"""
Optional. Copies app/evidence.py into the nutrient_evidence_rules table.
The API reads app/evidence.py directly, so you do NOT need to run this.
"""
from app.database import Base, engine, SessionLocal
from app.models import NutrientEvidenceRule
from app.evidence import EVIDENCE

Base.metadata.create_all(bind=engine)
db = SessionLocal()
for key, e in EVIDENCE.items():
    row = db.query(NutrientEvidenceRule).filter_by(nutrient_key=key).first()
    if row is None:
        row = NutrientEvidenceRule(nutrient_key=key, title="", body="", nutrient_explanation="", evidence_tier="mixed")
        db.add(row)
    row.title = e["title"]
    row.body = e["nutrient_explanation"]
    row.nutrient_explanation = e["nutrient_explanation"]
    row.evidence_tier = e["evidence_tier"]
    row.source_note = e["source_note"]
db.commit()
print(f"Upserted {len(EVIDENCE)} evidence rows.")
