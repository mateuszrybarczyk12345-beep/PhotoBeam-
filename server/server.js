'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const QRCode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Losowy kod dostepu generowany przy kazdym starcie serwera.
// Trafia do linku/QR-kodu, wiec tylko ten, kto zeskanowal kod
// (albo dostal link), moze przesylac pliki - nawet jesli ktos
// inny jest w tej samej sieci WiFi.
const TOKEN = crypto.randomBytes(4).toString('hex');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function getLocalIPs() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

function buildUrl(ip) {
  return `http://${ip}:${PORT}/?token=${TOKEN}`;
}

const app = express();
app.disable('x-powered-by');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const dir = path.join(UPLOAD_DIR, today);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).slice(0, 10);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 60);
    const unique = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    cb(null, `${unique}-${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 30 }, // 50 MB / zdjecie, max 30 na raz
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Dozwolone sa tylko pliki graficzne'));
    }
  },
});

function checkToken(req, res, next) {
  const token = req.query.token || req.headers['x-upload-token'];
  if (token !== TOKEN) {
    return res.status(403).json({
      ok: false,
      error: 'Nieprawidlowy lub brakujacy kod dostepu. Zeskanuj kod QR ponownie z ekranu komputera.',
    });
  }
  next();
}

app.use(express.static(PUBLIC_DIR));

app.get('/api/info', (req, res) => {
  const ips = getLocalIPs();
  res.json({
    hostname: os.hostname(),
    urls: ips.map(buildUrl),
  });
});

app.get('/api/qr.png', async (req, res, next) => {
  try {
    const ip = getLocalIPs()[0] || 'localhost';
    res.type('png');
    await QRCode.toFileStream(res, buildUrl(ip), { width: 320, margin: 1 });
  } catch (err) {
    next(err);
  }
});

app.post('/api/upload', checkToken, (req, res) => {
  upload.array('photos', 30)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
    const files = (req.files || []).map((f) => ({ name: f.filename, size: f.size }));
    if (files.length === 0) {
      return res.status(400).json({ ok: false, error: 'Nie otrzymano zadnych plikow.' });
    }
    res.json({ ok: true, count: files.length, files });
  });
});

// Blokuj przegladanie/pobieranie zapisanych zdjec bez tokenu.
app.use('/uploads', checkToken, express.static(UPLOAD_DIR));

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(500).json({ ok: false, error: 'Blad serwera.' });
});

app.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();

  console.log('\n📷  Serwer odbioru zdjec uruchomiony!\n');
  console.log(`   Zdjecia beda zapisywane w: ${UPLOAD_DIR}\n`);

  if (ips.length === 0) {
    console.log('   ⚠️  Nie wykryto adresu w sieci lokalnej.');
    console.log('      Upewnij sie, ze komputer jest podlaczony do WiFi/sieci lokalnej.\n');
    console.log(`   Mozesz przetestowac lokalnie: ${buildUrl('localhost')}\n`);
    return;
  }

  console.log('   Adresy w sieci lokalnej (telefon musi byc w tej samej sieci WiFi):');
  ips.forEach((ip) => console.log(`     ${buildUrl(ip)}`));

  console.log('\n   Zeskanuj ponizszy kod QR aparatem telefonu, zeby otworzyc aplikacje:\n');
  qrcodeTerminal.generate(buildUrl(ips[0]), { small: true });
  console.log('');
});
