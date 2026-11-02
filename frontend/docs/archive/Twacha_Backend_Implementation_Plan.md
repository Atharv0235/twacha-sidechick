# 🔧 Twacha — Backend Implementation Plan

> **Owner:** Backend / ML Person  
> **Stack:** Python · Django · DRF · OpenCV · PyTorch · Ultralytics · Scikit-learn  
> **Parallel with:** Frontend plan (Flutter) — coordinate on the API contract in Phase 1

---

## Table of Contents

1. [Architecture Overview (Backend Only)](#1-architecture-overview-backend-only)
2. [Everything to Download & Install](#2-everything-to-download--install)
3. [All Datasets — Where to Get Them](#3-all-datasets--where-to-get-them)
4. [All APIs — Registration & Keys](#4-all-apis--registration--keys)
5. [All GitHub Repos to Clone / Reference](#5-all-github-repos-to-clone--reference)
6. [Phase B0 — Environment & Project Setup (Week 0)](#6-phase-b0--environment--project-setup-week-0)
7. [Phase B1 — Schema, Models & API Contract (Weeks 1–2)](#7-phase-b1--schema-models--api-contract-weeks-1-2)
8. [Phase B2 — Classical CV Pipeline (Weeks 2–3)](#8-phase-b2--classical-cv-pipeline-weeks-2-3)
9. [Phase B3 — Acne Deep Learning Models (Weeks 3–5)](#9-phase-b3--acne-deep-learning-models-weeks-3-5)
10. [Phase B4 — Recommender Engine (Weeks 3–4)](#10-phase-b4--recommender-engine-weeks-3-4)
11. [Phase B5 — Pollution / AQI Layer (Week 5)](#11-phase-b5--pollution--aqi-layer-week-5)
12. [Phase B6 — Full Integration & Image Lifecycle (Weeks 5–6)](#12-phase-b6--full-integration--image-lifecycle-weeks-5-6)
13. [Phase B7 — Testing, Validation & Evaluation (Weeks 7–8)](#13-phase-b7--testing-validation--evaluation-weeks-7-8)
14. [Phase B8 — Deployment (Week 8)](#14-phase-b8--deployment-week-8)
15. [Complete Backend Folder Structure](#15-complete-backend-folder-structure)
16. [Risk Matrix & Fallbacks](#16-risk-matrix--fallbacks)
17. [Key Research Papers](#17-key-research-papers)
18. [Coordination Points with Frontend](#18-coordination-points-with-frontend)

---

## 1. Architecture Overview (Backend Only)

```mermaid
graph TB
    subgraph "Django Backend"
        A["POST /api/scan/"] --> B["Image Preprocessing (OpenCV)"]
        B --> C{CV Pipeline}
        C --> D["Acne: MobileNetV2 + YOLOv8-Nano"]
        C --> E["Redness: LAB/HSV Color Analysis"]
        C --> F["Dryness: Texture Roughness"]
        C --> G["Skin Tone: ITA Computation"]
        D & E & F & G --> H[Score Vector]
        H --> I["Recommendation Engine (KNN/Decision Tree)"]
        I --> J["Evidence-Tagged JSON Response"]
        
        K["GET /api/history/"] --> L[PostgreSQL Score Records]
        
        M["WAQI API"] --> N[AQI Data]
        N --> I
    end

    subgraph "Data Sources"
        O["ACNE04v2 Dataset"] --> D
        P["INDB Excel"] --> I
        Q["15 Literature Rules"] --> I
    end

    style A fill:#0f3460,stroke:#e94560,color:#fff
    style J fill:#16213e,stroke:#4CAF50,color:#fff
```

### Method-to-Metric Matrix

| Metric | Method | Needs Training? | Dataset |
|---|---|---|---|
| **Acne severity** | MobileNetV2 (classification) | ✅ Yes | ACNE04v2 |
| **Acne lesion count** | YOLOv8-Nano (detection) | ✅ Yes | ACNE04v2 |
| **Redness / erythema** | LAB/HSV color-space analysis | ❌ No | None |
| **Dryness** | Texture roughness + specular highlights | ❌ No | None |
| **Skin tone (ITA)** | L*a*b* pixel computation | ❌ No | None |
| **Recommendations** | KNN / Decision Tree | ❌ No (rule-based) | Literature + INDB |

---

## 2. Everything to Download & Install

### 2.1 System-Level Prerequisites

| Tool | Version | Download Link | Purpose |
|---|---|---|---|
| **Python** | 3.10+ | [python.org/downloads](https://www.python.org/downloads/) | Backend runtime |
| **Git** | Latest | [git-scm.com/downloads](https://git-scm.com/downloads) | Version control |
| **PostgreSQL** | 15+ | [postgresql.org/download](https://www.postgresql.org/download/) | Database (or use Supabase free tier) |
| **CUDA Toolkit** | 11.8+ | [developer.nvidia.com/cuda-downloads](https://developer.nvidia.com/cuda-downloads) | GPU training (optional — use Colab if no GPU) |
| **VS Code** | Latest | [code.visualstudio.com](https://code.visualstudio.com/) | Editor |

### 2.2 All Python Packages

```bash
# Create virtual environment
python -m venv twacha_env
twacha_env\Scripts\activate   # Windows
# source twacha_env/bin/activate  # Mac/Linux

# ─────────────────────────────────────────
# CORE BACKEND (Django)
# ─────────────────────────────────────────
pip install django==5.1
pip install djangorestframework==3.15
pip install django-cors-headers
pip install pillow
pip install psycopg2-binary        # PostgreSQL adapter
pip install gunicorn                # Production server
pip install python-decouple         # .env file management

# ─────────────────────────────────────────
# COMPUTER VISION
# ─────────────────────────────────────────
pip install opencv-python==4.9.0.80
pip install opencv-contrib-python
pip install numpy
pip install scipy

# ─────────────────────────────────────────
# DEEP LEARNING (pick ONE framework)
# ─────────────────────────────────────────
# Option A: PyTorch (recommended)
pip install torch torchvision

# Option B: TensorFlow
# pip install tensorflow

# ─────────────────────────────────────────
# YOLO
# ─────────────────────────────────────────
pip install ultralytics             # YOLOv8

# ─────────────────────────────────────────
# RECOMMENDATION ENGINE
# ─────────────────────────────────────────
pip install scikit-learn            # KNN / Decision Tree

# ─────────────────────────────────────────
# DATA HANDLING
# ─────────────────────────────────────────
pip install pandas
pip install openpyxl                # For reading INDB Excel
pip install requests                # For WAQI API calls

# ─────────────────────────────────────────
# IMAGE AUGMENTATION (for training)
# ─────────────────────────────────────────
pip install albumentations

# ─────────────────────────────────────────
# EVALUATION & VISUALIZATION
# ─────────────────────────────────────────
pip install matplotlib seaborn

# ─────────────────────────────────────────
# OPTIONAL
# ─────────────────────────────────────────
pip install celery redis            # Background task queue
pip install jupyter                 # Notebooks for training
```

Save all with:
```bash
pip freeze > requirements.txt
```

---

## 3. All Datasets — Where to Get Them

### 3.1 ACNE04v2 — PRIMARY Training Dataset

| Property | Detail |
|---|---|
| **What** | 1,204 images, 32,443 annotations — dermatologist-labeled acne severity + lesion bounding boxes |
| **Format** | COCO format (JSON annotations + images) |
| **License** | Research use, freely available |

| Source | URL | Action |
|---|---|---|
| **Refined v2 (USE THIS)** | [github.com/AIpourlapeau/acne04v2](https://github.com/AIpourlapeau/acne04v2) | `git clone` |
| Original (LDL paper) | [github.com/xpwu95/ldl](https://github.com/xpwu95/ldl) | Reference only |
| Pre-trained weights | [huggingface.co/will702/acne-cv-models](https://huggingface.co/will702/acne-cv-models) | Download `.pt` files |

```bash
git clone https://github.com/AIpourlapeau/acne04v2.git data/acne04v2
```

### 3.2 DermaCon-IN — Validation on Indian Skin Tones

| Property | Detail |
|---|---|
| **What** | 5,450 images, ~3,000 South Indian patients, 245 diagnosis labels |
| **License** | CC BY-NC-SA 4.0 — **non-commercial only** |
| **Use** | Validation/fine-tuning ONLY — not primary training |

| Source | URL |
|---|---|
| Harvard Dataverse (download) | [doi:10.7910/DVN/W7OUZM](https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/W7OUZM) |
| GitHub (code + checkpoints) | [github.com/DermaCon-IN/DermaCon-IN](https://github.com/DermaCon-IN/DermaCon-IN) |

> [!WARNING]
> **Do NOT treat DermaCon-IN's diagnosis labels as acne severity scores.** They are diagnostic categories, not severity grades.

### 3.3 SCIN — Google Research (OPTIONAL)

| Property | Detail |
|---|---|
| **What** | 10,000+ crowdsourced everyday skin images with dermatologist labels |
| **Caveat** | US-based, ~14% Fitzpatrick V/VI — don't rely on this for Indian skin fairness claims |

| Source | URL |
|---|---|
| GitHub | [github.com/google-research-datasets/scin](https://github.com/google-research-datasets/scin) |
| Hugging Face | [huggingface.co/datasets/google/scin](https://huggingface.co/datasets/google/scin) |
| Colab Demo | [SCIN Demo Notebook](https://colab.research.google.com/github/google-research-datasets/scin/blob/main/scin_demo.ipynb) |

### 3.4 Fitzpatrick17k (DEPRIORITIZED)

| Property | Detail |
|---|---|
| **What** | 17k dermatology images with Fitzpatrick labels |
| **Caveat** | Known label-quality issues — **prefer computing ITA directly** |
| GitHub | [github.com/mattgroh/fitzpatrick17k](https://github.com/mattgroh/fitzpatrick17k) |

### 3.5 Indian Nutrient Databank — INDB

| Property | Detail |
|---|---|
| **What** | 1,095 food items + 1,014 Indian recipes, full nutrient profiles |
| **License** | **Open-access for reuse** (safer than raw IFCT) |
| **Format** | Excel (.xlsx) |

| Source | URL |
|---|---|
| **Direct Download** | [ANUVAAD_INDB_2024.xlsx](https://www.anuvaad.org.in/wp-content/uploads/2020/07/ANUVAAD_INDB_2024.xlsx) |
| GitHub (code) | [github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB](https://github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB) |
| Research Paper | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2475299124017244) |

> [!IMPORTANT]
> **Use INDB, not raw IFCT 2017.** INDB is explicitly open-access. Raw IFCT requires written permission for electronic reproduction in a product.

### 3.6 No Dataset Needed — Classical CV

| Metric | Method | Data Required |
|---|---|---|
| Redness | LAB/HSV color-space deviation | **None** |
| Dryness | Texture roughness + specular highlight analysis | **None** |
| Skin Tone (ITA) | Individual Typology Angle from L*a*b* | **None** |

---

## 4. All APIs — Registration & Keys

### 4.1 WAQI — World Air Quality Index (PRIMARY)

| Property | Detail |
|---|---|
| **Purpose** | Real-time city-level AQI, PM2.5, PM10, NO2 |
| **Cost** | **Free** |
| **Rate Limit** | 1,000 requests/second |
| **Restriction** | Cannot use in paid apps or sell the data |
| **Register** | [aqicn.org/data-platform/token](https://aqicn.org/data-platform/token/) — email → instant token |
| **API Docs** | [aqicn.org/api](https://aqicn.org/api/) |

**Test your token immediately:**
```bash
curl "https://api.waqi.info/feed/delhi/?token=YOUR_TOKEN"
```

### 4.2 OpenWeatherMap Air Pollution (FALLBACK)

| Property | Detail |
|---|---|
| **Purpose** | Backup if WAQI rate-limits |
| **Cost** | Free tier: 60 calls/min |
| **Register** | [openweathermap.org/api](https://openweathermap.org/api) |

### 4.3 Nothing Else Needed

All CV models run locally. The recommender is rule-based. INDB is a downloaded file.

---

## 5. All GitHub Repos to Clone / Reference

### Directly Used

| Repo | URL | Clone? |
|---|---|---|
| ACNE04v2 | [github.com/AIpourlapeau/acne04v2](https://github.com/AIpourlapeau/acne04v2) | ✅ Clone |
| Ultralytics YOLOv8 | [github.com/ultralytics/ultralytics](https://github.com/ultralytics/ultralytics) | Installed via pip |
| INDB | [github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB](https://github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB) | ✅ Clone |
| DermaCon-IN | [github.com/DermaCon-IN/DermaCon-IN](https://github.com/DermaCon-IN/DermaCon-IN) | ✅ Clone (code) |

### Reference Repos (Learn From)

| Repo | URL | What to Learn |
|---|---|---|
| Acne Detection YOLOv8 | [github.com/sufiinamulhassan/Acne-Detection-Using-YOLOv8](https://github.com/sufiinamulhassan/Acne-Detection-Using-YOLOv8) | YOLOv8 training pipeline for acne |
| Skin Disease Detection YOLO | [github.com/NIKK0001/Skin_Disease_Detection-YOLO-V8](https://github.com/NIKK0001/Skin_Disease_Detection-YOLO-V8) | Multi-class detection patterns |
| Acne Detection & Removal | [github.com/VinayN18/Acne-Detection-And-Removal](https://github.com/VinayN18/Acne-Detection-And-Removal) | OpenCV acne masking |
| Skin Type Classification | [github.com/MdAliAhnaf/Skin_Type_Classification-Recommendation](https://github.com/MdAliAhnaf/Skin_Type_Classification-Recommendation) | MobileNetV2 transfer learning |
| Skin Detection OpenCV | [github.com/CHEREF-Mehdi/SkinDetection](https://github.com/CHEREF-Mehdi/SkinDetection) | HSV/YCbCr skin segmentation |
| HSV Range Finder | [github.com/kushalchaudhari21/RangeFinder](https://github.com/kushalchaudhari21/RangeFinder) | Interactive LAB/HSV threshold tuning |
| HuggingFace Acne Models | [huggingface.co/will702/acne-cv-models](https://huggingface.co/will702/acne-cv-models) | Pre-trained weights |

---

## 6. Phase B0 — Environment & Project Setup (Week 0)

> **Goal:** Django project running locally with mock endpoints.

```bash
# ═══════════════════════════════════════════
# 1. CREATE PROJECT STRUCTURE
# ═══════════════════════════════════════════
mkdir twacha && cd twacha
mkdir backend data docs

# ═══════════════════════════════════════════
# 2. PYTHON ENVIRONMENT
# ═══════════════════════════════════════════
cd backend
python -m venv venv
venv\Scripts\activate

# Install everything from §2.2 (copy the pip commands)
pip install django djangorestframework django-cors-headers pillow
pip install opencv-python numpy scipy scikit-learn
pip install ultralytics torch torchvision
pip install pandas openpyxl requests python-decouple psycopg2-binary

# ═══════════════════════════════════════════
# 3. DJANGO PROJECT
# ═══════════════════════════════════════════
django-admin startproject twacha_backend .
python manage.py startapp scan
python manage.py startapp recommendations

# ═══════════════════════════════════════════
# 4. CREATE ML PIPELINE DIRECTORIES
# ═══════════════════════════════════════════
mkdir ml_pipeline
mkdir ml_pipeline\acne_model
mkdir ml_pipeline\acne_model\weights
mkdir ml_pipeline\classical_cv
mkdir ml_pipeline\evaluation
mkdir services

# ═══════════════════════════════════════════
# 5. DOWNLOAD DATASETS
# ═══════════════════════════════════════════
cd ../data
git clone https://github.com/AIpourlapeau/acne04v2.git
git clone https://github.com/lindsayjaacks/Indian-Nutrient-Databank-INDB.git
curl -o ANUVAAD_INDB_2024.xlsx "https://www.anuvaad.org.in/wp-content/uploads/2020/07/ANUVAAD_INDB_2024.xlsx"
# DermaCon-IN: download manually from Harvard Dataverse

# ═══════════════════════════════════════════
# 6. ENVIRONMENT VARIABLES
# ═══════════════════════════════════════════
cd ../backend
# Create .env file
echo WAQI_API_TOKEN=your_token_here > .env
echo DJANGO_SECRET_KEY=your_random_secret_key >> .env
echo DATABASE_URL=postgres://user:pass@localhost:5432/twacha_db >> .env
echo DEBUG=True >> .env
```

### Configure `settings.py`

```python
# backend/twacha_backend/settings.py — key additions

INSTALLED_APPS = [
    # ...defaults...
    'rest_framework',
    'corsheaders',
    'scan',
    'recommendations',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ...rest of defaults...
]

CORS_ALLOW_ALL_ORIGINS = True  # Dev only; lock down for production

REST_FRAMEWORK = {
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ]
}

# No MEDIA storage for user images — they are processed and deleted
# Only temporary storage during CV pipeline execution
```

### Configure URLs

```python
# backend/twacha_backend/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('scan.urls')),
]
```

### Verify Setup

```bash
python manage.py migrate
python manage.py runserver
# Visit http://127.0.0.1:8000/ — should see Django welcome page
```

---

## 7. Phase B1 — Schema, Models & API Contract (Weeks 1–2)

> **Goal:** Lock the data shapes so the frontend person can build against them.

> [!IMPORTANT]
> **Do this together with the frontend person.** Both sides must agree on the JSON shapes before building anything else.

### 7.1 Django Models

```python
# backend/scan/models.py
from django.db import models
from datetime import date

class SkinScan(models.Model):
    """
    Stores only the numeric score vector — never the raw image.
    Images are deleted immediately after CV pipeline processes them.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    
    # CV scores (0-10 scale)
    acne_score = models.FloatField(null=True)
    redness_score = models.FloatField(null=True)
    dryness_score = models.FloatField(null=True)
    
    # Skin tone context (internal use only, not shown to user)
    ita_value = models.FloatField(null=True)
    
    # Environmental context (fetched at scan time)
    local_aqi = models.IntegerField(null=True)
    pm25 = models.FloatField(null=True)
    dominant_pollutant = models.CharField(max_length=10, null=True, blank=True)
    aqi_band = models.CharField(max_length=25, null=True, blank=True)
    city = models.CharField(max_length=100, default="Delhi")
    
    # NO ImageField — this is intentional. See §Privacy.

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Scan #{self.id} — {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class UserProgram(models.Model):
    """Tracks a user's 30-day program enrollment."""
    user_id = models.CharField(max_length=100)  # Device ID
    program_start_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    @property
    def current_day(self):
        return (date.today() - self.program_start_date).days + 1

    @property
    def is_complete(self):
        return self.current_day > 30


class RecommendationRule(models.Model):
    """
    Evidence-tagged dietary/skincare rule.
    Populated from literature review, not user input.
    """
    EVIDENCE_TIERS = [
        ('clinical', 'Clinical — RCT/Systematic Review'),
        ('mixed', 'Mixed — Conflicting Literature'),
        ('traditional', 'Traditional — Ayurvedic/Complementary'),
    ]
    METRICS = [
        ('acne', 'Acne'),
        ('redness', 'Redness'),
        ('dryness', 'Dryness'),
    ]

    title = models.CharField(max_length=200)
    body = models.TextField()
    evidence_tier = models.CharField(max_length=20, choices=EVIDENCE_TIERS)
    source_note = models.TextField()               # Full citation
    target_metric = models.CharField(max_length=20, choices=METRICS)
    min_score = models.FloatField()                 # Trigger when score >= this
    max_score = models.FloatField(default=10.0)     # Trigger when score <= this
    food_suggestions = models.JSONField(null=True, blank=True)
    is_pollution_specific = models.BooleanField(default=False)

    def __str__(self):
        return f"[{self.evidence_tier}] {self.title}"
```

```bash
python manage.py makemigrations
python manage.py migrate
```

### 7.2 Serializers

```python
# backend/scan/serializers.py
from rest_framework import serializers
from .models import SkinScan

class SkinScanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkinScan
        fields = [
            'id', 'created_at',
            'acne_score', 'redness_score', 'dryness_score',
            'local_aqi', 'pm25', 'dominant_pollutant', 'aqi_band',
        ]
        # Note: ita_value intentionally excluded — internal use only

class ScanUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()
    city = serializers.CharField(max_length=100, default="Delhi")
```

### 7.3 Mock API Views (Ship This First)

```python
# backend/scan/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from .models import SkinScan
from .serializers import SkinScanSerializer
import random

class ScanView(APIView):
    """
    POST /api/scan/ — accepts multipart image, returns scores + recommendations.
    Phase B1: returns MOCK data so frontend can build against this shape.
    Phase B6: replaced with real CV pipeline + recommender.
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image = request.FILES.get('image')
        city = request.data.get('city', 'Delhi')

        if not image:
            return Response(
                {"error": "No image provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── MOCK DATA (remove in Phase B6) ──
        scan = SkinScan.objects.create(
            acne_score=round(random.uniform(1, 8), 1),
            redness_score=round(random.uniform(1, 6), 1),
            dryness_score=round(random.uniform(1, 5), 1),
            ita_value=round(random.uniform(-10, 50), 1),
            local_aqi=random.randint(50, 300),
            pm25=round(random.uniform(20, 150), 1),
            dominant_pollutant="pm25",
            aqi_band="moderate",
            city=city,
        )

        mock_recommendations = [
            {
                "title": "Reduce high-glycemic foods",
                "body": "Clinical evidence shows low-GI diets reduce acne. Replace white rice with brown rice.",
                "evidence_tier": "clinical",
                "source_note": "Smith et al., 2007 — Am J Clin Nutr",
                "trend": None,
                "food_suggestions": {"eat_more": ["brown rice", "moong dal"], "eat_less": ["white rice", "maida"]}
            },
            {
                "title": "Consider reducing dairy intake",
                "body": "Literature is mixed on dairy and acne. If prone to breakouts, try reducing milk-based products.",
                "evidence_tier": "mixed",
                "source_note": "Adebamowo et al., 2005 — J Am Acad Dermatol",
                "trend": None,
                "food_suggestions": {"eat_more": ["almond milk", "soy paneer"], "eat_less": ["whole milk", "ice cream"]}
            },
        ]

        return Response({
            "scan": SkinScanSerializer(scan).data,
            "recommendations": mock_recommendations,
        })


class HistoryView(APIView):
    """
    GET /api/history/ — returns past scan records for trend charts.
    No images ever included — only numeric scores.
    """
    def get(self, request):
        scans = SkinScan.objects.all()[:30]  # Last 30 scans
        return Response(SkinScanSerializer(scans, many=True).data)
```

### 7.4 URLs

```python
# backend/scan/urls.py
from django.urls import path
from .views import ScanView, HistoryView

urlpatterns = [
    path('scan/', ScanView.as_view(), name='scan'),
    path('history/', HistoryView.as_view(), name='history'),
]
```

### 7.5 API Contract — Agreed JSON Shapes

**Tell the frontend person:** "Build your screens against these exact shapes."

**`POST /api/scan/`** → Response:
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
      "body": "Clinical evidence shows low-GI diets...",
      "evidence_tier": "clinical",
      "source_note": "Smith et al., 2007",
      "trend": null,
      "food_suggestions": {
        "eat_more": ["brown rice", "bajra roti"],
        "eat_less": ["white rice", "maida"]
      }
    }
  ]
}
```

**`GET /api/history/`** → Response:
```json
[
  {"id": 1, "created_at": "...", "acne_score": 4.2, "redness_score": 3.1, "dryness_score": 2.0, "local_aqi": 187, "pm25": 92.4, "dominant_pollutant": "pm25", "aqi_band": "unhealthy"},
  {"id": 2, "created_at": "...", "acne_score": 3.8, "redness_score": 2.9, "dryness_score": 2.2, "local_aqi": 120, "pm25": 55.1, "dominant_pollutant": "pm10", "aqi_band": "unhealthy_sensitive"}
]
```

> [!TIP]
> **Verify the mock API works now.** Run `python manage.py runserver`, then test with:
> ```bash
> # POST a scan (use any image file)
> curl -X POST -F "image=@test_photo.jpg" -F "city=Delhi" http://127.0.0.1:8000/api/scan/
>
> # GET history
> curl http://127.0.0.1:8000/api/history/
> ```
> Send these URLs to the frontend person so they can start building immediately.

---

## 8. Phase B2 — Classical CV Pipeline (Weeks 2–3)

> **Goal:** Build the 3 no-training-needed analyzers. These are cheap wins — ship them first.

### 8.1 Image Preprocessor

```python
# backend/ml_pipeline/classical_cv/preprocessor.py
import cv2
import numpy as np


class SkinImagePreprocessor:
    def __init__(self, target_size=(224, 224)):
        self.target_size = target_size

    def preprocess(self, image_path: str) -> np.ndarray:
        """Load, normalize lighting, detect face, crop, resize."""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")

        # 1. Lighting normalization — CLAHE on LAB L-channel
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
            pad = int(w * 0.2)
            x1 = max(0, x - pad)
            y1 = max(0, y - pad)
            x2 = min(img.shape[1], x + w + pad)
            y2 = min(img.shape[0], y + h + pad)
            img = img[y1:y2, x1:x2]

        # 3. Resize
        img = cv2.resize(img, self.target_size)
        return img

    def get_skin_mask(self, img: np.ndarray) -> np.ndarray:
        """Isolate skin pixels using YCbCr color space thresholding."""
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        mask = cv2.inRange(ycrcb, np.array([0, 133, 77]), np.array([255, 173, 127]))
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        return mask
```

### 8.2 Redness Analyzer

```python
# backend/ml_pipeline/classical_cv/redness_analyzer.py
import cv2
import numpy as np


class RednessAnalyzer:
    """
    Computes redness score (0-10) via LAB color space.
    Higher a* channel values = more red.
    No training data needed — this is pure color math.
    """

    def analyze(self, img: np.ndarray, skin_mask: np.ndarray) -> float:
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        _, a_ch, _ = cv2.split(lab)

        # Only analyze skin pixels
        skin_pixels = a_ch[skin_mask > 0]
        if len(skin_pixels) == 0:
            return 0.0

        # a* channel in OpenCV: 0-255, where 128 = neutral
        # Values > 128 = red shift
        mean_a = float(np.mean(skin_pixels))

        # Normalize to 0-10 scale
        # Typical skin a* range: ~125 (no redness) to ~165 (significant)
        redness_raw = max(0.0, mean_a - 128.0) / 40.0
        redness_score = min(10.0, redness_raw * 10.0)

        # Check for localized high-redness patches (erythema)
        _, red_mask = cv2.threshold(a_ch, 145, 255, cv2.THRESH_BINARY)
        red_area = cv2.bitwise_and(red_mask, skin_mask)
        total_skin = max(np.count_nonzero(skin_mask), 1)
        patch_ratio = np.count_nonzero(red_area) / total_skin

        # Combine: 60% mean redness + 40% patch concentration
        combined = (redness_score * 0.6) + (patch_ratio * 10.0 * 0.4)
        return round(min(10.0, combined), 1)
```

### 8.3 Dryness Analyzer

```python
# backend/ml_pipeline/classical_cv/dryness_analyzer.py
import cv2
import numpy as np


class DrynessAnalyzer:
    """
    Estimates visible dryness (0-10) via texture roughness
    and specular highlight analysis.

    IMPORTANT: This is NOT a hydration measurement.
    A photo can only proxy visible dryness/flaking.
    The UI MUST say "Visible Dryness", not "Hydration Level".
    """

    def analyze(self, img: np.ndarray, skin_mask: np.ndarray) -> float:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.bitwise_and(gray, gray, mask=skin_mask)

        # 1. Texture roughness — Laplacian variance
        #    Higher variance = rougher texture = drier skin
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        texture_var = float(laplacian.var())
        roughness_norm = min(1.0, texture_var / 500.0)

        # 2. Specular highlight analysis (inverse = drier)
        #    Healthy/moisturized skin reflects more light
        _, specular_mask = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY)
        specular_mask = cv2.bitwise_and(specular_mask, skin_mask)
        total_skin = max(np.count_nonzero(skin_mask), 1)
        specular_ratio = np.count_nonzero(specular_mask) / total_skin
        moisture_proxy = 1.0 - min(1.0, specular_ratio * 50.0)

        # Combine: 60% roughness + 40% moisture proxy
        dryness_score = (roughness_norm * 0.6 + moisture_proxy * 0.4) * 10.0
        return round(min(10.0, dryness_score), 1)
```

### 8.4 ITA Analyzer (Skin Tone — Internal Use Only)

```python
# backend/ml_pipeline/classical_cv/ita_analyzer.py
import cv2
import numpy as np


class ITAAnalyzer:
    """
    Individual Typology Angle — standard dermatology metric.
    ITA = arctan((L* - 50) / b*) × (180/π)
    
    Used for fairness checks: ensure model accuracy
    is consistent across skin tones.
    NEVER shown to the user.
    """

    def compute_ita(self, img: np.ndarray, skin_mask: np.ndarray) -> float | None:
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l_ch, _, b_ch = cv2.split(lab)

        skin_l = l_ch[skin_mask > 0].astype(float)
        skin_b = b_ch[skin_mask > 0].astype(float)

        if len(skin_l) == 0:
            return None

        # OpenCV LAB: L is 0-255 (needs scaling to standard 0-100)
        # b is 0-255 (centered at 128)
        l_star = np.mean(skin_l) / 255.0 * 100.0
        b_star = np.mean(skin_b) - 128.0

        if abs(b_star) < 0.001:
            b_star = 0.001  # Avoid division by zero

        ita = float(np.degrees(np.arctan((l_star - 50.0) / b_star)))
        return round(ita, 1)

    def classify_tone(self, ita: float | None) -> str:
        """Internal classification — not user-facing."""
        if ita is None:
            return "unknown"
        if ita > 55:  return "very_light"
        if ita > 41:  return "light"
        if ita > 28:  return "intermediate"
        if ita > 10:  return "tan"
        if ita > -30: return "brown"
        return "dark"
```

### 8.5 Test the Classical CV Pipeline

```python
# backend/ml_pipeline/classical_cv/test_pipeline.py
"""Run this to verify all 3 analyzers work on a test image."""
from preprocessor import SkinImagePreprocessor
from redness_analyzer import RednessAnalyzer
from dryness_analyzer import DrynessAnalyzer
from ita_analyzer import ITAAnalyzer

preprocessor = SkinImagePreprocessor()
img = preprocessor.preprocess("test_selfie.jpg")
skin_mask = preprocessor.get_skin_mask(img)

redness = RednessAnalyzer().analyze(img, skin_mask)
dryness = DrynessAnalyzer().analyze(img, skin_mask)
ita = ITAAnalyzer().compute_ita(img, skin_mask)

print(f"Redness:  {redness}/10")
print(f"Dryness:  {dryness}/10")
print(f"ITA:      {ita} ({ITAAnalyzer().classify_tone(ita)})")
```

> [!TIP]
> **Ship this as your first demoable milestone.** Redness + Dryness + ITA work without ANY training, so you can show results from day one.

---

## 9. Phase B3 — Acne Deep Learning Models (Weeks 3–5)

> **Goal:** Train MobileNetV2 (severity classification) + YOLOv8-Nano (lesion detection).

### 9.1 MobileNetV2 — Acne Severity Classification

```python
# backend/ml_pipeline/acne_model/train_mobilenet.py
import torch
import torch.nn as nn
from torchvision import models, transforms, datasets
from torch.utils.data import DataLoader

# ─── Model Definition ───
class AcneClassifier(nn.Module):
    """
    MobileNetV2 with custom head for 4-class acne severity.
    Classes: Level 0 (clear) → Level 3 (severe)
    """
    def __init__(self, num_classes=4):
        super().__init__()
        self.backbone = models.mobilenet_v2(weights='IMAGENET1K_V1')

        # Freeze early layers (keep learned features)
        for param in list(self.backbone.parameters())[:-20]:
            param.requires_grad = False

        # Replace classifier head
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(self.backbone.last_channel, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        return self.backbone(x)


# ─── Data Transforms ───
train_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

val_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


# ─── Training Loop ───
def train():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Training on: {device}")

    # Organize ACNE04v2 into folders: data/acne04v2/train/{level0,level1,level2,level3}/
    train_dataset = datasets.ImageFolder('../../data/acne04v2/train', transform=train_transforms)
    val_dataset = datasets.ImageFolder('../../data/acne04v2/val', transform=val_transforms)

    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=4)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False, num_workers=4)

    model = AcneClassifier(num_classes=4).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=1e-4, weight_decay=1e-5,
    )
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5)

    best_val_acc = 0.0

    for epoch in range(50):
        # Training
        model.train()
        train_loss = 0.0
        correct = 0
        total = 0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            train_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

        # Validation
        model.eval()
        val_correct = 0
        val_total = 0
        val_loss = 0.0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item()
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()

        val_acc = val_correct / val_total
        scheduler.step(val_loss)

        print(f"Epoch {epoch+1}/50 | "
              f"Train Loss: {train_loss/len(train_loader):.4f} | "
              f"Train Acc: {correct/total:.4f} | "
              f"Val Acc: {val_acc:.4f}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), 'weights/mobilenetv2_acne_best.pt')
            print(f"  ✓ Saved best model (val acc: {val_acc:.4f})")

    print(f"\nBest validation accuracy: {best_val_acc:.4f}")

if __name__ == "__main__":
    train()
```

### 9.2 YOLOv8-Nano — Acne Lesion Detection

```yaml
# backend/ml_pipeline/acne_model/data.yaml
# Point this to your ACNE04v2 data (converted to YOLO format)
train: ../../data/acne04v2/train/images
val: ../../data/acne04v2/val/images
nc: 1
names: ['acne_lesion']
```

```python
# backend/ml_pipeline/acne_model/train_yolo.py
from ultralytics import YOLO

def train_yolo():
    # Load YOLOv8 nano pretrained weights
    model = YOLO('yolov8n.pt')

    # Train on ACNE04v2
    results = model.train(
        data='data.yaml',
        epochs=100,
        imgsz=640,
        batch=16,
        patience=20,        # Early stopping
        save=True,
        project='weights',
        name='yolo_acne',
    )
    print("Training complete. Best weights at: weights/yolo_acne/weights/best.pt")

if __name__ == "__main__":
    train_yolo()
```

> [!TIP]
> **No GPU?** Train on [Google Colab](https://colab.research.google.com) (free T4) or [Kaggle Notebooks](https://www.kaggle.com/code). Upload your `data.yaml` and dataset, train there, download the `.pt` weights file.

### 9.3 Inference Module

```python
# backend/ml_pipeline/acne_model/inference.py
import torch
import torch.nn as nn
import numpy as np
from torchvision import transforms
from PIL import Image
from ultralytics import YOLO

class AcneInference:
    """Combines MobileNetV2 severity + YOLOv8 lesion count into a single acne score."""

    def __init__(
        self,
        classifier_weights='ml_pipeline/acne_model/weights/mobilenetv2_acne_best.pt',
        detector_weights='ml_pipeline/acne_model/weights/yolo_acne/weights/best.pt',
    ):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

        # Load classifier
        from .train_mobilenet import AcneClassifier
        self.classifier = AcneClassifier(num_classes=4).to(self.device)
        self.classifier.load_state_dict(torch.load(classifier_weights, map_location=self.device))
        self.classifier.eval()

        # Load detector
        self.detector = YOLO(detector_weights)

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])

    def predict(self, img_array: np.ndarray) -> float:
        """
        Returns acne score 0-10.
        Combines: 60% severity classification + 40% normalized lesion count.
        """
        # Severity classification
        pil_img = Image.fromarray(img_array[:, :, ::-1])  # BGR→RGB
        tensor = self.transform(pil_img).unsqueeze(0).to(self.device)
        with torch.no_grad():
            output = self.classifier(tensor)
            severity = torch.argmax(output, dim=1).item()  # 0-3

        # Lesion detection
        results = self.detector.predict(source=img_array, conf=0.25, verbose=False)
        lesion_count = len(results[0].boxes) if results else 0

        # Combine into 0-10 score
        severity_score = (severity / 3.0) * 10.0            # 0-10
        count_score = min(10.0, (lesion_count / 20.0) * 10)  # Cap at 20 lesions
        combined = severity_score * 0.6 + count_score * 0.4

        return round(combined, 1)
```

### 9.4 Fallback (If Training Time Runs Short)

> [!WARNING]
> **If you can't finish training by Week 5**, ship this rule-based fallback:

```python
# backend/ml_pipeline/acne_model/fallback_inference.py
import cv2
import numpy as np

class AcneFallbackInference:
    """
    Rule-based acne stand-in using blob detection.
    NOT as accurate as the trained model — use only as a fallback.
    """
    def predict(self, img: np.ndarray) -> float:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Detect dark spots (potential lesions)
        params = cv2.SimpleBlobDetector_Params()
        params.filterByArea = True
        params.minArea = 20
        params.maxArea = 500
        params.filterByCircularity = True
        params.minCircularity = 0.3
        detector = cv2.SimpleBlobDetector_create(params)
        keypoints = detector.detect(gray)
        lesion_count = len(keypoints)
        return round(min(10.0, (lesion_count / 15.0) * 10.0), 1)
```

---

## 10. Phase B4 — Recommender Engine (Weeks 3–4)

> **Goal:** Build the evidence-tagged rule matcher + INDB food cross-reference.

### 10.1 Knowledge Base — 15 Rules With Citations

```python
# backend/recommendations/knowledge_base.py

RULES = [
    # ═══ ACNE — CLINICAL ═══
    {
        "id": "R001",
        "title": "Reduce high-glycemic foods",
        "body": "Clinical evidence shows low-GI diets reduce acne lesion count by ~30%. Replace white rice with brown rice, maida with atta, and reduce sugar intake.",
        "evidence_tier": "clinical",
        "source_note": "Smith RN et al. (2007). A low-glycemic-load diet improves symptoms in acne vulgaris patients. Am J Clin Nutr, 86(1), 107-115.",
        "target_metric": "acne",
        "score_range": [4.0, 10.0],
        "food_suggestions": {
            "eat_more": ["brown rice", "bajra roti", "moong dal", "oats upma", "ragi dosa"],
            "eat_less": ["white rice", "maida naan", "sugary drinks", "mithai", "biscuits"]
        },
        "is_pollution_specific": False,
    },
    {
        "id": "R002",
        "title": "Increase omega-3 fatty acid intake",
        "body": "Omega-3 fatty acids have anti-inflammatory effects that may reduce acne severity. Include walnuts, flaxseed, and fatty fish.",
        "evidence_tier": "clinical",
        "source_note": "Jung JY et al. (2014). Effect of dietary supplementation with omega-3 fatty acid and gamma-linolenic acid on acne vulgaris. Acta Derm Venereol, 94(5), 521-525.",
        "target_metric": "acne",
        "score_range": [3.0, 10.0],
        "food_suggestions": {
            "eat_more": ["walnuts (akhrot)", "flaxseed (alsi)", "chia seeds", "sardines", "mackerel"],
            "eat_less": ["deep fried snacks", "vanaspati ghee", "processed chips"]
        },
        "is_pollution_specific": False,
    },
    {
        "id": "R003",
        "title": "Reduce refined sugar and processed carbs",
        "body": "Refined sugars trigger insulin spikes linked to sebum production and inflammatory pathways that worsen acne.",
        "evidence_tier": "clinical",
        "source_note": "Kucharska A et al. (2016). Significance of diet in treated and untreated acne vulgaris. Adv Dermatol Allergol, 33(2), 81-86.",
        "target_metric": "acne",
        "score_range": [5.0, 10.0],
        "food_suggestions": {
            "eat_more": ["jaggery (gur) in moderation", "dates", "fresh fruits"],
            "eat_less": ["cola drinks", "packaged juices", "white bread", "cakes"]
        },
        "is_pollution_specific": False,
    },

    # ═══ ACNE — MIXED ═══
    {
        "id": "R004",
        "title": "Consider reducing dairy intake",
        "body": "Literature is mixed, but several studies associate dairy (especially skim milk) with acne. If prone to breakouts, try reducing milk-based products for 2-3 weeks.",
        "evidence_tier": "mixed",
        "source_note": "Adebamowo CA et al. (2005). High school dietary dairy intake and teenage acne. J Am Acad Dermatol, 52(2), 207-214.",
        "target_metric": "acne",
        "score_range": [4.0, 10.0],
        "food_suggestions": {
            "eat_more": ["almond milk", "coconut milk", "soy paneer (tofu)"],
            "eat_less": ["whole milk", "skim milk", "ice cream", "lassi (if acne-prone)"]
        },
        "is_pollution_specific": False,
    },
    {
        "id": "R005",
        "title": "Try zinc-rich foods",
        "body": "Some studies show zinc supplementation improves acne, though evidence is not conclusive. Food sources are safer than supplements.",
        "evidence_tier": "mixed",
        "source_note": "Yee BE et al. (2020). Serum zinc levels and efficacy of zinc treatment in acne vulgaris: A systematic review. Dermatol Ther, 33(6), e14252.",
        "target_metric": "acne",
        "score_range": [3.0, 8.0],
        "food_suggestions": {
            "eat_more": ["pumpkin seeds (kaddu ke beej)", "chickpeas (chana)", "lentils (masoor dal)", "sesame seeds (til)"],
            "eat_less": []
        },
        "is_pollution_specific": False,
    },

    # ═══ REDNESS — CLINICAL ═══
    {
        "id": "R006",
        "title": "Increase vitamin C-rich foods",
        "body": "Vitamin C is a potent antioxidant that supports collagen synthesis and helps reduce skin redness and inflammation.",
        "evidence_tier": "clinical",
        "source_note": "Pullar JM et al. (2017). The roles of vitamin C in skin health. Nutrients, 9(8), 866.",
        "target_metric": "redness",
        "score_range": [4.0, 10.0],
        "food_suggestions": {
            "eat_more": ["amla (Indian gooseberry)", "guava", "lemon", "bell peppers (shimla mirch)", "kiwi"],
            "eat_less": ["excessive spicy food", "alcohol"]
        },
        "is_pollution_specific": False,
    },
    {
        "id": "R007",
        "title": "Add anti-inflammatory foods",
        "body": "Foods rich in antioxidants help combat oxidative stress that contributes to skin redness.",
        "evidence_tier": "clinical",
        "source_note": "Vierkötter A et al. (2010). Airborne particle exposure and extrinsic skin aging. J Invest Dermatol, 130(12), 2719-2726.",
        "target_metric": "redness",
        "score_range": [3.0, 10.0],
        "food_suggestions": {
            "eat_more": ["green tea", "turmeric (haldi) milk", "blueberries", "spinach (palak)", "tomatoes"],
            "eat_less": ["processed meats", "excessive caffeine"]
        },
        "is_pollution_specific": False,
    },

    # ═══ DRYNESS — CLINICAL ═══
    {
        "id": "R008",
        "title": "Increase vitamin E intake",
        "body": "Vitamin E supports skin barrier function and protects against oxidative damage that contributes to dryness.",
        "evidence_tier": "clinical",
        "source_note": "Keen MA & Hassan I. (2016). Vitamin E in dermatology. Indian Dermatol Online J, 7(4), 311-315.",
        "target_metric": "dryness",
        "score_range": [4.0, 10.0],
        "food_suggestions": {
            "eat_more": ["almonds (badam)", "sunflower seeds", "mustard oil", "peanuts (mungfali)", "avocado"],
            "eat_less": []
        },
        "is_pollution_specific": False,
    },
    {
        "id": "R009",
        "title": "Stay well hydrated",
        "body": "While water alone doesn't fix dry skin, adequate hydration supports overall skin function. Aim for 8-10 glasses daily, more in hot weather.",
        "evidence_tier": "mixed",
        "source_note": "Palma L et al. (2015). Dietary water affects human skin hydration and biomechanics. Clin Cosmet Investig Dermatol, 8, 413-421.",
        "target_metric": "dryness",
        "score_range": [3.0, 10.0],
        "food_suggestions": {
            "eat_more": ["water-rich fruits (watermelon, cucumber)", "coconut water (nariyal pani)", "buttermilk (chaas)"],
            "eat_less": ["excessive caffeine", "alcohol", "very salty foods"]
        },
        "is_pollution_specific": False,
    },

    # ═══ TRADITIONAL ═══
    {
        "id": "R010",
        "title": "Include turmeric in your diet",
        "body": "Turmeric (curcumin) has documented anti-inflammatory properties, though clinical skin trials are limited. Traditional use in Indian medicine supports its role in skin health.",
        "evidence_tier": "traditional",
        "source_note": "Vaughn AR et al. (2016). Effects of turmeric on skin health: A systematic review. Phytother Res, 30(8), 1243-1264.",
        "target_metric": "acne",
        "score_range": [2.0, 10.0],
        "food_suggestions": {
            "eat_more": ["haldi doodh (turmeric milk)", "turmeric in dal/sabzi", "golden paste"],
            "eat_less": []
        },
        "is_pollution_specific": False,
    },
    {
        "id": "R011",
        "title": "Try aloe vera for soothing",
        "body": "Aloe vera has traditional use for soothing dry and irritated skin. Apply topically or consume aloe juice in moderation.",
        "evidence_tier": "traditional",
        "source_note": "Surjushe A et al. (2008). Aloe vera: A short review. Indian J Dermatol, 53(4), 163-166.",
        "target_metric": "dryness",
        "score_range": [5.0, 10.0],
        "food_suggestions": {
            "eat_more": ["aloe vera juice (small amounts)", "aloe vera gel (topical)"],
            "eat_less": []
        },
        "is_pollution_specific": False,
    },

    # ═══ POLLUTION-SPECIFIC ═══
    {
        "id": "R012",
        "title": "Boost antioxidants during high pollution",
        "body": "PM2.5 exposure is linked to oxidative stress in skin. During high-AQI days, increase vitamin C and E intake to counteract free radical damage.",
        "evidence_tier": "clinical",
        "source_note": "Kim KE et al. (2025). PM2.5 and skin redness association. + Vierkötter A et al. (2010). J Invest Dermatol.",
        "target_metric": "redness",
        "score_range": [2.0, 10.0],
        "food_suggestions": {
            "eat_more": ["amla", "guava", "almonds", "green tea", "dark chocolate (in moderation)"],
            "eat_less": ["outdoor street food during smog"]
        },
        "is_pollution_specific": True,
    },
    {
        "id": "R013",
        "title": "Double-cleanse on high-AQI days",
        "body": "Pollution particles can deposit on skin, clogging pores. On days with AQI > 150, consider double-cleansing and applying a barrier cream.",
        "evidence_tier": "clinical",
        "source_note": "Liu W et al. (2019). Acne and environmental pollutants. J Eur Acad Dermatol Venereol.",
        "target_metric": "acne",
        "score_range": [2.0, 10.0],
        "food_suggestions": None,
        "is_pollution_specific": True,
    },

    # ═══ PROBIOTICS — MIXED ═══
    {
        "id": "R014",
        "title": "Consider probiotic-rich foods",
        "body": "The gut-skin axis suggests gut health may influence skin. Fermented foods may help, though direct evidence for acne is still emerging.",
        "evidence_tier": "mixed",
        "source_note": "Bowe WP & Logan AC. (2011). Acne vulgaris, probiotics and the gut-brain-skin axis. Gut Pathogens, 3(1), 1.",
        "target_metric": "acne",
        "score_range": [3.0, 8.0],
        "food_suggestions": {
            "eat_more": ["curd (dahi)", "kanji", "idli", "dhokla", "kimchi"],
            "eat_less": []
        },
        "is_pollution_specific": False,
    },

    # ═══ VITAMIN A — CLINICAL ═══
    {
        "id": "R015",
        "title": "Include beta-carotene rich foods",
        "body": "Vitamin A / beta-carotene supports skin cell turnover and repair. Deficiency is linked to dry, rough skin.",
        "evidence_tier": "clinical",
        "source_note": "Sorg O et al. (2006). Proposed mechanisms of action for retinoid derivatives in skin. Dermatology, 212(Suppl 1), 3-10.",
        "target_metric": "dryness",
        "score_range": [3.0, 10.0],
        "food_suggestions": {
            "eat_more": ["carrot (gajar)", "sweet potato (shakarkandi)", "pumpkin (kaddu)", "mango (aam)", "spinach (palak)"],
            "eat_less": []
        },
        "is_pollution_specific": False,
    },
]
```

### 10.2 INDB Food Cross-Referencing

```python
# backend/recommendations/indb_mapper.py
import pandas as pd


class INDBMapper:
    """
    Cross-references recommendation food suggestions against the
    Indian Nutrient Databank for actual nutrient values.
    """

    def __init__(self, indb_path: str = "../../data/ANUVAAD_INDB_2024.xlsx"):
        self.df = pd.read_excel(indb_path)
        # Inspect columns: print(self.df.columns.tolist())
        # Typical columns include: Food_Name, Energy_kcal, Protein_g, etc.

    def find_foods_rich_in(self, nutrient_col: str, top_n: int = 10) -> list[dict]:
        """Find top Indian foods rich in a given nutrient."""
        if nutrient_col not in self.df.columns:
            return []
        sorted_df = self.df.dropna(subset=[nutrient_col])
        sorted_df = sorted_df.sort_values(by=nutrient_col, ascending=False)
        return sorted_df.head(top_n)[['Food_Name', nutrient_col]].to_dict('records')

    def get_food_profile(self, food_name: str) -> dict | None:
        """Get full nutrient profile for a specific food."""
        matches = self.df[self.df['Food_Name'].str.contains(food_name, case=False, na=False)]
        if matches.empty:
            return None
        return matches.iloc[0].to_dict()

    def validate_suggestions(self, food_list: list[str]) -> list[dict]:
        """Check which suggested foods exist in INDB and return their data."""
        results = []
        for food in food_list:
            profile = self.get_food_profile(food)
            if profile:
                results.append({"name": food, "found": True, "data": profile})
            else:
                results.append({"name": food, "found": False, "data": None})
        return results
```

### 10.3 Recommendation Engine

```python
# backend/recommendations/engine.py
import numpy as np


class RecommenderEngine:
    """
    Rule-based recommendation engine with evidence tagging.
    Uses KNN-style matching on score vectors against the rule set.
    
    NOT deep learning — deliberately simple for interpretability.
    """

    def __init__(self, rules: list[dict]):
        self.rules = rules

    def match_rules(
        self,
        acne_score: float,
        redness_score: float,
        dryness_score: float,
        aqi: int | None = None,
        trend_data: list[dict] | None = None,
    ) -> list[dict]:
        """
        Match current scores against rule set.
        Returns list of applicable recommendations, sorted by evidence tier.
        """
        matched = []
        score_map = {
            "acne": acne_score,
            "redness": redness_score,
            "dryness": dryness_score,
        }

        for rule in self.rules:
            score = score_map.get(rule["target_metric"], 0)
            min_s, max_s = rule["score_range"]

            if not (min_s <= score <= max_s):
                continue

            # Skip pollution rules when AQI is acceptable
            if rule["is_pollution_specific"] and (aqi is None or aqi < 100):
                continue

            rec = {
                "title": rule["title"],
                "body": rule["body"],
                "evidence_tier": rule["evidence_tier"],
                "source_note": rule["source_note"],
                "food_suggestions": rule.get("food_suggestions"),
                "trend": self._compute_trend(rule["target_metric"], trend_data),
            }
            matched.append(rec)

        # Sort: clinical first, then mixed, then traditional
        tier_order = {"clinical": 0, "mixed": 1, "traditional": 2}
        matched.sort(key=lambda r: tier_order.get(r["evidence_tier"], 3))

        return matched

    def _compute_trend(self, metric: str, trend_data: list[dict] | None) -> str | None:
        """
        Compare current score to 7-day rolling average.
        Uses 3-scan smoothing to avoid single-bad-photo whiplash.
        """
        if not trend_data or len(trend_data) < 3:
            return None

        recent = np.mean([d.get(metric, 0) for d in trend_data[-3:]])
        older = np.mean([d.get(metric, 0) for d in trend_data[:3]])
        diff = recent - older

        if diff < -0.5:
            return "improving"
        elif diff > 0.5:
            return "worsening"
        return "flat"
```

---

## 11. Phase B5 — Pollution / AQI Layer (Week 5)

### WAQI Service

```python
# backend/services/waqi_service.py
import requests
from decouple import config


WAQI_TOKEN = config('WAQI_API_TOKEN', default='')


def fetch_aqi(city: str) -> dict:
    """
    Fetch real-time AQI data for a city from WAQI.
    Returns dict with aqi, pm25, dominant pollutant, and band.
    Fails gracefully — returns None values on error.
    """
    if not WAQI_TOKEN:
        return _empty_response()

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
    except (requests.RequestException, KeyError, ValueError):
        pass

    return _empty_response()


def _aqi_band(aqi: int) -> str:
    if aqi <= 50:   return "good"
    if aqi <= 100:  return "moderate"
    if aqi <= 150:  return "unhealthy_sensitive"
    if aqi <= 200:  return "unhealthy"
    if aqi <= 300:  return "very_unhealthy"
    return "hazardous"


def _empty_response() -> dict:
    return {"aqi": None, "pm25": None, "dominant": None, "band": None}
```

---

## 12. Phase B6 — Full Integration & Image Lifecycle (Weeks 5–6)

> **Goal:** Replace mock data with real CV pipeline + recommender. Enforce image deletion.

### 12.1 Master CV Pipeline

```python
# backend/ml_pipeline/pipeline.py
from .classical_cv.preprocessor import SkinImagePreprocessor
from .classical_cv.redness_analyzer import RednessAnalyzer
from .classical_cv.dryness_analyzer import DrynessAnalyzer
from .classical_cv.ita_analyzer import ITAAnalyzer

# Choose one:
try:
    from .acne_model.inference import AcneInference
    ACNE_MODEL_AVAILABLE = True
except Exception:
    from .acne_model.fallback_inference import AcneFallbackInference as AcneInference
    ACNE_MODEL_AVAILABLE = False


class CVPipeline:
    def __init__(self):
        self.preprocessor = SkinImagePreprocessor()
        self.acne = AcneInference()
        self.redness = RednessAnalyzer()
        self.dryness = DrynessAnalyzer()
        self.ita = ITAAnalyzer()

    def analyze(self, image_path: str) -> dict:
        img = self.preprocessor.preprocess(image_path)
        skin_mask = self.preprocessor.get_skin_mask(img)

        return {
            "acne_score": self.acne.predict(img),
            "redness_score": self.redness.analyze(img, skin_mask),
            "dryness_score": self.dryness.analyze(img, skin_mask),
            "ita_value": self.ita.compute_ita(img, skin_mask),
        }
```

### 12.2 Updated ScanView (Real Pipeline)

```python
# backend/scan/views.py — REPLACE the mock version from Phase B1
import os
import tempfile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
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
            return Response({"error": "No image provided"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Save image temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            for chunk in image.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        try:
            # 2. Run CV pipeline
            scores = cv_pipeline.analyze(tmp_path)

            # 3. Fetch AQI
            aqi_data = fetch_aqi(city)

            # 4. Save score record (NO IMAGE)
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

            # 5. Get recommendations (with trend data)
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
            # 6. DELETE IMAGE IMMEDIATELY — this is non-negotiable
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)


class HistoryView(APIView):
    def get(self, request):
        scans = SkinScan.objects.all()[:30]
        return Response(SkinScanSerializer(scans, many=True).data)
```

> [!CAUTION]
> The `finally` block guarantees image deletion even if the CV pipeline crashes. **Never remove this.**

---

## 13. Phase B7 — Testing, Validation & Evaluation (Weeks 7–8)

### 13.1 CV Model Evaluation

| Test | Method | Target |
|---|---|---|
| Acne classification accuracy | Test on held-out ACNE04 split | >70% |
| Acne detection mAP | YOLOv8 built-in val metrics | >50% mAP@0.5 |
| Redness consistency | Same face, different lighting (after CLAHE) | Score within ±1.0 |
| Dryness consistency | Compare vs self-reported dryness (5–10 users) | Correlation |
| ITA accuracy | Compare computed ITA vs Fitzpatrick self-reports | Correct zone |
| Fairness check | Compare acne accuracy across ITA zones | Similar accuracy |

### 13.2 Recommender Evaluation

- [ ] Domain-literate reviewer checks all 15 rules for accuracy
- [ ] Verify every citation is real and correctly categorized
- [ ] Test: enter score vectors → do matched rules make sense?
- [ ] 5–10 users: "Did the food suggestions feel relevant?"

### 13.3 API Testing

```bash
# Test the full pipeline
curl -X POST -F "image=@test_photo.jpg" -F "city=Delhi" http://127.0.0.1:8000/api/scan/

# Verify image was deleted
# (check temp directory — file should be gone)

# Test history
curl http://127.0.0.1:8000/api/history/
```

---

## 14. Phase B8 — Deployment (Week 8)

| Component | Free-Tier Option |
|---|---|
| **Database** | [Supabase](https://supabase.com) or [Neon](https://neon.tech) (PostgreSQL) |
| **Django Server** | [Railway](https://railway.app) or [Render](https://render.com) with Gunicorn |
| **ML Model Weights** | Store `.pt` files in repo (if small) or [HuggingFace Hub](https://huggingface.co) |

```bash
# Production requirements
pip install gunicorn whitenoise

# Procfile (for Railway/Render)
echo "web: gunicorn twacha_backend.wsgi --bind 0.0.0.0:$PORT" > Procfile
```

---

## 15. Complete Backend Folder Structure

```
backend/
├── twacha_backend/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── scan/
│   ├── __init__.py
│   ├── models.py               # SkinScan, UserProgram
│   ├── serializers.py
│   ├── views.py                # ScanView, HistoryView
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
├── recommendations/
│   ├── __init__.py
│   ├── models.py               # RecommendationRule
│   ├── knowledge_base.py       # 15 evidence-tagged rules
│   ├── engine.py               # Rule matcher
│   └── indb_mapper.py          # INDB food cross-reference
├── ml_pipeline/
│   ├── __init__.py
│   ├── pipeline.py             # Master CV orchestrator
│   ├── acne_model/
│   │   ├── __init__.py
│   │   ├── train_mobilenet.py  # MobileNetV2 training
│   │   ├── train_yolo.py       # YOLOv8-Nano training
│   │   ├── inference.py        # Combined inference
│   │   ├── fallback_inference.py  # Blob-detection fallback
│   │   ├── data.yaml           # YOLO dataset config
│   │   └── weights/            # .pt model files
│   ├── classical_cv/
│   │   ├── __init__.py
│   │   ├── preprocessor.py     # Face detection, CLAHE, skin mask
│   │   ├── redness_analyzer.py # LAB a* channel analysis
│   │   ├── dryness_analyzer.py # Laplacian + specular analysis
│   │   ├── ita_analyzer.py     # ITA computation
│   │   └── test_pipeline.py    # Quick test script
│   └── evaluation/
│       └── evaluate.py         # Model evaluation metrics
├── services/
│   └── waqi_service.py         # AQI API integration
├── .env                        # API keys, secrets (NEVER commit)
├── .gitignore
├── requirements.txt
├── manage.py
└── Procfile                    # For deployment
```

---

## 16. Risk Matrix & Fallbacks

| Risk | Fallback |
|---|---|
| Acne model training takes too long | Ship classical CV (redness + dryness) first; use blob-detection fallback for acne |
| No GPU | Train on Google Colab (free T4) or Kaggle |
| DermaCon-IN access delayed | Validate on ACNE04 test split only |
| WAQI rate-limited | Switch to OpenWeatherMap Air Pollution API |
| INDB Excel column names changed | Update mapping in `indb_mapper.py` |

---

## 17. Key Research Papers

| # | Paper | Year | Why |
|---|---|---|---|
| 1 | Wu et al. — Joint Acne Image Grading via LDL (ICCV) | 2019 | ACNE04 dataset |
| 2 | Smith RN — Low-GI diet and acne (Am J Clin Nutr) | 2007 | Core clinical rule |
| 3 | Adebamowo — Dairy and acne (J Am Acad Dermatol) | 2005 | Mixed evidence rule |
| 4 | Kim et al. — PM2.5 and skin redness | 2025 | Pollution USP |
| 5 | Pullar — Vitamin C in skin (Nutrients) | 2017 | Clinical rule |
| 6 | Chardon — ITA formula origin (IJCS) | 1991 | ITA computation |
| 7 | Jaacks — Indian Food Composition Database | 2024 | INDB methodology |

---

## 18. Coordination Points with Frontend

> [!IMPORTANT]
> These are the moments you **must** sync with the frontend person:

| When | What to Share |
|---|---|
| **Week 1** | Lock the API contract (§7.5) — agree on JSON shapes |
| **Week 1** | Start mock API so frontend can build against it |
| **Week 3** | Classical CV working → update mock endpoint with real redness/dryness scores |
| **Week 5** | Full pipeline working → swap all mock data for real scores |
| **Week 6** | AQI data flowing → frontend adds AQI badge |
| **Week 7** | Trend data working → frontend enables trend charts |
| **Week 8** | Deploy backend → give frontend the production URL |
