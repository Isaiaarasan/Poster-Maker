import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AdminDashboard from './pages/admin/Dashboard';
import EventEditor from './pages/admin/EventEditor';
import Login from './pages/admin/Login';
import Events from './pages/admin/Events';
import Leads from './pages/admin/Leads';
import Templates from './pages/admin/Templates';
import Settings from './pages/admin/Settings';
import PublicEventPage from './pages/public/EventLanding';
import Home from './pages/public/Home';
import AdminLayout from './components/admin/AdminLayout';
import './index.css';

const ProtectedRoute = () => {
  const isAuth = localStorage.getItem('isAdmin') === 'true';
  return isAuth ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

function App() {
  useEffect(() => {
    // Apply Theme from LocalStorage
    const theme = localStorage.getItem('pm_themeMode') || 'dark';
    const primary = localStorage.getItem('pm_primaryColor') || '#8b5cf6';
    const secondary = localStorage.getItem('pm_secondaryColor') || '#3b82f6';
    const bgPrimary = localStorage.getItem('pm_bgPrimary');
    const bgSecondary = localStorage.getItem('pm_bgSecondary');
    const textMain = localStorage.getItem('pm_textMain');

    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }

    // Apply Colors
    document.documentElement.style.setProperty('--primary', primary);
    document.documentElement.style.setProperty('--secondary', secondary);
    if (bgPrimary) document.documentElement.style.setProperty('--bg-primary', bgPrimary);
    if (bgSecondary) document.documentElement.style.setProperty('--bg-secondary', bgSecondary);
    if (textMain) document.documentElement.style.setProperty('--text-main', textMain);

    // Derived colors (simplified)
    document.documentElement.style.setProperty('--primary-light', primary);
    document.documentElement.style.setProperty('--primary-dark', primary);

  }, []);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Admin Routes with Protection */}
          <Route path="/admin/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/events" element={<Events />} />
              <Route path="/admin/leads" element={<Leads />} />
              <Route path="/admin/templates" element={<Templates />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/event/:id" element={<EventEditor />} />
            </Route>
          </Route>

          {/* Public Routes */}
          <Route path="/:slug" element={<PublicEventPage />} />

          {/* Default Route: Public Home */}
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
