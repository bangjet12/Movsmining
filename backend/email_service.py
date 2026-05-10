"""MOVS Mining - Resend email service for magic links."""
import os
import asyncio
import logging
import resend

logger = logging.getLogger(__name__)

_API_KEY = os.environ.get("RESEND_API_KEY", "")
_SENDER = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

if _API_KEY:
    resend.api_key = _API_KEY


def _build_html(magic_link: str, lang: str = "id") -> str:
    if lang == "en":
        title = "MOVS :: Magic Login Link"
        body = "Click the link below to sign in to the MOVS Mining Network. This link expires in 15 minutes."
        cta = "Open MOVS"
        foot = "If you didn't request this, ignore this email."
    else:
        title = "MOVS :: Tautan Login"
        body = "Klik tautan berikut untuk masuk ke jaringan MOVS Mining. Tautan ini berlaku 15 menit."
        cta = "Buka MOVS"
        foot = "Jika Anda tidak meminta tautan ini, abaikan email ini."

    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0B0A;padding:32px 0;font-family:'IBM Plex Mono','Courier New',monospace;color:#D7E6D7">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#070807;border:1px solid #2E4A2E;padding:24px">
          <tr><td>
            <pre style="color:#00FF66;margin:0 0 12px 0;font-size:14px;line-height:1.4">+-- MOVS ---------------------------------+
| reusable proof-of-work :: tribute to    |
| hal finney's RPOW (2004)                |
+-----------------------------------------+</pre>
            <h2 style="color:#00FF66;margin:16px 0 8px 0;font-size:16px;letter-spacing:0.06em;text-transform:uppercase">{title}</h2>
            <p style="color:#D7E6D7;line-height:1.6;margin:8px 0">{body}</p>
            <p style="margin:24px 0">
              <a href="{magic_link}" style="display:inline-block;background:#00FF66;color:#0A0B0A;text-decoration:none;padding:12px 20px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;border:1px solid #00FF66">[ {cta} ]</a>
            </p>
            <p style="color:#5F7A5F;font-size:12px;word-break:break-all;margin:16px 0">{magic_link}</p>
            <p style="color:#5F7A5F;font-size:12px;margin:16px 0 0 0">{foot}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
    """


async def send_magic_link_email(recipient_email: str, magic_link: str, lang: str = "id") -> dict:
    """Returns {sent: bool, email_id: str|None, error: str|None}.
    Falls back gracefully so the magic link can still be shown in dev mode.
    """
    if not _API_KEY:
        logger.warning("RESEND_API_KEY not set; skipping email send (dev mode)")
        return {"sent": False, "email_id": None, "error": "no_api_key"}

    subject = "[MOVS] Magic login link" if lang == "en" else "[MOVS] Tautan login Anda"
    params = {
        "from": f"MOVS <{_SENDER}>",
        "to": [recipient_email],
        "subject": subject,
        "html": _build_html(magic_link, lang),
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        email_id = result.get("id") if isinstance(result, dict) else None
        logger.info(f"Resend email sent: id={email_id} to={recipient_email}")
        return {"sent": True, "email_id": email_id, "error": None}
    except Exception as e:
        logger.error(f"Resend send failed: {e}")
        return {"sent": False, "email_id": None, "error": str(e)}
