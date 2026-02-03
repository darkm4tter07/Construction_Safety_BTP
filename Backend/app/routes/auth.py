from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime

from app.database import get_db
from app.db_models import User, UserRole, FitnessConnection
from app.schemas.user import Token, UserResponse, GoogleAuthURL
from app.utils.security import create_access_token, get_current_user
from app.core.config import settings

router = APIRouter()

# Google OAuth Scopes
SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read'
]

def create_flow():
    """Create Google OAuth flow"""
    return Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
            }
        },
        scopes=SCOPES,
        redirect_uri=settings.GOOGLE_REDIRECT_URI
    )

@router.get("/google/login", response_model=GoogleAuthURL)
async def google_login():
    """Start Google OAuth flow"""
    flow = create_flow()
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    return {"authorization_url": authorization_url}

@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    flow = create_flow()
    flow.fetch_token(code=code)
    credentials = flow.credentials
    
    # Get user info from Google
    user_info_service = build('oauth2', 'v2', credentials=credentials)
    user_info = user_info_service.userinfo().get().execute()
    
    google_id = user_info.get('id')
    email = user_info.get('email')
    full_name = user_info.get('name', email.split('@')[0])
    profile_picture = user_info.get('picture')
    
    # Check if user exists by google_id OR email (important for admin!)
    user = db.query(User).filter(
        (User.google_id == google_id) | (User.email == email)
    ).first()
    
    if user:
        # Update existing user's google_id and profile picture if missing
        if not user.google_id or user.google_id != google_id:
            user.google_id = google_id
        if not user.profile_picture:
            user.profile_picture = profile_picture
        db.commit()
        db.refresh(user)
    else:
        # Create new worker account
        user = User(
            email=email,
            full_name=full_name,
            google_id=google_id,
            profile_picture=profile_picture,
            role=UserRole.WORKER
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Store/update fitness connection
    fitness_conn = db.query(FitnessConnection).filter(
        FitnessConnection.user_id == user.id
    ).first()
    
    if fitness_conn:
        # Update existing connection
        fitness_conn.access_token = credentials.token
        fitness_conn.refresh_token = credentials.refresh_token or fitness_conn.refresh_token
        fitness_conn.token_expiry = credentials.expiry
        fitness_conn.scopes = credentials.scopes
        fitness_conn.is_active = True
    else:
        # Create new connection
        fitness_conn = FitnessConnection(
            user_id=user.id,
            access_token=credentials.token,
            refresh_token=credentials.refresh_token,
            token_expiry=credentials.expiry,
            scopes=credentials.scopes
        )
        db.add(fitness_conn)
    
    db.commit()
    
    # Create JWT token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # Redirect to login with token
    frontend_url = "http://localhost:5173"
    redirect_url = f"{frontend_url}/login?token={access_token}&fitness=connected"
    
    return RedirectResponse(url=redirect_url)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current logged-in user info"""
    return current_user

@router.get("/google/status")
async def check_fitness_connection(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if current user has Google Fit connected"""
    connection = db.query(FitnessConnection).filter(
        FitnessConnection.user_id == current_user.id,
        FitnessConnection.is_active == True
    ).first()
    
    return {
        "connected": connection is not None,
        "connected_at": connection.connected_at if connection else None,
        "last_synced_at": connection.last_synced_at if connection else None
    }

@router.delete("/google/disconnect")
async def disconnect_google_fit(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disconnect Google Fit for current user"""
    connection = db.query(FitnessConnection).filter(
        FitnessConnection.user_id == current_user.id
    ).first()
    
    if connection:
        connection.is_active = False
        db.commit()
        return {"message": "Google Fit disconnected successfully"}
    
    raise HTTPException(status_code=404, detail="No active connection found")