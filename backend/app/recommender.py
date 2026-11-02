"""
Nutrient relevance scorer.

Instead of a fixed list of rules, every scan produces a continuous relevance score
for every nutrient target, so the output is never capped at a handful of rules.

IMPORTANT - HONESTY NOTE:
  The weights in COEFFICIENTS and the AQI multipliers in AQI_THRESHOLDS are
  PLACEHOLDER VALUES chosen by the project team to give sensible rankings.
  They are NOT published coefficients and are NOT derived from any paper.
  The evidence text shown to users (app/evidence.py) is separate and was checked
  against real sources. Tune the weights later with expert review or user data.
"""

# ── PLACEHOLDER scoring weights (team-chosen, not from papers) ──────────────
# Each weight is how strongly that skin metric raises the relevance of that nutrient.
# Format: { nutrient_key: { metric: weight } }

COEFFICIENTS = {
    "low_glycemic": {
        "acne":     0.68,
        "redness":  0.22,
        "dryness":  0.05,
    },
    "dairy_reduce": {
        "acne":     0.41,
        "redness":  0.18,
        "dryness":  0.00,
    },
    "zinc": {
        "acne":     0.35,
        "redness":  0.28,
        "dryness":  0.10,
    },
    "omega3": {
        "acne":     0.20,
        "redness":  0.52,
        "dryness":  0.18,
    },
    "antioxidant_vit_c": {

        "acne":     0.15,
        "redness":  0.30,
        "dryness":  0.10,
    },
    "antioxidant_vit_e": {
        "acne":     0.10,
        "redness":  0.25,
        "dryness":  0.35,
    },
    "healthy_fats": {
        "acne":     0.05,
        "redness":  0.10,
        "dryness":  0.61,
    },
    "probiotic": {
        "acne":     0.30,
        "redness":  0.15,
        "dryness":  0.05,
    },
    "vitamin_d": {

        "acne":     0.20,
        "redness":  0.20,
        "dryness":  0.25,
    },
    "water_intake": {
        "acne":     0.05,
        "redness":  0.05,
        "dryness":  0.55,
    },
}
# Placeholder multipliers (experimental): more antioxidant-food emphasis on worse-air days.
AQI_THRESHOLDS = {
    "good":        1.0,
    "satisfactory": 1.1,
    "moderate":    1.2,
    "poor":        1.4,
    "very_poor":   1.6,
    "severe":      1.8,
}

ANTIOXIDANT_KEYS = {"antioxidant_vit_c", "antioxidant_vit_e"}


def score_nutrient_targets(
    acne_score: float,
    redness_score: float,
    dryness_score: float,
    aqi_band: str = "moderate",
) -> dict[str, float]:
    """
    Returns every nutrient key with a continuous relevance score for this
    exact person's numbers. No rule fires/doesn't fire — every nutrient
    gets scored, and the caller decides how many to surface.

    Example output:
        {
          "low_glycemic":      5.21,
          "antioxidant_vit_c": 4.87,  ← boosted by high AQI
          "zinc":              3.94,
          "omega3":            3.61,
          "healthy_fats":      1.40,
          ...
        }
    """
    aqi_modifier = AQI_THRESHOLDS.get(aqi_band, 1.0)
    scores = {}

    for nutrient_key, weights in COEFFICIENTS.items():
        base_score = (
            acne_score    * weights["acne"] +
            redness_score * weights["redness"] +
            dryness_score * weights["dryness"]
        )
        # Apply AQI amplifier to antioxidant targets
        if nutrient_key in ANTIOXIDANT_KEYS:
            base_score *= aqi_modifier

        scores[nutrient_key] = round(base_score, 3)

    # Return sorted highest to lowest relevance
    return dict(sorted(scores.items(), key=lambda x: x[1], reverse=True))


def top_nutrient_targets(
    acne_score: float,
    redness_score: float,
    dryness_score: float,
    aqi_band: str = "moderate",
    top_n: int = 3,
    min_score: float = 1.0,   # don't surface targets with negligible relevance
) -> list[str]:
    """
    Returns the top N nutrient keys above the minimum relevance threshold.
    This is what the router calls — it then passes these keys to
    nutrient_lookup.py to get the actual food recommendations.
    """
    scored = score_nutrient_targets(acne_score, redness_score, dryness_score, aqi_band)
    return [k for k, v in scored.items() if v >= min_score][:top_n]


def compute_trend(scans: list, metric: str, current_value: float, min_scans: int = 3) -> str:
    """
    Compares current_value against the rolling average of past scans
    for a given metric. Smoothed over the window (not single-point
    comparison) to avoid whiplash from one noisy scan — see blueprint §7.
    Lower scores = healthier, so a drop = improving.
    """
    if len(scans) < min_scans:
        return "insufficient_data"

    past_avg = sum(getattr(s, metric) for s in scans) / len(scans)
    delta = current_value - past_avg

    threshold = 0.5  # on 0-10 scale — avoids flagging normal noise as a trend
    if delta <= -threshold:
        return "improving"
    elif delta >= threshold:
        return "worsening"
    return "flat"
