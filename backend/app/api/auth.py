import uuid
from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import UserRegisterRequest, UserLoginRequest, UserResponse, TokenResponse
from app.services.auth import hash_password, verify_password, create_access_token, get_current_user
from app.db.database import create_user, get_user_by_email

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegisterRequest):
    """
    Register a new clinical operator user account.
    """
    email_clean = payload.email.lower().strip()
    if not email_clean or "@" not in email_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid email address is required."
        )

    if not payload.password or len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    if not payload.full_name or not payload.full_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name or clinician identifier is required."
        )

    existing_user = get_user_by_email(email_clean)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    hashed_pwd = hash_password(payload.password)
    user_record = create_user(
        user_id=user_id,
        email=email_clean,
        hashed_password=hashed_pwd,
        full_name=payload.full_name.strip(),
        role=payload.role or "Clinical Operator"
    )

    access_token = create_access_token({"sub": user_id, "email": email_clean})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user_record["id"],
            email=user_record["email"],
            full_name=user_record["full_name"],
            role=user_record["role"],
            created_at=user_record["created_at"]
        )
    )

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLoginRequest):
    """
    Authenticate clinical operator user and return JWT access token.
    """
    email_clean = payload.email.lower().strip()
    user_record = get_user_by_email(email_clean)
    if not user_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(payload.password, user_record["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token({"sub": user_record["id"], "email": user_record["email"]})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user_record["id"],
            email=user_record["email"],
            full_name=user_record["full_name"],
            role=user_record["role"],
            created_at=user_record["created_at"]
        )
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """
    Retrieve current authenticated user details.
    """
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        created_at=current_user["created_at"]
    )
