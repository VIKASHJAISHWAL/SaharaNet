import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, CheckCircle2 } from 'lucide-react';

const API_URL = 'https://saharanet.onrender.com/api';

const Wards = [
  "Naini - Ward 7",
  "Civil Lines - Ward 2",
  "Phaphamau - Ward 11",
  "Jhunsi - Ward 15",
  "Bamhrauli - Ward 19",
  "Kareli - Ward 3"
];

const Categories = [
  "Water & Sanitation",
  "Food & Nutrition",
  "Health & Medical",
  "Education",
  "Livelihood & Skills",
  "Shelter",
  "Child Welfare"
];

const ReportNeed = () => {
  const [formData, setFormData] = useState({
    source_type: '',
    area: '',
    ward: '',
    category: '',
    affected_count: '',
    description: ''
  });

  const [aiResult, setAiResult] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if(e.target.name === 'area') {
      // Auto-fill ward based on area selection mapping to predefined wards
      const map = {
        'Naini': 'Naini - Ward 7',
        'Civil Lines': 'Civil Lines - Ward 2',
        'Phaphamau': 'Phaphamau - Ward 11',
        'Jhunsi': 'Jhunsi - Ward 15',
        'Bamhrauli': 'Bamhrauli - Ward 19',
        'Kareli': 'Kareli - Ward 3'
      };
      if (map[e.target.value]) {
         setFormData(prev => ({...prev, area: e.target.value, ward: map[e.target.value]}));
      }
    }
  };

  const handleAnalyzeAndSubmit = async (e) => {
    e.preventDefault();
    setLoadingAI(true);
    setSubmitting(true);
    setSuccess('');

    try {
      // Extract main area name if needed, but we save area as selected.
      const payload = {
        ...formData,
        affected_count: parseInt(formData.affected_count),
        title: `Need: ${formData.category} at ${formData.area}`
      };

      const res = await axios.post(`${API_URL}/needs`, payload);
      setAiResult(res.data.ai_analysis);
      setSuccess('Need report successfully submitted & analyzed!');
      // Reset form
      setFormData({ source_type: '', area: '', ward: '', category: '', affected_count: '', description: '' });
    } catch (error) {
      console.error(error);
      alert('Failed to submit need.');
    } finally {
      setLoadingAI(false);
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <h1 className="page-title">Report a Need</h1>
        <p className="page-subtitle">Submit community requirements for AI analysis and matching.</p>
      </div>

      {success && (
        <div style={{ padding: '16px', background: '#d1fae5', color: 'var(--green)', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={20} />
          {success}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleAnalyzeAndSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Source Type</label>
              <select className="form-control" name="source_type" value={formData.source_type} onChange={handleChange} required>
                <option value="">Select Source</option>
                <option value="Community Member">Community Member</option>
                <option value="NGO">NGO / Organization</option>
                <option value="Government">Local Government</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Area (Location)</label>
              <select className="form-control" name="area" value={formData.area} onChange={handleChange} required>
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

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" name="category" value={formData.category} onChange={handleChange} required>
                <option value="">Select Category</option>
                {Categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Affected People (Count)</label>
              <input type="number" className="form-control" name="affected_count" value={formData.affected_count} onChange={handleChange} required placeholder="e.g. 50" min="1" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Problem Description</label>
            <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} required placeholder="Describe the ground situation in detail..."></textarea>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button type="submit" className="btn btn-ai w-full" disabled={loadingAI || submitting}>
              <Sparkles size={18} />
              {loadingAI ? 'Analyzing with AI & Submitting...' : 'Analyze with AI & Submit Report'}
            </button>
          </div>
        </form>

        {aiResult && (
          <div className="ai-results fade-in">
            <h4><Sparkles size={18} /> AI Analysis Findings</h4>
            <div className="grid-2 mt-4">
              <div>
                <strong>Urgency:</strong> <span style={{marginLeft:'8px'}} className={`badge badge-${aiResult.urgency?.toLowerCase()}`}>{aiResult.urgency}</span>
              </div>
              <div>
                <strong>Priority Score:</strong> <span style={{fontWeight:600}}>{aiResult.priority_score}/10</span>
              </div>
            </div>
            <div className="mt-4">
              <strong>Specific Analysis:</strong>
              <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-muted)' }}>{aiResult.analysis}</p>
            </div>
            <div className="mt-4">
              <strong>Immediate Action Recommended:</strong>
              <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-muted)' }}>{aiResult.immediate_action}</p>
            </div>
            <div className="mt-4">
              <strong>Required Skills:</strong>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {aiResult.skills_required?.map((skill, idx) => (
                  <span key={idx} style={{ background: 'rgba(83, 74, 183, 0.1)', color: 'var(--accent-ai)', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 500}}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportNeed;
