from datetime import date, datetime, timedelta, timezone
import logging
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SkinScan, Program, DietaryLog, User
from ..schemas import (ScanResponse, HistoryResponse, ScanOut, HistoryScanOut,
                       ProgramOut, NutrientRecommendation, DietaryLogIn, DietaryLogOut,
                       EnvironmentContext)
from ..auth import get_current_user
from .accounts import delete_user_data
from ..cv_pipeline import analyze_image_with_notes, ImageError
from ..recommender import top_nutrient_targets, score_nutrient_targets, compute_trend
from ..nutrient_lookup import get_foods_for_targets, all_food_names
from ..evidence import get_evidence_tuple
from ..aqi_client import get_local_aqi

log = logging.getLogger("twacha.scans")


def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)   # naive UTC, as stored in SQLite


router = APIRouter(prefix="/api", tags=["twacha"])

MAX_UPLOAD_BYTES = 10 * 1024 * 1024          # 10 MB; phone photos are ~2-5 MB
SCAN_COLUMNS = ("acne_score", "redness_score", "dryness_score", "ita_value")


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_or_create_program(db: Session, user_id: int) -> Program:
    program = db.query(Program).filter_by(user_id=user_id).first()
    if not program:
        program = Program(start_date=date.today(), total_days=30, user_id=user_id)
        db.add(program)
        db.commit()
        db.refresh(program)
    return program


def _recently_eaten(db: Session, user_id: int, days: int = 3) -> list[str]:
    """Flatten the last N days of dietary logs into a single food list."""
    cutoff = date.today() - timedelta(days=days)
    logs = db.query(DietaryLog).filter(DietaryLog.user_id == user_id, DietaryLog.log_date >= cutoff).all()
    foods: list[str] = []
    for log in logs:
        foods.extend(log.foods_eaten or [])
    return foods


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/scan/", response_model=ScanResponse, status_code=201)
async def create_scan(
    image: UploadFile = File(..., description="A clear, well-lit photo of your face"),
    city: str | None = Form(None, description="City for the air-quality lookup (optional)"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Full scan pipeline:
    1. Run CV (ONNX acne model + classical redness/dryness/skin-tone estimates)
    2. Fetch local AQI (never invented: see environment.source)
    3. Score all nutrient targets, take the top ones
    4. Look up Indian foods, personalised by the recent food log
    5. Store the scan (the image itself is never stored)
    """
    image_bytes = await image.read()
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large (max 10 MB). Please send a smaller photo.")
    try:
        # ONNX inference and the AQI request both block, so keep them off the event loop
        vector, notes = await run_in_threadpool(analyze_image_with_notes, image_bytes)
    except ImageError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        log.exception("scan analysis failed")        # details stay in the server log, not in the response
        raise HTTPException(status_code=500, detail="Could not analyse this image. Please try another photo.")

    env = await run_in_threadpool(get_local_aqi, city)
    if env["source"] == "unavailable":
        notes.append("Air-quality data is unavailable right now, so no pollution adjustment was applied.")

    program = _get_or_create_program(db, user.id)
    day_number = (date.today() - program.start_date).days + 1

    # Store scan. Unavailable AQI is stored as NULL, not as a fake 0.
    unavailable = env["source"] == "unavailable"
    scan = SkinScan(
        created_at=_utcnow(), day_number=day_number, user_id=user.id,
        **{k: vector[k] for k in SCAN_COLUMNS},
        local_aqi=None if unavailable else env["local_aqi"],
        pm25=None if unavailable else env["pm25"],
        dominant_pollutant=None if unavailable else env["dominant_pollutant"],
        aqi_band=None if unavailable else env["aqi_band"],
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    past_scans = (
        db.query(SkinScan).filter(SkinScan.user_id == user.id)
        .order_by(SkinScan.created_at.desc(), SkinScan.id.desc())
        .offset(1).limit(7).all()
    )
    trend = compute_trend(past_scans, "acne_score", scan.acne_score)

    all_scores = score_nutrient_targets(scan.acne_score, scan.redness_score, scan.dryness_score, env["aqi_band"])
    top_targets = top_nutrient_targets(
        scan.acne_score, scan.redness_score, scan.dryness_score, aqi_band=env["aqi_band"], top_n=3
    )
    food_map = get_foods_for_targets(top_targets, recently_eaten=_recently_eaten(db, user.id))

    recommendations = []
    for key in top_targets:
        title, tier, source_note, explanation = get_evidence_tuple(key)
        foods = food_map.get(key, {"foods_to_add": [], "foods_to_reduce": []})
        recommendations.append(NutrientRecommendation(
            nutrient_key=key,
            relevance_score=all_scores[key],
            title=title,
            body=explanation,
            nutrient_explanation=explanation,
            evidence_tier=tier,
            source_note=source_note,
            foods_to_add=foods["foods_to_add"],
            foods_to_reduce=foods["foods_to_reduce"],
            trend=trend,
        ))

    return ScanResponse(
        scan=ScanOut.model_validate(scan),
        environment=EnvironmentContext(**env),
        nutrient_scores=all_scores,
        recommendations=recommendations,
        quality_notes=notes,
    )


@router.get("/history/", response_model=HistoryResponse)
def scan_history(limit: int = Query(30, ge=1, le=200), db: Session = Depends(get_db),
                 user: User = Depends(get_current_user)):
    program = _get_or_create_program(db, user.id)
    scans = db.query(SkinScan).filter(SkinScan.user_id == user.id).order_by(SkinScan.created_at.desc(), SkinScan.id.desc()).limit(limit).all()
    return HistoryResponse(
        program=ProgramOut(
            start_date=program.start_date,
            current_day=(date.today() - program.start_date).days + 1,
            total_days=program.total_days,
            is_demo=bool(program.is_demo),
        ),
        scans=[HistoryScanOut.model_validate(s) for s in scans],
    )


@router.post("/log/", response_model=DietaryLogOut, status_code=201)
def log_diet(payload: DietaryLogIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Log what was eaten. Foods logged in the last 3 days are used to personalise
    the next recommendation (already-eaten foods are not suggested as 'new').
    """
    foods = [f.strip() for f in payload.foods_eaten if f and f.strip()][:60]
    if not foods:
        raise HTTPException(status_code=422, detail="Add at least one food.")
    log_date = payload.log_date or date.today()
    # The app sends the user's local date, which can be a day ahead of the server's (time zones).
    if log_date > date.today() + timedelta(days=1):
        raise HTTPException(status_code=422, detail="log_date cannot be in the future.")

    existing = db.query(DietaryLog).filter_by(log_date=log_date, user_id=user.id).first()
    if existing:
        existing.foods_eaten = foods
        db.commit()
        db.refresh(existing)
        return existing

    entry = DietaryLog(log_date=log_date, foods_eaten=foods, user_id=user.id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/log/", response_model=list[DietaryLogOut])
def get_diet_log(limit: int = Query(7, ge=1, le=60), db: Session = Depends(get_db),
                 user: User = Depends(get_current_user)):
    return db.query(DietaryLog).filter(DietaryLog.user_id == user.id).order_by(DietaryLog.log_date.desc()).limit(limit).all()


@router.get("/foods/", response_model=list[str])
def food_names():
    """Canonical food names for the app's food-log picker."""
    return all_food_names()


@router.delete("/data/")
def delete_my_data(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Deletes your scans, food logs, plan and program. Your account stays; use POST /api/me/delete to remove it too."""
    counts = delete_user_data(db, user.id)
    db.commit()
    return {"deleted": counts}
