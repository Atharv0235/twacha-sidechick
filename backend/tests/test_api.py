"""
Run from the backend root:   pip install -r requirements-dev.txt && pytest -q
Optional real-photo tests:   TWACHA_PHOTOS=/path/to/folder pytest -q   (any .jpg/.png/.webp with a face)
Optional Postgres run:       TWACHA_TEST_DATABASE_URL=postgresql://user:pw@localhost/dbname pytest -q   (use an EMPTY test database)
"""
import io, os, sys, glob, tempfile, itertools, time
from datetime import date, datetime, timedelta, timezone

_tmp = tempfile.mkdtemp()
# TWACHA_TEST_DATABASE_URL lets you run the same tests against Postgres (the tables are created fresh).
os.environ["DATABASE_URL"] = os.environ.get("TWACHA_TEST_DATABASE_URL") or f"sqlite:///{_tmp}/test.db"
os.environ["ENABLE_DEMO"] = "1"
os.environ["BCRYPT_ROUNDS"] = "4"                      # fast hashing in tests only
os.environ["JWT_SECRET_KEY"] = "test-secret-key-test-secret-key-0123456789"
os.environ.pop("WAQI_TOKEN", None)
os.environ.pop("DEMO_AQI", None)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np, cv2, pytest, jwt
from fastapi.testclient import TestClient
from app.main import app
from app import auth


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def _clear_throttle():
    auth._failures.clear()
    yield


_n = itertools.count(1)
PW = "correct horse 42"


def signup(client, email=None, name="Asha", city=None, password=PW):
    email = email or f"user{next(_n)}@example.com"
    r = client.post("/api/auth/register", json={"email": email, "password": password, "name": name,
                                                "city": city, "accepted_terms": True})
    assert r.status_code == 201, r.text
    return email, {"Authorization": f"Bearer {r.json()['access_token']}"}


def _jpg(arr):
    ok, buf = cv2.imencode(".jpg", arr)
    return buf.tobytes()


def _post(client, data, headers, name="x.jpg", **form):
    return client.post("/api/scan/", files={"image": (name, data, "image/jpeg")}, data=form, headers=headers)


# ── basics ───────────────────────────────────────────────────────────────────

def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["acne_model_loaded"] is True


def test_data_routes_need_a_login(client):
    for method, path in [("get", "/api/history/"), ("get", "/api/log/"), ("get", "/api/plan/summary"),
                         ("get", "/api/me"), ("post", "/api/scan/"), ("delete", "/api/data/"),
                         ("post", "/demo/seed")]:
        assert getattr(client, method)(path).status_code == 401, path
    assert client.get("/api/foods/").status_code == 200        # public: just a list of food names


def test_garbage_token_is_401(client):
    r = client.get("/api/me", headers={"Authorization": "Bearer not.a.token"})
    assert r.status_code == 401 and r.json()["detail"]


# ── scan input validation (logged in) ────────────────────────────────────────

def test_scan_input_errors(client):
    _, h = signup(client)
    assert client.post("/api/scan/", headers=h).status_code == 422
    r = _post(client, b"hello world", h)
    assert r.status_code == 422 and "image" in r.json()["detail"].lower()
    assert _post(client, b"", h).status_code == 422
    r = _post(client, _jpg(np.full((400, 400, 3), 8, np.uint8)), h)
    assert r.status_code == 422 and r.json()["detail"]
    rng = np.random.default_rng(0)
    blur = cv2.GaussianBlur(rng.integers(60, 200, (400, 400, 3), dtype=np.uint8), (51, 51), 0)
    assert _post(client, _jpg(blur), h).status_code == 422
    assert _post(client, b"0" * (10 * 1024 * 1024 + 1), h).status_code == 413


def test_limits_validated(client):
    _, h = signup(client)
    assert client.get("/api/history/?limit=0", headers=h).status_code == 422
    assert client.get("/api/history/?limit=100000", headers=h).status_code == 422


def test_log_validation(client):
    _, h = signup(client)
    assert client.post("/api/log/", json={"foods_eaten": []}, headers=h).status_code == 422
    assert client.post("/api/log/", json={"foods_eaten": ["dal"], "log_date": str(date.today() + timedelta(days=3))}, headers=h).status_code == 422
    assert client.post("/api/log/", json={"foods_eaten": ["dal", "  "]}, headers=h).json()["foods_eaten"] == ["dal"]
    # a user whose local date is one day ahead of the server (time zones) must still be accepted
    assert client.post("/api/log/", json={"foods_eaten": ["dal"], "log_date": str(date.today() + timedelta(days=1))}, headers=h).status_code == 201


