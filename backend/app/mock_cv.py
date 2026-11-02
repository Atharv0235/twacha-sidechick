import random

def mock_analyze_image(image_bytes: bytes | None = None) -> dict:
    """
    Stand-in for the real Phase 3 CV pipeline.
    Swap this for MobileNetV2/YOLOv8 + OpenCV later.
    Return shape must stay identical — nothing downstream changes.
    """
    return {
        "acne_score":    round(random.uniform(2, 8), 1),
        "redness_score": round(random.uniform(1, 7), 1),
        "dryness_score": round(random.uniform(1, 6), 1),
        "ita_value":     round(random.uniform(10, 55), 1),
    }
