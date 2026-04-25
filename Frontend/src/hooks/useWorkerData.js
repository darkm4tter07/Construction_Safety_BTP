import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AUTH_URL as API_URL } from '../Constant';
import { supabase, uploadProfilePhotoToStorage } from '../utils/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export const useWorkerData = (user, id, isAdminView) => {
  const [fitnessData, setFitnessData] = useState(null);
  const [fitnessConnected, setFitnessConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const { setUser } = useAuth();

  const targetId = isAdminView ? id : user?.id;

  const loadProfile = useCallback(async () => {
    if (!user || !targetId) return;
    if(!isAdminView) {
      setProfileUser(user);
      setWorkerProfile(user.profile);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/profile/${targetId}`);
      setProfileUser(res.data);
      setWorkerProfile(res.data.profile);
    } catch (err) {
      toast.error('Failed to load profile');
      console.error('Failed to load profile:', err);
      if (!isAdminView) setProfileUser(user);
    }
  }, [user, targetId, isAdminView]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!user) return;
    const checkFitnessConnection = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/google/status`);
        setFitnessConnected(response.data.connected);
        if (response.data.connected) {
          fetchFitnessData();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to check fitness connection:', error);
        setLoading(false);
      }
    };
    if (isAdminView) {
      fetchFitnessData();
    } else {
      checkFitnessConnection();
    }
  }, [user, id, isAdminView]);

  const fetchFitnessData = async () => {
    setLoading(true);
    try {
      const url = isAdminView
        ? `${API_URL}/fitness/summary/${id}`
        : `${API_URL}/fitness/summary`;
      const response = await axios.get(url);
      if (response.data?.needs_reauth) {
        setNeedsReauth(true);
        setFitnessData(null);
      } else {
        setFitnessData(response.data);
        setNeedsReauth(false);
      }
    }  catch (error) {
      if (error?.response?.status === 401) {
        setNeedsReauth(true);
      } else {
        toast.error('Failed to fetch fitness data');
      }
    }finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data) => {
    setProfileLoading(true);
    try {
      const res = await axios.put(`${API_URL}/profile/${targetId}`, data);
      setWorkerProfile(res.data);
      setUser(prev => ({
        ...prev,
        profile: res.data,
      }));
      toast.success('Profile updated');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
      return { success: false };
    } finally {
      setProfileLoading(false);
    }
  };

  const uploadProfilePhoto = async (file) => {
    setPhotoUploading(true);
    try {
      const publicUrl = await uploadProfilePhotoToStorage(file, targetId);

      await updateProfile({ profile_photo_url: publicUrl });

      setWorkerProfile(prev => ({
        ...prev,
        profile_photo_url: publicUrl,
      }));

      setUser(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          profile_photo_url: publicUrl,
        },
      }));

      toast.success('Photo updated');

      return { success: true, url: publicUrl };
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Photo upload failed');
      return { success: false };
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleConnectFitness = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/google/login`);
      window.location.href = response.data.authorization_url;
    } catch {
      toast.error('Failed to connect. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Google Fit?')) return;
    try {
      await axios.delete(`${API_URL}/auth/google/disconnect`);
      setFitnessConnected(false);
      setFitnessData(null);
      toast.success('Google Fit disconnected');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const handleAdminDisconnect = async () => {
    if (!window.confirm(`Disconnect Google Fit for ${profileUser?.full_name}?`)) return;
    try {
      await axios.delete(`${API_URL}/auth/google/disconnect`);
      setFitnessData(null);
      toast.success('Disconnected');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const getBMI = () => {
    if (!workerProfile?.height_cm || !workerProfile?.weight_kg) return null;
    const heightM = workerProfile.height_cm / 100;
    const bmi = workerProfile.weight_kg / (heightM * heightM);
    return bmi.toFixed(1);
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400' };
    if (bmi < 25) return { label: 'Normal', color: 'text-green-400' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-400' };
    return { label: 'Obese', color: 'text-red-400' };
  };

  return {
    profileUser,
    workerProfile,
    fitnessData,
    fitnessConnected,
    loading,
    profileLoading,
    photoUploading,
    needsReauth,
    fetchFitnessData,
    updateProfile,
    uploadProfilePhoto,
    loadProfile,
    getBMI,
    getBMICategory,
    handleConnectFitness,
    handleDisconnect,
    handleAdminDisconnect,
  };
};