def test_foods_picker(client):
    names = client.get("/api/foods/").json()
    assert len(names) > 20 and names == sorted(names)


# ── registration and login ───────────────────────────────────────────────────

@pytest.mark.parametrize("patch", [
    {"email": "not-an-email"}, {"email": ""}, {"password": "short"}, {"password": "x" * 73},
    {"password": "é" * 40},                     # 80 bytes: bcrypt would refuse it
    {"name": "   "}, {"name": "n" * 41}, {"city": "c" * 61}, {"accepted_terms": False},
])
def test_register_validation(client, patch):
    body = {"email": f"v{next(_n)}@example.com", "password": PW, "name": "Asha", "accepted_terms": True, **patch}
    r = client.post("/api/auth/register", json=body)
    assert r.status_code == 422, (patch, r.text)
    assert r.json()["detail"]


def test_register_duplicate_email_is_409_even_with_other_case(client):
    email, _ = signup(client)
    r = client.post("/api/auth/register", json={"email": email.upper(), "password": PW, "name": "X", "accepted_terms": True})
    assert r.status_code == 409


def test_password_is_stored_hashed(client):
    email, _ = signup(client, password="my secret pw 1")
    from app.database import SessionLocal
    from app.models import User
    db = SessionLocal()
    try:
        u = db.query(User).filter_by(email=email).one()
        assert "my secret pw 1" not in u.password_hash and u.password_hash.startswith("$2")
    finally:
        db.close()


def test_login_and_me(client):
    email, _ = signup(client, name="Ravi", city="Delhi")
    r = client.post("/api/auth/login", json={"email": email.upper(), "password": PW})
    assert r.status_code == 200
    me = client.get("/api/me", headers={"Authorization": f"Bearer {r.json()['access_token']}"}).json()
    assert me["name"] == "Ravi" and me["city"] == "Delhi" and me["email"] == email
    assert "password" not in str(me).lower()


def test_wrong_password_and_unknown_email_look_the_same(client):
    email, _ = signup(client)
    a = client.post("/api/auth/login", json={"email": email, "password": "wrong password"})
    b = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "wrong password"})
    assert a.status_code == b.status_code == 401 and a.json() == b.json()


def test_login_is_throttled_after_repeated_failures(client):
    email, _ = signup(client)
    for _i in range(8):
        assert client.post("/api/auth/login", json={"email": email, "password": "nope nope"}).status_code == 401
    r = client.post("/api/auth/login", json={"email": email, "password": PW})
    assert r.status_code == 429


def test_profile_update(client):
    _, h = signup(client)
    r = client.put("/api/me", json={"name": " Meera ", "city": " Pune "}, headers=h)
    assert r.status_code == 200 and r.json()["name"] == "Meera" and r.json()["city"] == "Pune"
    assert client.put("/api/me", json={"name": ""}, headers=h).status_code == 422


def test_expired_and_tampered_tokens_are_rejected(client):
    email, h = signup(client)
    uid = client.get("/api/me", headers=h).json()["id"]
    now = datetime.now(timezone.utc)
    expired = jwt.encode({"sub": str(uid), "tv": 0, "exp": now - timedelta(minutes=1)}, auth.SECRET_KEY, algorithm="HS256")
    assert client.get("/api/me", headers={"Authorization": f"Bearer {expired}"}).status_code == 401
    forged = jwt.encode({"sub": str(uid), "tv": 0, "exp": now + timedelta(days=1)}, "some other secret key 0123456789abcdef", algorithm="HS256")
    assert client.get("/api/me", headers={"Authorization": f"Bearer {forged}"}).status_code == 401
    unsigned = jwt.encode({"sub": str(uid), "tv": 0, "exp": now + timedelta(days=1)}, None, algorithm="none")
    assert client.get("/api/me", headers={"Authorization": f"Bearer {unsigned}"}).status_code == 401
    no_exp = jwt.encode({"sub": str(uid), "tv": 0}, auth.SECRET_KEY, algorithm="HS256")
    assert client.get("/api/me", headers={"Authorization": f"Bearer {no_exp}"}).status_code == 401


