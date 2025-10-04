/*
  Minimal Express backend for StoryChain MVP.
  - stores chains and contributions in SQLite
  - when threshold is reached, calls OpenAI to generate a paragraph
  - Expects OPENAI_API_KEY in process.env (server-side)
  - DO NOT put your API key in frontend code. Keep it secret.

  Marked places where you must add secrets are in .env (see .env.example).
*/

require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const cors = require('cors');

const PORT = process.env.PORT || 3000;
const OPENAI_KEY = process.env.OPENAI_API_KEY; // <-- PLACE YOUR OPENAI KEY IN backend/.env, NEVER IN FRONTEND
const THRESHOLD = parseInt(process.env.THRESHOLD || '6', 10);

if (!OPENAI_KEY) {
  console.warn("WARNING: OPENAI_API_KEY is not set. Put your key in backend/.env before starting.");
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

let db;

(async () => {
  db = await sqlite.open({ filename: process.env.DATABASE_URL || './db.sqlite', driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS chains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT DEFAULT 'open',
      paragraph TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chain_id INTEGER,
      text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
})();

// Create a new chain
app.post('/api/chains', async (req, res) => {
  const result = await db.run("INSERT INTO chains (status) VALUES ('open')");
  res.json({ chainId: result.lastID });
});

// Contribute to a chain
app.post('/api/chains/:id/contribute', async (req, res) => {
  const chainId = Number(req.params.id);
  const { text } = req.body;
  if (!text || typeof text !== 'string' || text.length < 1 || text.length > 300) {
    return res.status(400).json({ error: 'text required (1-300 chars)' });
  }

  // Basic moderation: no links
  if (/https?:\/\//i.test(text)) {
    return res.status(400).json({ error: 'no links allowed' });
  }

  await db.run("INSERT INTO contributions (chain_id, text) VALUES (?, ?)", [chainId, text]);
  const row = await db.get("SELECT COUNT(*) as cnt FROM contributions WHERE chain_id = ?", [chainId]);
  const count = row.cnt;

  // If threshold reached, generate paragraph
  if (count >= THRESHOLD) {
    // fetch contributions
    const rows = await db.all("SELECT text FROM contributions WHERE chain_id = ? ORDER BY id", [chainId]);
    const contributions = rows.map(r => r.text);

    try {
      const paragraph = await generateParagraph(contributions);
      await db.run("UPDATE chains SET status = 'finished', paragraph = ? WHERE id = ?", [paragraph, chainId]);
      return res.json({ done: true, paragraph });
    } catch (err) {
      console.error('OpenAI error:', err.message || err);
      return res.status(500).json({ error: 'generation failed' });
    }
  }

  res.json({ done: false, contributions: count });
});

// Get chain result
app.get('/api/chains/:id', async (req, res) => {
  const chainId = Number(req.params.id);
  const chain = await db.get("SELECT * FROM chains WHERE id = ?", [chainId]);
  const contributions = await db.all("SELECT text FROM contributions WHERE chain_id = ? ORDER BY id", [chainId]);
  res.json({ chain, contributions });
});

// OpenAI call (uses Chat Completions)
async function generateParagraph(contributions) {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY not set');

  const system = `You are an imaginative editor. Produce a single coherent paragraph (70-160 words) that continues this collaborative story. Include or echo each contributor's sentence in order, but do not mention contributors or metadata. Keep it literary and surprising. Output only the paragraph.`;
  let user = "Here are the contributions in order:\n";
  contributions.forEach((c,i) => { user += `${i+1}) "${c.replace(/\"/g,'')}"\n`; });
  user += "\nNow produce one single paragraph continuation.";

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}` // <-- secure server-side
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // pick the model you have access to
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      max_tokens: 300,
      temperature: 0.9
    })
  });

  const data = await resp.json();
  if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('invalid openai response');
  }
  return data.choices[0].message.content.trim();
}

// Endpoint to safely expose public config like receiver address
app.get('/api/config', async (req, res) => {
  const receiver = process.env.RECEIVER_ADDRESS || null; // <-- set backend/.env RECEIVER_ADDRESS
  // Do not expose secret keys here. Only non-sensitive public config.
  res.json({ receiverAddress: receiver });
});


app.listen(PORT, () => {
  console.log(`StoryChain backend listening on port ${PORT}`);
});
