// Serves the built frontend (../frontend/build) for the tests.
// Real files are served as they are; any other path without a file extension (/cart, /checkout)
// gets index.html, so the app's own router can handle it, as on the deployed site.
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../frontend/build');
const port = Number(process.argv[2] || 3000);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml', '.csv': 'text/csv', '.txt': 'text/plain', '.map': 'application/json',
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(root, urlPath);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    if (path.extname(urlPath)) { res.writeHead(404); return res.end('Not found'); }
    file = path.join(root, 'index.html');
  }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
