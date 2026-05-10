"""MOVS Mining - Pydantic models & MongoDB schemas."""
from datetime import datetime, timezone
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, EmailStr, ConfigDict
import uuid


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


# ---------- Auth ----------
class MagicLinkRequest(BaseModel):
    email: EmailStr


class MagicLinkVerify(BaseModel):
    token: str


class AuthResponse(BaseModel):
    token: str  # JWT
    user: dict


# ---------- User ----------
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=new_id)
    email: str
    address: str  # MOVS address
    balance: float = 0.0
    total_mined: float = 0.0
    blocks_mined: int = 0
    created_at: datetime = Field(default_factory=now_utc)


# ---------- Mining ----------
class MineChallenge(BaseModel):
    prev_hash: str
    next_height: int
    difficulty_bits: int
    address: str
    target_hex: str  # informational
    reward: float
    server_time: str


class MineSubmit(BaseModel):
    prev_hash: str
    height: int
    nonce: int
    hash: Optional[str] = None  # client-computed, server re-validates


class MineResult(BaseModel):
    accepted: bool
    reason: Optional[str] = None
    block: Optional[dict] = None
    new_balance: Optional[float] = None
    total_mined: Optional[float] = None


# ---------- Blocks ----------
class Block(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=new_id)
    height: int
    prev_hash: str
    hash: str
    nonce: int
    miner_address: str
    miner_email: Optional[str] = None
    reward: float
    difficulty_bits: int
    timestamp: datetime = Field(default_factory=now_utc)


# ---------- Transactions ----------
TxType = Literal["mining_reward", "send", "receive"]


class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=new_id)
    type: TxType
    from_address: Optional[str] = None
    to_address: Optional[str] = None
    from_email: Optional[str] = None
    to_email: Optional[str] = None
    amount: float
    block_height: Optional[int] = None
    block_hash: Optional[str] = None
    note: Optional[str] = None
    timestamp: datetime = Field(default_factory=now_utc)


class SendRequest(BaseModel):
    recipient: str  # email or address
    amount: float = Field(gt=0)
    note: Optional[str] = None


# ---------- Network ----------
class NetworkStats(BaseModel):
    total_supply: float = 1_000_000.0
    minted_supply: float
    remaining_supply: float
    block_height: int
    current_reward: float
    next_halving_at: int
    difficulty_bits: int
    last_block_hash: str
    total_miners: int
    total_blocks: int
    halving_interval: int = 10000
    initial_reward: float = 50.0


class LeaderboardEntry(BaseModel):
    rank: int
    address: str
    email: Optional[str] = None  # masked
    total_mined: float
    blocks_mined: int
