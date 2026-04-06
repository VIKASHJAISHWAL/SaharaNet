const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let db;

// Database initialization
const initDb = async () => {
  try {
    db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS needs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        category TEXT,
        area TEXT,
        ward TEXT,
        affected_count INTEGER,
        source_type TEXT,
        urgency TEXT,
        priority_score INTEGER,
        skills_required TEXT,
        ai_analysis TEXT,
        status TEXT DEFAULT 'Open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS volunteers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT,
        email TEXT,
        location TEXT,
        ward TEXT,
        skills TEXT,
        availability TEXT,
        status TEXT DEFAULT 'available',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        need_id INTEGER,
        volunteer_id INTEGER,
        match_score INTEGER,
        match_reason TEXT,
        suggested_task TEXT,
        status TEXT DEFAULT 'proposed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (need_id) REFERENCES needs(id),
        FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
      );
    `);
    console.log('Local SQLite Database initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize database:', err.message);
  }
};

initDb();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SaharaNet API is running' });
});

// GET /api/needs
app.get('/api/needs', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM needs ORDER BY priority_score DESC, created_at DESC');
    res.json(rows.map(r => ({...r, skills_required: r.skills_required ? JSON.parse(r.skills_required) : [], ai_analysis: r.ai_analysis ? JSON.parse(r.ai_analysis) : null})));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/needs
app.post('/api/needs', async (req, res) => {
  const { title, description, category, area, ward, affected_count, source_type } = req.body;
  
  try {
    let ai_analysis = null;
    let urgency = 'Medium';
    let priority_score = 5;
    let skills_required = [];

    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key') {
      try {
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Analyze this community need report and provide specific insights. Return ONLY a valid JSON object (no markdown formatting, no backticks) with the following structure:
    {
      "urgency": "Low" | "Medium" | "High" | "Critical",
      "priority_score": Number (1-10, 10 being most critical),
      "skills_required": ["Skill1", "Skill2"],
      "analysis": "Short analysis paragraph explaining the situation",
      "immediate_action": "What needs to be done immediately"
    }
    
    Report Details:
    Category: ${category}
    Affected People: ${affected_count}
    Problem Description: ${description}`
              }]
            }]
          })
        });
        
        const geminiData = await aiResponse.json();
        if (geminiData && geminiData.candidates && geminiData.candidates[0].content.parts[0].text) {
          let text = geminiData.candidates[0].content.parts[0].text.trim();
          text = text.replace(/^`{3}(json)?/i, '').replace(/`{3}$/, '').trim();
          ai_analysis = JSON.parse(text);
          urgency = ai_analysis.urgency || 'Medium';
          priority_score = ai_analysis.priority_score || 5;
          skills_required = ai_analysis.skills_required || [];
        }
      } catch (e) {
        console.error('Error from Gemini:', e);
      }
    }

    const t = title || description.substring(0, 50);
    const result = await db.run(
      `INSERT INTO needs (title, description, category, area, ward, affected_count, source_type, urgency, priority_score, skills_required, ai_analysis, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t, description, category, area, ward, affected_count, source_type, urgency, priority_score, JSON.stringify(skills_required), JSON.stringify(ai_analysis), 'Open']
    );

    const insertedRow = await db.get('SELECT * FROM needs WHERE id = ?', [result.lastID]);
    res.json({...insertedRow, skills_required: insertedRow.skills_required ? JSON.parse(insertedRow.skills_required) : [], ai_analysis: insertedRow.ai_analysis ? JSON.parse(insertedRow.ai_analysis) : null});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// GET /api/needs/stats/dashboard
app.get('/api/needs/stats/dashboard', async (req, res) => {
  try {
    const activeNeeds = await db.get("SELECT COUNT(*) as count FROM needs WHERE status = 'Open'");
    const volunteers = await db.get("SELECT COUNT(*) as count FROM volunteers");
    const tasksMatched = await db.get("SELECT COUNT(*) as count FROM matches");
    
    const totalNeeds = parseInt(activeNeeds.count) || 0;
    const totalMatched = parseInt(tasksMatched.count) || 0;
    const coverageRate = totalNeeds === 0 ? 0 : Math.round((totalMatched / (totalNeeds + totalMatched)) * 100);

    const topNeeds = await db.all("SELECT * FROM needs WHERE status='Open' ORDER BY priority_score DESC LIMIT 6");
    const topNeedsMapped = topNeeds.map(r => ({...r, skills_required: r.skills_required ? JSON.parse(r.skills_required) : [] , ai_analysis: r.ai_analysis ? JSON.parse(r.ai_analysis) : null}));

    const areaStats = await db.all(`
      SELECT area, COUNT(*) as need_count 
      FROM needs 
      GROUP BY area
    `);

    res.json({
      stats: {
        activeNeeds: activeNeeds.count,
        volunteers: volunteers.count,
        tasksMatched: tasksMatched.count,
        coverageRate: `${coverageRate}%`
      },
      topUrgentNeeds: topNeedsMapped,
      areaCoverage: areaStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/volunteers
app.get('/api/volunteers', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM volunteers ORDER BY created_at DESC');
    res.json(rows.map(r => ({...r, skills: r.skills ? JSON.parse(r.skills) : []})));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/volunteers
app.post('/api/volunteers', async (req, res) => {
  const { name, phone, email, location, ward, skills, availability, status } = req.body;
  try {
    const result = await db.run(
      `INSERT INTO volunteers (name, phone, email, location, ward, skills, availability, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, phone, email, location, ward, JSON.stringify(skills), availability, status || 'available']
    );
    const row = await db.get('SELECT * FROM volunteers WHERE id = ?', result.lastID);
    res.json({...row, skills: row.skills ? JSON.parse(row.skills) : []});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/volunteers/:id/status
