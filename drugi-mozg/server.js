'use strict';

const express = require('express');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const QRCode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');

const store = require('./lib/store');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3100;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Losowy kod dostepu generowany przy kazdym starcie serwera.
// Trafia do linku/QR-kodu, wiec tylko ten, kto zeskanowal kod (albo dostal
// link), moze czytac i zmieniac notatki - nawet jesli ktos inny jest
// w tej samej sieci WiFi.
const TOKEN = crypto.randomBytes(4).toString('hex');

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
app.use(express.json({ limit: '5mb' }));

function checkToken(req, res, next) {
  const token = req.query.token || req.headers['x-access-token'];
  if (token !== TOKEN) {
    return res.status(403).json({
      ok: false,
      error: 'Nieprawidlowy lub brakujacy kod dostepu. Zeskanuj kod QR ponownie z ekranu komputera.',
    });
  }
  next();
}

function withId(handler) {
  return (req, res, next) => {
    if (!store.isValidId(req.params.id)) {
      return res.status(400).json({ ok: false, error: 'Nieprawidlowy identyfikator notatki.' });
    }
    try {
      handler(req, res);
    } catch (err) {
      next(err);
    }
  };
}

app.use(express.static(PUBLIC_DIR));

app.get('/api/info', (req, res) => {
  res.json({ hostname: os.hostname(), urls: getLocalIPs().map(buildUrl) });
});

// Lekki endpoint dla wskaznika polaczenia w naglowku aplikacji.
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, hostname: os.hostname() });
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

app.use('/api', checkToken);

app.get('/api/notes', (req, res) => {
  const notes = store.search(req.query.q || '', req.query.tag || '');
  res.json({
    ok: true,
    count: notes.length,
    notes: notes.map(({ body, ...rest }) => rest), // lista nie potrzebuje pelnej tresci
  });
});

app.post('/api/notes', (req, res) => {
  const note = store.createNote({
    title: req.body.title,
    body: req.body.body,
    tags: req.body.tags,
  });
  res.status(201).json({ ok: true, note });
});

app.get('/api/tags', (req, res) => {
  res.json({ ok: true, tags: store.allTags() });
});

// Notatka na dzisiaj - tworzona automatycznie przy pierwszym wejsciu.
app.get('/api/today', (req, res) => {
  const note = store.todayNote();
  const all = store.listNotes();
  res.json({
    ok: true,
    note,
    backlinks: store.backlinks(note.id, all),
    outlinks: store.outlinks(note, all),
  });
});

app.get(
  '/api/notes/:id',
  withId((req, res) => {
    const note = store.readNote(req.params.id);
    if (!note) return res.status(404).json({ ok: false, error: 'Nie ma takiej notatki.' });

    const all = store.listNotes();
    res.json({
      ok: true,
      note,
      backlinks: store.backlinks(note.id, all),
      outlinks: store.outlinks(note, all),
    });
  })
);

app.put(
  '/api/notes/:id',
  withId((req, res) => {
    const note = store.updateNote(req.params.id, {
      title: req.body.title,
      body: req.body.body,
      tags: req.body.tags,
    });
    if (!note) return res.status(404).json({ ok: false, error: 'Nie ma takiej notatki.' });
    res.json({ ok: true, note });
  })
);

app.delete(
  '/api/notes/:id',
  withId((req, res) => {
    if (!store.deleteNote(req.params.id)) {
      return res.status(404).json({ ok: false, error: 'Nie ma takiej notatki.' });
    }
    res.json({ ok: true });
  })
);

app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, error: 'Nieznany endpoint.' });
});

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(500).json({ ok: false, error: 'Blad serwera.' });
});

app.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();

  console.log('\n🧠  Drugi Mozg - serwer notatek uruchomiony!\n');
  console.log(`   Notatki zapisuja sie w: ${store.NOTES_DIR}\n`);
  console.log(`   Na tym komputerze: ${buildUrl('localhost')}\n`);

  if (ips.length === 0) {
    console.log('   ⚠️  Nie wykryto adresu w sieci lokalnej.');
    console.log('      Zeby wejsc z telefonu, podlacz komputer do WiFi.\n');
    return;
  }

  console.log('   Adresy w sieci lokalnej (telefon musi byc w tej samej sieci WiFi):');
  ips.forEach((ip) => console.log(`     ${buildUrl(ip)}`));

  console.log('\n   Zeskanuj ponizszy kod QR aparatem telefonu, zeby otworzyc aplikacje:\n');
  qrcodeTerminal.generate(buildUrl(ips[0]), { small: true });
  console.log('');
});
