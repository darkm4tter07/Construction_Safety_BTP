from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from datetime import datetime, date

from app.database import get_db
from app.db_models import User, FitnessConnection, FitnessData
from app.utils.security import get_current_user

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
        client_id="YOUR_CLIENT_ID",  # Will add from settings
        client_secret="YOUR_CLIENT_SECRET"
    )
    
    return build('fitness', 'v1', credentials=credentials)

@router.get("/summary")
async def get_fitness_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get today's fitness summary for current user"""
    service = get_fitness_service(current_user, db)
    
    # Get today's data
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
    except:
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
    except:
        avg_heart_rate = 0
    
    # Fetch calories
    try:
        calories_data = service.users().dataSources().datasets().get(
            userId='me',
            dataSourceId='derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
            datasetId=f"{start_time}-{end_time}"
        ).execute()
        total_calories = int(sum(point['value'][0]['fpVal'] for point in calories_data.get('point', [])))
    except:
        total_calories = 0
    
    # Store/update in database
    today = date.today()
    fitness_data = db.query(FitnessData).filter(
        FitnessData.user_id == current_user.id,
        FitnessData.date == today
    ).first()
    
    if fitness_data:
        fitness_data.steps = total_steps
        fitness_data.heart_rate_avg = avg_heart_rate
        fitness_data.calories = total_calories
        fitness_data.sync_timestamp = datetime.now()
    else:
        fitness_data = FitnessData(
            user_id=current_user.id,
            date=today,
            steps=total_steps,
            heart_rate_avg=avg_heart_rate,
            calories=total_calories
        )
        db.add(fitness_data)
    
    db.commit()
    
    return {
        "steps": total_steps,
        "heart_rate": avg_heart_rate,
        "calories": total_calories,
        "date": today.strftime("%Y-%m-%d")
    }