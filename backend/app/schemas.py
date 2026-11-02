from datetime import datetime, date
from enum import Enum
from typing import List, Optional, Any
from datetime import timezone
from pydantic import BaseModel, ConfigDict, field_validator


class EvidenceTier(str, Enum):
    clinical    = "clinical"
    mixed       = "mixed"
    traditional = "traditional"


class Trend(str, Enum):
    improving        = "improving"
    flat             = "flat"
    worsening        = "worsening"
    insufficient_data = "insufficient_data"


class AqiBand(str, Enum):
    good         = "good"
    satisfactory = "satisfactory"
    moderate     = "moderate"
    poor         = "poor"
    very_poor    = "very_poor"
    severe       = "severe"


class DominantPollutant(str, Enum):
    pm25 = "pm25"
    pm10 = "pm10"
    o3   = "o3"
    no2  = "no2"
    so2  = "so2"
    co   = "co"


class FoodItem(BaseModel):
    name:           str
    reason:         str
    nutrient_value: Optional[Any]  = None
    unit:           Optional[str]  = None
    gi:             Optional[int]  = None
    source:         Optional[str]  = None     # where nutrient_value / gi came from
    logged_recently: bool          = False    # user logged this food in the last 3 days


class NutrientRecommendation(BaseModel):
    nutrient_key:        str
    relevance_score:     float        # continuous score from recommender.py
    title:               str
    body:                str
    nutrient_explanation: str
    evidence_tier:       EvidenceTier
    source_note:         Optional[str] = None
    foods_to_add:        List[FoodItem] = []
    foods_to_reduce:     List[FoodItem] = []
    trend:               Trend


class EnvironmentContext(BaseModel):
    local_aqi:          int
    pm25:               float
    dominant_pollutant: DominantPollutant
    aqi_band:           AqiBand
    source:             str = "live"            # live | demo | unavailable (hide the AQI card)
    city:               Optional[str] = None


def _as_utc(v):
    # SQLite returns naive datetimes that are really UTC. Mark them so clients convert correctly.
    return v.replace(tzinfo=timezone.utc) if isinstance(v, datetime) and v.tzinfo is None else v


class ScanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:            int
    created_at:    datetime
    _utc = field_validator("created_at")(_as_utc)
    day_number:    int
    acne_score:    float
    redness_score: float
    dryness_score: float
    ita_value:     float


class ScanResponse(BaseModel):
    scan:            ScanOut
    environment:     EnvironmentContext
    nutrient_scores: dict           # full ranked nutrient relevance map
    recommendations: List[NutrientRecommendation]
    quality_notes:   List[str] = []      # e.g. 'Facial hair detected - scored forehead and cheeks'
    prototype_notice: str = "Experimental estimate for a class project. Not a medical diagnosis."


class HistoryScanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:            int
    created_at:    datetime
    _utc = field_validator("created_at")(_as_utc)
    day_number:    int
    acne_score:    float
    redness_score: float
    dryness_score: float
    ita_value:     float
    local_aqi:     Optional[int] = None


class ProgramOut(BaseModel):
    start_date:  date
    current_day: int
    total_days:  int
    is_demo:     bool = False


class HistoryResponse(BaseModel):
    program: ProgramOut
    scans:   List[HistoryScanOut]


# ── Dietary log schemas ────────────────────────────────────────────────────

class DietaryLogIn(BaseModel):
    foods_eaten: List[str]   # ["white rice", "dal", "curd"]
    log_date:    Optional[date] = None   # defaults to today


class DietaryLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:          int
    log_date:    date
    foods_eaten: List[str]


# ── Accounts ────────────────────────────────────────────────────────────────

import re as _re
from typing import Literal
from pydantic import Field

_EMAIL_RE = _re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _clean_email(v: str) -> str:
    v = (v or "").strip().lower()
    if len(v) > 254 or not _EMAIL_RE.match(v):
        raise ValueError("Enter a valid email address.")
    return v


def _check_password(v: str) -> str:
    if len(v) < 8 or len(v.encode("utf-8")) > 72:
        raise ValueError("Password must be 8 to 72 characters long.")
    return v


