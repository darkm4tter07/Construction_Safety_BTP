from sqlalchemy import Column, Integer, Float, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.database import Base

class CognitiveResult(str, enum.Enum):
    FIT = "fit"
    SUPERVISION_REQUIRED = "supervision_required"
    UNFIT = "unfit"

class CognitiveAssessment(Base):
    __tablename__ = "cognitive_assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    # Scores
    score = Column(Integer, nullable=False)  # 0-100 overall
    reaction_time_ms = Column(Float, nullable=True)
    memory_score = Column(Integer, nullable=True)   # 0-20
    attention_score = Column(Integer, nullable=True) # 0-20
    spatial_score = Column(Integer, nullable=True)   # 0-20
    knowledge_score = Column(Integer, nullable=True) # 0-20

    # Raw answers stored for audit
    answers = Column(JSONB, nullable=True)

    # Result
    result = Column(SQLEnum(CognitiveResult), nullable=False)

    # Validity
    taken_at = Column(DateTime(timezone=True), server_default=func.now())
    valid_until = Column(DateTime(timezone=True), nullable=True)  # 30 days from taken_at

    # Relationship
    user = relationship("User", back_populates="cognitive_assessments")