def test_change_password_logs_out_old_tokens(client):
    email, old = signup(client)
    assert client.post("/api/auth/change-password", json={"current_password": "wrong one", "new_password": "brand new pw 9"}, headers=old).status_code == 401
    assert client.post("/api/auth/change-password", json={"current_password": PW, "new_password": "short"}, headers=old).status_code == 422
    r = client.post("/api/auth/change-password", json={"current_password": PW, "new_password": "brand new pw 9"}, headers=old)
    assert r.status_code == 200
    new = {"Authorization": f"Bearer {r.json()['access_token']}"}
    assert client.get("/api/me", headers=old).status_code == 401           # other devices are logged out
    assert client.get("/api/me", headers=new).status_code == 200
    assert client.post("/api/auth/login", json={"email": email, "password": PW}).status_code == 401
    assert client.post("/api/auth/login", json={"email": email, "password": "brand new pw 9"}).status_code == 200


def test_cors_preflight_allows_authorization_header(client):
    r = client.options("/api/history/", headers={"Origin": "https://example.netlify.app",
                                                 "Access-Control-Request-Method": "GET",
                                                 "Access-Control-Request-Headers": "authorization,content-type"})
    assert r.status_code == 200
    assert "authorization" in r.headers["access-control-allow-headers"].lower()


# ── each user only sees their own data ───────────────────────────────────────

def test_two_users_are_isolated(client):
    _, A = signup(client); _, B = signup(client)
    client.post("/demo/seed?days=5", headers=A)
    client.post("/api/log/", json={"foods_eaten": ["dal"]}, headers=A)
    ha = client.get("/api/history/", headers=A).json()
    hb = client.get("/api/history/", headers=B).json()
    assert len(ha["scans"]) == 5 and ha["program"]["is_demo"] is True
    assert hb["scans"] == [] and hb["program"]["is_demo"] is False
    assert client.get("/api/log/", headers=B).json() == []
    assert client.get("/api/log/", headers=A).json()[0]["foods_eaten"] == ["dal"]


def test_plans_are_isolated_and_other_users_items_are_404(client):
    _, A = signup(client); _, B = signup(client)
    foods = client.get("/api/foods/").json()
    item = client.post("/api/plan/", json={"food": foods[0], "kind": "try"}, headers=A).json()
    assert client.get("/api/plan/summary", headers=B).json()["items"] == []
    assert client.put(f"/api/plan/{item['id']}", json={"target_days": 2}, headers=B).status_code == 404
    assert client.delete(f"/api/plan/{item['id']}", headers=B).status_code == 404
    assert len(client.get("/api/plan/summary", headers=A).json()["items"]) == 1


def test_delete_my_data_keeps_account_and_only_deletes_mine(client):
    email, A = signup(client); _, B = signup(client)
    foods = client.get("/api/foods/").json()
    client.post("/demo/seed?days=4", headers=A); client.post("/demo/seed?days=4", headers=B)
    client.post("/api/plan/", json={"food": foods[0], "kind": "try"}, headers=A)
    r = client.delete("/api/data/", headers=A)
    assert r.status_code == 200 and r.json()["deleted"]["scans"] == 4 and r.json()["deleted"]["plan_items"] == 1
    assert client.get("/api/history/", headers=A).json()["scans"] == []
    assert client.get("/api/plan/summary", headers=A).json()["items"] == []
    assert len(client.get("/api/history/", headers=B).json()["scans"]) == 4
    assert client.get("/api/me", headers=A).status_code == 200                     # account still there


