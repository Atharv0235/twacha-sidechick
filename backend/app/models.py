from datetime import datetime, date
from sqlalchemy import Column, Integer, Float, String, DateTime, Date, JSON, Text, Boolean, ForeignKey, UniqueConstraint
from .database import Base


class User(Base):
    """An account. Passwords are stored only as bcrypt hashes. All scans, logs and the plan hang off user_id."""
    __tablename__ = "users"
    id             = Column(Integer, primary_key=True, index=True)
    email          = Column(String(254), unique=True, nullable=False, index=True)   # stored lower-case
    password_hash  = Column(String, nullable=False)
    name           = Column(String(40), nullable=False)
    city           = Column(String(60), nullable=True)
    token_version  = Column(Integer, default=0, nullable=False)   # bumped on password change: old tokens stop working
    created_at     = Column(DateTime, default=datetime.utcnow, nullable=False)
    consented_at   = Column(DateTime, nullable=True)


class Program(Base):
    __tablename__ = "programs"
    id          = Column(Integer, primary_key=True, index=True)
    start_date  = Column(Date, default=date.today, nullable=False)
    total_days  = Column(Integer, default=30, nullable=False)
    device_id   = Column(String, default="anonymous", nullable=False, index=True)   # legacy (pre-accounts), no longer used
    user_id     = Column(Integer, nullable=True, index=True)       # owner (users.id); NULL = old pre-accounts row
    is_demo     = Column(Boolean, default=False, nullable=False)   # True when seeded with synthetic scans


class SkinScan(Base):
    __tablename__ = "skin_scans"
    id                 = Column(Integer, primary_key=True, index=True)
    created_at         = Column(DateTime, default=datetime.utcnow, nullable=False)
    day_number         = Column(Integer, nullable=False)
    device_id          = Column(String, default="anonymous", nullable=False, index=True)   # legacy, unused
    user_id            = Column(Integer, nullable=True, index=True)       # owner (users.id)

    # CV output vector — swap mock_cv.py for the real model later
    acne_score         = Column(Float, nullable=False)   # 0-10, lower = healthier
    redness_score      = Column(Float, nullable=False)   # 0-10, lower = healthier
    dryness_score      = Column(Float, nullable=False)   # 0-10, lower = healthier
    ita_value          = Column(Float, nullable=False)   # fairness context only, never shown as a score

    # Environmental context
    local_aqi          = Column(Integer, nullable=True)
    pm25               = Column(Float, nullable=True)
    dominant_pollutant = Column(String, nullable=True)
    aqi_band           = Column(String, nullable=True)

    # No image column — images are processed in memory and discarded (blueprint §6)


class DietaryLog(Base):
    """
    Daily food log per user. This is what makes recommendations
    personalized — without it, everyone with the same scores gets the
    same food list. With it, foods the user already eats are filtered
    out and actual dietary gaps drive the output.
    """
    __tablename__ = "dietary_logs"
    id         = Column(Integer, primary_key=True, index=True)
    logged_at  = Column(DateTime, default=datetime.utcnow, nullable=False)
    log_date   = Column(Date, nullable=False)
    device_id  = Column(String, default="anonymous", nullable=False, index=True)   # legacy, unused
    user_id    = Column(Integer, nullable=True, index=True)       # owner (users.id)

    # Stored as a JSON list of food name strings
    # e.g. ["white rice", "dal", "curd", "chai"]
    foods_eaten = Column(JSON, default=list, nullable=False)


class NutrientEvidenceRule(Base):
    """
    Evidence documentation layer — stores the citation, explanation, and
    body text for each nutrient target. The matching logic is now math
    (scoring coefficients in recommender.py), not centroid lookup.
    These records are referenced by nutrient_key after scoring, not
    matched against — they exist purely to provide human-readable
    explanations and citations for what the scorer already decided.
    """
    __tablename__ = "nutrient_evidence_rules"
    id                   = Column(Integer, primary_key=True, index=True)
    nutrient_key         = Column(String, unique=True, nullable=False)
    title                = Column(String, nullable=False)
    body                 = Column(Text, nullable=False)
    nutrient_explanation = Column(Text, nullable=False)
    evidence_tier        = Column(String, nullable=False)  # clinical | mixed | traditional
    source_note          = Column(String, nullable=True)


class PlanItem(Base):
    """A food the user chose to follow from their recommendations.
    kind 'try'   : goal is to eat it on at least target_days of the last 7 days.
    kind 'limit' : goal is to eat it on at most  target_days of the last 7 days.
    Progress is computed from the food log, so there is no separate check-in table."""
    __tablename__ = "plan_items"
    __table_args__ = (UniqueConstraint("user_id", "food", name="uq_plan_user_food"),)
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    food        = Column(String, nullable=False)          # canonical name from /api/foods/
    kind        = Column(String, nullable=False)          # try | limit
    target_days = Column(Integer, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow, nullable=False)
