"""
Air-quality lookup (WAQI, aqicn.org).

Env vars
  WAQI_TOKEN    free token from https://aqicn.org/data-platform/token/
  DEFAULT_CITY  city used when the app does not send one (default: bhopal)
  DEMO_AQI      a fixed AQI number (e.g. 215) used ONLY when live data is unavailable.
                The response is then labelled source="demo", never "live".

Behaviour
  * source="live"        real WAQI reading
  * source="demo"        DEMO_AQI was set and live data failed / no token
  * source="unavailable" nothing available. The values are neutral (band "good", AQI 0,
                         so the recommender applies NO pollution boost). The app should hide the
                         AQI card when it sees this.

The old version silently returned a RANDOM AQI when WAQI failed. That is gone.

WAQI terms: show attribution ("Air quality data: World Air Quality Index Project, aqicn.org")
wherever AQI is displayed; no paid use; do not republish or archive their data.
We keep only a 10-minute in-memory cache per city to respect rate limits.
"""
import os
import time
import requests

WAQI_BASE = "https://api.waqi.info/feed"
CACHE_SECONDS = 600
_BANDS = [(50, "good"), (100, "satisfactory"), (200, "moderate"), (300, "poor"), (400, "very_poor")]
_POLLUTANTS = {"pm25", "pm10", "o3", "no2", "so2", "co"}
_cache: dict[str, tuple[float, dict]] = {}


def _band(aqi: float) -> str:
    for threshold, band in _BANDS:
        if aqi <= threshold:
            return band
    return "severe"


def _num(x, default=None):
    try:
        return float(x)
    except (TypeError, ValueError):
        return default


def _fetch_live(city: str) -> dict | None:
    token = os.getenv("WAQI_TOKEN", "")
    if not token:
        return None
    try:
        r = requests.get(f"{WAQI_BASE}/{city}/", params={"token": token}, timeout=5)
        d = r.json()
    except Exception:
        return None
    if d.get("status") != "ok":
        return None
    data = d.get("data") or {}
    aqi = _num(data.get("aqi"))
    if aqi is None:                       # stations sometimes report "-"
        return None
    iaqi = data.get("iaqi") or {}
    pm25 = _num((iaqi.get("pm25") or {}).get("v"), 0.0)
    dom = str(data.get("dominentpol", "pm25")).lower()
    if dom == "pm2.5":
        dom = "pm25"
    if dom not in _POLLUTANTS:
        dom = "pm25"
    return {
        "local_aqi": int(round(aqi)),
        "pm25": float(pm25),
        "dominant_pollutant": dom,
        "aqi_band": _band(aqi),
        "source": "live",
    }


def get_local_aqi(city: str | None = None) -> dict:
    city = (city or os.getenv("DEFAULT_CITY", "bhopal")).strip().lower()
    now = time.time()
    hit = _cache.get(city)
    if hit and now - hit[0] < CACHE_SECONDS:
        return dict(hit[1])

    live = _fetch_live(city)
    if live:
        live["city"] = city
        _cache[city] = (now, live)
        return dict(live)

    demo = _num(os.getenv("DEMO_AQI"))
    if demo is not None:
        return {"local_aqi": int(demo), "pm25": round(demo * 0.5, 1), "dominant_pollutant": "pm25",
                "aqi_band": _band(demo), "source": "demo", "city": city}

    return {"local_aqi": 0, "pm25": 0.0, "dominant_pollutant": "pm25",
            "aqi_band": "good", "source": "unavailable", "city": city}