def test_delete_account_removes_everything(client):
    email, A = signup(client); _, B = signup(client)
    foods = client.get("/api/foods/").json()
    client.post("/demo/seed?days=4", headers=A); client.post("/demo/seed?days=4", headers=B)
    client.post("/api/plan/", json={"food": foods[0], "kind": "limit"}, headers=A)
    client.post("/api/log/", json={"foods_eaten": [foods[1]]}, headers=A)
    uid = client.get("/api/me", headers=A).json()["id"]
    assert client.post("/api/me/delete", json={"password": "wrong"}, headers=A).status_code == 401
    assert client.get("/api/me", headers=A).status_code == 200
    r = client.post("/api/me/delete", json={"password": PW}, headers=A)
    assert r.status_code == 200 and r.json()["deleted_account"] is True
    assert client.get("/api/me", headers=A).status_code == 401
    assert client.post("/api/auth/login", json={"email": email, "password": PW}).status_code == 401
    from app.database import SessionLocal
    from app.models import SkinScan, PlanItem, DietaryLog, Program, User
    db = SessionLocal()
    try:
        for model in (SkinScan, PlanItem, DietaryLog, Program):
            assert db.query(model).filter_by(user_id=uid).count() == 0, model.__name__     # no orphan rows
        assert db.get(User, uid) is None
    finally:
        db.close()
    assert len(client.get("/api/history/", headers=B).json()["scans"]) == 4                # B untouched
    # the email can be registered again
    assert client.post("/api/auth/register", json={"email": email, "password": PW, "name": "Again", "accepted_terms": True}).status_code == 201


def test_old_database_gets_new_columns():
    import sqlite3, tempfile
    d = tempfile.mkdtemp(); path = f"{d}/old.db"
    con = sqlite3.connect(path)
    con.execute("CREATE TABLE programs (id INTEGER PRIMARY KEY, start_date DATE NOT NULL, total_days INTEGER NOT NULL)")
    con.execute("CREATE TABLE skin_scans (id INTEGER PRIMARY KEY, day_number INTEGER)")
    con.execute("INSERT INTO programs (start_date, total_days) VALUES ('2026-09-01', 30)")
    con.commit(); con.close()
    from sqlalchemy import create_engine, inspect
    import app.database as dbm
    old = dbm.engine
    dbm.engine = create_engine(f"sqlite:///{path}")
    try:
        dbm.ensure_columns(); dbm.ensure_columns()          # twice: must be harmless
        insp = inspect(dbm.engine)
        assert {"device_id", "is_demo", "user_id"} <= {c["name"] for c in insp.get_columns("programs")}
        assert "user_id" in {c["name"] for c in insp.get_columns("skin_scans")}
        assert any(i["column_names"] == ["user_id"] for i in insp.get_indexes("programs"))
    finally:
        dbm.engine = old


def test_demo_seed_and_trend(client):
    _, h = signup(client)
    assert client.post("/demo/seed?days=14", headers=h).status_code == 200
    hist = client.get("/api/history/", headers=h).json()
    assert len(hist["scans"]) == 14 and hist["program"]["current_day"] == 15
    assert hist["scans"][0]["created_at"].endswith(("Z", "+00:00"))       # UTC-aware
    client.post("/demo/reset", headers=h)
    assert client.get("/api/history/", headers=h).json()["scans"] == []


# ── plan and progress ────────────────────────────────────────────────────────

def _today():
    return date.today().isoformat()


def test_plan_add_validation_and_defaults(client):
    _, h = signup(client)
    foods = client.get("/api/foods/").json()
    f = foods[0]
    r = client.post("/api/plan/", json={"food": f.upper(), "kind": "try"}, headers=h)       # case-insensitive
    assert r.status_code == 201 and r.json()["food"] == f and r.json()["target_days"] == 4
    again = client.post("/api/plan/", json={"food": f, "kind": "try"}, headers=h)
    assert again.status_code == 200 and again.json()["id"] == r.json()["id"]               # no duplicate
    assert client.post("/api/plan/", json={"food": "pizza of doom", "kind": "try"}, headers=h).status_code == 422
    assert client.post("/api/plan/", json={"food": foods[1], "kind": "eat"}, headers=h).status_code == 422
    assert client.post("/api/plan/", json={"food": foods[1], "kind": "try", "target_days": 0}, headers=h).status_code == 422
    assert client.post("/api/plan/", json={"food": foods[1], "kind": "try", "target_days": 8}, headers=h).status_code == 422
    ok = client.post("/api/plan/", json={"food": foods[2], "kind": "limit", "target_days": 0}, headers=h)
    assert ok.status_code == 201 and ok.json()["target_days"] == 0
    assert client.post("/api/plan/", json={"food": foods[3], "kind": "limit", "target_days": 7}, headers=h).status_code == 422


def test_plan_is_capped(client):
    _, h = signup(client)
    foods = client.get("/api/foods/").json()
    for f in foods[:12]:
        assert client.post("/api/plan/", json={"food": f, "kind": "try"}, headers=h).status_code == 201
    r = client.post("/api/plan/", json={"food": foods[12], "kind": "try"}, headers=h)
    assert r.status_code == 422 and "full" in r.json()["detail"]


