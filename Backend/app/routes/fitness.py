import os

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from datetime import datetime, date
from uuid import UUID

from app.database import get_db
from app.db_models import User, FitnessConnection, FitnessData
from app.utils.security import get_current_user
from app.core.config import settings
from app.utils.security import get_current_user, get_current_admin_user
from app.db_models import User, UserRole, FitnessConnection

router = APIRouter()

def get_fitness_service(user: User, db: Session):
    """Get Google Fit service for user"""
    fitness_conn = db.query(FitnessConnection).filter(
        FitnessConnection.user_id == user.id,
        FitnessConnection.is_active == True
    ).first()
    
    if not fitness_conn:
        raise HTTPException(status_code=401, detail="Google Fit not connected")
    
    credentials = Credentials(
        token=fitness_conn.access_token,
        refresh_token=fitness_conn.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET
    )
    
    return build('fitness', 'v1', credentials=credentials)

# Helper function to handle the actual syncing logic
def sync_user_fitness(user: User, db: Session):
    try:
        service = get_fitness_service(user, db)
    except HTTPException:
        # User not connected, return whatever is in DB or 0
        return None

    now = datetime.now()
    start_time = int(datetime(now.year, now.month, now.day).timestamp() * 1000000000)
    end_time = int(now.timestamp() * 1000000000)
    
    # Fetch steps
    try:
        steps_data = service.users().dataSources().datasets().get(
            userId='me',
            dataSourceId='derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
            datasetId=f"{start_time}-{end_time}"
        ).execute()
        total_steps = sum(point['value'][0]['intVal'] for point in steps_data.get('point', []))
    except Exception as e:
        print(f"🚨 Steps API Error for {user.email}: {e}")
        total_steps = 0
        
    # Fetch heart rate
    try:
        heart_data = service.users().dataSources().datasets().get(
            userId='me',
            dataSourceId='derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
            datasetId=f"{start_time}-{end_time}"
        ).execute()
        heart_rates = [point['value'][0]['fpVal'] for point in heart_data.get('point', [])]
        avg_heart_rate = int(sum(heart_rates) / len(heart_rates)) if heart_rates else 0
    except Exception as e:
        avg_heart_rate = 0
        
    # Fetch calories
    try:
        calories_data = service.users().dataSources().datasets().get(
            userId='me',
            dataSourceId='derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
            datasetId=f"{start_time}-{end_time}"
        ).execute()
        total_calories = int(sum(point['value'][0]['fpVal'] for point in calories_data.get('point', [])))
    except Exception as e:
        total_calories = 0
        
    # Store/update in database
    today = date.today()
    fitness_data = db.query(FitnessData).filter(
        FitnessData.user_id == user.id,
        FitnessData.date == today
    ).first()
    
    if fitness_data:
        fitness_data.steps = total_steps
        fitness_data.heart_rate_avg = avg_heart_rate
        fitness_data.calories = total_calories
        fitness_data.sync_timestamp = datetime.now()
    else:
        fitness_data = FitnessData(
            user_id=user.id,
            date=today,
            steps=total_steps,
            heart_rate_avg=avg_heart_rate,
            calories=total_calories
        )
        db.add(fitness_data)
    
    db.commit()
    db.refresh(fitness_data)
    return fitness_data

@router.get("/summary")
async def get_fitness_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get today's fitness summary for current user"""
    sync_user_fitness(current_user, db) # Force live sync
    
    today = date.today()
    fitness_data = db.query(FitnessData).filter(
        FitnessData.user_id == current_user.id,
        FitnessData.date == today
    ).first()
    
    return {
        "steps": fitness_data.steps if fitness_data else 0,
        "heart_rate": fitness_data.heart_rate_avg if fitness_data else 0,
        "calories": fitness_data.calories if fitness_data else 0,
        "date": today.strftime("%Y-%m-%d")
    }

@router.get("/connected-workers")
async def get_connected_workers(
    current_user: User = Depends(get_current_admin_user),  # Only admin can see all workers
    db: Session = Depends(get_db)
):
    """Get list of all workers connected to Google Fit (admin only)"""
    
    # Query all users who have active fitness connections
    workers = db.query(User).join(FitnessConnection).filter(
        FitnessConnection.is_active == True,
        User.role == UserRole.WORKER
    ).all()
    
    today = date.today()
    connected_workers = []
    
    for worker in workers:
        # 1. Force a live sync with Google Fit for this specific worker
        sync_user_fitness(worker, db)
        
        # 2. Grab their connection details
        fitness_conn = db.query(FitnessConnection).filter(
            FitnessConnection.user_id == worker.id,
            FitnessConnection.is_active == True
        ).first()
        
        # 3. Grab their freshly synced fitness data for today
        fitness_data = db.query(FitnessData).filter(
            FitnessData.user_id == worker.id,
            FitnessData.date == today
        ).first()
        
        # 4. Append EVERYTHING to the response (including the missing metrics!)
        connected_workers.append({
            "id": str(worker.id),
            "email": worker.email,
            "full_name": worker.full_name,
            "profile_picture": worker.profile_picture,
            "employee_id": worker.employee_id,
            "connected_at": fitness_conn.connected_at,
            "last_synced_at": fitness_conn.last_synced_at,
            # NEW: Send the metrics to the frontend
            "steps": fitness_data.steps if fitness_data else 0,
            "heart_rate": fitness_data.heart_rate_avg if fitness_data else 0,
            "calories": fitness_data.calories if fitness_data else 0
        })
    
    return {
        "total_connected": len(connected_workers),
        "workers": connected_workers
    }

@router.get("/summary/{user_id}")
async def get_worker_fitness_summary(
    user_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get today's fitness summary for a specific worker (Admin only)"""
    worker = db.query(User).filter(
        User.id == user_id,
        User.role == UserRole.WORKER
    ).first()

    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Force live sync using the helper function!
    sync_user_fitness(worker, db)

    today = date.today()
    fitness_data = db.query(FitnessData).filter(
        FitnessData.user_id == user_id,
        FitnessData.date == today
    ).first()

    return {
        "steps": fitness_data.steps if fitness_data else 0,
        "heart_rate": fitness_data.heart_rate_avg if fitness_data else 0,
        "calories": fitness_data.calories if fitness_data else 0,
        "date": today.strftime("%Y-%m-%d")
    }

@router.get("/users/{user_id}")
async def get_user_by_id(
    user_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "employee_id": user.employee_id,
        "role": user.role,
        "profile_picture": user.profile_picture
    }