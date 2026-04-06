import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Star } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Match = () => {
  const [needs, setNeeds] = useState([]);
  const [selectedNeed, setSelectedNeed] = useState('');
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch active needs for dropdown
    const fetchNeeds = async () => {
      try {
        const res = await axios.get(`${API_URL}/needs`);
        // only show Open needs
        setNeeds(res.data.filter(n => n.status === 'Open'));
      } catch (err) {
        console.error(err);
      }
    };
    fetchNeeds();
  }, []);

  const handleMatch = async () => {
    if(!selectedNeed) return;
    setLoading(true);
    setMatches(null);
    try {
      const res = await axios.post(`${API_URL}/match`, { need_id: selectedNeed });
      setMatches(res.data.matches);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedNeedDetails = needs.find(n => n.id === parseInt(selectedNeed));

  return (
    <div style={{ maxWidth: '900px' }}>
      <div className="page-header">
        <h1 className="page-title">Smart Matching</h1>
        <p className="page-subtitle">Algorithmically route the right volunteers to the most pressing needs.</p>
      </div>

      <div className="card" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Select an Open Need</h2>
        <div className="flex items-center gap-4">
          <select className="form-control" style={{ flex: 1 }} value={selectedNeed} onChange={(e) => setSelectedNeed(e.target.value)}>
            <option value="">-- Choose a Need Request --</option>
            {needs.map(n => (
              <option key={n.id} value={n.id}>{n.title} (Urgency: {n.urgency})</option>
            ))}
          </select>
          <button className="btn btn-ai" onClick={handleMatch} disabled={!selectedNeed || loading}>
            <Activity size={18} />
            {loading ? 'Finding...' : 'Find Best Matches'}
          </button>
        </div>

        {selectedNeedDetails && (
          <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border)'}}>
            <h4 style={{marginBottom: '8px', color: 'var(--text-main)'}}>Required for this need:</h4>
            <div className="flex gap-4">
              <span className="badge badge-low">Location: {selectedNeedDetails.area}</span>
              <span className="badge badge-low">Skills: {selectedNeedDetails.skills_required?.join(', ') || 'General'}</span>
            </div>
          </div>
        )}
      </div>

      {matches && (
        <div>
          <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Top Suggested Volunteers</h3>
          {matches.length === 0 ? (
            <div className="card text-center" style={{ padding: '40px' }}>
              <p className="text-muted">No available volunteers found for this need.</p>
            </div>
          ) : (
            <div className="grid-3">
              {matches.map((m, idx) => (
                <div key={idx} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                  {idx === 0 && <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--amber)', color: '#fff', fontSize: '10px', padding: '4px 16px', fontWeight: 700, transform: 'rotate(45deg) translate(8px, -18px)', width: '100px', textAlign: 'center' }}>TOP</div>}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {m.volunteer.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{m.volunteer.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.volunteer.location}</div>
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px' }}>
                    <div className="flex justify-between items-center mb-4">
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>Match Score</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>{m.matchScore} pts</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>
                      <strong>Why:</strong> {m.matchReason}
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', marginBottom: '20px', color: 'var(--text-main)' }}>
                    <strong>Task:</strong> {m.suggestedTask}
                  </div>

                  <button className="btn btn-primary w-full" onClick={() => alert('Assigned ' + m.volunteer.name + ' to task!')}>
                    Assign Task
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Match;
