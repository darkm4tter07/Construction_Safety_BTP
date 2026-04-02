import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import WorkerProfile from './pages/WorkerProfile';
import Dashboard from './pages/Dashboard';
import {useFrameSender} from './hooks/useFrameSender';
import './App.css';

function App() {
  const { isAuthenticated, user } = useAuth();
  useFrameSender();
  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Worker Self Profile */}
        <Route
          path="/worker/profile"
          element={
            <ProtectedRoute requiredRole="WORKER">
              <WorkerProfile />
            </ProtectedRoute>
          }
        />

        {/* Admin Viewing Any Worker */}
        <Route
          path="/admin/worker/:id"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <WorkerProfile />
            </ProtectedRoute>
          }
        />



        {/* Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Default redirect based on role */}
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

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;