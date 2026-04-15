import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import { cameraStore } from './store/cameraStore'
import App from './App.jsx'
import './App.css'

// Initialize camera store after DOM is ready
cameraStore.init();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)