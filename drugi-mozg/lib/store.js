'use strict';

// Warstwa przechowywania notatek.
//
// Kazda notatka to zwykly plik .md w folderze `notatki/`, z krotkim
// naglowkiem miedzy liniami "---". Dzieki temu notatki mozna czytac,
// edytowac i backupowac bez tej aplikacji - to zwykly tekst na dysku,
// zadnej bazy danych ani zamknietego formatu.

const fs = require('fs');
const path = require('path');

const NOTES_DIR = path.join(__dirname, '..', 'notatki');

const POLISH_MAP = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
  Ą: 'a', Ć: 'c', Ę: 'e', Ł: 'l', Ń: 'n', Ó: 'o', Ś: 's', Ź: 'z', Ż: 'z',
};

function ensureDir() {
  if (!fs.existsSync(NOTES_DIR)) {
    fs.mkdirSync(NOTES_DIR, { recursive: true });
  }
}

/** Zamienia tekst na porownywalna forme: bez polskich znakow, malymi literami. */
function normalize(text) {
  return String(text || '')
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (ch) => POLISH_MAP[ch])
    .toLowerCase()
    .trim();
}

/** Nazwa pliku dla notatki - bezpieczna na kazdym systemie plikow. */
function slugify(title) {
  const slug = normalize(title)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'notatka';
}

function notePath(id) {
  return path.join(NOTES_DIR, `${id}.md`);
}

/** Sprawdza, czy id notatki jest bezpieczne (bez ../ i podkatalogow). */
function isValidId(id) {
  return typeof id === 'string' && /^[a-z0-9][a-z0-9-]{0,99}$/.test(id);
}

