import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, user } = useAuth();

  const API_URL = 'http://localhost:8000';

  // Handle token from URL (after OAuth redirect)
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token);
      // Token is set, user will be fetched by AuthContext
    }
  }, [searchParams, login]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/worker/profile');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/google/login`);
    //   console.log("Authorization URL: ", response.data.authorization_url);
      window.location.href = response.data.authorization_url;
    } catch (error) {
      console.error('Failed to initiate Google login:', error);
      alert('Failed to connect to server. Please try again.');
    }
  };

  return (
    <div className='bg-black min-h-screen w-full flex flex-col'>
        <h1 className='w-full text-white opacity-85 text-3xl text-center py-4 font-bold border-b-2 border-[#ffffff31]'>
            Construction Safety Monitor
        </h1>
        <div className='flex-1 flex flex-col justify-center items-center text-white px-4 text-center'>
            <h1 className='text-5xl font-bold pb-6'>
                Login to your Account
            </h1>
            <p className='font-thin text-lg max-w-lg'>Sign in with Google to connect your account and access safety insights</p>
            <i className='font-extralight pb-6'>We don’t store passwords or post on your behalf.</i>
            <button
                onClick={handleGoogleLogin}
                className="bg-white border-2 border-gray-300 cursor-pointer hover:opacity-85 hover:shadow-lg text-gray-700 font-semibold py-2 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-3"
            >
                    <span className='font-semibold text-black'>Sign in to continue</span>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
            </button>

        </div>
    </div>
  );
};

export default Login;