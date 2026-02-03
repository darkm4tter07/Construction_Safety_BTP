import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const WorkerProfile = () => {
  const { user, logout, login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [fitnessData, setFitnessData] = useState(null);
  const [fitnessConnected, setFitnessConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:8000';

  // Handle token from URL (after OAuth redirect)
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token);
      navigate('/worker/profile', { replace: true });
    }
  }, [searchParams, login, navigate]);

  useEffect(() => {
    if (user) {
      checkFitnessConnection();
    }
  }, [user]);

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

  const fetchFitnessData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/fitness/summary`);
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
      console.error('Failed to connect fitness:', error);
      alert('Failed to connect. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Fit?')) return;
    
    try {
      await axios.delete(`${API_URL}/auth/google/disconnect`);
      setFitnessConnected(false);
      setFitnessData(null);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className='bg-black min-h-screen max-h-screen w-full flex flex-col text-white overflow-hidden'>
      {/* Header */}
      <header className='w-full border-b-2 border-[#ffffff31]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4'>
          <div className='flex items-center gap-4'>
            {user?.profile_picture && (
              <img 
                src={user.profile_picture} 
                alt="Profile" 
                className="w-12 h-12 rounded-full border-2 border-blue-500"
              />
            )}
            <div className='text-center sm:text-left'>
              <h1 className='text-2xl sm:text-3xl font-bold opacity-85'>Worker Profile</h1>
              <p className='text-sm text-gray-400'>Welcome, {user?.full_name}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className='flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto'>
        {/* Profile Info Card */}
        <div className='bg-[#1a1a1a] rounded-lg border border-[#ffffff1a] p-6 mb-6'>
          <h2 className='text-xl font-bold mb-4 opacity-85'>Profile Information</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium text-gray-400'>Email</label>
              <p className='text-white mt-1'>{user?.email}</p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-400'>Full Name</label>
              <p className='text-white mt-1'>{user?.full_name}</p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-400'>Employee ID</label>
              <p className='text-white mt-1'>{user?.employee_id || 'Not set'}</p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-400'>Role</label>
              <p className='text-white mt-1 capitalize'>{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Fitness Section */}
        <div className='bg-[#1a1a1a] rounded-lg border border-[#ffffff1a] p-6'>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
            <h2 className='text-xl font-bold opacity-85'>My Fitness Metrics</h2>
            {fitnessConnected && (
              <div className='flex flex-wrap gap-2'>
                <button
                  onClick={fetchFitnessData}
                  className='text-blue-400 hover:text-blue-300 font-medium text-sm flex items-center gap-1 px-3 py-2 border border-blue-500 rounded-lg hover:bg-blue-500 hover:bg-opacity-10 transition'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
                  </svg>
                  Refresh
                </button>
                <button
                  onClick={handleDisconnect}
                  className='text-red-400 hover:text-red-300 font-medium text-sm px-3 py-2 border border-red-500 rounded-lg hover:bg-red-500 hover:bg-opacity-10 transition'
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
              <span className='ml-3 text-gray-400'>Loading...</span>
            </div>
          ) : !fitnessConnected ? (
            <div className='text-center py-12'>
              <div className='text-6xl mb-4'>⌚</div>
              <h3 className='text-lg font-semibold mb-2'>
                Connect Your Fitness Device
              </h3>
              <p className='text-gray-400 mb-6 max-w-md mx-auto'>
                Track your health metrics by connecting Google Fit to monitor your activity and wellness
              </p>
              <button
                onClick={handleConnectFitness}
                className='bg-white hover:opacity-85 hover:shadow-lg text-black font-semibold py-3 px-8 rounded-lg transition duration-200 inline-flex items-center gap-2'
              >
                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/>
                  <path d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/>
                  <path d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/>
                  <path d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/>
                </svg>
                Connect Google Fit
              </button>
            </div>
          ) : fitnessData ? (
            <div>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {/* Steps Card */}
                <div className='bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-6 border border-blue-700'>
                  <div className='flex items-center justify-between mb-3'>
                    <span className='text-4xl'>👟</span>
                    <span className='text-xs text-blue-300 font-medium bg-blue-700 bg-opacity-50 px-2 py-1 rounded'>STEPS</span>
                  </div>
                  <div className='text-4xl font-bold mb-2'>
                    {fitnessData.steps.toLocaleString()}
                  </div>
                  <div className='text-sm text-blue-200'>Daily movement</div>
                </div>

                {/* Heart Rate Card */}
                <div className='bg-gradient-to-br from-red-900 to-red-800 rounded-lg p-6 border border-red-700'>
                  <div className='flex items-center justify-between mb-3'>
                    <span className='text-4xl'>❤️</span>
                    <span className='text-xs text-red-300 font-medium bg-red-700 bg-opacity-50 px-2 py-1 rounded'>BPM</span>
                  </div>
                  <div className='text-4xl font-bold mb-2'>
                    {fitnessData.heart_rate || 'N/A'}
                  </div>
                  <div className='text-sm text-red-200'>Avg heart rate</div>
                </div>

                {/* Calories Card */}
                <div className='bg-gradient-to-br from-orange-900 to-orange-800 rounded-lg p-6 border border-orange-700 sm:col-span-2 lg:col-span-1'>
                  <div className='flex items-center justify-between mb-3'>
                    <span className='text-4xl'>🔥</span>
                    <span className='text-xs text-orange-300 font-medium bg-orange-700 bg-opacity-50 px-2 py-1 rounded'>KCAL</span>
                  </div>
                  <div className='text-4xl font-bold mb-2'>
                    {fitnessData.calories}
                  </div>
                  <div className='text-sm text-orange-200'>Calories burned</div>
                </div>
              </div>

              <div className='mt-6 text-xs text-gray-500 text-center'>
                Last updated: {fitnessData.date}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default WorkerProfile;