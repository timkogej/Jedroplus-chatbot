/**
 * 🔐 Secure CORS Proxy Server for Chatbot+
 * 
 * Features:
 * - Rate limiting (100 req/min per IP)
 * - Domain whitelist for CORS
 * - Input validation & sanitization
 * - Request size limits
 * - Logging
 * 
 * Run: node proxy-server.js
 */

require('dotenv').config();

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 3000;
const API_TARGET = 'https://tikej.app.n8n.cloud/webhook/chat-termini';
const N8N_API_KEY = process.env.N8N_WEBHOOK_API_KEY;

// Allowed domains for CORS (from .env or default)
const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS || 'localhost,127.0.0.1')
  .split(',')
  .map(d => d.trim().toLowerCase());

// Rate limiting config
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;    // 100 requests per minute per IP

// Request limits
const MAX_BODY_SIZE = 10 * 1024; // 10KB max request body
const MAX_MESSAGE_LENGTH = 2000; // Max message length

// ============================================================================
// RATE LIMITING (in-memory, simple)
// ============================================================================

const rateLimitStore = new Map();

function getRateLimitKey(req) {
  // Get client IP (handle proxies)
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
  return ip || 'unknown';
}

function isRateLimited(key) {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (now > record.resetAt) {
    // Window expired, reset
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  record.count++;
  
  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  return false;
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ============================================================================
// CORS & DOMAIN VALIDATION
// ============================================================================

function isAllowedOrigin(origin) {
  if (!origin) return false;
  
  try {
    const originHost = new URL(origin).hostname.toLowerCase();
    
    for (const allowed of ALLOWED_DOMAINS) {
      // Wildcard support (*.webflow.io)
      if (allowed.startsWith('*.')) {
        const suffix = allowed.slice(2);
        if (originHost.endsWith(suffix) || originHost === suffix.slice(1)) {
          return true;
        }
      } else if (originHost === allowed || originHost === `www.${allowed}`) {
        return true;
      }
    }
  } catch (e) {
    return false;
  }
  
  return false;
}

function setCorsHeaders(res, origin) {
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')     // Remove HTML tags
    .replace(/[<>]/g, '')        // Remove < >
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .trim();
}

function validateChatPayload(body) {
  const errors = [];
  
  // Must be an object
  if (typeof body !== 'object' || body === null) {
    return { valid: false, errors: ['Invalid payload'] };
  }
  
  // Validate message
  if (body.message !== undefined) {
    if (typeof body.message !== 'string') {
      errors.push('message must be a string');
    } else if (body.message.length > MAX_MESSAGE_LENGTH) {
      errors.push(`message too long (max ${MAX_MESSAGE_LENGTH} chars)`);
    }
  }
  
  // Validate company_slug
  if (body.company_slug !== undefined) {
    if (typeof body.company_slug !== 'string') {
      errors.push('company_slug must be a string');
    } else if (body.company_slug.length > 100) {
      errors.push('company_slug too long');
    } else if (!/^[a-z0-9\-_]+$/i.test(body.company_slug)) {
      errors.push('company_slug contains invalid characters');
    }
  }
  
  // Check for honeypot (bot detection)
  if (body.website && body.website.length > 0) {
    return { valid: false, errors: ['Bot detected'], isBot: true };
  }
  
  return { valid: errors.length === 0, errors };
}

function sanitizePayload(body) {
  const sanitized = {};
  
  // Copy and sanitize known fields
  if (body.message) sanitized.message = sanitizeString(body.message);
  if (body.company_slug) sanitized.company_slug = body.company_slug.toLowerCase().trim();
  if (body.session_id) sanitized.session_id = String(body.session_id).slice(0, 100);
  if (body.language) sanitized.language = String(body.language).slice(0, 10);
  
  // Copy booking data if present (with sanitization)
  if (body.bookingData && typeof body.bookingData === 'object') {
    sanitized.bookingData = {};
    for (const [key, value] of Object.entries(body.bookingData)) {
      if (typeof value === 'string') {
        sanitized.bookingData[key] = sanitizeString(value).slice(0, 500);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized.bookingData[key] = value;
      }
    }
  }
  
  return sanitized;
}

// ============================================================================
// LOGGING
// ============================================================================

function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, ...data };
  
  if (level === 'error') {
    console.error(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

// ============================================================================
// MIME TYPES
// ============================================================================

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

// ============================================================================
// SERVER
// ============================================================================

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  const clientIp = getRateLimitKey(req);
  
  // Set CORS headers
  setCorsHeaders(res, origin);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // ========================================
  // PROXY API REQUESTS
  // ========================================
  if ((req.url === '/api/webhook' || req.url === '/api/chat') && req.method === 'POST') {
    
    // Check CORS for API requests
    if (origin && !isAllowedOrigin(origin)) {
      log('warn', 'CORS blocked', { origin, ip: clientIp });
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Origin not allowed' }));
      return;
    }
    
    // Check rate limit
    if (isRateLimited(clientIp)) {
      log('warn', 'Rate limited', { ip: clientIp });
      res.writeHead(429, { 
        'Content-Type': 'application/json',
        'Retry-After': '60'
      });
      res.end(JSON.stringify({ error: 'Too many requests. Please wait.' }));
      return;
    }
    
    // Collect body with size limit
    let body = '';
    let bodySize = 0;
    
    req.on('data', chunk => {
      bodySize += chunk.length;
      if (bodySize > MAX_BODY_SIZE) {
        log('warn', 'Request too large', { ip: clientIp, size: bodySize });
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request too large' }));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });
    
    req.on('end', () => {
      // Parse JSON
      let payload;
      try {
        payload = JSON.parse(body);
      } catch (e) {
        log('warn', 'Invalid JSON', { ip: clientIp });
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }
      
      // Validate payload
      const validation = validateChatPayload(payload);
      if (!validation.valid) {
        if (validation.isBot) {
          // Silently accept but don't process (fool the bot)
          log('info', 'Bot detected', { ip: clientIp });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
        
        log('warn', 'Validation failed', { ip: clientIp, errors: validation.errors });
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: validation.errors.join(', ') }));
        return;
      }
      
      // Sanitize payload
      const sanitizedPayload = sanitizePayload(payload);
      const sanitizedBody = JSON.stringify(sanitizedPayload);
      
      // Forward to n8n
      const targetUrl = new url.URL(API_TARGET);
      
      const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(sanitizedBody),
        'X-Forwarded-For': clientIp
      };
      
      if (N8N_API_KEY) {
        headers['X-API-Key'] = N8N_API_KEY;
      }
      
      const proxyOptions = {
        hostname: targetUrl.hostname,
        port: 443,
        path: targetUrl.pathname,
        method: 'POST',
        headers
      };
      
      const proxyReq = https.request(proxyOptions, (proxyRes) => {
        let responseBody = '';
        
        proxyRes.on('data', chunk => {
          responseBody += chunk.toString();
        });
        
        proxyRes.on('end', () => {
          log('info', 'Request proxied', { 
            ip: clientIp, 
            status: proxyRes.statusCode,
            company: sanitizedPayload.company_slug 
          });
          
          res.writeHead(proxyRes.statusCode, { 
            'Content-Type': 'application/json' 
          });
          res.end(responseBody);
        });
      });
      
      proxyReq.on('error', (error) => {
        log('error', 'Proxy error', { ip: clientIp, error: error.message });
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Backend unavailable' }));
      });
      
      proxyReq.write(sanitizedBody);
      proxyReq.end();
    });
    
    return;
  }
  
  // ========================================
  // SERVE STATIC FILES
  // ========================================
  let filePath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  filePath = path.join(__dirname, filePath);
  
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not found');
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

// ============================================================================
// START SERVER
// ============================================================================

server.listen(PORT, () => {
  console.log('\n🔐 Chatbot+ Secure Proxy Server');
  console.log('================================');
  console.log(`🚀 Running at: http://localhost:${PORT}`);
  console.log(`📡 API proxy: /api/chat -> ${API_TARGET}`);
  console.log(`🔑 API Key: ${N8N_API_KEY ? '✓ loaded' : '✗ NOT SET'}`);
  console.log(`🌐 Allowed domains: ${ALLOWED_DOMAINS.join(', ')}`);
  console.log(`⏱️  Rate limit: ${RATE_LIMIT_MAX_REQUESTS} req/min per IP`);
  console.log('');
});