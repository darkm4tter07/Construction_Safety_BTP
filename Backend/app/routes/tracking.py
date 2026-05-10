from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.db_models.user import User, UserRole
from app.services.worker_tracking_service import worker_tracking_service

router = APIRouter(prefix="/tracking", tags=["Tracking"])


# ------------------------------------------------------------------
# SCHEMAS
# ------------------------------------------------------------------

class AssignWorkerRequest(BaseModel):
    track_id: int
    worker_id: str        # UUID as string
    google_id: str
    name: str
    profile_picture: Optional[str] = None
    role: str = "worker"  # worker, supervisor, not_worker

class UnassignRequest(BaseModel):
    track_id: int


# ------------------------------------------------------------------
# ROUTES
# ------------------------------------------------------------------

@router.get("/active")
def get_active_tracks():
    """
    Returns all currently visible track_ids with their
    bounding boxes and assigned worker info (if any).
    Used by frontend modal to render clickable bounding boxes.
    """
    return {
        "mappings": worker_tracking_service.get_all_mappings(),
        "assignable_tracks": worker_tracking_service.get_assignable_tracks(),
        "assigned_worker_ids": worker_tracking_service.get_assigned_worker_ids()
    }


@router.get("/workers")
def get_assignable_workers(db: Session = Depends(get_db)):
    """
    Returns list of all active workers from DB.
    Used to populate the dropdown in the assignment modal.
    Already assigned workers are flagged so frontend can grey them out.
    """
    users = db.query(User).filter(
        User.is_active == True,
        User.role == UserRole.WORKER
    ).all()

    assigned_ids = worker_tracking_service.get_assigned_worker_ids()

    return {
        "workers": [
            {
                "worker_id": str(u.id),
                "google_id": u.google_id,
                "name": u.full_name,
                "profile_picture": u.profile_picture,
                "employee_id": u.employee_id,
                "role": u.role.value,
                "already_assigned": str(u.id) in assigned_ids
            }
            for u in users
        ]
    }


@router.post("/assign")
def assign_worker(payload: AssignWorkerRequest):
    """
    Links a track_id to a worker.
    Called when admin clicks a bounding box and selects a worker.
    Returns 400 if track_id is not currently visible in frame.
    """
    success = worker_tracking_service.assign_worker(
        track_id=payload.track_id,
        worker={
            "worker_id": payload.worker_id,
            "google_id": payload.google_id,
            "name": payload.name,
            "profile_picture": payload.profile_picture,
            "role": payload.role
        }
    )
    if not success:
        raise HTTPException(
            status_code=400,
            detail=f"track_id {payload.track_id} is not currently visible in frame. Reopen the modal and try again."
        )
    return {"status": "assigned", "track_id": payload.track_id, "worker": payload.name}


@router.post("/unassign")
def unassign_worker(payload: UnassignRequest):
    """
    Removes the worker assignment from a track_id.
    Useful if admin made a wrong assignment.
    """
    worker_tracking_service.unassign_track(payload.track_id)
    return {"status": "unassigned", "track_id": payload.track_id}


@router.post("/reset")
def reset_tracking():
    """
    Clears all track assignments.
    Same as sending reset_tracking over WebSocket but via HTTP.
    """
    worker_tracking_service.reset()
    return {"status": "reset"}