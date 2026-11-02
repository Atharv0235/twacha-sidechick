"""Register, log in, profile, change password, delete account."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import (burn_password_time, check_login_allowed, clear_login_failures, create_access_token,
                    get_current_user, hash_password, record_login_failure, verify_password)
from ..database import get_db
from ..models import DietaryLog, PlanItem, Program, SkinScan, User
from ..schemas import (AuthOut, ChangePasswordIn, DeleteAccountIn, LoginIn, ProfileIn, RegisterIn, UserOut)

router = APIRouter(prefix="/api", tags=["accounts"])


def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _auth_out(user: User) -> AuthOut:
    return AuthOut(access_token=create_access_token(user.id, user.token_version), user=UserOut.model_validate(user))


def delete_user_data(db: Session, user_id: int) -> dict:
    """Removes everything stored for a user except the account row itself."""
    counts = {
        "scans": db.query(SkinScan).filter_by(user_id=user_id).delete(),
        "food_logs": db.query(DietaryLog).filter_by(user_id=user_id).delete(),
        "plan_items": db.query(PlanItem).filter_by(user_id=user_id).delete(),
        "programs": db.query(Program).filter_by(user_id=user_id).delete(),
    }
    return counts


@router.post("/auth/register", response_model=AuthOut, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    if not payload.accepted_terms:
        raise HTTPException(status_code=422, detail="Please accept the privacy policy to create an account.")
    if db.query(User).filter_by(email=payload.email).first():
        raise HTTPException(status_code=409, detail="That email is already registered. Try logging in.")
    user = User(email=payload.email, password_hash=hash_password(payload.password), name=payload.name,
                city=payload.city, created_at=_utcnow(), consented_at=_utcnow())
    db.add(user)
    try:
        db.commit()
    except IntegrityError:          # two sign-ups with the same email at the same moment
        db.rollback()
        raise HTTPException(status_code=409, detail="That email is already registered. Try logging in.")
    db.refresh(user)
    return _auth_out(user)


@router.post("/auth/login", response_model=AuthOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    check_login_allowed(payload.email)
    user = db.query(User).filter_by(email=payload.email).first()
    if user is None:
        burn_password_time(payload.password)
        ok = False
    else:
        ok = verify_password(payload.password, user.password_hash)
    if not ok:
        record_login_failure(payload.email)
        raise HTTPException(status_code=401, detail="Wrong email or password.")
    clear_login_failures(payload.email)
    return _auth_out(user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserOut)
def update_me(payload: ProfileIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.name = payload.name
    user.city = payload.city
    db.commit()
    db.refresh(user)
    return user


@router.post("/auth/change-password", response_model=AuthOut)
def change_password(payload: ChangePasswordIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Also logs out every other device (their tokens carry the old version number)."""
    check_login_allowed(user.email)
    if not verify_password(payload.current_password, user.password_hash):
        record_login_failure(user.email)
        raise HTTPException(status_code=401, detail="Current password is wrong.")
    user.password_hash = hash_password(payload.new_password)
    user.token_version += 1
    db.commit()
    db.refresh(user)
    return _auth_out(user)


@router.post("/me/delete")
def delete_account(payload: DeleteAccountIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Deletes the account and every record that belongs to it. Needs the password."""
    check_login_allowed(user.email)
    if not verify_password(payload.password, user.password_hash):
        record_login_failure(user.email)
        raise HTTPException(status_code=401, detail="Password is wrong.")
    counts = delete_user_data(db, user.id)
    db.delete(user)
    db.commit()
    return {"deleted_account": True, "deleted": counts}
