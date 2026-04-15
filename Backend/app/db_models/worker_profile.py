from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Date, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey
import uuid
import enum
from app.database import Base

class BloodGroup(str, enum.Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"
    UNKNOWN = "unknown"

class FitnessStatus(str, enum.Enum):
    CLEARED = "cleared"
    RESTRICTED = "restricted"
    UNFIT = "unfit"
    PENDING = "pending"

class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class DominantHand(str, enum.Enum):
    LEFT = "left"
    RIGHT = "right"
    AMBIDEXTROUS = "ambidextrous"

class WorkerProfile(Base):
    __tablename__ = "worker_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)

    # Personal
    gender = Column(SQLEnum(Gender), nullable=True)
    age = Column(Integer, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    blood_group = Column(SQLEnum(BloodGroup), nullable=True, default=BloodGroup.UNKNOWN)
    dominant_hand = Column(SQLEnum(DominantHand), nullable=True)
    identification_mark = Column(String(255), nullable=True)
    profile_photo_url = Column(String(500), nullable=True)  # Supabase Storage URL

    # Health
    major_illness = Column(Text, nullable=True)
    disability = Column(Text, nullable=True)
    known_allergies = Column(Text, nullable=True)
    medications = Column(Text, nullable=True)  # medications affecting alertness
    last_medical_checkup = Column(Date, nullable=True)
    fitness_status = Column(SQLEnum(FitnessStatus), nullable=False, default=FitnessStatus.PENDING)

    # Work
    designation = Column(String(100), nullable=True)
    experience_years = Column(Float, nullable=True)
    zone_assignment = Column(String(100), nullable=True)
    certifications = Column(JSONB, default=list)  # list of cert names
    date_joined = Column(Date, nullable=True)

    # Emergency
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    emergency_contact_relation = Column(String(50), nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship
    user = relationship("User", back_populates="worker_profile")