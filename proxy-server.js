/**
 * Simple CORS Proxy Server for Chatbot+ Development
 * This proxy forwards requests to the n8n webhook and adds CORS headers
 *
 * Run: node proxy-server.js
 * Then open: http://localhost:3000
 */

require('dotenv').config();

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const API_TARGET = 'https://tikej.app.n8n.cloud/webhook/chat-termini';
const N8N_API_KEY = process.env.N8N_WEBHOOK_API_KEY;

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Add CORS headers to all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Proxy API requests
  if ((req.url === '/api/webhook' || req.url === '/api/chat') && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const url = new URL(API_TARGET);

      const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      };
      if (N8N_API_KEY) headers['X-API-Key'] = N8N_API_KEY;

      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers
      };

      const proxyReq = https.request(options, (proxyRes) => {
        let responseBody = '';

        proxyRes.on('data', chunk => {
          responseBody += chunk.toString();
        });

        proxyRes.on('end', () => {
          res.writeHead(proxyRes.statusCode, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(responseBody);
        });
      });

      proxyReq.on('error', (error) => {
        console.error('Proxy error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy error', message: error.message }));
      });

      proxyReq.write(body);
      proxyReq.end();
    });

    return;
  }

  // Serve static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Chatbot+ Dev Server running at http://localhost:${PORT}\n`);
  console.log(`   Static files served from: ${__dirname}`);
  console.log(`   API proxy: /api/webhook -> ${API_TARGET}`);
  console.log(`   X-API-Key: ${N8N_API_KEY ? '✓ loaded from .env' : '✗ NOT SET'}\n`);
});
