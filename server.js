const http = require('http');
const fs = require('fs');
const path = require('path');
const chatHandler = require('./api/chat.js');

// Lightweight .env loader (zero external dependencies)
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
      console.log('📄 .env 환경 변수를 성공적으로 불러왔습니다.');
    } catch (e) {
      console.warn('⚠️ .env 로드 중 오류:', e.message);
    }
  }
}
loadEnv();

const PORT = process.env.PORT || 3000;

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. API endpoint (routed to shared chatHandler for Vercel & local parity)
  if (pathname === '/api/chat') {
    return chatHandler(req, res);
  }

  // 2. Static file serving (check public/ then root)
  let reqPath = pathname === '/' ? '/index.html' : pathname;
  let filePath = path.join(__dirname, 'public', reqPath);

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = path.join(__dirname, reqPath);
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(`🌱 초등학교 6학년을 위한 AI 마음 건강 도우미 웹 서버`);
  console.log(`👉 로컬 주소(Localhost): http://localhost:${PORT}`);
  if (process.env.OPENAI_API_KEY || process.env.GPT_API_KEY) {
    console.log(`🔑 OpenAI GPT API 키 연동 활성화됨`);
  }
  if (process.env.GEMINI_API_KEY) {
    console.log(`🔑 Google Gemini API 키 연동 활성화됨`);
  }
  console.log(`=================================================`);
});
