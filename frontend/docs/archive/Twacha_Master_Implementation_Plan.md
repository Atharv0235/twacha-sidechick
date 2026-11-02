# 🪷 Twacha — Master Implementation Plan

> **Skin & Dietary Wellness Tracker** — A mobile-first app that scores facial skin condition from a smartphone photo and maps that score to evidence-tiered dietary/skincare recommendations, tuned for Indian/Fitzpatrick III–VI skin.

---

## Table of Contents

1. [Project Architecture Overview](#1-project-architecture-overview)
2. [Everything You Need to Download & Install](#2-everything-you-need-to-download--install)
3. [All Datasets — Where to Get Them](#3-all-datasets--where-to-get-them)
4. [All APIs — Registration & Keys](#4-all-apis--registration--keys)
5. [All Open-Source Projects & Repos to Clone](#5-all-open-source-projects--repos-to-clone)
6. [Phase 0 — Environment Setup (Week 0)](#6-phase-0--environment-setup-week-0)
7. [Phase 1 — Schema & API Contract (Weeks 1–2)](#7-phase-1--schema--api-contract-weeks-1-2)
8. [Phase 2 — Recommender Engine (Weeks 2–4)](#8-phase-2--recommender-engine-weeks-2-4)
9. [Phase 3 — Computer Vision Pipeline (Weeks 2–5)](#9-phase-3--computer-vision-pipeline-weeks-2-5)
10. [Phase 4 — Flutter Frontend (Weeks 1–5, parallel)](#10-phase-4--flutter-frontend-weeks-1-5-parallel)
11. [Phase 5 — Full-Stack Integration (Weeks 5–6)](#11-phase-5--full-stack-integration-weeks-5-6)
12. [Phase 6 — 30-Day Adaptive Program & Pollution Layer (Weeks 6–7)](#12-phase-6--30-day-adaptive-program--pollution-layer-weeks-6-7)
13. [Phase 7 — Privacy, Security & Compliance (Week 7)](#13-phase-7--privacy-security--compliance-week-7)
14. [Phase 8 — Testing, Validation & Evaluation (Weeks 7–8)](#14-phase-8--testing-validation--evaluation-weeks-7-8)
15. [Phase 9 — Deployment & Hosting (Week 8)](#15-phase-9--deployment--hosting-week-8)
16. [Complete File/Folder Structure](#16-complete-filefolder-structure)
17. [Risk Matrix & Fallbacks](#17-risk-matrix--fallbacks)
18. [Key Research Papers to Read](#18-key-research-papers-to-read)

---

## 1. Project Architecture Overview

```mermaid
graph TB
    subgraph "Flutter App (Cross-Platform)"
        A[Camera Capture Screen] --> B[Image Upload via HTTP/Dio]
        C[Dashboard Screen] --> D[Score Gauges + Recs]
        E[Trend/History Screen] --> F["fl_chart Line Charts"]
    end

    subgraph "Django Backend (Python)"
        G["POST /api/scan/"] --> H[Image Preprocessing - OpenCV]
        H --> I[CV Pipeline]
        I --> J["Acne: MobileNetV2 + YOLOv8-Nano"]
        I --> K["Redness: LAB/HSV Color Analysis"]
        I --> L["Dryness: Texture Roughness Analysis"]
        I --> M["Skin Tone: ITA Computation"]
        J & K & L & M --> N[Score Vector Assembly]
        N --> O[Recommendation Engine - KNN/Decision Tree]
        O --> P["Evidence-Tagged JSON Response"]
        Q["GET /api/history/"] --> R[PostgreSQL Score Records]
    end

    subgraph "External APIs"
        S["WAQI API (aqicn.org)"] --> T[AQI/PM2.5 Data]
        T --> O
    end

    B --> G
    P --> D
    R --> E
```

| Layer | Technology | Purpose |
|---|---|---|
| **Mobile App** | Flutter + Riverpod | Cross-platform UI, camera, charts |
| **Backend API** | Django + Django REST Framework | Image ingestion, model routing, recommendations |
| **CV Models** | MobileNetV2 (TensorFlow/PyTorch) + YOLOv8-Nano (Ultralytics) | Acne severity + lesion detection |
| **Classical CV** | OpenCV (Python) | Redness, dryness, ITA — no training needed |
| **Recommender** | Scikit-learn (KNN / Decision Tree) | Evidence-tagged dietary/skincare rules |
| **Database** | PostgreSQL (Supabase/Neon free tier) | Score records, user data |
| **AQI Data** | WAQI API (aqicn.org) | Pollution-adjusted skin insights |

---

## 2. Everything You Need to Download & Install

### 2.1 System-Level Prerequisites

| Tool | Version | Download Link | Purpose |
|---|---|---|---|
| **Python** | 3.10+ | [python.org/downloads](https://www.python.org/downloads/) | Backend runtime |
| **Flutter SDK** | 3.x (stable) | [flutter.dev/docs/get-started/install](https://flutter.dev/docs/get-started/install) | Mobile app framework |
| **Android Studio** | Latest | [developer.android.com/studio](https://developer.android.com/studio) | Android emulator + SDK |
| **Git** | Latest | [git-scm.com/downloads](https://git-scm.com/downloads) | Version control |
| **PostgreSQL** | 15+ | [postgresql.org/download](https://www.postgresql.org/download/) | Local database (or use Supabase) |
| **CUDA Toolkit** | 11.8+ | [developer.nvidia.com/cuda-downloads](https://developer.nvidia.com/cuda-downloads) | GPU-accelerated training (optional — use Colab if no GPU) |
| **VS Code** | Latest | [code.visualstudio.com](https://code.visualstudio.com/) | Editor |

### 2.2 Python Packages (Backend)

```bash
# Create virtual environment
python -m venv twacha_env
twacha_env\Scripts\activate  # Windows

# Core backend
pip install django djangorestframework django-cors-headers pillow psycopg2-binary gunicorn

# Computer Vision & ML
pip install opencv-python opencv-contrib-python numpy scipy
pip install torch torchvision  # OR tensorflow tf-keras (pick one)
pip install ultralytics        # YOLOv8
pip install scikit-learn       # Recommendation engine (KNN/DecisionTree)

# Data handling
pip install pandas openpyxl    # For INDB Excel processing
pip install requests           # For WAQI API calls

# Image preprocessing
pip install albumentations     # Advanced data augmentation

# Utilities
pip install python-decouple    # Environment variables
pip install celery redis       # Background task processing (optional)
pip install matplotlib seaborn # Visualization for model evaluation
```

### 2.3 Flutter Packages (Frontend)

Add to `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter

  # State management
  flutter_riverpod: ^2.4.0

  # Camera & image
  camera: ^0.11.0
  image_picker: ^1.0.0

  # Networking
  dio: ^5.4.0
  http: ^1.2.0

  # Charts
  fl_chart: ^0.68.0

  # Face detection overlay
  google_mlkit_face_detection: ^0.12.0

  # UI extras
  percent_indicator: ^4.2.0      # Gauge-style score display
  flutter_svg: ^2.0.0
  google_fonts: ^6.1.0
  shimmer: ^3.0.0                 # Loading animations
  lottie: ^3.0.0                  # Micro-animations

  # Storage
  shared_preferences: ^2.2.0
  flutter_secure_storage: ^9.0.0

  # Permissions
  permission_handler: ^11.0.0
```

---

## 3. All Datasets — Where to Get Them

### 3.1 ACNE04 (PRIMARY — Acne Model Training)

| Property | Detail |
|---|---|
| **What** | Dermatologist-labeled acne severity grades + lesion bounding boxes |
| **Size** | ~1,204 images, 32,443 annotations (v2) |
| **Format** | COCO format (JSON annotations + images) |
| **License** | Research use, freely available |
| **Download** | |

| Source | URL |
|---|---|
| Refined v2 (Recommended) | [github.com/AIpourlapeau/acne04v2](https://github.com/AIpourlapeau/acne04v2) |
| Original (LDL paper) | [github.com/xpwu95/ldl](https://github.com/xpwu95/ldl) |
| Pre-trained models | [huggingface.co/will702/acne-cv-models](https://huggingface.co/will702/acne-cv-models) |

**Download commands:**
```bash
git clone https://github.com/AIpourlapeau/acne04v2.git
```

### 3.2 DermaCon-IN (VALIDATION — Indian Skin Tones)

| Property | Detail |
|---|---|
| **What** | 5,450 clinically annotated images from South Indian patients |
| **Size** | ~3,000 patients, 245 diagnosis labels |
| **License** | CC BY-NC-SA 4.0 (non-commercial only) |
| **Use** | Validation/fine-tuning only — NOT primary training set |

| Source | URL |
|---|---|
| Harvard Dataverse | [dataverse.harvard.edu (DOI: 10.7910/DVN/W7OUZM)](https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/W7OUZM) |
| GitHub (code + checkpoints) | [github.com/DermaCon-IN/DermaCon-IN](https://github.com/DermaCon-IN/DermaCon-IN) |

### 3.3 SCIN — Google Research (OPTIONAL — Diversity Supplement)

| Property | Detail |
|---|---|
| **What** | 10,000+ crowdsourced everyday skin images |
| **License** | Open access |
| **Caveat** | US-based, skews lighter skin tones (~14% Fitzpatrick V/VI) |

| Source | URL |
|---|---|
| GitHub | [github.com/google-research-datasets/scin](https://github.com/google-research-datasets/scin) |
| Hugging Face | [huggingface.co/datasets/google/scin](https://huggingface.co/datasets/google/scin) |
| Demo Notebook | [Colab Notebook](https://colab.research.google.com/github/google-research-datasets/scin/blob/main/scin_demo.ipynb) |

### 3.4 Fitzpatrick17k (DEPRIORITIZED — Optional Only)

| Property | Detail |
|---|---|
| **What** | 17k dermatology images with Fitzpatrick labels |
| **Caveat** | Known label-quality issues (scraped from atlases) — prefer computing ITA directly |

| Source | URL |
|---|---|
| GitHub | [github.com/mattgroh/fitzpatrick17k](https://github.com/mattgroh/fitzpatrick17k) |
| ITA Analysis Notebook | `ita_fitzpatrick_analysis.ipynb` in the repo |

### 3.5 Indian Nutrient Databank — INDB (FOOD RECOMMENDATIONS)

| Property | Detail |
|---|---|
| **What** | 1,095 food items + 1,014 Indian recipes with full nutrient profiles |
| **License** | Open-access for reuse |
| **Format** | Excel (.xlsx) |

| Source | URL |
|---|---|
| Direct Download (Excel) | [ANUVAAD_INDB_2024.xlsx](https://www.anuvaad.org.in/wp-content/uploads/2020/07/ANUVAAD_INDB_2024.xlsx) |
| GitHub (Code + Methodology) | [github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB](https://github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB) |
| Research Paper | [ScienceDirect (PMC)](https://www.sciencedirect.com/science/article/pii/S2475299124017244) |

> [!IMPORTANT]
> **Use INDB (not raw IFCT 2017)** — INDB is explicitly open-access for reuse. Raw IFCT requires written permission for electronic reproduction in a product.

### 3.6 No Dataset Needed — Classical CV

| Metric | Method | Data Required |
|---|---|---|
| Redness / Erythema | LAB/HSV color-space deviation in OpenCV | **None — computed directly** |
| Dryness | Texture roughness + specular highlight analysis | **None — computed directly** |
| Skin Tone (ITA) | Individual Typology Angle from L*a*b* pixels | **None — computed directly** |

---

## 4. All APIs — Registration & Keys

### 4.1 WAQI — World Air Quality Index API

| Property | Detail |
|---|---|
| **Purpose** | Real-time city-level AQI, PM2.5, PM10, NO2 data for pollution-skin insights |
| **Cost** | **Free** |
| **Rate Limit** | 1,000 requests/second |
| **Restriction** | Cannot be used in **paid** applications or sold packages |
| **Registration** | [aqicn.org/data-platform/token](https://aqicn.org/data-platform/token/) — provide email, get token instantly |
| **API Docs** | [aqicn.org/api](https://aqicn.org/api/) |

**Example API call:**
```python
import requests

WAQI_TOKEN = "YOUR_TOKEN_HERE"
city = "delhi"
url = f"https://api.waqi.info/feed/{city}/?token={WAQI_TOKEN}"
response = requests.get(url).json()

aqi = response["data"]["aqi"]
pm25 = response["data"]["iaqi"].get("pm25", {}).get("v")
dominant = response["data"]["dominentpol"]
```

### 4.2 OpenWeatherMap Air Pollution API (FALLBACK)

| Property | Detail |
|---|---|
| **Purpose** | Backup if WAQI rate-limits become a problem |
| **Cost** | Free tier: 60 calls/min, 1,000,000 calls/month |
| **Registration** | [openweathermap.org/api](https://openweathermap.org/api) |
| **Docs** | [Air Pollution API](https://openweathermap.org/api/air-pollution) |

### 4.3 No Other External APIs Required

The rest of the pipeline is **self-contained**:
- CV models run locally (or on your server)
- Recommender runs locally
- INDB is a downloaded Excel file
- Literature rules are manually curated

---

## 5. All Open-Source Projects & Repos to Clone

### 5.1 Directly Used in Your Project

| Repo | URL | What You Use It For |
|---|---|---|
| **ACNE04 v2** | [github.com/AIpourlapeau/acne04v2](https://github.com/AIpourlapeau/acne04v2) | Primary acne training dataset |
| **Ultralytics YOLOv8** | [github.com/ultralytics/ultralytics](https://github.com/ultralytics/ultralytics) | YOLOv8-Nano acne lesion detection |
| **INDB** | [github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB](https://github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB) | Indian food nutrient data |
| **DermaCon-IN** | [github.com/DermaCon-IN/DermaCon-IN](https://github.com/DermaCon-IN/DermaCon-IN) | Validation on Indian skin tones |
| **Fitzpatrick17k** | [github.com/mattgroh/fitzpatrick17k](https://github.com/mattgroh/fitzpatrick17k) | ITA analysis reference only |

### 5.2 Reference Repos (Learn From, Don't Copy)

| Repo | URL | What You Learn |
|---|---|---|
| **Acne Detection YOLOv8** | [github.com/sufiinamulhassan/Acne-Detection-Using-YOLOv8](https://github.com/sufiinamulhassan/Acne-Detection-Using-YOLOv8) | YOLOv8 training pipeline for acne |
| **Skin Disease Detection YOLO** | [github.com/NIKK0001/Skin_Disease_Detection-YOLO-V8](https://github.com/NIKK0001/Skin_Disease_Detection-YOLO-V8) | Multi-class skin detection patterns |
| **Acne Detection & Removal** | [github.com/VinayN18/Acne-Detection-And-Removal](https://github.com/VinayN18/Acne-Detection-And-Removal) | OpenCV acne masking techniques |
| **Skin Type Classification** | [github.com/MdAliAhnaf/Skin_Type_Classification-Recommendation](https://github.com/MdAliAhnaf/Skin_Type_Classification-Recommendation) | MobileNetV2 transfer learning for skin |
| **Skin Detection (OpenCV)** | [github.com/CHEREF-Mehdi/SkinDetection](https://github.com/CHEREF-Mehdi/SkinDetection) | HSV/YCbCr skin segmentation |
| **HSV Range Finder** | [github.com/kushalchaudhari21/RangeFinder](https://github.com/kushalchaudhari21/RangeFinder) | Interactive LAB/HSV threshold tuning |
| **HuggingFace Acne Models** | [huggingface.co/will702/acne-cv-models](https://huggingface.co/will702/acne-cv-models) | Pre-trained weights for ACNE04 |

---

## 6. Phase 0 — Environment Setup (Week 0)

> **Goal:** Every team member can run the backend and frontend locally.

### Step-by-Step

```bash
# ═══════════════════════════════════════════════════════════
# 1. CREATE PROJECT ROOT
# ═══════════════════════════════════════════════════════════
mkdir twacha && cd twacha
mkdir backend frontend ml_pipeline data docs

# ═══════════════════════════════════════════════════════════
# 2. BACKEND SETUP (Django)
# ═══════════════════════════════════════════════════════════
cd backend
python -m venv venv
venv\Scripts\activate  # Windows

pip install django djangorestframework django-cors-headers pillow
pip install opencv-python numpy scipy scikit-learn
pip install ultralytics torch torchvision
pip install pandas openpyxl requests
pip install python-decouple psycopg2-binary

django-admin startproject twacha_backend .
python manage.py startapp scan
python manage.py startapp recommendations

# ═══════════════════════════════════════════════════════════
# 3. FLUTTER SETUP (Frontend)
# ═══════════════════════════════════════════════════════════
cd ../frontend
flutter create --org com.twacha --project-name twacha_app .
# Then add packages from §2.3 to pubspec.yaml
flutter pub get

# ═══════════════════════════════════════════════════════════
# 4. ML PIPELINE SETUP
# ═══════════════════════════════════════════════════════════
cd ../ml_pipeline
mkdir acne_model classical_cv recommender evaluation

# ═══════════════════════════════════════════════════════════
# 5. DOWNLOAD DATASETS
# ═══════════════════════════════════════════════════════════
cd ../data
git clone https://github.com/AIpourlapeau/acne04v2.git
git clone https://github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB.git

# Download INDB Excel directly
curl -o ANUVAAD_INDB_2024.xlsx "https://www.anuvaad.org.in/wp-content/uploads/2020/07/ANUVAAD_INDB_2024.xlsx"

# DermaCon-IN: Download from Harvard Dataverse manually
# URL: https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/W7OUZM

# ═══════════════════════════════════════════════════════════
# 6. API KEY REGISTRATION
# ═══════════════════════════════════════════════════════════
# Visit https://aqicn.org/data-platform/token/ → register with email → save token
# Create .env file in backend/
echo "WAQI_API_TOKEN=your_token_here" > ../backend/.env
echo "DJANGO_SECRET_KEY=your_secret_key" >> ../backend/.env
echo "DATABASE_URL=postgres://user:pass@localhost:5432/twacha_db" >> ../backend/.env
```

---

## 7. Phase 1 — Schema & API Contract (Weeks 1–2)

> **Goal:** Lock the data shapes so frontend and backend can build in parallel.

### 7.1 Django Models

```python
# backend/scan/models.py
from django.db import models

class SkinScan(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    acne_score = models.FloatField(null=True)           # 0-10 scale
    redness_score = models.FloatField(null=True)         # 0-10 scale
    dryness_score = models.FloatField(null=True)         # 0-10 scale
    ita_value = models.FloatField(null=True)             # ITA for fairness
    local_aqi = models.IntegerField(null=True)           # AQI at scan time
    pm25 = models.FloatField(null=True)
    dominant_pollutant = models.CharField(max_length=10, null=True)
    aqi_band = models.CharField(max_length=20, null=True)
    city = models.CharField(max_length=100, default="Delhi")
    # NO image field — images deleted after processing


class RecommendationRule(models.Model):
    EVIDENCE_TIERS = [
        ('clinical', 'Clinical — RCT/Systematic Review'),
        ('mixed', 'Mixed — Conflicting Literature'),
        ('traditional', 'Traditional — Ayurvedic/Complementary'),
    ]

    title = models.CharField(max_length=200)
    body = models.TextField()
    evidence_tier = models.CharField(max_length=20, choices=EVIDENCE_TIERS)
    source_note = models.TextField()           # Citation
    target_metric = models.CharField(max_length=20)  # acne/redness/dryness
    min_score = models.FloatField()            # Trigger threshold
    max_score = models.FloatField()
    food_suggestions = models.JSONField(null=True)  # INDB food cross-refs
    is_pollution_specific = models.BooleanField(default=False)
```

### 7.2 API Contract

**`POST /api/scan/`** — Multipart image upload → Returns:
```json
{
  "scan": {
    "id": 1,
    "created_at": "2026-10-10T14:30:00Z",
    "acne_score": 4.2,
    "redness_score": 3.1,
    "dryness_score": 2.0,
    "local_aqi": 187,
    "pm25": 92.4,
    "dominant_pollutant": "pm25",
    "aqi_band": "unhealthy"
  },
  "recommendations": [
    {
      "title": "Reduce high-glycemic foods",
      "body": "Clinical evidence links high-glycemic diets to increased acne lesions...",
      "evidence_tier": "clinical",
      "source_note": "Smith et al., 2007 — Am J Clin Nutr",
      "trend": null,
      "food_suggestions": ["bajra roti", "moong dal", "brown rice"]
    }
  ]
}
```

**`GET /api/history/`** — Returns array of past scans (same `scan` shape, no images).

### 7.3 Serializers & Views (Skeleton)

```python
# backend/scan/serializers.py
from rest_framework import serializers
from .models import SkinScan

class SkinScanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkinScan
        fields = ['id', 'created_at', 'acne_score', 'redness_score',
                  'dryness_score', 'local_aqi', 'pm25',
                  'dominant_pollutant', 'aqi_band']


# backend/scan/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

class ScanView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image = request.FILES.get('image')
        city = request.data.get('city', 'Delhi')

        # Phase 3 will plug in here:
        # 1. Run CV pipeline on image
        # 2. Delete image immediately after scoring
        # 3. Fetch AQI
        # 4. Run recommender
        # 5. Return JSON

        # For now, return mock data
        return Response({
            "scan": {"id": 1, "acne_score": 4.2, "redness_score": 3.1, "dryness_score": 2.0},
            "recommendations": []
        })
```

---

## 8. Phase 2 — Recommender Engine (Weeks 2–4)

> **Goal:** Build the decision tree / KNN matcher over evidence-tagged rules.

### 8.1 Literature Review — Papers to Curate Rules From

You need to read **~15–20 papers** and distill them into **10–15 rules**:

| # | Topic | Evidence Tier | Key Source |
|---|---|---|---|
| 1 | Low-glycemic diet → reduced acne lesions | `clinical` | Smith et al., 2007 (Am J Clin Nutr) |
| 2 | Dairy consumption → acne association | `mixed` | Adebamowo et al., 2005 (J Am Acad Dermatol) |
| 3 | Zinc supplementation → acne improvement | `mixed` | Yee et al., 2020 (Dermatol Ther) |
| 4 | Omega-3 fatty acids → anti-inflammatory | `clinical` | Jung et al., 2014 (Acta Derm Venereol) |
| 5 | Vitamin A / beta-carotene → skin health | `clinical` | Sorg et al., 2006 (Dermatology) |
| 6 | Vitamin C → antioxidant / collagen | `clinical` | Pullar et al., 2017 (Nutrients) |
| 7 | Vitamin E → skin barrier / oxidative stress | `clinical` | Keen & Hassan, 2016 (Indian Dermatol Online J) |
| 8 | Probiotics → gut-skin axis | `mixed` | Bowe & Logan, 2011 (Gut Pathogens) |
| 9 | Water intake → hydration proxy | `mixed` | Palma et al., 2015 (Clin Cosmet Investig Dermatol) |
| 10 | Turmeric (curcumin) → anti-inflammatory | `traditional` | Vaughn et al., 2016 (Phytother Res) |
| 11 | Neem → antimicrobial traditional use | `traditional` | Subapriya & Nagini, 2005 (Curr Med Chem) |
| 12 | High PM2.5 → redness/acne worsening | `clinical` | Kim et al., 2025; Liu et al., 2019 |
| 13 | Antioxidant-rich diet during high AQI | `clinical` | Vierkötter et al., 2010 (J Invest Dermatol) |
| 14 | Sugar/refined carbs → inflammation | `clinical` | Kucharska et al., 2016 (Adv Dermatol Allergol) |
| 15 | Aloe vera → soothing/dryness relief | `traditional` | Surjushe et al., 2008 (Indian J Dermatol) |

### 8.2 Rule Schema

```python
# backend/recommendations/knowledge_base.py

RULES = [
    {
        "id": "R001",
        "title": "Reduce high-glycemic foods",
        "body": "Clinical evidence shows low-GI diets reduce acne lesion count by ~30%. Replace white rice with brown rice, maida with atta, and reduce sugar intake.",
        "evidence_tier": "clinical",
        "source_note": "Smith RN et al. (2007). A low-glycemic-load diet improves symptoms in acne vulgaris patients. Am J Clin Nutr, 86(1), 107-115.",
        "target_metric": "acne",
        "score_range": [4.0, 10.0],
        "food_suggestions": {
            "eat_more": ["brown rice", "bajra roti", "moong dal", "oats upma"],
            "eat_less": ["white rice", "maida products", "sugary drinks"]
        },
        "is_pollution_specific": False
    },
    # ... 14 more rules
]
```

### 8.3 INDB Cross-Referencing

```python
# backend/recommendations/indb_mapper.py
import pandas as pd

class INDBMapper:
    def __init__(self, indb_path="data/ANUVAAD_INDB_2024.xlsx"):
        self.df = pd.read_excel(indb_path)

    def find_foods_rich_in(self, nutrient: str, top_n: int = 10):
        """Find top Indian foods rich in a given nutrient."""
        # Column names will vary — inspect the Excel first
        sorted_df = self.df.sort_values(by=nutrient, ascending=False)
        return sorted_df.head(top_n)[['Food_Name', nutrient]].to_dict('records')

    def get_food_profile(self, food_name: str):
        """Get full nutrient profile for a specific food."""
        return self.df[self.df['Food_Name'].str.contains(food_name, case=False)]
```

### 8.4 KNN/Decision Tree Recommender

```python
# backend/recommendations/engine.py
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
import numpy as np

class RecommenderEngine:
    def __init__(self, rules):
        self.rules = rules

    def match_rules(self, acne_score, redness_score, dryness_score,
                    aqi=None, trend_data=None):
        """
        Match current scores against rule set.
        Returns list of applicable recommendations.
        """
        matched = []
        for rule in self.rules:
            metric = rule["target_metric"]
            score_map = {
                "acne": acne_score,
                "redness": redness_score,
                "dryness": dryness_score
            }
            score = score_map.get(metric, 0)
            min_s, max_s = rule["score_range"]

            if min_s <= score <= max_s:
                # Check pollution-specific rules
                if rule["is_pollution_specific"] and (aqi is None or aqi < 100):
                    continue  # Skip pollution rules when AQI is okay

                rec = {
                    "title": rule["title"],
                    "body": rule["body"],
                    "evidence_tier": rule["evidence_tier"],
                    "source_note": rule["source_note"],
                    "food_suggestions": rule.get("food_suggestions", {}),
                    "trend": self._compute_trend(metric, trend_data) if trend_data else None
                }
                matched.append(rec)

        return matched

    def _compute_trend(self, metric, trend_data):
        """Compare current score to 7-day rolling average."""
        if not trend_data or len(trend_data) < 2:
            return None
        recent = np.mean([d[metric] for d in trend_data[-3:]])
        older = np.mean([d[metric] for d in trend_data[:3]])
        diff = recent - older
        if diff < -0.5:
            return "improving"
        elif diff > 0.5:
            return "worsening"
        return "flat"
```

---

## 9. Phase 3 — Computer Vision Pipeline (Weeks 2–5)

> **Goal:** Build 4 analysis modules — 1 deep learning (acne), 3 classical CV.

### 9.1 Image Preprocessing (OpenCV)

```python
# ml_pipeline/classical_cv/preprocessor.py
import cv2
import numpy as np

class SkinImagePreprocessor:
    def __init__(self, target_size=(224, 224)):
        self.target_size = target_size

    def preprocess(self, image_path):
        """Standard preprocessing for all CV modules."""
        img = cv2.imread(image_path)

        # 1. Lighting normalization (CLAHE on LAB L-channel)
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        lab = cv2.merge([l, a, b])
        img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

        # 2. Face detection and crop
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        if len(faces) > 0:
            x, y, w, h = faces[0]
            # Add padding
            pad = int(w * 0.2)
            x1 = max(0, x - pad)
            y1 = max(0, y - pad)
            x2 = min(img.shape[1], x + w + pad)
            y2 = min(img.shape[0], y + h + pad)
            img = img[y1:y2, x1:x2]

        # 3. Resize
        img = cv2.resize(img, self.target_size)
        return img

    def get_skin_mask(self, img):
        """Isolate skin pixels using YCbCr thresholding."""
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        mask = cv2.inRange(ycrcb, np.array([0, 133, 77]), np.array([255, 173, 127]))
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        return mask
```

### 9.2 Acne Detection — MobileNetV2 (Classification)

```python
# ml_pipeline/acne_model/train_mobilenet.py
import torch
import torch.nn as nn
from torchvision import models, transforms
from torch.utils.data import DataLoader, Dataset

class AcneClassifier(nn.Module):
    def __init__(self, num_classes=4):  # 4 severity levels
        super().__init__()
        self.backbone = models.mobilenet_v2(pretrained=True)
        # Freeze early layers
        for param in list(self.backbone.parameters())[:-20]:
            param.requires_grad = False
        # Replace classifier head
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(self.backbone.last_channel, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        return self.backbone(x)

# Training config
TRAIN_TRANSFORMS = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])
```

### 9.3 Acne Detection — YOLOv8-Nano (Lesion Detection)

```python
# ml_pipeline/acne_model/train_yolo.py
from ultralytics import YOLO

# 1. Prepare data.yaml pointing to ACNE04v2 (already in COCO format)
# data.yaml:
# train: ../data/acne04v2/train/images
# val: ../data/acne04v2/val/images
# nc: 1
# names: ['acne_lesion']

# 2. Train
model = YOLO('yolov8n.pt')  # Start from nano pretrained weights
results = model.train(
    data='data.yaml',
    epochs=100,
    imgsz=640,
    batch=16,
    patience=20,  # Early stopping
    device='cuda' if torch.cuda.is_available() else 'cpu'
)

# 3. Inference
def count_acne_lesions(image_path, model_path='runs/detect/train/weights/best.pt'):
    model = YOLO(model_path)
    results = model.predict(source=image_path, conf=0.25)
    lesion_count = len(results[0].boxes)
    return lesion_count
```

> [!TIP]
> **No GPU?** Use Google Colab (free T4 GPU) or Kaggle for training. Export the `.pt` weights file and load it on your local machine for inference.

### 9.4 Redness Analysis — Classical CV (NO TRAINING)

```python
# ml_pipeline/classical_cv/redness_analyzer.py
import cv2
import numpy as np

class RednessAnalyzer:
    def analyze(self, img, skin_mask):
        """
        Compute redness score (0-10) using LAB color space.
        Higher 'a*' channel values = more red.
        """
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l_ch, a_ch, b_ch = cv2.split(lab)

        # Apply skin mask — only analyze skin pixels
        skin_a = cv2.bitwise_and(a_ch, a_ch, mask=skin_mask)
        skin_pixels = skin_a[skin_mask > 0]

        if len(skin_pixels) == 0:
            return 0.0

        # a* channel: 0-255 in OpenCV (128 = neutral)
        # Values > 128 indicate red shift
        mean_a = np.mean(skin_pixels)
        std_a = np.std(skin_pixels)

        # Normalize to 0-10 scale
        # Typical range: 125 (no redness) to 165 (significant redness)
        redness_raw = max(0, mean_a - 128) / 40.0  # 0-1 range
        redness_score = min(10.0, redness_raw * 10)

        # Also check for high-redness patches (localized erythema)
        _, red_mask = cv2.threshold(a_ch, 145, 255, cv2.THRESH_BINARY)
        red_area = cv2.bitwise_and(red_mask, skin_mask)
        patch_ratio = np.count_nonzero(red_area) / max(np.count_nonzero(skin_mask), 1)

        # Combine mean redness + patch concentration
        combined_score = (redness_score * 0.6) + (patch_ratio * 10 * 0.4)
        return round(min(10.0, combined_score), 1)
```

### 9.5 Dryness Analysis — Classical CV (NO TRAINING)

```python
# ml_pipeline/classical_cv/dryness_analyzer.py
import cv2
import numpy as np

class DrynessAnalyzer:
    def analyze(self, img, skin_mask):
        """
        Estimate visible dryness (0-10) via texture roughness
        and specular highlight analysis.
        NOT a hydration measurement — UI must say so.
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.bitwise_and(gray, gray, mask=skin_mask)

        # 1. Texture roughness via Laplacian variance
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        texture_var = laplacian.var()

        # Higher variance = rougher texture = drier skin
        # Typical range: 50 (smooth) to 500+ (very rough)
        roughness_norm = min(1.0, texture_var / 500.0)

        # 2. Specular highlight analysis (inverse = drier)
        # Healthy/moisturized skin has more specular reflections
        _, specular_mask = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY)
        specular_mask = cv2.bitwise_and(specular_mask, skin_mask)
        specular_ratio = np.count_nonzero(specular_mask) / max(np.count_nonzero(skin_mask), 1)

        # Less specular highlights = drier skin
        moisture_proxy = 1.0 - min(1.0, specular_ratio * 50)

        # Combine
        dryness_score = (roughness_norm * 0.6 + moisture_proxy * 0.4) * 10
        return round(min(10.0, dryness_score), 1)
```

### 9.6 ITA Computation — Skin Tone Context (NO TRAINING)

```python
# ml_pipeline/classical_cv/ita_analyzer.py
import cv2
import numpy as np

class ITAAnalyzer:
    def compute_ita(self, img, skin_mask):
        """
        Individual Typology Angle — standard dermatology metric.
        ITA = arctan((L* - 50) / b*) × (180/π)

        Higher ITA = lighter skin.
        Used for fairness checks, NOT shown to user.
        """
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l_ch, a_ch, b_ch = cv2.split(lab)

        skin_l = l_ch[skin_mask > 0].astype(float)
        skin_b = b_ch[skin_mask > 0].astype(float)

        if len(skin_l) == 0:
            return None

        # OpenCV LAB: L is 0-255 (needs /255*100 for standard L*)
        # b is 0-255 (centered at 128, so subtract 128)
        l_star = np.mean(skin_l) / 255.0 * 100.0
        b_star = np.mean(skin_b) - 128.0

        if abs(b_star) < 0.001:
            b_star = 0.001  # Avoid division by zero

        ita = np.degrees(np.arctan((l_star - 50) / b_star))
        return round(ita, 1)

    def classify_tone(self, ita):
        """Classify into ITA categories (for internal use only)."""
        if ita is None:
            return "unknown"
        if ita > 55:    return "very_light"
        if ita > 41:    return "light"
        if ita > 28:    return "intermediate"
        if ita > 10:    return "tan"
        if ita > -30:   return "brown"
        return "dark"
```

### 9.7 Master CV Pipeline

```python
# ml_pipeline/pipeline.py
from .classical_cv.preprocessor import SkinImagePreprocessor
from .classical_cv.redness_analyzer import RednessAnalyzer
from .classical_cv.dryness_analyzer import DrynessAnalyzer
from .classical_cv.ita_analyzer import ITAAnalyzer
from .acne_model.inference import AcneInference  # wraps MobileNetV2 + YOLO

class CVPipeline:
    def __init__(self):
        self.preprocessor = SkinImagePreprocessor()
        self.acne = AcneInference()
        self.redness = RednessAnalyzer()
        self.dryness = DrynessAnalyzer()
        self.ita = ITAAnalyzer()

    def analyze(self, image_path):
        img = self.preprocessor.preprocess(image_path)
        skin_mask = self.preprocessor.get_skin_mask(img)

        return {
            "acne_score": self.acne.predict(img),       # Deep learning
            "redness_score": self.redness.analyze(img, skin_mask),  # Classical CV
            "dryness_score": self.dryness.analyze(img, skin_mask),  # Classical CV
            "ita_value": self.ita.compute_ita(img, skin_mask),      # Classical CV
        }
```

---

## 10. Phase 4 — Flutter Frontend (Weeks 1–5, parallel)

> **Goal:** Build all screens against mock data FIRST, swap to real API later.

### 10.1 Screen Map

```mermaid
graph LR
    A[Home / Dashboard] --> B[New Scan Button]
    B --> C[Capture Screen]
    C --> D[Result Screen]
    A --> E[Trend / History]
    D --> F["Recommendation Detail (optional)"]

    style A fill:#1a1a2e,stroke:#e94560,color:#fff
    style C fill:#1a1a2e,stroke:#0f3460,color:#fff
    style D fill:#1a1a2e,stroke:#16213e,color:#fff
    style E fill:#1a1a2e,stroke:#533483,color:#fff
```

| Screen | Purpose | Key Widgets |
|---|---|---|
| **Home / Dashboard** | Today's scores + top recommendations + AQI badge | Gauge indicators, recommendation cards, AQI color badge |
| **Capture** | Camera with face alignment overlay | `CameraPreview` + `CustomPainter` oval guide |
| **Result** | Scores just returned + evidence-tagged recommendations | Score gauges, evidence tier color coding, disclaimer |
| **Trend / History** | 7/14/30-day line charts, timeline, milestones | `fl_chart` `LineChart`, scrollable list |

### 10.2 Key Implementation Details

**Camera with Face Alignment:**
```dart
// Use Stack widget with CameraPreview + face guide overlay
Stack(
  children: [
    CameraPreview(controller: cameraController),
    CustomPaint(
      painter: FaceGuideOverlay(),  // Draws oval + guide text
    ),
    Positioned(
      bottom: 30,
      child: CaptureButton(onTap: _captureAndUpload),
    ),
  ],
)
```

**Score Gauge Display:**
```dart
// Use percent_indicator for gauge-style scores
CircularPercentIndicator(
  radius: 60.0,
  lineWidth: 8.0,
  percent: acneScore / 10.0,
  center: Text("${acneScore}", style: TextStyle(fontSize: 20)),
  progressColor: _getColorForScore(acneScore),
  backgroundColor: Colors.grey.shade800,
)
```

**Evidence Tier Color Coding:**
```dart
Color getEvidenceTierColor(String tier) {
  switch (tier) {
    case 'clinical':    return Color(0xFF4CAF50);  // Green
    case 'mixed':       return Color(0xFFFFC107);  // Amber
    case 'traditional': return Color(0xFF9C27B0);  // Purple
    default:            return Colors.grey;
  }
}
```

---

## 11. Phase 5 — Full-Stack Integration (Weeks 5–6)

> **Goal:** Connect Flutter ↔ Django, swap mock data for real model output.

### 11.1 Django View (Full Implementation)

```python
# backend/scan/views.py
import os
import tempfile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import SkinScan
from .serializers import SkinScanSerializer
from ml_pipeline.pipeline import CVPipeline
from recommendations.engine import RecommenderEngine
from recommendations.knowledge_base import RULES
from services.waqi_service import fetch_aqi

cv_pipeline = CVPipeline()
recommender = RecommenderEngine(RULES)

class ScanView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image = request.FILES.get('image')
        city = request.data.get('city', 'Delhi')

        if not image:
            return Response({"error": "No image provided"}, status=400)

        # 1. Save temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            for chunk in image.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        try:
            # 2. Run CV pipeline
            scores = cv_pipeline.analyze(tmp_path)

            # 3. Fetch AQI
            aqi_data = fetch_aqi(city)

            # 4. Save scan record (NO IMAGE)
            scan = SkinScan.objects.create(
                acne_score=scores['acne_score'],
                redness_score=scores['redness_score'],
                dryness_score=scores['dryness_score'],
                ita_value=scores['ita_value'],
                local_aqi=aqi_data.get('aqi'),
                pm25=aqi_data.get('pm25'),
                dominant_pollutant=aqi_data.get('dominant'),
                aqi_band=aqi_data.get('band'),
                city=city,
            )

            # 5. Get recommendations
            history = SkinScan.objects.order_by('-created_at')[:10]
            trend_data = [
                {"acne": s.acne_score, "redness": s.redness_score, "dryness": s.dryness_score}
                for s in history
            ]
            recs = recommender.match_rules(
                scores['acne_score'],
                scores['redness_score'],
                scores['dryness_score'],
                aqi=aqi_data.get('aqi'),
                trend_data=trend_data,
            )

            return Response({
                "scan": SkinScanSerializer(scan).data,
                "recommendations": recs,
            })

        finally:
            # 6. DELETE IMAGE IMMEDIATELY
            os.unlink(tmp_path)
```

### 11.2 Flutter API Service

```dart
// frontend/lib/services/api_service.dart
import 'dart:io';
import 'package:dio/dio.dart';

class ApiService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'http://YOUR_BACKEND_IP:8000/api/',
    connectTimeout: Duration(seconds: 30),
    receiveTimeout: Duration(seconds: 60),  // CV processing takes time
  ));

  Future<Map<String, dynamic>> submitScan(File imageFile, String city) async {
    FormData formData = FormData.fromMap({
      'image': await MultipartFile.fromFile(imageFile.path),
      'city': city,
    });

    final response = await _dio.post('scan/', data: formData);
    return response.data;
  }

  Future<List<dynamic>> getHistory() async {
    final response = await _dio.get('history/');
    return response.data;
  }
}
```

---

## 12. Phase 6 — 30-Day Adaptive Program & Pollution Layer (Weeks 6–7)

### 12.1 Program Tracking

```python
# backend/scan/models.py (additions)
class UserProgram(models.Model):
    user_id = models.CharField(max_length=100)  # Device ID or user ID
    program_start_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    @property
    def current_day(self):
        from datetime import date
        return (date.today() - self.program_start_date).days + 1
```

### 12.2 Milestone Check-ins

| Day | Action |
|---|---|
| **Day 1** | Baseline scores + first recommendations |
| **Day 7** | Progress summary — which metric moved most |
| **Day 14** | Mid-program check — trend classification |
| **Day 30** | Full before/after comparison |

### 12.3 WAQI Service

```python
# backend/services/waqi_service.py
import requests
from decouple import config

WAQI_TOKEN = config('WAQI_API_TOKEN')

def fetch_aqi(city: str) -> dict:
    url = f"https://api.waqi.info/feed/{city}/?token={WAQI_TOKEN}"
    try:
        resp = requests.get(url, timeout=5).json()
        if resp.get("status") == "ok":
            data = resp["data"]
            aqi = data.get("aqi", 0)
            return {
                "aqi": aqi,
                "pm25": data.get("iaqi", {}).get("pm25", {}).get("v"),
                "dominant": data.get("dominentpol"),
                "band": _aqi_band(aqi),
            }
    except Exception:
        pass
    return {"aqi": None, "pm25": None, "dominant": None, "band": None}

def _aqi_band(aqi):
    if aqi <= 50:    return "good"
    if aqi <= 100:   return "moderate"
    if aqi <= 150:   return "unhealthy_sensitive"
    if aqi <= 200:   return "unhealthy"
    if aqi <= 300:   return "very_unhealthy"
    return "hazardous"
```

---

## 13. Phase 7 — Privacy, Security & Compliance (Week 7)

### Checklist

- [ ] Image deleted **immediately** after score vector extraction (same processing cycle)
- [ ] No image field in `SkinScan` model — only numeric scores persist
- [ ] Consent screen shown before first camera use
- [ ] "Delete this photo now" button on every scan result
- [ ] Settings toggle: "Keep my scan photos for personal reference" — **OFF by default**
- [ ] Consent text: *"Your photo is analyzed and then deleted — we only keep your scores, not the image."*
- [ ] Disclaimer on every score screen: *"Not a medical diagnosis. Consult a dermatologist for medical concerns."*
- [ ] City-level location only (no precise GPS)
- [ ] HTTPS for all API calls in production
- [ ] `.env` file for all secrets (WAQI token, Django secret key, DB URL)
- [ ] `.env` added to `.gitignore`

---

## 14. Phase 8 — Testing, Validation & Evaluation (Weeks 7–8)

### 14.1 CV Model Evaluation

| Metric | Method |
|---|---|
| Acne classification accuracy | Test on held-out ACNE04 split + DermaCon-IN subset |
| Acne detection mAP | YOLOv8 validation metrics |
| Redness consistency | Same face, different lighting → score should be similar after CLAHE |
| Dryness consistency | Compare against self-reported dryness (5–10 test users) |
| ITA accuracy | Compare computed ITA against Fitzpatrick self-reports |

### 14.2 Recommender Evaluation

| Method | Detail |
|---|---|
| Manual review | Domain-literate reviewer checks all 10–15 rules for accuracy |
| Relevance test | 5–10 users compare recommendations to their own assessment |
| Evidence tier audit | Verify every citation is real and correctly categorized |

### 14.3 End-to-End Validation

- **5–10 test users** over 7 days
- Compare model scores to self-assessment (qualitative feedback)
- Track: "Did recommendations feel relevant and non-generic?"
- **30-day evaluation** (if timeline permits): "Did scores measurably improve?"

---

## 15. Phase 9 — Deployment & Hosting (Week 8)

| Component | Free-Tier Option | Notes |
|---|---|---|
| **Database** | [Supabase](https://supabase.com) or [Neon](https://neon.tech) | PostgreSQL, generous free tier |
| **Backend** | [Railway](https://railway.app) or [Render](https://render.com) | Django deployment with Gunicorn |
| **ML Model Files** | Store `.pt` weights in the repo or [HuggingFace Hub](https://huggingface.co) | |
| **Flutter App** | APK build for Android, TestFlight for iOS | `flutter build apk --release` |

---

## 16. Complete File/Folder Structure

```
twacha/
├── backend/
│   ├── twacha_backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── scan/
│   │   ├── models.py          # SkinScan, UserProgram
│   │   ├── serializers.py
│   │   ├── views.py           # ScanView, HistoryView
│   │   └── urls.py
│   ├── recommendations/
│   │   ├── models.py          # RecommendationRule
│   │   ├── knowledge_base.py  # 10-15 evidence-tagged rules
│   │   ├── engine.py          # KNN/Decision Tree matcher
│   │   └── indb_mapper.py     # INDB food cross-reference
│   ├── services/
│   │   └── waqi_service.py    # AQI API integration
│   ├── ml_pipeline/
│   │   ├── pipeline.py        # Master CV orchestrator
│   │   ├── acne_model/
│   │   │   ├── train_mobilenet.py
│   │   │   ├── train_yolo.py
│   │   │   ├── inference.py
│   │   │   └── weights/       # .pt model files
│   │   ├── classical_cv/
│   │   │   ├── preprocessor.py
│   │   │   ├── redness_analyzer.py
│   │   │   ├── dryness_analyzer.py
│   │   │   └── ita_analyzer.py
│   │   └── evaluation/
│   │       └── evaluate.py
│   ├── .env                   # API keys, secrets
│   ├── requirements.txt
│   └── manage.py
│
├── frontend/
│   ├── lib/
│   │   ├── main.dart
│   │   ├── screens/
│   │   │   ├── dashboard_screen.dart
│   │   │   ├── capture_screen.dart
│   │   │   ├── result_screen.dart
│   │   │   ├── trend_screen.dart
│   │   │   └── recommendation_detail_screen.dart
│   │   ├── widgets/
│   │   │   ├── score_gauge.dart
│   │   │   ├── recommendation_card.dart
│   │   │   ├── aqi_badge.dart
│   │   │   ├── face_guide_overlay.dart
│   │   │   └── trend_chart.dart
│   │   ├── providers/
│   │   │   ├── scan_provider.dart
│   │   │   ├── history_provider.dart
│   │   │   └── camera_provider.dart
│   │   ├── services/
│   │   │   └── api_service.dart
│   │   ├── models/
│   │   │   ├── scan_result.dart
│   │   │   └── recommendation.dart
│   │   └── theme/
│   │       └── app_theme.dart
│   ├── pubspec.yaml
│   └── android/ & ios/
│
├── data/
│   ├── acne04v2/              # Cloned dataset
│   ├── Indian-Nutrient-Databank-INDB/
│   ├── ANUVAAD_INDB_2024.xlsx
│   └── dermacon_in/           # Downloaded from Harvard Dataverse
│
├── docs/
│   ├── literature_review/     # 15-20 papers, summarized
│   ├── evidence_rules.md      # All rules with citations
│   └── api_contract.md        # Locked API shapes
│
└── README.md
```

---

## 17. Risk Matrix & Fallbacks

| Risk | Probability | Impact | Fallback |
|---|---|---|---|
| Acne model training takes too long | Medium | High | Ship classical CV (redness + dryness) first as demo; use simple rule-based lesion count as acne stand-in |
| No GPU available for training | Medium | Medium | Use **Google Colab** (free T4 GPU) or **Kaggle Notebooks** |
| DermaCon-IN access delayed | Low | Low | Validate on ACNE04 test split only; add DermaCon-IN later |
| WAQI API rate-limited | Low | Low | Switch to OpenWeatherMap Air Pollution API |
| INDB Excel format changes | Low | Low | Column mapping in `indb_mapper.py` is easy to update |
| Flutter camera permission issues | Medium | Medium | Fall back to `image_picker` (gallery upload) |
| Low test user participation | Medium | Medium | Use synthetic test vectors for recommender eval |

---

## 18. Key Research Papers to Read

| # | Paper | Year | Relevance |
|---|---|---|---|
| 1 | Wu et al. — *Joint Acne Image Grading and Counting via LDL* (ICCV) | 2019 | ACNE04 dataset paper |
| 2 | Smith RN et al. — *Low-GI diet improves acne symptoms* (Am J Clin Nutr) | 2007 | Core clinical rule |
| 3 | Adebamowo et al. — *Milk and acne in teenage boys* (J Am Acad Dermatol) | 2005 | Dairy-acne "mixed" evidence |
| 4 | Kim et al. — *PM2.5 and skin redness association* | 2025 | Pollution-skin USP evidence |
| 5 | Liu et al. — *Acne exposome and pollution* (J Eur Acad Dermatol) | 2019 | Pollution-acne support |
| 6 | Pullar et al. — *Role of vitamin C in skin health* (Nutrients) | 2017 | Clinical rule source |
| 7 | Chardon et al. — *Skin colour typology and sunreactive phenotypes* (IJCS) | 1991 | ITA formula origin |
| 8 | Jaacks et al. — *Development of an Indian Food Composition Database* | 2024 | INDB methodology |
| 9 | Sandler et al. — *YOLO for medical image analysis* | 2024 | YOLOv8 medical reference |
| 10 | DermaCon-IN paper — *Dermatological AI for Indian skin tones* | 2024 | Validation dataset |

---

## Quick-Start Checklist

> [!IMPORTANT]
> **Do these first 10 things before writing any feature code:**

- [ ] 1. Install Python 3.10+, Flutter SDK, Git, Android Studio
- [ ] 2. Clone ACNE04v2: `git clone https://github.com/AIpourlapeau/acne04v2.git`
- [ ] 3. Download INDB Excel from [anuvaad.org.in](https://www.anuvaad.org.in/wp-content/uploads/2020/07/ANUVAAD_INDB_2024.xlsx)
- [ ] 4. Register WAQI API token at [aqicn.org/data-platform/token](https://aqicn.org/data-platform/token/)
- [ ] 5. Create Django project + `scan` and `recommendations` apps
- [ ] 6. Create Flutter project + add all packages from §2.3
- [ ] 7. **Lock the API contract** (§7.2) between frontend and backend — both people agree
- [ ] 8. Backend person: create `SkinScan` model + mock endpoint returning fake scores
- [ ] 9. Frontend person: build all 4 screens with hardcoded mock data
- [ ] 10. Start literature review — curate first 5 rules with real citations

---

> [!CAUTION]
> **Never do these:**
> - Train deep learning on redness/dryness/recommendations
> - Treat DermaCon-IN diagnosis labels as severity scores
> - Claim "hydration" measurement from a photo
> - Mix Ayurvedic and clinical claims at equal confidence
> - Use raw IFCT data in a shipped product without written permission
> - Retain raw facial images by default
> - Request precise GPS when city-level AQI suffices