def test_plan_target_update_and_remove(client):
    _, h = signup(client)
    foods = client.get("/api/foods/").json()
    t = client.post("/api/plan/", json={"food": foods[0], "kind": "try"}, headers=h).json()
    l = client.post("/api/plan/", json={"food": foods[1], "kind": "limit"}, headers=h).json()
    assert client.put(f"/api/plan/{t['id']}", json={"target_days": 6}, headers=h).json()["target_days"] == 6
    assert client.put(f"/api/plan/{t['id']}", json={"target_days": 0}, headers=h).status_code == 422
    assert client.put(f"/api/plan/{l['id']}", json={"target_days": 7}, headers=h).status_code == 422
    assert client.delete(f"/api/plan/{t['id']}", headers=h).status_code == 200
    assert [i["food"] for i in client.get("/api/plan/summary", headers=h).json()["items"]] == [foods[1]]
    assert client.delete(f"/api/plan/{t['id']}", headers=h).status_code == 404


def test_tick_and_untick_edit_the_food_log_and_progress(client):
    _, h = signup(client)
    foods = client.get("/api/foods/").json()
    a, b = foods[0], foods[1]
    client.post("/api/plan/", json={"food": a, "kind": "try", "target_days": 2}, headers=h)
    client.post("/api/plan/", json={"food": b, "kind": "limit", "target_days": 1}, headers=h)

    s = client.get(f"/api/plan/summary?today={_today()}", headers=h).json()
    assert s["goals_total"] == 2 and s["goals_met"] == 1          # limit goal is met at 0 days, try goal is not
    assert s["logging_streak"] == 0

    assert client.post("/api/plan/check", json={"food": a, "done": True}, headers=h).json()["foods_eaten"] == [a]
    assert client.post("/api/plan/check", json={"food": a, "done": True}, headers=h).json()["foods_eaten"] == [a]   # idempotent
    yesterday = str(date.today() - timedelta(days=1))
    client.post("/api/plan/check", json={"food": a, "done": True, "log_date": yesterday}, headers=h)
    s = client.get(f"/api/plan/summary?today={_today()}", headers=h).json()
    item = next(i for i in s["items"] if i["food"] == a)
    assert item["days_eaten"] == 2 and item["met"] and item["eaten_today"] and item["last_7"][-2:] == [True, True]
    assert s["logging_streak"] == 2

    # the limit food: eating it on 2 days breaks the "at most 1 day" goal
    for d in (_today(), yesterday):
        client.post("/api/plan/check", json={"food": b, "done": True, "log_date": d}, headers=h)
    s = client.get(f"/api/plan/summary?today={_today()}", headers=h).json()
    assert next(i for i in s["items"] if i["food"] == b)["met"] is False and s["goals_met"] == 1

    # un-ticking removes it from the log; the log row disappears when empty
    client.post("/api/plan/check", json={"food": b, "done": False}, headers=h)
    client.post("/api/plan/check", json={"food": a, "done": False}, headers=h)
    assert client.get("/api/log/", headers=h).json()[0]["log_date"] == yesterday
    r = client.post("/api/plan/check", json={"food": a, "done": False, "log_date": yesterday}, headers=h)
    assert r.status_code == 200 and r.json()["foods_eaten"] == [b]


def test_check_rejects_bad_input(client):
    _, h = signup(client)
    f = client.get("/api/foods/").json()[0]
    assert client.post("/api/plan/check", json={"food": "nonsense", "done": True}, headers=h).status_code == 422
    far = str(date.today() + timedelta(days=3))
    assert client.post("/api/plan/check", json={"food": f, "done": True, "log_date": far}, headers=h).status_code == 422
    old = str(date.today() - timedelta(days=10))
    assert client.post("/api/plan/check", json={"food": f, "done": True, "log_date": old}, headers=h).status_code == 422
    assert client.get(f"/api/plan/summary?today={far}", headers=h).status_code == 422


