import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AdminDashboard from './pages/admin/Dashboard';
import EventEditor from './pages/admin/EventEditor';
import Login from './pages/admin/Login';
import PublicEventPage from './pages/public/EventLanding';
import Home from './pages/public/Home';
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

          {/* Default Route: Public Home */}
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
