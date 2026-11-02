from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, SkinScan, Program, DietaryLog
from ..schemas import UserCreate, UserLogin, UserOut, Token
from ..auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _link_device_to_user(db: Session, user_id: int, device_id: str | None):
    """Associates anonymous scans and logs from this device to the authenticated user ID."""
    if not device_id or device_id == "anonymous":
        return
    # Link past scans that don't have a user_id yet
    db.query(SkinScan).filter(SkinScan.device_id == device_id, SkinScan.user_id.is_(None)).update({"user_id": user_id})
    db.query(Program).filter(Program.device_id == device_id, Program.user_id.is_(None)).update({"user_id": user_id})
    db.query(DietaryLog).filter(DietaryLog.device_id == device_id, DietaryLog.user_id.is_(None)).update({"user_id": user_id})
    db.commit()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email address is required.")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    existing_email = db.query(User).filter(User.email == email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    username = payload.username.strip() if payload.username else None
    if username:
        existing_username = db.query(User).filter(User.username == username).first()
        if existing_username:
            raise HTTPException(status_code=400, detail="Username is already taken.")

    user = User(
        email=email,
        username=username,
        full_name=payload.full_name.strip() if payload.full_name else None,
        hashed_password=hash_password(payload.password),
        device_id=payload.device_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Link any previous scans made on this device to this user ID
    if payload.device_id:
        _link_device_to_user(db, user.id, payload.device_id)

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    login_id = payload.email.strip()
    user = (
        db.query(User)
        .filter((User.email == login_id.lower()) | (User.username == login_id))
        .first()
    )
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update or link device if provided
    if payload.device_id:
        if user.device_id != payload.device_id:
            user.device_id = payload.device_id
            db.commit()
        _link_device_to_user(db, user.id, payload.device_id)

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