def test_streak_counts_consecutive_days_only(client):
    _, h = signup(client)
    f = client.get("/api/foods/").json()[0]
    for back in (0, 1, 3):                                   # gap two days ago
        client.post("/api/plan/check", json={"food": f, "done": True, "log_date": str(date.today() - timedelta(days=back))}, headers=h)
    assert client.get(f"/api/plan/summary?today={_today()}", headers=h).json()["logging_streak"] == 2
    # nothing logged today yet: the streak that ended yesterday still counts
    client.post("/api/plan/check", json={"food": f, "done": False}, headers=h)
    assert client.get(f"/api/plan/summary?today={_today()}", headers=h).json()["logging_streak"] == 1


def test_scan_change_needs_enough_history(client):
    _, h = signup(client)
    assert client.get("/api/plan/summary", headers=h).json()["scan_change"] is None
    client.post("/demo/seed?days=10&start_acne=7&end_acne=4", headers=h)
    sc = client.get("/api/plan/summary", headers=h).json()["scan_change"]
    assert sc is not None and sc["scans"] >= 2 and sc["days"] >= 3 and sc["from_score"] > sc["to_score"]
    assert "does not show" in client.get("/api/plan/summary", headers=h).json()["note"]


def test_logged_food_changes_next_recommendations_still_works(client):
    # the plan reuses the food log, so logging through the plain endpoint must show up in plan progress too
    _, h = signup(client)
    f = client.get("/api/foods/").json()[0]
    client.post("/api/plan/", json={"food": f, "kind": "try", "target_days": 1}, headers=h)
    client.post("/api/log/", json={"foods_eaten": [f]}, headers=h)
    item = client.get(f"/api/plan/summary?today={_today()}", headers=h).json()["items"][0]
    assert item["eaten_today"] and item["met"]


PHOTOS = sorted(sum((glob.glob(os.path.join(os.environ.get("TWACHA_PHOTOS", "/nonexistent"), e))
                     for e in ("*.jpg", "*.jpeg", "*.png", "*.webp")), []))


@pytest.mark.skipif(not PHOTOS, reason="set TWACHA_PHOTOS to a folder of face photos")
@pytest.mark.parametrize("path", PHOTOS)
def test_real_photo(client, path):
    _, h = signup(client)
    data = open(path, "rb").read()
    r = _post(client, data, h, name=os.path.basename(path))
    assert r.status_code in (201, 422), r.text
    if r.status_code == 201:
        j = r.json()
        for k in ("acne_score", "redness_score", "dryness_score"):
            assert 0 <= j["scan"][k] <= 10
        assert j["environment"]["source"] == "unavailable"           # no token in tests
        assert 1 <= len(j["recommendations"]) <= 3
        assert any("Air-quality" in n for n in j["quality_notes"])
        for rec in j["recommendations"]:
            assert rec["evidence_tier"] != "clinical"
            assert "Fabbrocini" not in (rec["source_note"] or "")


# ── Weekly summary ───────────────────────────────────────────────────────────

def _add_scans(uid, rows):
    """rows: (days_ago, hour_utc, acne, redness, dryness, aqi_band). Inserts scans directly with known dates."""
    from app.database import SessionLocal
    from app.models import SkinScan
    db = SessionLocal()
    try:
        base = datetime.now(timezone.utc).replace(tzinfo=None, hour=0, minute=0, second=0, microsecond=0)
        for days_ago, hour, a, r, d, band in rows:
            db.add(SkinScan(created_at=base - timedelta(days=days_ago) + timedelta(hours=hour), day_number=1, user_id=uid,
                            acne_score=a, redness_score=r, dryness_score=d, ita_value=40.0,
                            local_aqi=None if band is None else 150, pm25=None, dominant_pollutant=None, aqi_band=band))
        db.commit()
    finally:
        db.close()


def _uid(client, h):
    return client.get("/api/me", headers=h).json()["id"]


def test_week_requires_login_and_validates_input(client):
    assert client.get("/api/summary/week").status_code == 401
    _, h = signup(client)
    assert client.get("/api/summary/week?tz_offset=5000", headers=h).status_code == 422
    assert client.get("/api/summary/week?today=2001-01-01", headers=h).status_code == 422


def test_week_for_a_new_account_is_empty_but_valid(client):
    _, h = signup(client)
    w = client.get("/api/summary/week", headers=h).json()
    assert w["scans_this_week"] == 0 and w["food_days"] == 0 and w["logging_streak"] == 0
    assert w["scan_days"] == [False] * 7 and w["log_days"] == [False] * 7
    assert all(m["this_week"] is None and m["direction"] is None for m in w["metrics"])
    assert w["air"] is None and w["plan"] is None
    assert any("No scans" in s for s in w["highlights"])
    assert "does not show what caused" in w["note"] or "does not show" in w["note"]