class RegisterIn(BaseModel):
    email: str
    password: str
    name: str
    city: Optional[str] = None
    accepted_terms: bool = False

    _email = field_validator("email")(_clean_email)
    _pw = field_validator("password")(_check_password)

    @field_validator("name")
    @classmethod
    def _name(cls, v):
        v = (v or "").strip()
        if not 1 <= len(v) <= 40:
            raise ValueError("Enter your first name (up to 40 characters).")
        return v

    @field_validator("city")
    @classmethod
    def _city(cls, v):
        v = (v or "").strip()
        if len(v) > 60:
            raise ValueError("City name is too long.")
        return v or None


class LoginIn(BaseModel):
    email: str
    password: str = Field(max_length=200)

    _email = field_validator("email")(_clean_email)


class ProfileIn(BaseModel):
    name: str
    city: Optional[str] = None

    @field_validator("name")
    @classmethod
    def _name(cls, v):
        v = (v or "").strip()
        if not 1 <= len(v) <= 40:
            raise ValueError("Enter your first name (up to 40 characters).")
        return v

    @field_validator("city")
    @classmethod
    def _city(cls, v):
        v = (v or "").strip()
        if len(v) > 60:
            raise ValueError("City name is too long.")
        return v or None


class ChangePasswordIn(BaseModel):
    current_password: str = Field(max_length=200)
    new_password: str

    _pw = field_validator("new_password")(_check_password)


class DeleteAccountIn(BaseModel):
    password: str = Field(max_length=200)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:    int
    email: str
    name:  str
    city:  Optional[str] = None


class AuthOut(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserOut


# ── Plan (foods the user chose to follow) ───────────────────────────────────

class PlanItemIn(BaseModel):
    food:        str
    kind:        Literal["try", "limit"]
    target_days: Optional[int] = None       # defaults: try 4, limit 2 (days out of the last 7)


class PlanTargetIn(BaseModel):
    target_days: int


class PlanCheckIn(BaseModel):
    food:  str
    done:  bool
    log_date: Optional[date] = None         # defaults to today


class PlanItemStatus(BaseModel):
    id:           int
    food:         str
    kind:         Literal["try", "limit"]
    target_days:  int
    days_eaten:   int                       # of the last 7 days
    met:          bool
    eaten_today:  bool
    last_7:       List[bool]                # oldest first, last entry is today


class ScanChange(BaseModel):
    from_score: float
    to_score:   float
    days:       int
    scans:      int


class PlanSummary(BaseModel):
    today:          date
    items:          List[PlanItemStatus]
    goals_met:      int
    goals_total:    int
    logging_streak: int                     # consecutive days with something logged, ending today or yesterday
    scan_change:    Optional[ScanChange] = None
    max_items:      int
    note:           str = ("Changes in score can come from lighting and photo quality, so this does not show "
                           "that the plan caused them.")


# ── Weekly summary ("Your week") ─────────────────────────────────────────────

class WeekMetric(BaseModel):
    key:        str                      # acne | redness | dryness
    label:      str
    this_week:  Optional[float] = None   # average of this week's scans, 0-10 (lower is better)
    last_week:  Optional[float] = None
    change:     Optional[float] = None   # this_week - last_week, only when both weeks have scans
    direction:  Optional[Literal["lower", "higher", "same"]] = None   # "lower" = a lower score than last week


class WeekAir(BaseModel):
    days_with_reading: int
    poor_days:         int               # days whose worst reading was "poor" or worse


class WeekPlan(BaseModel):
    goals_met:   int
    goals_total: int


class WeekSummary(BaseModel):
    today:          date
    first_day:      date                 # first day of the 7-day window (today - 6)
    scans_this_week: int
    scans_last_week: int
    scan_days:      List[bool]           # 7 entries, oldest first: any scan that day
    log_days:       List[bool]           # 7 entries, oldest first: any food logged that day
    food_days:      int
    logging_streak: int
    metrics:        List[WeekMetric]
    air:            Optional[WeekAir] = None
    plan:           Optional[WeekPlan] = None
    highlights:     List[str]            # plain sentences the app can show as they are
    note:           str = ("Scores come from photos, so lighting and angle can move them. This describes what you "
                           "scanned and logged. It does not show what caused a change.")
