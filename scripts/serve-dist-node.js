#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = parseInt(process.argv[2], 10) || 5000;
const openFlag = process.argv.includes('--open') || process.argv.includes('-o');
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
  let decoded = decodeURIComponent(req.url.split('?')[0] || '/');
  // normalize leading slashes so path.join doesn't treat it as absolute on Windows
  if (decoded.startsWith('/')) decoded = decoded.substring(1);
  if (decoded === '') decoded = 'index.html';
  let filePath = path.join(root, decoded);
  // if the request targets a directory (ends with slash), serve index.html
  if (req.url.endsWith('/') || filePath.endsWith(path.sep)) filePath = path.join(filePath, 'index.html');

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
  if (openFlag) {
    const url = `http://localhost:${port}`;
    const cp = require('child_process');
    try {
      if (process.platform === 'win32') {
        cp.exec(`start "" "${url}"`);
      } else if (process.platform === 'darwin') {
        cp.exec(`open "${url}"`);
      } else {
        cp.exec(`xdg-open "${url}"`);
      }
    } catch (e) {
      console.error('Failed to open browser:', e);
    }
  }
});