function parseTags(value) {
  return String(value || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Rozdziela plik na naglowek (metadane) i tresc. */
function parseNoteFile(raw) {
  const meta = {};
  let body = raw;

  if (raw.startsWith('---')) {
    const end = raw.indexOf('\n---', 3);
    if (end !== -1) {
      const header = raw.slice(raw.indexOf('\n') + 1, end);
      body = raw.slice(end + 4).replace(/^\r?\n/, '');
      header.split(/\r?\n/).forEach((line) => {
        const sep = line.indexOf(':');
        if (sep === -1) return;
        meta[line.slice(0, sep).trim()] = line.slice(sep + 1).trim();
      });
    }
  }

  return { meta, body };
}

function serializeNote(note) {
  return [
    '---',
    `tytul: ${note.title}`,
    `tagi: ${note.tags.join(', ')}`,
    `utworzono: ${note.created}`,
    `zmieniono: ${note.updated}`,
    '---',
    '',
    note.body.replace(/\s+$/, ''),
    '',
  ].join('\n');
}

function readNote(id) {
  let raw;
  try {
    raw = fs.readFileSync(notePath(id), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }

  const { meta, body } = parseNoteFile(raw);
  const stat = fs.statSync(notePath(id));

  return {
    id,
    title: meta.tytul || id,
    tags: parseTags(meta.tagi),
    created: meta.utworzono || stat.birthtime.toISOString(),
    updated: meta.zmieniono || stat.mtime.toISOString(),
    body,
  };
}

function listNotes() {
  ensureDir();
  return fs
    .readdirSync(NOTES_DIR)
    .filter((name) => name.endsWith('.md'))
    .map((name) => readNote(name.slice(0, -3)))
    .filter(Boolean)
    .sort((a, b) => b.updated.localeCompare(a.updated));
}

/** Wolne id na podstawie tytulu (dopisuje -2, -3... jesli zajete). */
function freeId(title) {
  ensureDir();
  const base = slugify(title);
  if (!fs.existsSync(notePath(base))) return base;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base}-${i}`;
    if (!fs.existsSync(notePath(candidate))) return candidate;
  }
  return `${base}-${Date.now()}`;
}

function createNote({ title, body, tags, id }) {
  ensureDir();
  const now = new Date().toISOString();
  const note = {
    id: id && isValidId(id) && !fs.existsSync(notePath(id)) ? id : freeId(title),
    title: String(title || '').trim() || 'Bez tytulu',
    tags: Array.isArray(tags) ? tags.filter(Boolean).map(String) : parseTags(tags),
    created: now,
    updated: now,
    body: String(body || ''),
  };
  fs.writeFileSync(notePath(note.id), serializeNote(note), 'utf8');
  return note;
}

function updateNote(id, changes) {
  const existing = readNote(id);
  if (!existing) return null;

  const note = {
    ...existing,
    title:
      changes.title === undefined
        ? existing.title
        : String(changes.title).trim() || 'Bez tytulu',
    tags:
      changes.tags === undefined
        ? existing.tags
        : Array.isArray(changes.tags)
          ? changes.tags.filter(Boolean).map(String)
          : parseTags(changes.tags),
    body: changes.body === undefined ? existing.body : String(changes.body),
    updated: new Date().toISOString(),
  };

  fs.writeFileSync(notePath(id), serializeNote(note), 'utf8');
  return note;
}

function deleteNote(id) {
  if (!fs.existsSync(notePath(id))) return false;
  fs.unlinkSync(notePath(id));
  return true;
}

/** Wyciaga wszystkie linki [[Tytul]] / [[Tytul|opis]] z tresci. */
function extractLinks(body) {
  const links = [];
  const re = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
  let match = re.exec(body);
  while (match) {
    links.push(match[1].trim());
    match = re.exec(body);
  }
  return links;
}

/** Mapa: znormalizowany tytul/id -> id notatki. */
function buildTitleIndex(notes) {
  const index = new Map();
  notes.forEach((note) => {
    index.set(normalize(note.title), note.id);
    index.set(note.id, note.id);
  });
  return index;
}

/** Notatki, ktore linkuja do wskazanej notatki. */
function backlinks(id, notes) {
  const all = notes || listNotes();
  const target = all.find((n) => n.id === id);
  if (!target) return [];

  const wanted = new Set([normalize(target.title), target.id]);

  return all
    .filter((note) => note.id !== id)
    .filter((note) => extractLinks(note.body).some((link) => wanted.has(normalize(link))))
    .map((note) => ({ id: note.id, title: note.title }));
}

/** Linki z notatki - z informacja, czy cel juz istnieje. */
function outlinks(note, notes) {
  const index = buildTitleIndex(notes || listNotes());
  const seen = new Set();
  return extractLinks(note.body)
    .filter((link) => {
      const key = normalize(link);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((link) => ({
      title: link,
      id: index.get(normalize(link)) || null,
    }));
}

function excerpt(body, terms) {
  const plain = body.replace(/[#>*`_[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) return '';

  const haystack = normalize(plain);
  const at = terms.length ? haystack.indexOf(terms[0]) : -1;
  if (at === -1) return plain.slice(0, 160);

  const start = Math.max(0, at - 50);
  return (start > 0 ? '...' : '') + plain.slice(start, start + 180);
}

/**
 * Szuka notatek. Pusty tekst = wszystkie (najnowsze pierwsze).
 * Wszystkie slowa musza wystapic w notatce; tytul i tagi licza sie mocniej.
 */
function search(query, tag) {
  let notes = listNotes();

  if (tag) {
    const wanted = normalize(tag);
    notes = notes.filter((note) => note.tags.some((t) => normalize(t) === wanted));
  }

  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return notes.map((note) => ({ ...note, excerpt: excerpt(note.body, []), score: 0 }));
  }

  return notes
    .map((note) => {
      const title = normalize(note.title);
      const tags = normalize(note.tags.join(' '));
      const body = normalize(note.body);

      let score = 0;
      const matchesAll = terms.every((term) => {
        let hit = false;
        if (title.includes(term)) {
          score += 10;
          hit = true;
        }
        if (tags.includes(term)) {
          score += 5;
          hit = true;
        }
        const occurrences = body.split(term).length - 1;
        if (occurrences > 0) {
          score += Math.min(occurrences, 5);
          hit = true;
        }
        return hit;
      });

      return matchesAll ? { ...note, excerpt: excerpt(note.body, terms), score } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || b.updated.localeCompare(a.updated));
}

/** Lista tagow z liczba notatek. */
function allTags() {
  const counts = new Map();
  listNotes().forEach((note) => {
    note.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
  });
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Notatka na dzis - tworzona przy pierwszym wejsciu danego dnia. */
function todayNote() {
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

  const id = `dziennik-${stamp}`;
  const existing = readNote(id);
  if (existing) return existing;

  return createNote({
    id,
    title: `Dziennik ${stamp}`,
    tags: ['dziennik'],
    body: '',
  });
}

module.exports = {
  NOTES_DIR,
  allTags,
  backlinks,
  createNote,
  deleteNote,
  isValidId,
  listNotes,
  outlinks,
  readNote,
  search,
  todayNote,
  updateNote,
};
