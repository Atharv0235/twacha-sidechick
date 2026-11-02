# Skin & Dietary Wellness Tracker — Final Project Blueprint (Revised)

## 1. Project Summary

A mobile-first web app that scores facial skin condition from a smartphone photo and maps that score to evidence-tiered dietary and skincare recommendations, tuned for Indian/Fitzpatrick III–VI skin. Differentiator vs. apps like LooksIQ: those wrap a general-purpose vision LLM around selfies with no domain training; this system trains a dedicated CV model on a purpose-built dermatology dataset and backs recommendations with a literature-sourced, evidence-tagged knowledge base rather than an LLM's free-form output.

## 2. Architecture (unchanged from original proposal)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js + Tailwind | Camera overlay for consistent framing, progress dashboard |
| Backend | Python + Django | Image ingestion, model routing, JSON payload assembly |
| Preprocessing | OpenCV | Lighting normalization, crop standardization — **also does real analytical work now, see §3.1** |

## 3. ML Strategy — Revised

The single biggest change from the original proposal: **not every metric should be a trained deep learning model.** Match the method to what the data actually supports.

### 3.1 Computer Vision Pipeline

| Metric | Method | Why |
|---|---|---|
| **Acne** (severity + lesion detection) | Deep learning — MobileNetV2/EfficientNet (classification) + YOLOv8-Nano (detection) | Only metric with a proper labeled severity dataset; texture/color complexity genuinely needs learned features |
| **Redness / erythema** | Classical CV — LAB/HSV color-space deviation analysis in OpenCV | No labeled dataset exists; redness is fundamentally a color signal, not a texture/shape one |
| **Dryness** (rename from "Hydration") | Classical CV — texture roughness + specular highlight analysis | True hydration needs a corneometer; a photo can only proxy visible dryness/flaking — say so explicitly in the UI |
| **Skin tone context** (for fairness checks, not user-facing) | Individual Typology Angle (ITA), computed directly from L*a*b* pixel values | Standard dermatology-CV technique; needs zero training data, avoids Fitzpatrick17k's label-quality problems |

### 3.2 Recommendation Engine

Keep **traditional ML (Decision Tree / KNN)** — do not upgrade this to deep learning. The input is low-dimensional (a handful of scores), there's no large labeled outcome dataset, and interpretability (showing *why* a recommendation was given) matters for a health-adjacent tool. A decision tree over an evidence-tagged rule set is both more defensible and easier to build than a neural net here.

**Knowledge base structure** — every rule should carry an evidence tag:
- `clinical` — backed by systematic review / RCT (e.g., low-glycemic-index diet reducing acne lesion counts)
- `mixed` — literature conflicts (e.g., dairy and acne)
- `traditional` — Ayurvedic/complementary source, not clinical evidence

Never blend these tiers with equal confidence in the output.

## 4. Datasets & Data Sources Required

| Source | Use | What it provides | License / Access notes |
|---|---|---|---|
| **ACNE04** | Primary CV training set (acne) | Dermatologist-labeled severity grades + lesion bounding boxes; standard ICCV 2019 benchmark | Research use, freely available — check current repo for terms before any commercial use |
| **DermaCon-IN** | Validation/fine-tuning for Indian skin tones | 5,450 clinically annotated South Indian images, 245 diagnosis labels, IRB-approved | CC BY-NC-SA 4.0 — non-commercial only; use for eval/fine-tuning, not as your primary severity-label source |
| **SCIN (Google Research)** | Optional supplementary diversity data | 10,000+ crowd-sourced everyday skin images | US-based, skews toward lighter Fitzpatrick tones (~14% are V/VI) — don't rely on it for your India-fairness claims |
| **Fitzpatrick17k** | Deprioritized / optional only | Skin-tone benchmark, 17k images | Known label-quality issues (scraped from atlases) — prefer computing ITA directly instead |
| **No dataset — classical CV** | Redness, dryness | N/A — computed via OpenCV color/texture analysis, no training data needed | — |
| **ICMR-NIN Indian Food Composition Tables (IFCT 2017)** | Nutrient values for 528 Indian foods, nationally sampled | Converts recommendation logic into real food suggestions | Free for personal/research use; **written permission required to store/reproduce electronically in a product** |
| **Indian Nutrient Databank (INDB)** | Preferred alternative to raw IFCT for app integration | 1,095 food items + 1,014 recipes, built from IFCT 2017/2004 + UK/US data | Explicitly open-access for reuse — safer to build on than raw IFCT |
| **Literature corpus** (PubMed/MEDLINE systematic reviews on diet & acne) | Source for the recommendation rule set itself | ~15–20 papers distilled into evidence-tagged if-then rules | Not a dataset to download — this is manual curation work, budget real time for it |

## 5. Revised Development Roadmap

**Phase 1 — Schema Definition**
- Define CV output JSON vector (acne, redness, dryness, ITA-based tone context)
- Design recommendation knowledge base schema with evidence tags
- Draft consent/privacy flow for facial image capture and storage

**Phase 2 — Recommender Prototyping**
- Build the decision tree/KNN model against mock CV vectors
- Populate an initial rule set (10–20 rules) from literature review, evidence-tagged
- Cross-reference rules against INDB for concrete food suggestions

**Phase 3 — Vision Model Training**
- Train MobileNetV2/YOLOv8-Nano on ACNE04 for acne severity + detection
- Implement redness (color-space) and dryness (texture) analysis in OpenCV — no training required
- Compute ITA for skin-tone fairness checks
- Validate generalization on a labeled subset of DermaCon-IN
- **Fallback if time-constrained:** ship the classical-CV redness/dryness features even if acne model training slips — they're cheap wins that don't block on data/training time

**Phase 4 — Full-Stack Integration**
- Django pipeline: image → CV output vector → recommender → JSON payload → Next.js frontend
- Add disclaimers ("not a medical diagnosis") wherever output is shown
- Small validation round: 5–10 test users, compare model scores to self-assessment

## 6. Do / Don't Summary

**Do:** evidence-tag every recommendation · validate against a real person with domain knowledge · consent + deletion policy before collecting any real photos · keep Phase 3 fallback-ready · use classical CV where no dataset exists.

**Don't:** train deep learning on redness/dryness/recommendations · treat DermaCon-IN diagnosis labels as severity scores · claim "hydration" measurement from a photo · mix Ayurvedic and clinical claims at equal confidence · use raw IFCT data in a shipped product without permission.

## 7. Evaluation Plan

- CV: compare model severity output against dermatologist/self-assessment on a small held-out set
- Recommender: manual review of rule outputs by a domain-literate reviewer before scaling the knowledge base
- End-to-end: qualitative user feedback round (5–10 users) on whether recommendations feel relevant and non-generic
