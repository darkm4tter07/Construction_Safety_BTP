import { useState, useEffect } from 'react';
import axios from 'axios';

export default function FitnessPanel() {
  const [fitnessData, setFitnessData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
    
    // Check if redirected after OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get('fitness') === 'connected') {
      fetchFitnessData();
    }
  }, []);

  const checkConnection = async () => {
    try {
      const response = await axios.get('http://localhost:8000/auth/google/status');
      setConnected(response.data.connected);
      if (response.data.connected) {
        fetchFitnessData();
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFitnessData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/fitness/summary');
    //   console.log('Fitness data fetched:', response.data);
      setFitnessData(response.data);
      setConnected(true);
    } catch (error) {
      console.error('Failed to fetch fitness data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = 'http://localhost:8000/auth/google/login';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Worker Fitness Monitor</h3>
        <p className="text-gray-600 mb-4">Connect your fitness device to monitor health metrics</p>
        <button 
          onClick={handleConnect}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Connect Google Fit
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Today's Health Metrics</h3>
        <button 
          onClick={fetchFitnessData}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      
      {fitnessData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">👟</span>
              <span className="text-xs text-blue-600 font-medium bg-blue-200 px-2 py-1 rounded">STEPS</span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {fitnessData.steps.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Daily movement</div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-5 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">❤️</span>
              <span className="text-xs text-red-600 font-medium bg-red-200 px-2 py-1 rounded">BPM</span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {fitnessData.heart_rate}
            </div>
            <div className="text-sm text-gray-600">Avg heart rate</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-5 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">🔥</span>
              <span className="text-xs text-orange-600 font-medium bg-orange-200 px-2 py-1 rounded">KCAL</span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {fitnessData.calories}
            </div>
            <div className="text-sm text-gray-600">Calories burned</div>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Last updated: {fitnessData?.date || 'N/A'}
      </div>
    </div>
  );
};
