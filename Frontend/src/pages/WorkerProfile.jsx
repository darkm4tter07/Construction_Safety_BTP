import { useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { useWorkerData } from '../hooks/useWorkerData';
import FitnessMetrics from '../components/Profile/FitnessMetrics';
import ConnectFitnessCTA from '../components/Profile/ConnectFitnessCTA';

const WorkerProfile = () => {
  const { user, login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { id } = useParams();

  const isAdminView = user?.role === 'ADMIN' && !!id;

  // Custom hook handles all data fetching logic
  const {
    profileUser,
    fitnessData,
    fitnessConnected,
    loading,
    fetchFitnessData,
    handleConnectFitness,
    handleDisconnect,
  } = useWorkerData(user, id, isAdminView);

  // Handle token from URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token);
      navigate('/worker/profile', { replace: true });
    }
  }, [searchParams, login, navigate]);

  if (!user || loading && !profileUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400" />
      </div>
    );
  }

  return (
    <div className='bg-black min-h-screen max-h-screen w-full flex flex-col text-white overflow-hidden'>
      <Header />

      <main className='flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto'>
        
        {/* Admin back button */}
        {isAdminView && (
          <button
            onClick={() => navigate('/admin/dashboard')}
            className='cursor-pointer flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition mb-5'
          >
            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
            </svg>
            Back to Dashboard
          </button>
        )}

        {/* Profile Info Card - UPDATED TO ZINC THEME */}
        <div className='bg-zinc-800 rounded-xl border border-zinc-700 p-6 mb-4'>
          <div className='flex items-center gap-4 mb-5'>
            {profileUser?.profile_picture && (
              <img
                src={profileUser.profile_picture}
                alt={profileUser?.full_name}
                className='w-14 h-14 rounded-full border-2 border-zinc-600'
              />
            )}
            <div>
              <div className='flex items-center gap-2'>
                <h2 className='text-lg font-semibold text-zinc-100'>{profileUser?.full_name}</h2>
                {isAdminView && (
                  <span className='text-[10px] text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20'>
                    Admin View
                  </span>
                )}
              </div>
              <p className='text-xs text-zinc-400 capitalize mt-0.5'>{profileUser?.role}</p>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='text-[10px] text-zinc-500 uppercase tracking-widest'>Email</label>
              <p className='text-sm text-zinc-300 mt-1'>{profileUser?.email}</p>
            </div>
            <div>
              <label className='text-[10px] text-zinc-500 uppercase tracking-widest'>Employee ID</label>
              <p className='text-sm text-zinc-300 mt-1'>{profileUser?.employee_id || '—'}</p>
            </div>
          </div>
        </div>

        {/* Fitness Section - UPDATED TO ZINC THEME */}
        <div className='bg-zinc-800 rounded-xl border border-zinc-700 p-6'>
          <div className='flex justify-between items-center mb-5'>
            <div>
              <h2 className='text-sm font-semibold tracking-widest text-zinc-400 uppercase'>
                {isAdminView ? `${profileUser?.full_name?.split(' ')[0]}'s Fitness` : 'My Fitness Metrics'}
              </h2>
              <p className='text-[10px] text-zinc-500 mt-0.5'>Today's data</p>
            </div>

            {/* Controls */}
            {!isAdminView && fitnessConnected && (
              <div className='flex gap-2'>
                <button onClick={fetchFitnessData} className='btn-secondary'>Refresh</button>
                <button onClick={handleDisconnect} className='btn-danger'>Disconnect</button>
              </div>
            )}
            {isAdminView && (
              <button onClick={fetchFitnessData} className='btn-secondary'>Refresh</button>
            )}
          </div>

          {/* Conditional Rendering of Fitness State */}
          {loading ? (
             <div className='flex items-center justify-center py-12 gap-3'>
               <div className='w-4 h-4 border border-zinc-600 border-t-zinc-300 rounded-full animate-spin' />
               <span className='text-xs text-zinc-400'>Loading...</span>
             </div>
          ) : !isAdminView && !fitnessConnected ? (
             <ConnectFitnessCTA onConnect={handleConnectFitness} />
          ) : isAdminView && !fitnessData ? (
             <div className='flex items-center justify-center py-12'>
               <p className='text-xs text-zinc-500'>No fitness data available for this worker today</p>
             </div>
          ) : fitnessData ? (
             <FitnessMetrics data={fitnessData} />
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default WorkerProfile;