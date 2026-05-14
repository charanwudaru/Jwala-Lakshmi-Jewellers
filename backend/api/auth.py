from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta

from db.database import get_db
from db.models import User
from schemas.schemas import Token, UserOut, PasswordChange
from core.security import verify_password, create_access_token, get_password_hash
from core.config import settings
from jose import JWTError, jwt

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

DEFAULT_PASSWORD = "Password@123"

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    # Block access to any protected resource until password is changed
    if current_user.must_change_password:
        raise HTTPException(
            status_code=403,
            detail="You must change your password before accessing this resource."
        )
    return current_user

async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user


@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    # Accept login via email OR phone
    result = await db.execute(
        select(User).where(
            (User.email == form_data.username) | (User.phone == form_data.username)
        )
    )
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/phone or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value},
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "must_change_password": user.must_change_password
    }


@router.post("/change-password", response_model=UserOut)
async def change_password(
    payload: PasswordChange,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint accessible even when must_change_password is True.
    Validates the new password and clears the flag.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        jwt_payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = jwt_payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user:
        raise credentials_exception

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    user.hashed_password = get_password_hash(payload.new_password)
    user.must_change_password = False
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/me", response_model=UserOut)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
