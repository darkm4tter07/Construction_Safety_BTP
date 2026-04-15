from typing import Optional
from datetime import datetime


class WorkerTrackingService:
    def __init__(self, lost_frame_threshold: int = 30):
        # track_id -> worker info mapping
        self.track_to_worker: dict = {}
        
        # track_id -> consecutive frames where track was missing
        self.lost_frame_counts: dict = {}
        
        # track_id -> last seen bbox (for modal snapshot)
        self.track_bboxes: dict = {}
        
        # How many consecutive missing frames before we consider track lost
        self.lost_frame_threshold = lost_frame_threshold
        
        # Workers who left frame: track_id -> worker info (for notification)
        self.recently_left: dict = {}

    # ------------------------------------------------------------------
    # ASSIGNMENT
    # ------------------------------------------------------------------

    def assign_worker(self, track_id: int, worker: dict) -> bool:
        """
        Link a track_id to a worker.
        worker dict must have: worker_id, google_id, name, profile_picture, role
        """
        if track_id not in self.track_bboxes:
            # track_id doesn't exist in current frame, reject
            return False
        
        self.track_to_worker[track_id] = {
            **worker,
            "assigned_at": datetime.utcnow().isoformat()
        }
        # Clear from recently_left if they were there
        self.recently_left.pop(track_id, None)
        return True

    def unassign_track(self, track_id: int):
        self.track_to_worker.pop(track_id, None)

    # ------------------------------------------------------------------
    # FRAME UPDATE — call this every frame with current detections
    # ------------------------------------------------------------------

    def update_tracks(self, detections: list) -> dict:
        """
        Call every frame with YOLO detections.
        Returns a dict with:
        - active_tracks: current track_id -> {bbox, worker or None}
        - lost_workers: workers who just crossed the lost threshold
        - new_untracked: track_ids that are new and have no worker assigned
        """
        current_track_ids = set()

        person_detections = [d for d in detections if d.get("class_id") == 5]

        # Update bboxes for all currently visible tracks
        for det in person_detections:
            track_id = det.get("track_id")
            if track_id is None:
                continue
            current_track_ids.add(track_id)
            self.track_bboxes[track_id] = det["bbox"]
            # Reset lost counter since they're visible
            self.lost_frame_counts.pop(track_id, None)

        # Check previously known tracks that are missing this frame
        lost_workers = []
        all_known_track_ids = set(self.track_bboxes.keys())
        missing_track_ids = all_known_track_ids - current_track_ids

        for track_id in missing_track_ids:
            self.lost_frame_counts[track_id] = self.lost_frame_counts.get(track_id, 0) + 1

            if self.lost_frame_counts[track_id] >= self.lost_frame_threshold:
                # Track is officially lost
                worker_info = self.track_to_worker.get(track_id)
                if worker_info:
                    self.recently_left[track_id] = worker_info
                    lost_workers.append({
                        "track_id": track_id,
                        "worker": worker_info
                    })
                # Clean up
                self.track_to_worker.pop(track_id, None)
                self.track_bboxes.pop(track_id, None)
                self.lost_frame_counts.pop(track_id, None)

        # New untracked: visible but no worker assigned
        new_untracked = [
            track_id for track_id in current_track_ids
            if track_id not in self.track_to_worker
        ]

        # Build active tracks response
        active_tracks = {}
        for track_id in current_track_ids:
            active_tracks[track_id] = {
                "bbox": self.track_bboxes.get(track_id),
                "worker": self.track_to_worker.get(track_id, None)
            }

        return {
            "active_tracks": active_tracks,
            "lost_workers": lost_workers,
            "new_untracked": new_untracked
        }

    # ------------------------------------------------------------------
    # GETTERS — used by HTTP routes
    # ------------------------------------------------------------------

    def get_all_mappings(self) -> dict:
        return {
            str(track_id): {
                "bbox": self.track_bboxes.get(track_id),
                "worker": worker
            }
            for track_id, worker in self.track_to_worker.items()
        }

    def get_assignable_tracks(self) -> list:
        """Returns tracks visible in frame that have no worker assigned yet"""
        return [
            {
                "track_id": track_id,
                "bbox": self.track_bboxes[track_id]
            }
            for track_id in self.track_bboxes
            if track_id not in self.track_to_worker
        ]

    def get_assigned_worker_ids(self) -> list:
        """Returns list of worker_ids already assigned, so frontend can grey them out"""
        return [w["worker_id"] for w in self.track_to_worker.values()]

    def reset(self):
        self.track_to_worker.clear()
        self.lost_frame_counts.clear()
        self.track_bboxes.clear()
        self.recently_left.clear()


# Singleton instance — import this everywhere
worker_tracking_service = WorkerTrackingService(lost_frame_threshold=60)