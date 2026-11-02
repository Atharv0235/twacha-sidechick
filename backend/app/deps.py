import re
from typing import Optional
from fastapi import Header

_ID_RE = re.compile(r"^[A-Za-z0-9-]{8,64}$")
ANONYMOUS = "anonymous"


def get_device_id(x_device_id: Optional[str] = Header(None)) -> str:
    """Anonymous per-install ID sent by the app as X-Device-Id. Missing or malformed -> 'anonymous'."""
    if x_device_id and _ID_RE.match(x_device_id.strip()):
        return x_device_id.strip()
    return ANONYMOUS
