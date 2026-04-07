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

  const {
    profileUser,
    fitnessData,
    fitnessConnected,
    loading,
    needsReauth,
    fetchFitnessData,
    handleConnectFitness,
    handleAdminDisconnect,
  } = useWorkerData(user, id, isAdminView);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token);
      navigate('/worker/profile', { replace: true });
    }
  }, [searchParams, login, navigate]);

  if (!user || (loading && !profileUser)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400" />
      </div>
    );
  }

  return (
    <div className='bg-black h-screen w-full flex flex-col text-white overflow-hidden'>
      <Header />

      <main className='flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3 overflow-hidden'>

        {/* Admin back button */}
        {isAdminView && (
          <button
            onClick={() => navigate('/admin/dashboard')}
            className='cursor-pointer flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition w-fit'
          >
            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
            </svg>
            Back to Dashboard
          </button>
        )}

        {/* Profile Info */}
        <div className='bg-zinc-800 rounded-xl border border-zinc-700 px-5 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              {profileUser?.profile_picture && (
                <img
                  src={profileUser.profile_picture}
                  alt={profileUser?.full_name}
                  className='w-11 h-11 rounded-full border-2 border-zinc-600 shrink-0'
                />
              )}
              <div>
                <div className='flex items-center gap-2'>
                  <h2 className='text-base font-semibold text-zinc-100'>
                    {profileUser?.full_name}
                  </h2>
                  {isAdminView && (
                    <span className='text-[10px] text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20'>
                      Admin View
                    </span>
                  )}
                </div>
                <p className='text-xs text-zinc-400 capitalize'>
                  {profileUser?.role}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-8'>
              <div>
                <label className='text-[10px] text-zinc-500 uppercase'>Email</label>
                <p className='text-xs text-zinc-300'>{profileUser?.email}</p>
              </div>
              <div>
                <label className='text-[10px] text-zinc-500 uppercase'>Employee ID</label>
                <p className='text-xs text-zinc-300'>
                  {profileUser?.employee_id || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fitness Status Card */}
        {(fitnessConnected || isAdminView) && (
          <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${
            needsReauth
              ? 'bg-yellow-900/20 border-yellow-800'
              : 'bg-zinc-800 border-zinc-700'
          }`}>
            <div>
              <p className={`text-xs font-medium ${
                needsReauth ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {needsReauth
                  ? '⚠️ Fitness sync needs attention'
                  : '✓ Google Fit connected and syncing'}
              </p>
            </div>

            {/* Admin only disconnect */}
            {isAdminView && (
              <button
                onClick={handleAdminDisconnect}
                className='cursor-pointer text-[10px] text-red-400 hover:text-red-300 border border-red-800 px-3 py-1.5 rounded-lg'
              >
                Disconnect
              </button>
            )}
          </div>
        )}

        {/* Fitness Section */}
        <div className='bg-zinc-800 rounded-xl border border-zinc-700 px-5 py-4 flex flex-col min-h-0'>
          <div className='flex justify-between items-center mb-3'>
            <div>
              <h2 className='text-xs font-semibold tracking-widest text-zinc-400 uppercase'>
                {isAdminView
                  ? `${profileUser?.full_name?.split(' ')[0]}'s Fitness`
                  : 'My Fitness Metrics'}
              </h2>
              <p className='text-[10px] text-zinc-500'>Today</p>
            </div>

            {(fitnessConnected || isAdminView) && (
              <button
                onClick={fetchFitnessData}
                className='text-xs cursor-pointer text-zinc-400 hover:text-white border border-zinc-700 px-3 py-1.5 rounded-lg'
              >
                Refresh
              </button>
            )}
          </div>

          <div className='flex-1 min-h-0'>
            {loading ? (
              <div className='flex items-center justify-center h-full'>
                <span className='text-xs text-zinc-400'>Loading...</span>
              </div>
            ) : !isAdminView && !fitnessConnected ? (
              <ConnectFitnessCTA onConnect={handleConnectFitness} />
            ) : isAdminView && !fitnessData ? (
              <p className='text-xs text-zinc-500 text-center'>
                No data available
              </p>
            ) : fitnessData ? (
              <FitnessMetrics data={fitnessData} />
            ) : null}
          </div>
        </div>

        {/* Relogin Notice */}
        {(fitnessConnected || isAdminView) && needsReauth && (
          <div className='bg-yellow-900/20 rounded-xl border border-yellow-800 px-4 py-2'>
            <p className='text-[10px] text-yellow-400'>
              {isAdminView
                ? `⚠️ Ask ${profileUser?.full_name?.split(' ')[0]} to login again`
                : '⚠️ Please login again to restore fitness sync'}
            </p>
          </div>
        )}

      </main>
    </div>
  );
};

export default WorkerProfile;