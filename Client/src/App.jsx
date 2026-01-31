import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AdminDashboard from './pages/admin/Dashboard';
import EventEditor from './pages/admin/EventEditor';
import Login from './pages/admin/Login';
import PublicEventPage from './pages/public/EventLanding';
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
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/event/:id" element={<EventEditor />} />
          </Route>

          {/* Public Routes */}
          <Route path="/:slug" element={<PublicEventPage />} />

          {/* Default Route Logic: 
              If the user visits root /, we can redirect to login for now, 
              or if the user intended a specific public event they go to /:slug directly.
              Let's redirect / to /admin/login so they find the tool interface. 
          */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