def test_week_averages_changes_and_direction(client):
    _, h = signup(client)
    uid = _uid(client, h)
    _add_scans(uid, [
        (1, 12, 4.0, 3.0, 5.0, None), (2, 12, 5.0, 3.2, 5.0, None),          # this week: acne avg 4.5
        (8, 12, 7.0, 3.0, 5.0, None), (9, 12, 6.0, 3.0, 5.0, None),          # last week: acne avg 6.5
    ])
    w = client.get("/api/summary/week", headers=h).json()
    m = {x["key"]: x for x in w["metrics"]}
    assert (w["scans_this_week"], w["scans_last_week"]) == (2, 2)
    assert m["acne"]["this_week"] == 4.5 and m["acne"]["last_week"] == 6.5
    assert m["acne"]["change"] == -2.0 and m["acne"]["direction"] == "lower"
    assert m["redness"]["direction"] == "same"                               # 3.1 vs 3.0 is inside the noise band
    assert m["dryness"]["direction"] == "same"
    assert sum(w["scan_days"]) == 2
    text = " ".join(w["highlights"])
    assert "acne score averaged 4.5" in text and "Lower is better" in text
    assert "caused" not in text and "because" not in text                       # describes, never explains


def test_week_with_nothing_last_week_does_not_invent_a_comparison(client):
    _, h = signup(client)
    _add_scans(_uid(client, h), [(1, 12, 4.0, 3.0, 5.0, None)])
    w = client.get("/api/summary/week", headers=h).json()
    assert all(m["change"] is None and m["direction"] is None for m in w["metrics"])
    assert any("nothing to compare" in s for s in w["highlights"])


def test_week_is_isolated_between_users(client):
    _, a = signup(client)
    _, b = signup(client)
    _add_scans(_uid(client, a), [(1, 12, 9.0, 9.0, 9.0, "poor")])
    wb = client.get("/api/summary/week", headers=b).json()
    assert wb["scans_this_week"] == 0 and wb["air"] is None
    assert client.get("/api/summary/week", headers=a).json()["scans_this_week"] == 1


def test_week_uses_the_users_own_calendar_day(client):
    _, h = signup(client)
    # yesterday 20:00 UTC is 01:30 on the next day for someone at UTC+5:30, so it counts as "today" for them
    _add_scans(_uid(client, h), [(1, 20, 4.0, 3.0, 5.0, None)])
    today = datetime.now(timezone.utc).date().isoformat()
    utc_view = client.get(f"/api/summary/week?today={today}&tz_offset=0", headers=h).json()
    ist_view = client.get(f"/api/summary/week?today={today}&tz_offset=330", headers=h).json()
    assert utc_view["scan_days"] == [False] * 5 + [True, False]
    assert ist_view["scan_days"] == [False] * 6 + [True]


def test_week_air_plan_and_food_days(client):
    _, h = signup(client)
    _add_scans(_uid(client, h), [(1, 10, 4, 3, 5, "poor"), (1, 14, 4, 3, 5, "good"),     # same day: the worst reading counts
                                 (2, 12, 4, 3, 5, "good")])
    foods = client.get("/api/foods/").json()
    assert client.post("/api/plan/", json={"food": foods[0], "kind": "try"}, headers=h).status_code == 201
    assert client.post("/api/plan/check", json={"food": foods[0], "done": True}, headers=h).status_code == 200
    w = client.get("/api/summary/week", headers=h).json()
    assert w["air"] == {"days_with_reading": 2, "poor_days": 1}
    assert w["plan"] == {"goals_met": 0, "goals_total": 1}                               # default goal is 4 days, ticked 1
    assert w["food_days"] == 1 and w["log_days"][6] is True and w["logging_streak"] == 1
    assert any("poor or worse on 1 of 2 days" in s for s in w["highlights"])


def test_week_ignores_scans_older_than_two_weeks(client):
    _, h = signup(client)
    _add_scans(_uid(client, h), [(20, 12, 9.0, 9.0, 9.0, "severe")])
    w = client.get("/api/summary/week", headers=h).json()
    assert w["scans_this_week"] == 0 and w["scans_last_week"] == 0 and w["air"] is None
