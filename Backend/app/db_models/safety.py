from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, DECIMAL, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.database import Base

class SafetySession(Base):
    __tablename__ = "safety_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    total_frames_analyzed = Column(Integer, default=0)
    total_violations = Column(Integer, default=0)
    avg_compliance_rate = Column(DECIMAL(5, 2), nullable=True)
    avg_rula_score = Column(DECIMAL(3, 1), nullable=True)
    avg_reba_score = Column(DECIMAL(3, 1), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    admin = relationship("User", back_populates="safety_sessions")
    events = relationship("SafetyEvent", back_populates="session", cascade="all, delete-orphan")


class SafetyEvent(Base):
    __tablename__ = "safety_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("safety_sessions.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    event_type = Column(String(50), nullable=False)  # 'PPE_VIOLATION', 'ERGONOMIC_ALERT', etc.
    severity = Column(String(20), nullable=False)  # 'high', 'medium', 'low'
    worker_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    metadata = Column(JSONB, nullable=True)  # Store RULA scores, heart rate, etc.
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("SafetySession", back_populates="events")
    worker = relationship("User", foreign_keys=[worker_id])