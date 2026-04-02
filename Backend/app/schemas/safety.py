from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID

# ============================================
# Safety Session Schemas
# ============================================

class SafetySessionBase(BaseModel):
    started_at: datetime
    ended_at: Optional[datetime] = None

class SafetySessionCreate(SafetySessionBase):
    pass

class SafetySessionResponse(SafetySessionBase):
    id: UUID
    admin_id: UUID
    total_frames_analyzed: int
    total_violations: int
    avg_compliance_rate: Optional[float]
    avg_rula_score: Optional[float]
    avg_reba_score: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================
# Safety Event Schemas
# ============================================

class SafetyEventBase(BaseModel):
    event_type: str
    severity: str
    title: str
    message: str
    worker_id: Optional[UUID] = None
    metadata: Optional[Dict[str, Any]] = None

class SafetyEventCreate(SafetyEventBase):
    timestamp: datetime

class SafetyEventResponse(SafetyEventBase):
    id: UUID
    session_id: UUID
    timestamp: datetime
    resolved_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================
# Export/Report Schemas
# ============================================

class SessionStartResponse(BaseModel):
    session_id: UUID
    started_at: datetime
    message: Optional[str] = None

class SessionStopResponse(BaseModel):
    session_id: UUID
    duration: float  # seconds
    total_events: int
    total_violations: int

class EventLogResponse(BaseModel):
    event_id: UUID
    
class DailySummary(BaseModel):
    date: datetime
    total_sessions: int
    total_events: int
    ppe_violations: int
    ergonomic_alerts: int
    health_alerts: int
    environmental_alerts: int