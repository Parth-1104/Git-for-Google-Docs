// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔐 Catch incoming parameters right after successful Google Auth redirects
 // 🔐 Catch incoming parameters right after successful Google Auth redirects
 useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const name = params.get('name');
  const avatar = params.get('avatar');

  if (token) {
    // 💾 Safely commit credentials to browser local state caches
    localStorage.setItem('gitdoc_token', token);
    const profile = { name, avatar: decodeURIComponent(avatar) };
    localStorage.setItem('gitdoc_user', JSON.stringify(profile));
    
    setUser(profile);
    
    // ✅ FIX: Flush search queries and lock position directly on /dashboard state path
    navigate('/dashboard', { replace: true });
  } else {
    const savedUser = localStorage.getItem('gitdoc_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center font-mono text-xs text-gray-500">
        Booting Secure Session Tunnels...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Landing Directory View */}
      <Route 
        path="/" 
        element={user ? <Navigate to="/dashboard" /> : <LandingPage handleLoginTrigger={handleLoginTrigger} />} 
      />
      
      {/* Secured Project Space Entry */}
      <Route 
        path="/dashboard" 
        element={user ? <DashboardPage user={user} handleLogout={handleLogout} BACKEND_URL={BACKEND_URL} /> : <Navigate to="/" />} 
      />
      
      {/* Fallback Catch */}
      <Route path="*" element={<Navigate to="/" />} />
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