import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ activeNeeds: 0, volunteers: 0, tasksMatched: 0, coverageRate: '0%' });
  const [topNeeds, setTopNeeds] = useState([]);
  const [areaCoverage, setAreaCoverage] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_URL}/needs/stats/dashboard`);
      setStats(response.data.stats);
      setTopNeeds(response.data.topUrgentNeeds || []);
      setAreaCoverage(response.data.areaCoverage || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadgeColor = (urgency) => {
    switch(urgency?.toLowerCase()) {
      case 'critical': return 'badge-critical';
      case 'high': return 'badge-high';
      case 'medium': return 'badge-medium';
      case 'low': return 'badge-low';
      default: return 'badge-medium';
    }
  };

  if (loading) return <div className="page-title">Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Platform Overview</h1>
        <p className="page-subtitle">Real-time statistics and priority needs</p>
      </div>

      <div className="grid-4 mb-8">
        <div className="stat-card">
          <span className="text-muted">Active Needs</span>
          <span className="stat-value">{stats.activeNeeds}</span>
        </div>
        <div className="stat-card">
          <span className="text-muted">Registered Volunteers</span>
          <span className="stat-value">{stats.volunteers}</span>
        </div>
        <div className="stat-card">
          <span className="text-muted">Tasks Matched</span>
          <span className="stat-value">{stats.tasksMatched}</span>
        </div>
        <div className="stat-card">
          <span className="text-muted">Coverage Rate</span>
          <span className="stat-value" style={{color: 'var(--accent-ai)'}}>{stats.coverageRate}</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 style={{fontSize: '18px', marginBottom: '16px'}}>Top Urgent Needs</h2>
          {topNeeds.length === 0 ? (
            <p className="text-muted">No active needs reported.</p>
          ) : (
            <div className="needs-list">
              {topNeeds.map(need => (
                <div key={need.id} className="need-item">
                  <div>
                    <div className="need-title">{need.title}</div>
                    <div className="need-meta">{need.area} - {need.category} (Score: {need.priority_score}/10)</div>
                  </div>
                  <div>
                    <span className={`badge ${getUrgencyBadgeColor(need.urgency)}`}>{need.urgency}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{fontSize: '18px', marginBottom: '16px'}}>Area Need Distribution</h2>
          {areaCoverage.length === 0 ? (
            <p className="text-muted">No data available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {areaCoverage.map((area, index) => {
                const total = areaCoverage.reduce((sum, item) => sum + parseInt(item.need_count), 0);
                const perc = Math.round((parseInt(area.need_count) / total) * 100);
                return (
                  <div key={index} style={{ marginBottom: '8px' }}>
                    <div className="flex justify-between" style={{fontSize: '14px', marginBottom: '4px'}}>
                      <span>{area.area}</span>
                      <span style={{fontWeight: 600}}>{area.need_count} Needs</span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: 'var(--border)', borderRadius: '4px', height: '8px' }}>
                      <div style={{ width: `${perc}%`, backgroundColor: 'var(--primary)', height: '100%', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
