"""
"My plan": foods the user chose to follow from their recommendations, with progress worked out
from the food log. Nothing here is a health claim: it only counts what the user says they ate.
"""
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import DietaryLog, PlanItem, SkinScan, User
from ..nutrient_lookup import canonical_food, food_matches
from ..schemas import (DietaryLogOut, PlanCheckIn, PlanItemIn, PlanItemStatus, PlanSummary, PlanTargetIn, ScanChange)

router = APIRouter(prefix="/api/plan", tags=["plan"])

MAX_ITEMS = 12
WINDOW = 7                 # days used for weekly goals
DEFAULT_TARGET = {"try": 4, "limit": 2}
TARGET_RANGE = {"try": (1, 7), "limit": (0, 6)}
CHANGE_LOOKBACK_DAYS = 14
CHANGE_MIN_SPAN_DAYS = 3
TZ_SLACK_DAYS = 1          # the app sends its own local date; allow for time zones ahead of the server


def _client_today(value: Optional[date]) -> date:
    """The user's own 'today' (the server may be in another time zone), kept within one day of the server's."""
    server = date.today()
    if value is None:
        return server
    if abs((value - server).days) > TZ_SLACK_DAYS:
        raise HTTPException(status_code=422, detail="That date is not valid.")
    return value


def _check_target(kind: str, target: int) -> int:
    lo, hi = TARGET_RANGE[kind]
    if not lo <= target <= hi:
        word = "at least" if kind == "try" else "at most"
        raise HTTPException(status_code=422, detail=f"Days per week must be between {lo} and {hi} ({word} goal).")
    return target


def _own_item(db: Session, user: User, item_id: int) -> PlanItem:
    item = db.query(PlanItem).filter_by(id=item_id, user_id=user.id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="That plan item was not found.")
    return item


def _item_status(item: PlanItem, by_day: dict, today: date) -> PlanItemStatus:
    days = [today - timedelta(days=i) for i in range(WINDOW - 1, -1, -1)]          # oldest first
    last_7 = [any(food_matches(f, item.food) for f in by_day.get(d, [])) for d in days]
    eaten = sum(last_7)
    met = eaten >= item.target_days if item.kind == "try" else eaten <= item.target_days
    return PlanItemStatus(id=item.id, food=item.food, kind=item.kind, target_days=item.target_days,
                          days_eaten=eaten, met=met, eaten_today=last_7[-1], last_7=last_7)


def _streak(by_day: dict, today: date) -> int:
    day = today if by_day.get(today) else today - timedelta(days=1)
    n = 0
    while by_day.get(day):
        n += 1
        day -= timedelta(days=1)
    return n


def _scan_change(db: Session, user: User) -> Optional[ScanChange]:
    since = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=CHANGE_LOOKBACK_DAYS)
    scans = (db.query(SkinScan).filter(SkinScan.user_id == user.id, SkinScan.created_at >= since)
             .order_by(SkinScan.created_at.asc(), SkinScan.id.asc()).all())
    if len(scans) < 2:
        return None
    span = (scans[-1].created_at - scans[0].created_at).days
    if span < CHANGE_MIN_SPAN_DAYS:
        return None
    return ScanChange(from_score=scans[0].acne_score, to_score=scans[-1].acne_score, days=span, scans=len(scans))


@router.get("/summary", response_model=PlanSummary)
def summary(today: Optional[date] = Query(None, description="The user's local date (YYYY-MM-DD)"),
            user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = _client_today(today)
    logs = db.query(DietaryLog).filter(DietaryLog.user_id == user.id,
                                       DietaryLog.log_date >= today - timedelta(days=60)).all()
    by_day = defaultdict(list)
    for log in logs:
        by_day[log.log_date].extend(log.foods_eaten or [])
    items = db.query(PlanItem).filter_by(user_id=user.id).order_by(PlanItem.created_at, PlanItem.id).all()
    statuses = [_item_status(i, by_day, today) for i in items]
    return PlanSummary(
        today=today, items=statuses,
        goals_met=sum(1 for s in statuses if s.met), goals_total=len(statuses),
        logging_streak=_streak(by_day, today), scan_change=_scan_change(db, user), max_items=MAX_ITEMS,
    )


@router.post("/", response_model=PlanItemStatus)
def add_item(payload: PlanItemIn, response: Response, user: User = Depends(get_current_user),
             db: Session = Depends(get_db)):
    """Adds a food to the plan. Adding the same food again returns the existing item."""
    food = canonical_food(payload.food)
    if food is None:
        raise HTTPException(status_code=422, detail="That food is not in the food list.")
    target = _check_target(payload.kind, DEFAULT_TARGET[payload.kind] if payload.target_days is None else payload.target_days)
    existing = db.query(PlanItem).filter_by(user_id=user.id, food=food).first()
    if existing:
        item = existing
    else:
        if db.query(PlanItem).filter_by(user_id=user.id).count() >= MAX_ITEMS:
            raise HTTPException(status_code=422, detail=f"Your plan is full ({MAX_ITEMS} foods). Remove one first.")
        item = PlanItem(user_id=user.id, food=food, kind=payload.kind, target_days=target)
        db.add(item)
        db.commit()
        db.refresh(item)
        response.status_code = 201
    return _item_status(item, {}, date.today())     # a brand-new item has no progress shown until /summary


@router.put("/{item_id}", response_model=PlanItemStatus)
def set_target(item_id: int, payload: PlanTargetIn, user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    item = _own_item(db, user, item_id)
    item.target_days = _check_target(item.kind, payload.target_days)
    db.commit()
    return _item_status(item, {}, date.today())


@router.delete("/{item_id}")
def remove_item(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(_own_item(db, user, item_id))
    db.commit()
    return {"removed": True}


@router.post("/check", response_model=DietaryLogOut)
def check_food(payload: PlanCheckIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Tick or untick one food for a day. It edits that day's food log, which is what progress is counted from."""
    food = canonical_food(payload.food)
    if food is None:
        raise HTTPException(status_code=422, detail="That food is not in the food list.")
    day = _client_today(payload.log_date)
    if day < date.today() - timedelta(days=WINDOW - 1):
        raise HTTPException(status_code=422, detail="You can only change the last 7 days.")
    log = db.query(DietaryLog).filter_by(user_id=user.id, log_date=day).first()
    foods = list(log.foods_eaten or []) if log else []
    if payload.done:
        if not any(food_matches(f, food) for f in foods):
            foods.append(food)
    else:
        foods = [f for f in foods if not food_matches(f, food)]
    if not foods:
        if log:
            db.delete(log)
            db.commit()
        return DietaryLogOut(id=0, log_date=day, foods_eaten=[])
    if log:
        log.foods_eaten = foods
    else:
        log = DietaryLog(user_id=user.id, log_date=day, foods_eaten=foods)
        db.add(log)
    db.commit()
    db.refresh(log)
    return log
