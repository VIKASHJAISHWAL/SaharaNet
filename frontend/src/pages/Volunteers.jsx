import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Volunteers = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    skills: '', // will split by comma
    availability: 'Flexible'
  });

  const fetchVolunteers = async () => {
    try {
      const res = await axios.get(`${API_URL}/volunteers`);
      setVolunteers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    const skillsArray = formData.skills.split(',').map(s => s.trim());
    const payload = {
      ...formData,
      skills: skillsArray,
      status: 'available'
    };

    try {
      await axios.post(`${API_URL}/volunteers`, payload);
      setFormData({ name: '', phone: '', email: '', location: '', skills: '', availability: 'Flexible' });
      fetchVolunteers();
    } catch (error) {
      console.error(error);
      alert('Failed to add volunteer');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'available' ? 'busy' : 'available';
      await axios.patch(`${API_URL}/volunteers/${id}/status`, { status: newStatus });
      fetchVolunteers();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Community Volunteers</h1>
        <p className="page-subtitle">Manage and onboard local heroes.</p>
      </div>

      <div className="grid-2">
        <div>
          <div className="card">
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Add New Volunteer</h2>
            <form onSubmit={handleAddVolunteer}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-control" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Location (Area)</label>
                  <select className="form-control" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required>
                    <option value="">Select Area</option>
                    <option value="Naini">Naini</option>
                    <option value="Civil Lines">Civil Lines</option>
                    <option value="Phaphamau">Phaphamau</option>
                    <option value="Jhunsi">Jhunsi</option>
                    <option value="Bamhrauli">Bamhrauli</option>
                    <option value="Kareli">Kareli</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Skills (comma separated)</label>
                <input type="text" className="form-control" placeholder="e.g. First Aid, Logistics, Medical" value={formData.skills} onChange={(e) => setFormData({...formData, skills: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Availability</label>
                <select className="form-control" value={formData.availability} onChange={(e) => setFormData({...formData, availability: e.target.value})}>
                  <option value="Flexible">Flexible</option>
                  <option value="Weekends only">Weekends only</option>
                  <option value="Immediate">Immediate / Emergency</option>
                  <option value="Evenings">Evenings</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full">Register Volunteer</button>
            </form>
          </div>
        </div>

        <div>
          <div className="card">
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Volunteer Roster</h2>
            {loading ? <p>Loading...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {volunteers.length === 0 ? <p className="text-muted">No volunteers found.</p> : volunteers.map(vol => (
                  <div key={vol.id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '16px' }}>{vol.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{vol.location} • {vol.phone}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {vol.skills?.map((skill, idx) => (
                          <span key={idx} style={{ background: '#f1f5f9', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>{skill}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                       <span className={`badge ${vol.status === 'available' ? 'badge-medium' : 'badge-low'}`}>{vol.status}</span>
                       <button 
                         onClick={() => toggleStatus(vol.id, vol.status)} 
                         className="btn btn-outline" 
                         style={{ padding: '6px 12px', fontSize: '12px' }}
                       >
                         Toggle Status
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Volunteers;
