"""
"Your week": a plain summary of the last 7 days, built only from what the user scanned and logged.
It describes. It never says that anything caused a change.
"""
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import DietaryLog, PlanItem, SkinScan, User
from ..schemas import WeekAir, WeekMetric, WeekPlan, WeekSummary
from .plan import _client_today, _item_status, _streak

router = APIRouter(prefix="/api/summary", tags=["summary"])

DAYS = 7
SAME_BELOW = 0.5                         # an average must move by at least this (0-10 scale) to count as a change
POOR_BANDS = {"poor", "very_poor", "severe"}
METRICS = (("acne", "Acne", "acne_score"), ("redness", "Redness", "redness_score"), ("dryness", "Dryness", "dryness_score"))


def _local_date(created_at: datetime, offset_minutes: int) -> date:
    """Scans are stored in UTC. Convert to the user's own calendar day."""
    return (created_at + timedelta(minutes=offset_minutes)).date()


def _avg(values: list) -> Optional[float]:
    return round(sum(values) / len(values), 1) if values else None


def _plural(n: int, word: str) -> str:
    return f"{n} {word}" if n == 1 else f"{n} {word}s"


@router.get("/week", response_model=WeekSummary)
def week(today: Optional[date] = Query(None, description="The user's local date (YYYY-MM-DD)"),
         tz_offset: int = Query(0, ge=-840, le=840, description="Minutes east of UTC (India is 330)"),
         user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = _client_today(today)
    first_day = today - timedelta(days=DAYS - 1)
    prev_first = first_day - timedelta(days=DAYS)

    # a day of slack either side of the window, then filtered by the user's own calendar day
    since = datetime.combine(prev_first - timedelta(days=1), datetime.min.time())
    scans = (db.query(SkinScan).filter(SkinScan.user_id == user.id, SkinScan.created_at >= since)
             .order_by(SkinScan.created_at.asc(), SkinScan.id.asc()).all())
    this_week, last_week = [], []
    for s in scans:
        d = _local_date(s.created_at, tz_offset)
        if first_day <= d <= today:
            this_week.append((d, s))
        elif prev_first <= d < first_day:
            last_week.append((d, s))

    days = [first_day + timedelta(days=i) for i in range(DAYS)]
    scan_day_set = {d for d, _ in this_week}

    logs = db.query(DietaryLog).filter(DietaryLog.user_id == user.id,
                                       DietaryLog.log_date >= today - timedelta(days=60)).all()
    by_day = defaultdict(list)
    for log in logs:
        by_day[log.log_date].extend(log.foods_eaten or [])
    log_days = [bool(by_day.get(d)) for d in days]

    # metrics
    metrics = []
    for key, label, col in METRICS:
        now = _avg([getattr(s, col) for _, s in this_week])
        before = _avg([getattr(s, col) for _, s in last_week])
        change = direction = None
        if now is not None and before is not None:
            change = round(now - before, 1)
            direction = "same" if abs(change) < SAME_BELOW else ("lower" if change < 0 else "higher")
        metrics.append(WeekMetric(key=key, label=label, this_week=now, last_week=before, change=change, direction=direction))

    # air: the worst reading on each day that has one
    worst_by_day = {}
    for d, s in this_week:
        if s.aqi_band is not None:
            worst_by_day[d] = worst_by_day.get(d, False) or (s.aqi_band in POOR_BANDS)
    air = WeekAir(days_with_reading=len(worst_by_day), poor_days=sum(worst_by_day.values())) if worst_by_day else None

    # plan
    items = db.query(PlanItem).filter_by(user_id=user.id).all()
    plan = None
    if items:
        statuses = [_item_status(i, by_day, today) for i in items]
        plan = WeekPlan(goals_met=sum(1 for s in statuses if s.met), goals_total=len(statuses))

    streak = _streak(by_day, today)
    highlights = _highlights(len(scan_day_set), len(this_week), len(last_week), metrics, sum(log_days), plan, air)
    return WeekSummary(
        today=today, first_day=first_day,
        scans_this_week=len(this_week), scans_last_week=len(last_week),
        scan_days=[d in scan_day_set for d in days], log_days=log_days, food_days=sum(log_days),
        logging_streak=streak, metrics=metrics, air=air, plan=plan, highlights=highlights,
    )


def _highlights(scan_days, n_this, n_last, metrics, food_days, plan, air) -> list:
    out = []
    if n_this == 0:
        out.append("No scans in the last 7 days yet. One scan gives you something to compare next week.")
    else:
        out.append(f"You scanned on {_plural(scan_days, 'day')} in the last 7 days.")
        for m in metrics:
            if m.direction is None:
                continue
            word = m.label.lower()
            if m.direction == "same":
                out.append(f"Your {word} score is about the same as last week ({m.this_week} vs {m.last_week}).")
            else:
                size = abs(m.change)
                out.append(f"Your {word} score averaged {m.this_week} this week, {size} {m.direction} than last week "
                           f"({m.last_week}). Lower is better.")
        if n_last == 0:
            out.append("There are no scans from the week before, so there is nothing to compare yet.")
        elif n_this == 1 or n_last == 1:
            out.append("One scan in a week is a rough guide only. More scans make the comparison steadier.")
    out.append(f"You logged food on {food_days} of the last 7 days." if food_days
               else "You have not logged any food in the last 7 days.")
    if plan:
        out.append(f"You met {plan.goals_met} of {_plural(plan.goals_total, 'plan goal')}.")
    if air:
        if air.poor_days:
            out.append(f"Air quality was poor or worse on {air.poor_days} of {_plural(air.days_with_reading, 'day')} with a reading.")
        else:
            out.append(f"Air quality was not poor on any of the {_plural(air.days_with_reading, 'day')} with a reading.")
    return out
