// backend/index.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files
const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');
if (fs.existsSync(FRONTEND_PATH)) {
  app.use(express.static(FRONTEND_PATH));
}

// results file
const RESULTS_FILE = path.join(__dirname, 'results.json');
function ensureFile() {
  if (!fs.existsSync(RESULTS_FILE)) {
    fs.writeFileSync(RESULTS_FILE, JSON.stringify([], null, 2));
  }
}

// POST /analyze  -> save record (timestamp, name, scores, answers)
app.post('/analyze', (req, res) => {
  try {
    ensureFile();
    const body = req.body || {};
    // validate minimal shape
    if (!body.scores || !body.answers) {
      // allow older payloads (answers-only) as fallback
      if (Array.isArray(body.answers)) {
        const fallback = { timestamp: new Date().toISOString(), name: body.name || '', scores: {}, answers: body.answers };
        const db = JSON.parse(fs.readFileSync(RESULTS_FILE));
        db.push(fallback);
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(db, null, 2));
        return res.json({ ok: true, saved: true, fallback: true });
      }
      return res.status(400).json({ ok:false, message:'Expected payload with scores & answers' });
    }

    const record = {
      timestamp: body.timestamp || new Date().toISOString(),
      name: body.name || '',
      scores: body.scores,
      answers: body.answers
    };

    const db = JSON.parse(fs.readFileSync(RESULTS_FILE));
    db.push(record);
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(db, null, 2));

    res.json({ ok:true, saved:true });
  } catch (err) {
    console.error('Save error', err);
    res.status(500).json({ ok:false, error: err.message });
  }
});

// GET /results -> return array of saved records
app.get('/results', (req, res) => {
  try {
    ensureFile();
    const db = JSON.parse(fs.readFileSync(RESULTS_FILE));
    res.json(db);
  } catch (err) {
    res.status(500).json({ ok:false, error: err.message });
  }
});

// fallback: serve index.html for root (already served by static), but keep this
app.get('/', (req, res) => {
  if (fs.existsSync(path.join(FRONTEND_PATH, 'index.html'))) {
    res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
  } else {
    res.send('Frontend not found');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));