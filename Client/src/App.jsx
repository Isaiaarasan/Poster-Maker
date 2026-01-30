import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminPanel from './pages/AdminPanel';
import ClientPanel from './pages/ClientPanel';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <div className="logo">PosterMaker</div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Client Panel</Link>
            <Link to="/admin" className="nav-link">Admin Architect</Link>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ClientPanel />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
