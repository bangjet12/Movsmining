"""MOVS Mining - PoW logic, halving, supply cap."""
import hashlib
import os
import secrets

INITIAL_REWARD = 50.0
HALVING_INTERVAL = 10000
MAX_SUPPLY = 1_000_000.0
DEFAULT_DIFFICULTY_BITS = 20  # ~1M hashes -> few seconds in browser
MIN_DIFFICULTY = 16
MAX_DIFFICULTY = 28

GENESIS_PREV_HASH = hashlib.sha256(b"MOVS_GENESIS_HAL_FINNEY_TRIBUTE_2026").hexdigest()


def block_reward_for_height(height: int) -> float:
    halvings = max(0, (height - 1) // HALVING_INTERVAL)
    if halvings >= 64:
        return 0.0
    return INITIAL_REWARD / (2 ** halvings)


def target_from_difficulty(difficulty_bits: int) -> int:
    return 1 << (256 - difficulty_bits)


def target_hex(difficulty_bits: int) -> str:
    t = target_from_difficulty(difficulty_bits)
    return f"{t:064x}"


def compute_pow_hash(prev_hash: str, address: str, height: int, nonce: int) -> str:
    msg = f"{prev_hash}|{address}|{height}|{nonce}".encode()
    return hashlib.sha256(msg).hexdigest()


def validate_pow(prev_hash: str, address: str, height: int, nonce: int,
                 difficulty_bits: int) -> tuple[bool, str]:
    h = compute_pow_hash(prev_hash, address, height, nonce)
    target = target_from_difficulty(difficulty_bits)
    return (int(h, 16) < target, h)


def next_halving_block(current_height: int) -> int:
    """Returns the block height at which the NEXT halving occurs."""
    eras = current_height // HALVING_INTERVAL
    return (eras + 1) * HALVING_INTERVAL


def generate_address(user_id: str) -> str:
    """Stable per-user MOVS address."""
    secret = os.environ.get("JWT_SECRET", "movs_secret")
    digest = hashlib.sha256(f"movs|{user_id}|{secret}".encode()).hexdigest()
    return "movs1" + digest[:32]


def generate_token(nbytes: int = 24) -> str:
    return secrets.token_urlsafe(nbytes)
