#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = parseInt(process.argv[2], 10) || 5000;
const root = path.resolve(process.cwd(), 'dist');

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff'
  };
  return map[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  try {
    const decoded = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(root, decoded);
    if (filePath.endsWith(path.sep)) filePath = path.join(filePath, 'index.html');

    // Prevent path traversal
    if (!filePath.startsWith(root)) {
      res.statusCode = 403;
      return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      fs.readFile(filePath, (readErr, data) => {
        if (readErr) {
          // SPA fallback to index.html
          const indexPath = path.join(root, 'index.html');
          fs.readFile(indexPath, (ixErr, ixData) => {
            if (ixErr) {
              res.statusCode = 404;
              res.end('Not found');
            } else {
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(ixData);
            }
          });
          return;
        }

        res.setHeader('Content-Type', contentType(filePath));
        res.end(data);
      });
    });
  } catch (e) {
    res.statusCode = 500;
    res.end('Server error');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Serving ${root} on http://localhost:${port}`);
});
