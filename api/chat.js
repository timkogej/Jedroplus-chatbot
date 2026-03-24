const https = require('https');
const { URL } = require('url');

const API_TARGET = 'https://tikej.app.n8n.cloud/webhook/chat-termini';
const N8N_API_KEY = process.env.N8N_WEBHOOK_API_KEY;
const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS || '')
  .split(',')
  .map(d => d.trim().toLowerCase())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return false;
  try {
    const originHost = new URL(origin).hostname.toLowerCase();
    for (const allowed of ALLOWED_DOMAINS) {
      if (allowed.startsWith('*.')) {
        const suffix = allowed.slice(2);
        if (originHost.endsWith(suffix) || originHost === suffix) return true;
      } else if (originHost === allowed || originHost === `www.${allowed}`) {
        return true;
      }
    }
  } catch (e) {
    return false;
  }
  return false;
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';

  // CORS headers
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = JSON.stringify(req.body);
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  };
  if (N8N_API_KEY) {
    headers['X-API-Key'] = N8N_API_KEY;
  }

  return new Promise((resolve) => {
    const targetUrl = new URL(API_TARGET);
    const proxyReq = https.request(
      {
        hostname: targetUrl.hostname,
        port: 443,
        path: targetUrl.pathname,
        method: 'POST',
        headers,
      },
      (proxyRes) => {
        let data = '';
        proxyRes.on('data', (chunk) => { data += chunk; });
        proxyRes.on('end', () => {
          try {
            res.status(proxyRes.statusCode).json(JSON.parse(data));
          } catch (e) {
            res.status(proxyRes.statusCode).send(data);
          }
          resolve();
        });
      }
    );

    proxyReq.on('error', (err) => {
      console.error('[chat proxy] n8n error:', err.message);
      res.status(502).json({ error: 'Backend unavailable' });
      resolve();
    });

    proxyReq.write(body);
    proxyReq.end();
  });
};
