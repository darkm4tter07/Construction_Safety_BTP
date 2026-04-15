import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import WorkerProfile from './pages/WorkerProfile';
import Dashboard from './pages/Dashboard';
import { useFrameSender } from './hooks/useFrameSender';
import { Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  const { isAuthenticated, user } = useAuth();
  useFrameSender();

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#27272a",
            color: "#fff",
            border: "1px solid #3f3f46",
            fontSize: "12px",
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Worker profile — nested routes */}
        <Route
          path="/worker/profile/*"
          element={
            <ProtectedRoute requiredRole="WORKER">
              <WorkerProfile />
            </ProtectedRoute>
          }
        />

        {/* Admin viewing worker profile — nested routes */}
        <Route
          path="/admin/worker/:id/*"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <WorkerProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            isAuthenticated && user ? (
              user.role === 'ADMIN' ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <Navigate to="/worker/profile" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;