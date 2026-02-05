const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const WAITLIST_FILE = path.join(__dirname, 'waitlist.json');

// Initialize waitlist file if it doesn't exist
if (!fs.existsSync(WAITLIST_FILE)) {
  fs.writeFileSync(WAITLIST_FILE, '[]');
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve static files
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // API: Add to waitlist
  if (req.method === 'POST' && req.url === '/api/waitlist') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { email } = JSON.parse(body);
        if (!email || !email.includes('@')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid email' }));
          return;
        }

        // Read current waitlist
        const waitlist = JSON.parse(fs.readFileSync(WAITLIST_FILE, 'utf8'));
        
        // Check if already exists
        if (waitlist.some(entry => entry.email === email)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Already on waitlist', email }));
          return;
        }

        // Add new entry
        waitlist.push({
          email,
          timestamp: new Date().toISOString(),
          source: req.headers['referer'] || 'direct'
        });

        fs.writeFileSync(WAITLIST_FILE, JSON.stringify(waitlist, null, 2));

        console.log(`✅ New signup: ${email} (Total: ${waitlist.length})`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Added to waitlist', email, count: waitlist.length }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
      }
    });
    return;
  }

  // API: Get waitlist (protected - simple check)
  if (req.method === 'GET' && req.url === '/api/waitlist') {
    const waitlist = JSON.parse(fs.readFileSync(WAITLIST_FILE, 'utf8'));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      count: waitlist.length, 
      emails: waitlist 
    }));
    return;
  }

  // 404 for everything else
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`🚀 Copio landing server running at http://localhost:${PORT}`);
  console.log(`📧 Waitlist API: POST /api/waitlist`);
  console.log(`📊 View waitlist: GET /api/waitlist`);
});
