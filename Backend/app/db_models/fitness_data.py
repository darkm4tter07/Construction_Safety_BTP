from sqlalchemy import Column, Integer, Float, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class FitnessData(Base):
    __tablename__ = "fitness_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    
    # Activity metrics
    steps = Column(Integer, default=0)
    distance_meters = Column(Float, default=0.0)
    calories = Column(Integer, default=0)
    active_minutes = Column(Integer, default=0)
    
    # Heart rate metrics
    heart_rate_avg = Column(Integer, nullable=True)
    heart_rate_max = Column(Integer, nullable=True)
    heart_rate_resting = Column(Integer, nullable=True)
    
    # Sleep data
    sleep_hours = Column(Float, nullable=True)
    
    # Metadata
    sync_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship to User
    user = relationship("User", backref="fitness_data")
    
    # Ensure one record per user per day
    __table_args__ = (
        UniqueConstraint('user_id', 'date', name='unique_user_date'),
    )