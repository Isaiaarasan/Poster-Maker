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
