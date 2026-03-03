require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const url = require('url');

const PORT = 8080;
const N8N_WEBHOOK = 'https://tikej.app.n8n.cloud/webhook/chat-termini';
const N8N_API_KEY = process.env.N8N_WEBHOOK_API_KEY;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Proxy API requests to n8n
  if ((req.url === '/api/webhook' || req.url === '/api/chat') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const webhookUrl = new url.URL(N8N_WEBHOOK);

      const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      };
      if (N8N_API_KEY) headers['X-API-Key'] = N8N_API_KEY;

      const options = {
        hostname: webhookUrl.hostname,
        path: webhookUrl.pathname,
        method: 'POST',
        headers
      };

      const proxyReq = https.request(options, proxyRes => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => {
          res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(data);
        });
      });

      proxyReq.on('error', err => {
        console.error('Proxy error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy error' }));
      });

      proxyReq.write(body);
      proxyReq.end();
    });
    return;
  }

  // Serve static files
  let filePath = req.url.split('?')[0];
  if (filePath === '/' || filePath.startsWith('/chatbot/')) {
    filePath = '/index.html';
  }

  const fullPath = path.join(__dirname, filePath);
  const ext = path.extname(fullPath);

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Try index.html for SPA routing
        fs.readFile(path.join(__dirname, 'index.html'), (err2, content2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content2);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`API proxy: /api/webhook -> ${N8N_WEBHOOK}`);
  console.log(`X-API-Key: ${N8N_API_KEY ? '✓ loaded from .env' : '✗ NOT SET'}`);
});
