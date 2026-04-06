const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function test() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  try {
    const t = "test";
    const description = "test desc";
    const category = "Health";
    const area = "Naini";
    const ward = "Ward 7";
    const affected_count = 50;
    const source_type = "NGO";
    const urgency = "Medium";
    const priority_score = 5;
    const skills_required = [];
    const ai_analysis = null;

    const result = await db.run(
      `INSERT INTO needs (title, description, category, area, ward, affected_count, source_type, urgency, priority_score, skills_required, ai_analysis, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t, description, category, area, ward, affected_count, source_type, urgency, priority_score, JSON.stringify(skills_required), JSON.stringify(ai_analysis), 'Open']
    );
    console.log("Success", result);
  } catch (err) {
    console.error("DB Error:", err);
  }
}
test();
