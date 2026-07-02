// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function AppContent() {
  const navigate = useNavigate();

  // 🎯 FIX STEP 1: Rely entirely on localized state lifecycle checks for tracking authenticated user states
  const [user, setUser] = useState(() => {
    // Check local storage directly on initial mount to determine true persistent auth status
    const savedUser = localStorage.getItem('gitdoc_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(true);

  // 🎯 FIX STEP 2: Handle URL parameter extraction inside an isolated, safe structural hook phase
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const name = params.get('name');
    const avatar = params.get('avatar');

    if (token) {
      // 💾 Commit newly verified profile parameters securely into client context storage cache blocks
      localStorage.setItem('gitdoc_token', token);
      const profile = { name, avatar: decodeURIComponent(avatar || '') };
      localStorage.setItem('gitdoc_user', JSON.stringify(profile));
      
      setUser(profile);
      
      // Flush URL parameters completely and lock router location directly inside the secure dashboard views
      navigate('/dashboard', { replace: true });
    }
    
    setLoading(false);
  }, [navigate]);

  const handleLoginTrigger = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google`);
      const data = await res.json();
      if (data.url) window.location.href = data.url; 
    } catch (err) {
      alert("Handshake failure linking to backend auth endpoints.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gitdoc_token');
    localStorage.removeItem('gitdoc_user');
    setUser(null);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-mono text-xs text-[#57606a]">
        Booting Secure Session Tunnels...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Landing Directory View */}
      {/* Inside your Routes entry frame in App.jsx */}
<Route 
  path="/" 
  element={
    <LandingPage 
      handleLoginTrigger={handleLoginTrigger} 
      user={user} 
      navigate={navigate} 
    />
  } 
/>
      
      {/* Secured Project Space Entry */}
      <Route 
        path="/dashboard" 
        element={user ? <DashboardPage user={user} handleLogout={handleLogout} BACKEND_URL={BACKEND_URL} /> : <Navigate to="/" replace />} 
      />
      
      {/* Fallback Catch */}
      <Route path="*" element={<Navigate to="/" replace />} />
      // Quick addition to your React Routes inside App.jsx
<Route path="/privacy" element={
  <div className="p-8 font-mono text-xs max-w-2xl text-gray-600">
    <h1 className="text-lg font-bold mb-4 text-black">Privacy Policy</h1>
    <p>DocGit accesses Google Drive metadata and Document structures solely to compute local character-level diff operations. Your data stream content is never packaged, distributed, or sold to third-party entities.</p>
  </div>
} />

<Route path="/terms" element={
  <div className="p-8 font-mono text-xs max-w-2xl text-gray-600">
    <h1 className="text-lg font-bold mb-4 text-black">Terms of Service</h1>
    <p>By utilizing the DocGit terminal daemon and web-client interface framework, you authorize the real-time transmission of file update differentials to our synchronized cloud database node matrix for version history storage.</p>
  </div>
} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}