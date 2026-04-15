import { useEffect } from 'react';
import { useNavigate, useSearchParams, useParams, Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { useWorkerData } from '../hooks/useWorkerData';
import ProfileHeader from '../components/Profile/ProfileHeader';
import ProfileTabs from '../components/Profile/ProfileTabs';
import ProfileOverview from '../components/Profile/ProfileOverview';
import ProfileEditForm from '../components/Profile/ProfileEditForm';
import ProfileCognitive from '../components/Profile/ProfileCognitive';
import ProfileFitness from '../components/Profile/ProfileFitness';

export default function WorkerProfile() {
  const { user, login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { id } = useParams();

  const isAdminView = user?.role === 'ADMIN' && !!id;

  const workerData = useWorkerData(user, id, isAdminView);

  const {
    profileUser,
    workerProfile,
    loading,
    photoUploading,
    uploadProfilePhoto,
    getBMI,
    getBMICategory,
  } = workerData;

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
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* Top header — same as dashboard */}
      <div className="shrink-0">
        <Header />
      </div>

      {/* Profile header card */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-0">
        {isAdminView && (
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition mb-3"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        )}

        <ProfileHeader
          profileUser={profileUser}
          workerProfile={workerProfile}
          isAdminView={isAdminView}
          photoUploading={photoUploading}
          onPhotoUpload={uploadProfilePhoto}
          getBMI={getBMI}
          getBMICategory={getBMICategory}
        />
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-6 lg:px-8 mt-4">
        <ProfileTabs
          isAdminView={isAdminView}
          userId={id}
        />
      </div>

      {/* Tab content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 overflow-y-auto">
        <Routes>
          <Route
            index
            element={
              <ProfileOverview
                workerProfile={workerProfile}
                workerData={workerData}
                isAdminView={isAdminView}
                userId={id}
              />
            }
          />
          <Route
            path="edit"
            element={
              <ProfileEditForm
                workerProfile={workerProfile}
                updateProfile={workerData.updateProfile}
                profileLoading={workerData.profileLoading}
                isAdminView={isAdminView}
              />
            }
          />
          <Route
            path="cognitive"
            element={
              <ProfileCognitive
                userId={isAdminView ? id : user?.id}
                isAdminView={isAdminView}
              />
            }
          />
          <Route
            path="fitness"
            element={
              <ProfileFitness
                workerData={workerData}
                isAdminView={isAdminView}
                profileUser={profileUser}
              />
            }
          />
        </Routes>
      </div>
    </div>
  );
}