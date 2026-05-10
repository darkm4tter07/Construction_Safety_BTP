import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AI_URL } from "../Constant";
import { wsStore } from "../store/wsStore";

export function useWorkerTracking() {
  const [activeTracks, setActiveTracks] = useState({});
  const [assignableTracks, setAssignableTracks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [assignedWorkerIds, setAssignedWorkerIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // ------------------------------------------------------------------
  // Fetch current tracks + worker list — call when modal opens
  // ------------------------------------------------------------------
  const fetchTrackingData = useCallback(async () => {
    setLoading(true);

    // Pre-populate from wsStore immediately so canvas renders
    const liveTracks = wsStore.activeTracks || {};
    if (Object.keys(liveTracks).length > 0) {
      setActiveTracks(liveTracks);
      setAssignableTracks(
        Object.keys(liveTracks)
          .filter(id => !liveTracks[id]?.worker)
          .map(id => ({ track_id: parseInt(id), bbox: liveTracks[id].bbox }))
      );
    }

    try {
      const [activeRes, workersRes] = await Promise.all([
        axios.get(`${AI_URL}/tracking/active`),
        axios.get(`${AI_URL}/tracking/workers`),
      ]);

      const apiTracks = activeRes.data.mappings || {};

      // Use API tracks if available, otherwise keep wsStore tracks
      const finalTracks = Object.keys(apiTracks).length > 0 ? apiTracks : liveTracks;

      setActiveTracks(finalTracks);
      setAssignableTracks(
        Object.keys(finalTracks)
          .filter(id => !finalTracks[id]?.worker)
          .map(id => ({ track_id: parseInt(id), bbox: finalTracks[id].bbox }))
      );
      setAssignedWorkerIds(activeRes.data.assigned_worker_ids || []);
      setWorkers(workersRes.data.workers || []);
    } catch (err) {
      console.error("Failed to fetch tracking data:", err);
      toast.error("Failed to load tracking data");
    } finally {
      setLoading(false);
    }
  }, []);

  // ------------------------------------------------------------------
  // Assign a worker to a track_id
  // ------------------------------------------------------------------
  const assignWorker = useCallback(async (trackId, worker) => {
    try {
      await axios.post(`${AI_URL}/tracking/assign`, {
        track_id: trackId,
        worker_id: worker.worker_id,
        google_id: worker.google_id,
        name: worker.name,
        profile_picture: worker.profile_picture,
        role: worker.role,
      });

      // Update local state immediately so modal reflects change
      setActiveTracks((prev) => ({
        ...prev,
        [trackId]: {
          ...prev[trackId],
          worker: {
            worker_id: worker.worker_id,
            google_id: worker.google_id,
            name: worker.name,
            profile_picture: worker.profile_picture,
            role: worker.role,
          },
        },
      }));

      // Mark worker as assigned in dropdown
      setAssignedWorkerIds((prev) => [...prev, worker.worker_id]);

      // Remove from assignable tracks
      setAssignableTracks((prev) =>
        prev.filter((t) => t.track_id !== trackId)
      );

      toast.success(`${worker.name} assigned to Person #${trackId}`);
    } catch (err) {
      const msg = err.response?.data?.detail || "Assignment failed";
      toast.error(msg);
    }
  }, []);

  // ------------------------------------------------------------------
  // Unassign a track
  // ------------------------------------------------------------------
  const unassignWorker = useCallback(async (trackId) => {
    try {
      const workerName = activeTracks[trackId]?.worker?.name;
      await axios.post(`${AI_URL}/tracking/unassign`, { track_id: trackId });

      // Update local state
      setActiveTracks((prev) => ({
        ...prev,
        [trackId]: { ...prev[trackId], worker: null },
      }));

      // Add back to assignable
      setAssignableTracks((prev) => [
        ...prev,
        { track_id: trackId, bbox: activeTracks[trackId]?.bbox },
      ]);

      // Remove from assigned worker ids
      const workerId = activeTracks[trackId]?.worker?.worker_id;
      if (workerId) {
        setAssignedWorkerIds((prev) => prev.filter((id) => id !== workerId));
      }

      toast.success(`${workerName || "Person #" + trackId} unassigned`);
    } catch (err) {
      toast.error("Failed to unassign");
    }
  }, [activeTracks]);

  // ------------------------------------------------------------------
  // Reset all tracking
  // ------------------------------------------------------------------
  const resetTracking = useCallback(async () => {
    try {
      await axios.post(`${AI_URL}/tracking/reset`);
      setActiveTracks({});
      setAssignableTracks([]);
      setAssignedWorkerIds([]);
      toast.success("Tracking reset");
    } catch (err) {
      toast.error("Failed to reset tracking");
    }
  }, []);

  return {
    activeTracks,
    assignableTracks,
    workers,
    assignedWorkerIds,
    loading,
    fetchTrackingData,
    assignWorker,
    unassignWorker,
    resetTracking,
  };
}