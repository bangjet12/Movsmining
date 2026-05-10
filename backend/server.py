"""MOVS Mining - FastAPI main server.
All routes are under /api prefix.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional, List

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from models import (
    MagicLinkRequest, AuthResponse, User,
    MineChallenge, MineSubmit, MineResult, Block,
    Transaction, SendRequest, NetworkStats, LeaderboardEntry,
    now_utc, new_id,
)
from mining import (
    INITIAL_REWARD, HALVING_INTERVAL, MAX_SUPPLY, DEFAULT_DIFFICULTY_BITS,
    GENESIS_PREV_HASH,
    block_reward_for_height, validate_pow, target_hex,
    next_halving_block, generate_address, generate_token,
)
from auth import (
    create_jwt, get_current_user_id, MAGIC_LINK_TTL_MIN,
)
from email_service import send_magic_link_email

# ----------- DB -----------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

APP_BASE_URL = os.environ.get("APP_BASE_URL", "http://localhost:3000").rstrip("/")
DEV_MODE = os.environ.get("RESEND_API_KEY", "") == ""

# ----------- App -----------
app = FastAPI(title="MOVS Mining API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("movs")


# ---------------- Helpers ----------------
def _ser_dt(d: dict, *fields: str) -> dict:
    for f in fields:
        if f in d and isinstance(d[f], datetime):
            d[f] = d[f].isoformat()
    return d


def _parse_dt(d: dict, *fields: str) -> dict:
    for f in fields:
        if f in d and isinstance(d[f], str):
            try:
                d[f] = datetime.fromisoformat(d[f])
            except Exception:
                pass
    return d


async def _get_chain_head() -> dict:
    """Return the latest block (highest height). If none, return synthetic genesis."""
    cursor = db.blocks.find({}, {"_id": 0}).sort("height", -1).limit(1)
    blocks = await cursor.to_list(1)
    if blocks:
        return _parse_dt(blocks[0], "timestamp")
    return {
        "height": 0,
        "hash": GENESIS_PREV_HASH,
        "prev_hash": "0" * 64,
        "miner_address": "movs1genesis",
        "reward": 0.0,
        "difficulty_bits": DEFAULT_DIFFICULTY_BITS,
        "nonce": 0,
        "timestamp": datetime(2026, 1, 1, tzinfo=timezone.utc),
    }


async def _minted_supply() -> float:
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$reward"}}}]
    res = await db.blocks.aggregate(pipeline).to_list(1)
    return float(res[0]["total"]) if res else 0.0


async def _ensure_user(email: str) -> dict:
    email = email.lower().strip()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        return existing
    uid = new_id()
    user = {
        "id": uid,
        "email": email,
        "address": generate_address(uid),
        "balance": 0.0,
        "total_mined": 0.0,
        "blocks_mined": 0,
        "created_at": now_utc().isoformat(),
    }
    await db.users.insert_one(user)
    user.pop("_id", None)
    return user


async def _get_user_by_id(uid: str) -> dict:
    u = await db.users.find_one({"id": uid}, {"_id": 0})
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u


async def _get_user_by_address(addr: str) -> Optional[dict]:
    return await db.users.find_one({"address": addr}, {"_id": 0})


async def _get_user_by_email(email: str) -> Optional[dict]:
    return await db.users.find_one({"email": email.lower().strip()}, {"_id": 0})


async def _record_tx(tx: dict):
    tx = dict(tx)
    if isinstance(tx.get("timestamp"), datetime):
        tx["timestamp"] = tx["timestamp"].isoformat()
    await db.transactions.insert_one(tx)


# ---------------- Routes: meta ----------------
@api.get("/")
async def root():
    return {"app": "MOVS Mining", "version": "1.0.0", "tribute": "Hal Finney RPOW (2004)"}


@api.get("/health")
async def health():
    return {"status": "ok", "time": now_utc().isoformat()}


# ---------------- Routes: auth ----------------
@api.post("/auth/request-link")
async def request_magic_link(payload: MagicLinkRequest, lang: str = Query("id")):
    email = payload.email.lower().strip()
    token = generate_token(24)
    expires = now_utc() + timedelta(minutes=MAGIC_LINK_TTL_MIN)
    doc = {
        "id": new_id(),
        "token": token,
        "email": email,
        "expires_at": expires.isoformat(),
        "used": False,
        "created_at": now_utc().isoformat(),
    }
    await db.magic_links.insert_one(doc)

    # Build link to frontend route /verify?token=...
    link = f"{APP_BASE_URL}/verify?token={token}"

    # Try to send email
    result = await send_magic_link_email(email, link, lang=lang)

    response = {
        "ok": True,
        "email": email,
        "expires_at": expires.isoformat(),
        "email_sent": result["sent"],
    }
    # Dev-mode fallback: expose magic link directly so user can test login
    # even if email service is sandboxed (Resend often restricts unverified domains
    # to send only to the account owner). In production, set RESEND_API_KEY +
    # verified domain and this fallback is not needed.
    if not result["sent"]:
        response["dev_magic_link"] = link
        response["email_error"] = result.get("error")
    return response


@api.get("/auth/verify")
async def verify_magic_link(token: str):
    doc = await db.magic_links.find_one({"token": token}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=400, detail="Invalid token")
    if doc.get("used"):
        raise HTTPException(status_code=400, detail="Token already used")
    expires = doc.get("expires_at")
    if isinstance(expires, str):
        expires = datetime.fromisoformat(expires)
    if expires < now_utc():
        raise HTTPException(status_code=400, detail="Token expired")

    await db.magic_links.update_one({"token": token}, {"$set": {"used": True, "used_at": now_utc().isoformat()}})

    user = await _ensure_user(doc["email"])
    jwt_token = create_jwt(user["id"], user["email"])
    return {
        "token": jwt_token,
        "user": user,
    }


@api.get("/auth/me")
async def me(user_id: str = Depends(get_current_user_id)):
    return await _get_user_by_id(user_id)


# ---------------- Routes: mining ----------------
@api.get("/mine/challenge")
async def mine_challenge(user_id: str = Depends(get_current_user_id)):
    user = await _get_user_by_id(user_id)
    head = await _get_chain_head()
    next_height = head["height"] + 1
    reward = block_reward_for_height(next_height)
    diff = DEFAULT_DIFFICULTY_BITS
    return {
        "prev_hash": head["hash"],
        "next_height": next_height,
        "difficulty_bits": diff,
        "address": user["address"],
        "target_hex": target_hex(diff),
        "reward": reward,
        "server_time": now_utc().isoformat(),
    }


@api.post("/mine/submit")
async def mine_submit(payload: MineSubmit, user_id: str = Depends(get_current_user_id)):
    user = await _get_user_by_id(user_id)
    head = await _get_chain_head()

    # Race / staleness check
    if payload.prev_hash != head["hash"]:
        return {"accepted": False, "reason": "stale_chain",
                "current_prev_hash": head["hash"],
                "current_height": head["height"] + 1}
    expected_height = head["height"] + 1
    if payload.height != expected_height:
        return {"accepted": False, "reason": "stale_height",
                "expected_height": expected_height}

    # Supply cap
    minted = await _minted_supply()
    reward = block_reward_for_height(expected_height)
    if minted + reward > MAX_SUPPLY:
        # Trim if last block partial
        reward = max(0.0, MAX_SUPPLY - minted)
        if reward <= 0:
            return {"accepted": False, "reason": "supply_cap_reached"}

    # Validate PoW
    diff = DEFAULT_DIFFICULTY_BITS
    ok, h = validate_pow(payload.prev_hash, user["address"], expected_height,
                         payload.nonce, diff)
    if not ok:
        return {"accepted": False, "reason": "invalid_pow", "computed_hash": h}

    # Idempotency (avoid double-submission of identical hash)
    existing = await db.blocks.find_one({"hash": h}, {"_id": 0})
    if existing:
        return {"accepted": False, "reason": "duplicate_block"}

    # Append block
    block = {
        "id": new_id(),
        "height": expected_height,
        "prev_hash": payload.prev_hash,
        "hash": h,
        "nonce": payload.nonce,
        "miner_address": user["address"],
        "miner_email": user["email"],
        "reward": reward,
        "difficulty_bits": diff,
        "timestamp": now_utc().isoformat(),
    }
    await db.blocks.insert_one(block)
    block.pop("_id", None)

    # Update user balance
    new_balance = round(user["balance"] + reward, 8)
    new_total_mined = round(user["total_mined"] + reward, 8)
    new_blocks_mined = user["blocks_mined"] + 1
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"balance": new_balance,
                  "total_mined": new_total_mined,
                  "blocks_mined": new_blocks_mined}},
    )

    # Record mining tx
    await _record_tx({
        "id": new_id(),
        "type": "mining_reward",
        "to_address": user["address"],
        "to_email": user["email"],
        "amount": reward,
        "block_height": expected_height,
        "block_hash": h,
        "timestamp": now_utc().isoformat(),
    })

    block_out = dict(block)
    return {
        "accepted": True,
        "block": block_out,
        "new_balance": new_balance,
        "total_mined": new_total_mined,
    }


# ---------------- Routes: wallet ----------------
@api.get("/wallet")
async def wallet(user_id: str = Depends(get_current_user_id)):
    u = await _get_user_by_id(user_id)
    return {
        "address": u["address"],
        "email": u["email"],
        "balance": u["balance"],
        "total_mined": u["total_mined"],
        "blocks_mined": u["blocks_mined"],
    }


_ADDR_RE = re.compile(r"^movs1[0-9a-f]{32}$")


@api.post("/wallet/send")
async def wallet_send(payload: SendRequest, user_id: str = Depends(get_current_user_id)):
    sender = await _get_user_by_id(user_id)
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be > 0")
    if sender["balance"] < payload.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    rec_str = payload.recipient.strip().lower()
    recipient = None
    if _ADDR_RE.match(rec_str):
        recipient = await _get_user_by_address(rec_str)
    elif "@" in rec_str:
        recipient = await _get_user_by_email(rec_str)
        if not recipient:
            # Auto-create recipient wallet so external emails can receive
            recipient = await _ensure_user(rec_str)
    else:
        raise HTTPException(status_code=400, detail="Invalid recipient (email or movs1 address)")

    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    if recipient["id"] == sender["id"]:
        raise HTTPException(status_code=400, detail="Cannot send to self")

    amount = round(float(payload.amount), 8)

    # Atomic-ish update (without transactions, do compare-and-set on sender balance)
    res = await db.users.update_one(
        {"id": sender["id"], "balance": {"$gte": amount}},
        {"$inc": {"balance": -amount}},
    )
    if res.modified_count != 1:
        raise HTTPException(status_code=400, detail="Insufficient balance (race)")
    await db.users.update_one(
        {"id": recipient["id"]},
        {"$inc": {"balance": amount}},
    )

    tx_id = new_id()
    common = {
        "from_address": sender["address"],
        "from_email": sender["email"],
        "to_address": recipient["address"],
        "to_email": recipient["email"],
        "amount": amount,
        "note": payload.note,
        "timestamp": now_utc().isoformat(),
    }
    await _record_tx({"id": tx_id, "type": "send", **common})
    await _record_tx({"id": new_id(), "type": "receive", **common, "ref_tx_id": tx_id})

    new_sender = await _get_user_by_id(sender["id"])
    return {
        "ok": True,
        "tx_id": tx_id,
        "from": sender["address"],
        "to": recipient["address"],
        "amount": amount,
        "new_balance": new_sender["balance"],
    }


@api.get("/wallet/transactions")
async def wallet_transactions(user_id: str = Depends(get_current_user_id),
                              limit: int = 50):
    u = await _get_user_by_id(user_id)
    addr = u["address"]
    cursor = db.transactions.find(
        {"$or": [{"from_address": addr}, {"to_address": addr}]},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit)
    items = await cursor.to_list(limit)
    # Mark direction relative to the user
    for it in items:
        if it.get("type") == "mining_reward":
            it["direction"] = "in"
        elif it.get("from_address") == addr and it.get("type") == "send":
            it["direction"] = "out"
        else:
            it["direction"] = "in"
    return {"items": items}


# ---------------- Routes: network ----------------
@api.get("/network/stats")
async def network_stats():
    head = await _get_chain_head()
    minted = await _minted_supply()
    next_height = head["height"] + 1
    current_reward = block_reward_for_height(next_height)
    total_users = await db.users.count_documents({})
    total_blocks = await db.blocks.count_documents({})
    return {
        "total_supply": MAX_SUPPLY,
        "minted_supply": round(minted, 8),
        "remaining_supply": round(MAX_SUPPLY - minted, 8),
        "block_height": head["height"],
        "current_reward": current_reward,
        "next_halving_at": next_halving_block(head["height"]),
        "difficulty_bits": DEFAULT_DIFFICULTY_BITS,
        "last_block_hash": head["hash"],
        "total_miners": total_users,
        "total_blocks": total_blocks,
        "halving_interval": HALVING_INTERVAL,
        "initial_reward": INITIAL_REWARD,
    }


@api.get("/leaderboard")
async def leaderboard(limit: int = 50):
    cursor = db.users.find({"total_mined": {"$gt": 0}}, {"_id": 0}).sort("total_mined", -1).limit(limit)
    users = await cursor.to_list(limit)
    out = []
    for i, u in enumerate(users):
        email = u.get("email", "")
        masked = email.split("@")[0][:3] + "***@" + email.split("@")[1] if "@" in email else email
        out.append({
            "rank": i + 1,
            "address": u["address"],
            "email": masked,
            "total_mined": u["total_mined"],
            "blocks_mined": u["blocks_mined"],
        })
    return {"items": out}


@api.get("/blocks/recent")
async def recent_blocks(limit: int = 30):
    cursor = db.blocks.find({}, {"_id": 0}).sort("height", -1).limit(limit)
    items = await cursor.to_list(limit)
    return {"items": items}


# ---------------- Mount ----------------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("address", unique=True)
    await db.blocks.create_index("height", unique=True)
    await db.blocks.create_index("hash", unique=True)
    await db.magic_links.create_index("token", unique=True)
    await db.magic_links.create_index("expires_at")
    await db.transactions.create_index([("timestamp", -1)])
    logger.info("MOVS Mining API ready. Dev mode: %s", DEV_MODE)


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