app.patch('/api/volunteers/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.run('UPDATE volunteers SET status = ? WHERE id = ?', [status, id]);
    const row = await db.get('SELECT * FROM volunteers WHERE id = ?', id);
    res.json({...row, skills: row.skills ? JSON.parse(row.skills) : []});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/match
app.post('/api/match', async (req, res) => {
  const { need_id } = req.body;
  try {
    const needRow = await db.get('SELECT * FROM needs WHERE id = ?', [need_id]);
    if (!needRow) return res.status(404).json({ error: 'Need not found' });
    const need = {...needRow, skills_required: needRow.skills_required ? JSON.parse(needRow.skills_required) : [], ai_analysis: needRow.ai_analysis ? JSON.parse(needRow.ai_analysis) : null};

    const volRows = await db.all('SELECT * FROM volunteers WHERE status = ?', ['available']);
    const availableVolunteers = volRows.map(r => ({...r, skills: r.skills ? JSON.parse(r.skills) : []}));

    let matchResults = availableVolunteers.map(vol => {
      let score = 0;
      let reasons = [];
      
      if (vol.location === need.area || vol.ward === need.ward) {
        score += 30;
        reasons.push('Location matches');
      }

      let skillsMatched = 0;
      if (vol.skills && need.skills_required) {
        vol.skills.forEach(skill => {
          if (need.skills_required.includes(skill)) {
            skillsMatched++;
          }
        });
        if (skillsMatched > 0) {
          score += 50;
          reasons.push(`Skills match (${skillsMatched})`);
        }
      }

      if (vol.availability && vol.availability.toLowerCase().includes('immediate')) {
        score += 20;
        reasons.push('Immediately available');
      } else if (vol.availability) {
        score += 10;
        reasons.push('Available for task');
      }

      return {
        volunteer: vol,
        matchScore: score,
        matchReason: reasons.join(', '),
        suggestedTask: need.ai_analysis?.immediate_action || 'Assist with ' + need.category,
      };
    });

    matchResults.sort((a, b) => b.matchScore - a.matchScore);
    res.json({ matches: matchResults.slice(0, 3) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
