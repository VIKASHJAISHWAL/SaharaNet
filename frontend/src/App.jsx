import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertCircle, Users, Activity } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ReportNeed from './pages/ReportNeed';
import Volunteers from './pages/Volunteers';
import Match from './pages/Match';

function App() {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <Activity color="var(--primary)" size={28} />
          SaharaNet
        </div>
        <nav className="nav-links">
          <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink to="/report" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            <AlertCircle size={20} />
            Report Need
          </NavLink>
          <NavLink to="/volunteers" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            <Users size={20} />
            Volunteers
          </NavLink>
          <NavLink to="/match" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            <Activity size={20} />
            AI Match
          </NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/report" element={<ReportNeed />} />
          <Route path="/volunteers" element={<Volunteers />} />
          <Route path="/match" element={<Match />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
