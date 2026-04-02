import { useState, useEffect } from 'react';
import axios from 'axios';
import { AUTH_URL as API_URL } from '../Constant';

export const useWorkerData = (user, id, isAdminView) => {
  const [fitnessData, setFitnessData] = useState(null);
  const [fitnessConnected, setFitnessConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    const loadProfile = async () => {
      try {
        if (isAdminView) {
          const res = await axios.get(`${API_URL}/fitness/users/${id}`);
          setProfileUser(res.data);
        } else {
          setProfileUser(user);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    
    loadProfile();
  }, [user, id, isAdminView]);

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
      setFitnessData(response.data);
    } catch (error) {
      console.error('Failed to fetch fitness data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectFitness = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/google/login`);
      window.location.href = response.data.authorization_url;
    } catch (error) {
      alert('Failed to connect. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Fit?')) return;
    try {
      await axios.delete(`${API_URL}/auth/google/disconnect`);
      setFitnessConnected(false);
      setFitnessData(null);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  return {
    profileUser,
    fitnessData,
    fitnessConnected,
    loading,
    fetchFitnessData,
    handleConnectFitness,
    handleDisconnect,
  };
};