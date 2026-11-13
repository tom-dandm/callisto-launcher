'use strict';

/* ───────────── constants ───────────── */

const CLIENT_ID = '257581565054-a3i5pvi1akkcq2s9i7rt4jp140pdh7rm.apps.googleusercontent.com';
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const DRIVE = 'https://www.googleapis.com/drive/v3';
const GDOC = 'application/vnd.google-apps.document';
const GFOLDER = 'application/vnd.google-apps.folder';
const GSHORTCUT = 'application/vnd.google-apps.shortcut';
const KINDS = {
  [GDOC]: 'gdoc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.oasis.opendocument.text': 'odt',
  'text/plain': 'txt', 'text/markdown': 'md', 'text/x-markdown': 'md', 'text/html': 'html',
  'application/rtf': 'rtf', 'text/rtf': 'rtf', 'application/epub+zip': 'epub',
};
const EXT_KIND = { txt: 'txt', text: 'txt', md: 'md', markdown: 'md', html: 'html', htm: 'html', xhtml: 'html', docx: 'docx', odt: 'odt', rtf: 'rtf', epub: 'epub' };
const PALETTE = ['#7a4fd0', '#d6457a', '#d9822b', '#3d7fd6', '#2fa39a', '#5f9e3a', '#c0392b', '#8a6d3b', '#5b6ee1', '#b0479a', '#1f8a70', '#6d6875'];
const GROUP_COLORS = { character: '#d9822b', pairing: '#d6457a', relationship: '#d6457a', genre: '#3d7fd6', trope: '#7a4fd0', mood: '#2fa39a', warning: '#c0392b', fandom: '#5b6ee1', status: '#5f9e3a', rating: '#8a6d3b' };
const DEFAULT_GROUPS = ['Character', 'Pairing', 'Genre', 'Trope', 'Mood', 'Warning', 'Other'];
const SCENE_BREAK = /^\s*([*~#=•·_\-+o0xX]\s*){3,}\s*$|^\s*(⁂|§|❧|\* \* \*)\s*$/;
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/* ───────────── small helpers ───────────── */

const $ = s => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wordsIn = s => (s.match(/\S+/g) || []).length;
const fmtWords = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k words' : n + ' words';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const lc = s => (s || '').toLowerCase();
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function hashColor(s, list = PALETTE) { let n = 0; for (const c of s) n = (n * 31 + c.charCodeAt(0)) >>> 0; return list[n % list.length]; }
function fmtDate(t) { return t ? new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }

function h(sel, props, ...kids) {
  if (props == null || typeof props !== 'object' || props instanceof Node || Array.isArray(props)) { kids.unshift(props); props = {}; }
  const [, tag = 'div', rest = ''] = sel.match(/^([a-z0-9-]*)(.*)$/i);
  const el = document.createElement(tag || 'div');
  for (const part of rest.match(/[.#][^.#]+/g) || []) part[0] === '.' ? el.classList.add(part.slice(1)) : (el.id = part.slice(1));
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'css') for (const [p, val] of Object.entries(v)) el.style.setProperty(p, val);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  const add = k => { if (k == null || k === false) return; if (Array.isArray(k)) return k.forEach(add); el.append(k instanceof Node ? k : String(k)); };
  kids.forEach(add);
  return el;
}

const ICONS = {
  library: '<path d="M4 4h4v16H4zM10 4h4v16h-4zM16.5 4.5l3.8 1-3.9 15-3.8-1z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  tag: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.4 1.4 0 0 1 0 2l-6.2 6.2a1.4 1.4 0 0 1-2 0z"/><circle cx="8" cy="8" r="1.4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  arrange: '<path d="M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3"/>',
  handle: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke-width="3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  folder: '<path d="M3.5 6.5a1 1 0 0 1 1-1h4.6l2 2h8.4a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z"/>',
  doc: '<path d="M6.5 3.5h7l4 4v13h-11z"/><path d="M13.5 3.5v4h4M9 12h6M9 15.5h6"/>',
};
// replaceChildren that skips null/false and flattens arrays, like h() does for its children.
function put(el, ...kids) { el.replaceChildren(...kids.flat(Infinity).filter(k => k != null && k !== false)); return el; }
function icon(name) { const s = h('span.ico'); s.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`; return s; }
function iconBtn(name, label, onclick, extra = {}) { const b = h('button.icon-btn', { type: 'button', 'aria-label': label, title: label, on: { click: onclick }, ...extra }); b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`; return b; }

const pref = {
  get(k, d) { try { const v = localStorage.getItem('cal.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('cal.' + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem('cal.' + k); } catch {} },
};

// Reading progress is per viewer and never published: { [storyId]: { status, readPos, lastRead, fav } }.
const P = { all: pref.get('progress', {}) };
const prog = id => ({ status: 'unread', readPos: 0, lastRead: 0, fav: false, ...P.all[id] });
function setProg(id, patch) { P.all[id] = { ...prog(id), ...patch }; pref.set('progress', P.all); }

/* ───────────── toast ───────────── */

let toastTimer;
function toast(msg, action, ms = 3800) {
  const t = $('#toast');
  t.replaceChildren(h('span', msg));
  if (action) t.append(h('button', { type: 'button', on: { click: () => { t.hidden = true; action.run(); } } }, action.label));
  t.hidden = false;
  clearTimeout(toastTimer);
  if (ms) toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}

/* ───────────── storage (IndexedDB) ───────────── */

const STORES = ['stories', 'texts', 'universes', 'tags', 'kv'];
let dbp;
function db() {
  return dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open('callisto', 1);
    r.onupgradeneeded = () => { for (const s of STORES) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s, { keyPath: 'id' }); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function tx(store, mode, fn) {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction(store, mode);
    const out = fn(t.objectStore(store));
    t.oncomplete = () => res(out && 'result' in out ? out.result : out);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error || new Error('Storage write was refused.'));
  });
}
const dbAll = store => tx(store, 'readonly', s => s.getAll());
const dbGet = (store, id) => tx(store, 'readonly', s => s.get(id));
// Any change to the library in manager mode means there is something to publish.
const touch = store => { if (store !== 'kv' && isAdmin() && !S.quiet) pref.set('dirtyAt', Date.now()); };
const dbPut = (store, items) => { touch(store); return tx(store, 'readwrite', s => { for (const i of [].concat(items)) s.put(i); }); };
const dbDel = (store, ids) => { touch(store); return tx(store, 'readwrite', s => { for (const i of [].concat(ids)) s.delete(i); }); };
const dbClear = store => { touch(store); return tx(store, 'readwrite', s => s.clear()); };

/* ───────────── state ───────────── */

const S = {
  stories: new Map(), universes: new Map(), tags: new Map(), texts: new Map(),
  allTexts: false, route: { name: 'library' }, arranging: false, sel: new Set(),
  filter: { tags: new Set(), unread: false }, searchQ: '', ai: null,
};

async function loadAll() {
  const [st, un, tg] = await Promise.all([dbAll('stories'), dbAll('universes'), dbAll('tags')]);
  S.stories = new Map(st.map(x => [x.id, x]));
  S.universes = new Map(un.map(x => [x.id, x]));
  S.tags = new Map(tg.map(x => [x.id, x]));
}

const universesSorted = () => [...S.universes.values()].sort((a, b) => a.order - b.order || collator.compare(a.name, b.name));
const storiesIn = u => [...S.stories.values()].filter(s => (s.universeId || '') === (u || '')).sort((a, b) => a.pos - b.pos || a.addedAt - b.addedAt);
const uName = u => (u && S.universes.get(u)?.name) || 'Unsorted';
const uColor = u => (u && S.universes.get(u)?.color) || 'var(--ink-2)';
const tagColor = t => t.color || GROUP_COLORS[lc(t.group)] || hashColor(t.group || t.name);
const tagsSorted = () => [...S.tags.values()].sort((a, b) => collator.compare(a.group || '', b.group || '') || collator.compare(a.name, b.name));
const tagUse = id => { let n = 0; for (const s of S.stories.values()) if (s.tags.includes(id)) n++; return n; };
const groups = () => [...new Set([...DEFAULT_GROUPS, ...[...S.tags.values()].map(t => t.group).filter(Boolean)])];

async function saveStories(list) { list = [].concat(list); list.forEach(s => S.stories.set(s.id, s)); await dbPut('stories', list); }
async function saveUniverse(u) { S.universes.set(u.id, u); await dbPut('universes', u); }
async function saveTag(t) { S.tags.set(t.id, t); await dbPut('tags', t); }

async function getText(id) {
  if (S.texts.has(id)) return S.texts.get(id);
  if (!isAdmin()) { await loadAllTexts(); return S.texts.get(id); }
  const t = await dbGet('texts', id);
  if (t) S.texts.set(id, t);
  return t;
}
// Manager: every text from the device. Reader: the published texts file, fetched once.
async function loadAllTexts() {
  if (S.allTexts) return;
  if (isAdmin()) { for (const t of await dbAll('texts')) S.texts.set(t.id, t); S.allTexts = true; return; }
  S.textsLoading ||= (async () => {
    // The device copy first; the network only when this version is not downloaded yet.
    let texts = (await dbGet('kv', 'publishedTexts').catch(() => null));
    texts = texts?.v === S.published ? texts.texts : await fetchTexts(S.published);
    fillTexts(texts);
  })().finally(() => { S.textsLoading = null; });
  return S.textsLoading;
}

/* ───────────── manager mode and publishing ───────────── */

// Readers see the library published to the site (data/library.json and data/texts.json).
// Laura's manager mode keeps a working copy on her device and publishes it to the site's GitHub repo.
const DATA = 'data/';
// The publishing script (tools/manager-script.gs, a Google Apps Script web app running as Tom).
// It holds the GitHub token; the app only sends the manager's Google sign-in.
const CONFIG = { managerUrl: 'https://script.google.com/macros/s/AKfycbxyLoeHb97Eex3dPntMRmk6a8AhVIdhuyU2HwotGGqeukuKRxSED_JPLmYN5TunJj6E/exec' };
function isAdmin() { return pref.get('admin', false); }

function setLibrary(lib) {
  S.stories = new Map((lib?.stories || []).map(x => [x.id, x]));
  S.universes = new Map((lib?.universes || []).map(x => [x.id, x]));
  S.tags = new Map((lib?.tags || []).map(x => [x.id, x]));
  S.texts.clear(); S.allTexts = false;
  S.published = lib?.publishedAt || '';
}
function fillTexts(texts) {
  for (const [id, html] of Object.entries(texts || {})) S.texts.set(id, { id, html, plain: plainOf(html) });
  S.allTexts = true;
}
async function fetchTexts(v) {
  const r = await fetch(DATA + 'texts.json?v=' + encodeURIComponent(v || ''), { cache: 'no-cache' });
  if (!r.ok) throw new Error('Could not load the stories (' + r.status + ').');
  const texts = await r.json();
  await dbPut('kv', { id: 'publishedTexts', v, texts });
  return texts;
}

// Readers work from the copy downloaded to this device (IndexedDB) and check the site for a newer
// version whenever they can. The first visit needs the network; after that, offline is normal.
async function loadPublished() {
  S.loadError = '';
  const saved = await dbGet('kv', 'published').catch(() => null);
  if (saved?.lib) { setLibrary(saved.lib); refreshPublished(); return; }
  setLibrary(null);
  await refreshPublished(true);
}
let refreshing = null;
function refreshPublished(first) {
  return refreshing ||= (async () => {
    try {
      const r = await fetch(DATA + 'library.json', { cache: 'no-cache' });
      if (r.status === 404) return;
      if (!r.ok) throw new Error('The library could not be loaded (' + r.status + ').');
      const lib = await r.json();
      pref.set('checkedAt', Date.now());
      if (lib.publishedAt === S.published) return;
      // Download every story before switching, so the new version is complete offline.
      const texts = await fetchTexts(lib.publishedAt);
      await dbPut('kv', { id: 'published', lib });
      const had = S.stories.size;
      setLibrary(lib);
      fillTexts(texts);
      S.loadError = '';
      if (!first) { if (had) toast('The library has been updated.'); rerenderSoon(); }
    } catch (e) {
      if (first && !S.stories.size) S.loadError = /fetch/i.test(e.message) ? 'The library could not be loaded. Are you online?' : e.message;
    } finally { refreshing = null; }
  })();
}

// While open: readers look for a newer library, the manager for edited Google Docs.
// Quietly, at most every few minutes, and never in the way of reading offline.
function backgroundChecks() {
  if (!navigator.onLine || document.hidden) return;
  if (Date.now() - pref.get('appCheckedAt', 0) > 30 * 60000) checkUpdate(true);
  if (!isAdmin()) {
    if (Date.now() - pref.get('checkedAt', 0) > 5 * 60000) refreshPublished();
    return;
  }
  if (Date.now() - pref.get('summaryCheckedAt', 0) > 5 * 60000) {
    pref.set('summaryCheckedAt', Date.now());
    fetch('data/library.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null)
      .then(lib => lib && lib.publishedAt !== pref.get('pubBase', '') ? keepSiteSummaries(lib, true) : 0)
      .then(n => { if (n) { render(); toast(`${n} new summar${n === 1 ? 'y' : 'ies'} from the site.`, null, 5000); } })
      .catch(() => {});
  }
  if (G.valid() && Date.now() - pref.get('driveCheckedAt', 0) > 30 * 60000 && [...S.stories.values()].some(s => s.source?.driveId)) {
    pref.set('driveCheckedAt', Date.now());
    refreshFromDrive([...S.stories.keys()], false, true);
  }
}
window.addEventListener('online', () => { pref.del('checkedAt'); pref.del('driveCheckedAt'); backgroundChecks(); });
document.addEventListener('visibilitychange', backgroundChecks);
setInterval(backgroundChecks, 60000);

// Calls the publishing script with the manager's Google sign-in. Signs in first if needed
// (on a phone that leaves the page; `after` says what to carry on with when it comes back).
async function managerCall(action, extra = {}, after = 'manager') {
  if (!/^https:/.test(CONFIG.managerUrl)) throw new Error('Publishing is not set up yet.');
  if (!G.valid()) await signIn(after);
  let r;
  try {
    r = await fetch(CONFIG.managerUrl, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, googleToken: G.token, ...extra }),
    });
  } catch { throw new Error('Could not reach the publishing service. Are you online?'); }
  const j = await r.json().catch(() => ({ error: 'The publishing service sent back something unreadable.' }));
  if (j.error) { if (/expired/i.test(j.error)) dropToken(); throw new Error(j.error); }
  return j;
}

// Replaces the working copy on this device with what is published.
async function pullPublished() {
  const r = await managerCall('pull');
  const lib = r.library ? JSON.parse(r.library) : null;
  const texts = r.texts ? JSON.parse(r.texts) : {};
  S.quiet = true;
  try {
    for (const st of STORES) if (st !== 'kv') await dbClear(st);
    if (lib) {
      await dbPut('universes', lib.universes); await dbPut('tags', lib.tags); await dbPut('stories', lib.stories);
      await dbPut('texts', Object.entries(texts).map(([id, html]) => ({ id, html, plain: plainOf(html) })));
    }
  } finally { S.quiet = false; }
  S.texts.clear(); S.allTexts = false;
  await loadAll();
  pref.set('pubBase', lib?.publishedAt || '');
  pref.del('dirtyAt');
  return lib;
}

// Copies newer summaries from the published library into this device's copy. Returns how many.
// Claude Code writes summaries straight to the site, so the manager's copy would otherwise lack them.
async function keepSiteSummaries(lib, quiet) {
  if (lib === undefined) { const r = await managerCall('pull'); lib = r.library ? JSON.parse(r.library) : null; }
  const put = [];
  for (const s of lib?.stories || []) {
    const mine = S.stories.get(s.id);
    if (!mine || !(s.summary || '').trim() || s.summary === mine.summary) continue;
    if ((mine.summary || '').trim() && (s.summaryAt || 0) <= (mine.summaryAt || 0)) continue;
    put.push({ ...mine, summary: s.summary, summaryAt: s.summaryAt, summaryBy: s.summaryBy, summaryStale: !!s.summaryStale });
  }
  if (put.length) { S.quiet = !!quiet; try { await saveStories(put); } finally { S.quiet = false; } }
  return put.length;
}

let publishing = false;
async function publish() {
  if (publishing) return;
  publishing = true;
  try {
    toast('Publishing…', null, 0);
    const publishedAt = new Date().toISOString();
    const lib = { app: 'callisto', v: 1, publishedAt, universes: universesSorted(), tags: tagsSorted(), stories: [...S.stories.values()] };
    const texts = Object.fromEntries((await dbAll('texts')).filter(t => S.stories.has(t.id)).map(t => [t.id, t.html]));
    const body = { library: JSON.stringify(lib), texts: JSON.stringify(texts), base: pref.get('pubBase', ''), message: `Library: ${lib.stories.length} stories` };
    let r = await managerCall('publish', body, 'publish');
    if (r.conflict) {
      // Summaries written by Claude Code go straight to the site: carry them into this copy first.
      if (await keepSiteSummaries()) { publishing = false; return await publish(); }
      $('#toast').hidden = true;
      const ok = await ask({
        title: 'Published from somewhere else',
        text: `The library on the site was published on ${new Date(r.conflict).toLocaleString()}, after this device last loaded it. Publishing now replaces that version with this one.`,
        ok: 'Publish this one', danger: true,
      });
      if (!ok) return;
      toast('Publishing…', null, 0);
      r = await managerCall('publish', { ...body, force: true }, 'publish');
    }
    pref.set('pubBase', publishedAt);
    pref.del('dirtyAt');
    toast('Published. Readers see it within a minute or two.', null, 6000);
    render();
  } catch (e) {
    toast('Not published: ' + e.message, null, 8000);
  } finally { publishing = false; }
}


// Turning manager mode on: sign in with Google; the publishing script checks the account is a manager.
function managerFlow() {
  const err = h('p.small', { style: { color: 'var(--danger)' } });
  openSheet([
    h('h2', 'Manage the library'),
    h('p.sub', 'For the person who runs this library. Readers never need this.'),
    h('p.small', 'Sign in with the Google account that manages this library. The same sign-in imports stories from Google Drive.'),
    err,
    h('div.foot',
      h('button.btn', { type: 'button', on: { click: closeSheet } }, 'Cancel'),
      h('button.btn.primary', { type: 'button', on: { click: e => turnOnManager(e.currentTarget, err) } }, 'Sign in with Google')),
  ]);
}
async function turnOnManager(btn, err) {
  if (btn) btn.disabled = true;
  if (err) err.textContent = '';
  try {
    const who = await managerCall('check');
    pref.set('admin', true);
    const hasLocal = (await dbAll('stories')).length > 0;
    const keep = hasLocal && await ask({
      title: 'This device already has a library',
      text: 'Start from the published library (recommended), or keep the copy on this device and publish it over the site later?',
      ok: "Keep this device's copy", cancel: 'Use the published one',
    });
    if (keep) await loadAll();
    else { toast('Loading the published library…', null, 0); await pullPublished(); }
    toast(`Manager mode is on (${who.email}).`);
    closeSheet();
    go('#/');
    render();
  } catch (x) {
    pref.set('admin', false);
    if (err) { err.textContent = x.message; if (btn) btn.disabled = false; }
    else toast(x.message, null, 8000);
  }
}
async function leaveManager() {
  const dirty = pref.get('dirtyAt', 0);
  const ok = await ask({
    title: 'Leave manager mode?',
    text: (dirty ? 'There are changes on this device that are not published. They stay on this device, but readers will not see them.\n\n' : '') + 'This device then shows the library as readers see it. Signing in with Google again turns manager mode back on.',
    ok: 'Leave manager mode', danger: !!dirty,
  });
  if (!ok) return;
  pref.set('admin', false);
  await loadPublished();
  go('#/'); render();
}

async function newUniverse(name) {
  const u = { id: uid(), name: name.trim(), color: PALETTE[S.universes.size % PALETTE.length], order: S.universes.size ? Math.max(...[...S.universes.values()].map(x => x.order)) + 1 : 0, createdAt: Date.now() };
  await saveUniverse(u);
  return u;
}
async function findOrMakeTag(name, group = 'Other') {
  name = name.trim();
  const hit = [...S.tags.values()].find(t => lc(t.name) === lc(name) && lc(t.group) === lc(group)) || [...S.tags.values()].find(t => lc(t.name) === lc(name));
  if (hit) return hit;
  const t = { id: uid(), name, group, createdAt: Date.now() };
  await saveTag(t);
  return t;
}

// Writes the order of one universe: ids in reading order.
async function setOrder(u, ids) {
  const list = ids.map((id, i) => ({ ...S.stories.get(id), universeId: u || '', pos: i }));
  await saveStories(list);
}
// Moves stories into universe u at index (in the list without them).
async function placeStories(ids, u, index) {
  const moving = new Set(ids);
  const rest = storiesIn(u).filter(s => !moving.has(s.id)).map(s => s.id);
  const at = index == null ? rest.length : Math.max(0, Math.min(index, rest.length));
  rest.splice(at, 0, ...ids);
  await setOrder(u, rest);
}

async function deleteStories(ids) {
  ids.forEach(id => { S.stories.delete(id); S.texts.delete(id); });
  await Promise.all([dbDel('stories', ids), dbDel('texts', ids)]);
}

/* ───────────── zip, docx, odt, epub, rtf, text, html ───────────── */

async function unzip(buf) {
  const v = new DataView(buf), u8 = new Uint8Array(buf);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('This file is not a valid document (no zip directory).');
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const files = new Map(), dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const method = v.getUint16(p + 10, true), csize = v.getUint32(p + 20, true);
    const nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), off = v.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nl));
    files.set(name, { method, csize, off });
    p += 46 + nl + xl + cl;
  }
  return {
    names: [...files.keys()],
    has: n => files.has(n),
    async text(name) {
      const f = files.get(name) || [...files].find(([k]) => lc(k) === lc(name))?.[1];
      if (!f) return null;
      const start = f.off + 30 + v.getUint16(f.off + 26, true) + v.getUint16(f.off + 28, true);
      const raw = u8.subarray(start, start + f.csize);
      if (f.method === 0) return dec.decode(raw);
      if (f.method !== 8) throw new Error('Unsupported compression in this file.');
      const ab = await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
      return dec.decode(ab);
    },
  };
}
const xml = s => new DOMParser().parseFromString(s, 'application/xml');
const kids = (el, name) => [...el.children].filter(c => c.localName === name);
const kid = (el, name) => el && [...el.children].find(c => c.localName === name);
const onAttr = el => { if (!el) return false; const v = el.getAttribute('w:val'); return v == null || !/^(0|false|none)$/i.test(v); };

function wrapFmt(t, f) {
  if (!t) return '';
  let s = esc(t);
  if (f.u) s = `<u>${s}</u>`;
  if (f.s) s = `<s>${s}</s>`;
  if (f.i) s = `<em>${s}</em>`;
  if (f.b) s = `<strong>${s}</strong>`;
  return s;
}
function blockHtml(tag, inner) {
  const text = inner.replace(/<[^>]+>/g, '').replace(/&nbsp;| /g, ' ').replace(/&amp;/g, '&').trim();
  if (!text) return '';
  if (/^(p|blockquote)$/.test(tag) && SCENE_BREAK.test(text)) return '<hr>';
  inner = inner.replace(/^(\s|<br>)+|(\s|<br>)+$/g, '');
  return tag === 'blockquote' ? `<blockquote><p>${inner}</p></blockquote>` : `<${tag}>${inner}</${tag}>`;
}

async function parseDocx(buf) {
  const z = await unzip(buf);
  const doc = xml(await z.text('word/document.xml') || '');
  const body = doc.getElementsByTagNameNS('*', 'body')[0];
  if (!body) throw new Error('Could not read the Word document.');
  const out = [];
  const runText = (r, f) => {
    let s = '';
    for (const c of r.children) {
      if (c.localName === 't') s += wrapFmt(c.textContent, f);
      else if (c.localName === 'tab') s += ' ';
      else if (c.localName === 'br' && c.getAttribute('w:type') !== 'page') s += '<br>';
      else if (c.localName === 'noBreakHyphen') s += '-';
    }
    return s;
  };
  const para = p => {
    const ppr = kid(p, 'pPr');
    const style = kid(ppr, 'pStyle')?.getAttribute('w:val') || '';
    const m = style.match(/heading\s*(\d)|^title$/i);
    const tag = m ? (m[1] ? 'h' + Math.min(3, Math.max(1, +m[1])) : 'h1') : 'p';
    let inner = '';
    const walk = el => {
      for (const c of el.children) {
        if (c.localName === 'r') {
          const rpr = kid(c, 'rPr');
          const u = kid(rpr, 'u');
          inner += runText(c, { b: onAttr(kid(rpr, 'b')), i: onAttr(kid(rpr, 'i')), u: u && !/^none$/i.test(u.getAttribute('w:val') || ''), s: onAttr(kid(rpr, 'strike')) });
        } else if (/^(hyperlink|ins|smartTag|sdt|sdtContent|fldSimple|customXml)$/.test(c.localName)) walk(c);
      }
    };
    walk(p);
    out.push(blockHtml(tag, inner));
  };
  const walkBody = el => {
    for (const c of el.children) {
      if (c.localName === 'p') para(c);
      else if (/^(tbl|tr|tc|sdt|sdtContent|customXml)$/.test(c.localName)) walkBody(c);
    }
  };
  walkBody(body);
  let title = '';
  try { title = xml(await z.text('docProps/core.xml') || '<x/>').getElementsByTagNameNS('*', 'title')[0]?.textContent || ''; } catch {}
  return { html: out.filter(Boolean).join('\n'), docTitle: title };
}

async function parseOdt(buf) {
  const z = await unzip(buf);
  const doc = xml(await z.text('content.xml') || '');
  const text = doc.getElementsByTagNameNS('*', 'text');
  const root = [...text].find(e => e.parentElement?.localName === 'body');
  if (!root) throw new Error('Could not read the OpenDocument file.');
  const out = [];
  const inline = el => {
    let s = '';
    for (const n of el.childNodes) {
      if (n.nodeType === 3) s += esc(n.textContent);
      else if (n.localName === 's') s += ' '.repeat(+n.getAttribute('text:c') || 1);
      else if (n.localName === 'tab') s += ' ';
      else if (n.localName === 'line-break') s += '<br>';
      else if (/^(span|a)$/.test(n.localName)) s += inline(n);
    }
    return s;
  };
  const walk = el => {
    for (const c of el.children) {
      if (c.localName === 'h') out.push(blockHtml('h' + Math.min(3, +c.getAttribute('text:outline-level') || 2), inline(c)));
      else if (c.localName === 'p') out.push(blockHtml('p', inline(c)));
      else if (/^(list|list-item|section|table|table-row|table-cell)$/.test(c.localName)) walk(c);
    }
  };
  walk(root);
  return { html: out.filter(Boolean).join('\n') };
}

async function parseEpub(buf) {
  const z = await unzip(buf);
  const cont = xml(await z.text('META-INF/container.xml') || '');
  const opfPath = cont.getElementsByTagNameNS('*', 'rootfile')[0]?.getAttribute('full-path');
  if (!opfPath) throw new Error('Could not read the EPUB.');
  const base = opfPath.includes('/') ? opfPath.replace(/[^/]+$/, '') : '';
  const opf = xml(await z.text(opfPath));
  const items = new Map([...opf.getElementsByTagNameNS('*', 'item')].map(i => [i.getAttribute('id'), i.getAttribute('href')]));
  const title = opf.getElementsByTagNameNS('*', 'title')[0]?.textContent || '';
  let all = '';
  for (const ref of opf.getElementsByTagNameNS('*', 'itemref')) {
    const href = items.get(ref.getAttribute('idref'));
    if (!href) continue;
    const path = (base + decodeURIComponent(href)).replace(/[^/]+\/\.\.\//g, '');
    const t = await z.text(path);
    if (t) all += `<section>${(t.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, t])[1]}</section>`;
  }
  const r = parseHtml(`<html><body>${all}</body></html>`);
  return { ...r, docTitle: r.meta?.title || title };
}

// Drops RTF groups that hold no story text (font table, styles, pictures, headers, \* groups).
function rtfStrip(s) {
  const skip = /^\{\\(\*|(fonttbl|colortbl|stylesheet|info|listtable|listoverridetable|pict|header|footer|headerl|headerr|footerl|footerr|rsidtbl|generator|xmlnstbl|latentstyles|themedata|colorschememapping|datastore|pgdsctbl|filetbl|revtbl|object|fldinst)\b)/;
  let out = '', i = 0;
  while (i < s.length) {
    if (s[i] === '\\' && i + 1 < s.length) { out += s[i] + s[i + 1]; i += 2; continue; }
    if (s[i] === '{' && skip.test(s.slice(i, i + 40))) {
      let depth = 0;
      for (; i < s.length; i++) {
        if (s[i] === '\\') { i++; continue; }
        if (s[i] === '{') depth++;
        else if (s[i] === '}' && --depth === 0) { i++; break; }
      }
      continue;
    }
    out += s[i++];
  }
  return out;
}

function parseRtf(s) {
  const cp = new TextDecoder('windows-1252');
  s = rtfStrip(s);
  const paras = [];
  let cur = '', depth = 0, f = { b: false, i: false, u: false };
  const stack = [];
  const re = /\\'([0-9a-f]{2})|\\u(-?\d+)\??|\\([a-z]+)(-?\d+)? ?|\\([\\{}~_-])|([{}])|\r?\n|([^\\{}\r\n]+)/gi;
  let m;
  while ((m = re.exec(s))) {
    if (m[1]) cur += esc(cp.decode(new Uint8Array([parseInt(m[1], 16)])));
    else if (m[2]) cur += esc(String.fromCharCode(+m[2] < 0 ? +m[2] + 65536 : +m[2]));
    else if (m[3]) {
      const w = m[3], n = m[4];
      if (w === 'par' || w === 'sect') { paras.push(blockHtml('p', cur)); cur = ''; }
      else if (w === 'line') cur += '<br>';
      else if (w === 'tab') cur += ' ';
      else if (w === 'emdash') cur += '—'; else if (w === 'endash') cur += '–';
      else if (w === 'lquote') cur += '‘'; else if (w === 'rquote') cur += '’';
      else if (w === 'ldblquote') cur += '“'; else if (w === 'rdblquote') cur += '”';
      else if (w === 'b' || w === 'i' || w === 'ul' || w === 'ulnone') {
        const on = n !== '0';
        const k = w === 'ulnone' ? 'u' : w === 'ul' ? 'u' : w;
        const val = w === 'ulnone' ? false : on;
        if (f[k] !== val) { cur += val ? { b: '<strong>', i: '<em>', u: '<u>' }[k] : { b: '</strong>', i: '</em>', u: '</u>' }[k]; f[k] = val; }
      } else if (w === 'plain') { if (f.u) cur += '</u>'; if (f.i) cur += '</em>'; if (f.b) cur += '</strong>'; f = { b: false, i: false, u: false }; }
    } else if (m[5]) cur += m[5] === '~' ? ' ' : m[5] === '_' || m[5] === '-' ? '-' : esc(m[5]);
    else if (m[6] === '{') { depth++; stack.push({ ...f }); }
    else if (m[6] === '}') {
      depth--;
      const prev = stack.pop() || { b: false, i: false, u: false };
      for (const k of ['u', 'i', 'b']) if (f[k] && !prev[k]) cur += { b: '</strong>', i: '</em>', u: '</u>' }[k];
      for (const k of ['b', 'i', 'u']) if (!f[k] && prev[k]) cur += { b: '<strong>', i: '<em>', u: '<u>' }[k];
      f = prev;
    } else if (m[7]) cur += esc(m[7]);
  }
  paras.push(blockHtml('p', cur));
  const html = paras.filter(Boolean).join('\n');
  // Repair any formatting tags left unbalanced by odd RTF.
  const t = document.createElement('template'); t.innerHTML = html;
  return { html: t.innerHTML };
}

function parseText(s) {
  s = s.replace(/\r\n?/g, '\n').replace(/ /g, ' ');
  const blocks = /\n\s*\n/.test(s) ? s.split(/\n\s*\n+/) : s.split('\n');
  const multi = blocks.filter(b => b.includes('\n'));
  const lens = multi.flatMap(b => b.split('\n').slice(0, -1).map(l => l.length));
  const hardWrapped = lens.length > 5 && lens.filter(n => n >= 55 && n <= 90).length / lens.length > .7;
  return {
    html: blocks.map(b => {
      const lines = b.split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) return '';
      const inner = lines.map(esc).join(hardWrapped ? ' ' : '<br>');
      return blockHtml('p', inner);
    }).filter(Boolean).join('\n'),
  };
}

function parseMarkdown(s) {
  s = s.replace(/\r\n?/g, '\n');
  const inline = t => esc(t)
    .replace(/\*\*(.+?)\*\*|__(.+?)__/g, (_, a, b) => `<strong>${a || b}</strong>`)
    .replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\*)|(^|[^_\w])_(?!\s)(.+?)_(?!\w)/g, (_, p1, a, p2, b) => `${p1 ?? p2 ?? ''}<em>${a ?? b}</em>`)
    .replace(/~~(.+?)~~/g, '<s>$1</s>');
  return {
    html: s.split(/\n\s*\n+/).map(b => {
      b = b.trim();
      if (!b) return '';
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(b)) return '<hr>';
      const hm = b.match(/^(#{1,6})\s+(.*)$/);
      if (hm && !b.includes('\n')) return blockHtml('h' + Math.min(3, hm[1].length), inline(hm[2]));
      if (/^>/.test(b)) return blockHtml('blockquote', b.split('\n').map(l => inline(l.replace(/^>\s?/, ''))).join('<br>'));
      return blockHtml('p', b.split('\n').map(inline).join('<br>'));
    }).filter(Boolean).join('\n'),
  };
}

// Reads AO3's download preface (title, author, tags, summary) when the file has one.
function ao3Meta(doc) {
  const dl = doc.querySelector('dl.tags');
  const pre = doc.querySelector('#preface') || dl?.closest('.meta');
  if (!pre && !dl) return null;
  const meta = { tags: {} };
  meta.title = pre?.querySelector('h1')?.textContent.trim() || '';
  meta.author = pre?.querySelector('a[rel="author"]')?.textContent.trim() || '';
  if (dl) {
    for (const dt of dl.querySelectorAll('dt')) {
      const dd = dt.nextElementSibling;
      if (!dd || dd.localName !== 'dd') continue;
      const k = dt.textContent.replace(/:\s*$/, '').trim();
      const vals = [...dd.querySelectorAll('a')].map(a => a.textContent.trim()).filter(Boolean);
      meta.tags[k] = vals.length ? vals : [dd.textContent.trim()];
    }
  }
  const sumH = [...(pre || doc).querySelectorAll('h2, h3, p, b')].find(e => /^summary:?$/i.test(e.textContent.trim()));
  let sum = sumH?.nextElementSibling;
  while (sum && !/blockquote|div|p/i.test(sum.localName)) sum = sum.nextElementSibling;
  if (sum) meta.blurb = [...sum.querySelectorAll('p')].map(p => p.textContent.trim()).filter(Boolean).join('\n\n') || sum.textContent.trim();
  return (meta.title || meta.blurb || Object.keys(meta.tags).length) ? meta : null;
}

function cssClasses(doc) {
  const map = new Map();
  for (const st of doc.querySelectorAll('style')) {
    for (const m of st.textContent.matchAll(/\.([\w-]+)\s*\{([^}]*)\}/g)) map.set(m[1], (map.get(m[1]) || '') + ';' + m[2]);
  }
  return map;
}
function styleFmt(el, classes, f) {
  let css = el.getAttribute('style') || '';
  for (const c of el.classList) css += ';' + (classes.get(c) || '');
  if (!css) return f;
  const n = { ...f };
  const w = css.match(/font-weight\s*:\s*(\w+)/g)?.pop()?.split(':')[1].trim();
  if (w) n.b = w === 'bold' || +w >= 600;
  const st = css.match(/font-style\s*:\s*(\w+)/g)?.pop()?.split(':')[1].trim();
  if (st) n.i = st === 'italic' || st === 'oblique';
  const dec = css.match(/text-decoration(?:-line)?\s*:\s*([^;]+)/g)?.pop();
  if (dec) { n.u = /underline/.test(dec); n.s = /line-through/.test(dec); }
  return n;
}

function parseHtml(s) {
  const doc = new DOMParser().parseFromString(s, 'text/html');
  const meta = ao3Meta(doc);
  if (meta) {
    doc.querySelectorAll('#preface, #afterword').forEach(e => e.remove());
    const m = doc.querySelector('dl.tags')?.closest('.meta');
    if (m && !m.closest('#chapters')) m.remove();
  }
  const classes = cssClasses(doc);
  const out = [];
  let cur = null;
  const flush = () => { if (cur) out.push(blockHtml(cur.tag, cur.inner)); cur = null; };
  const ensure = tag => { if (!cur) cur = { tag: tag || 'p', inner: '' }; };
  const SKIP = /^(script|style|head|title|noscript|svg|iframe|form|button|input|select|textarea|nav|template|object|video|audio|canvas|map)$/;
  const BLOCK = /^(p|div|section|article|main|header|footer|aside|center|pre|li|dd|dt|tr|figure|figcaption|address|body|ul|ol|dl|table|tbody|thead)$/;
  const walk = (el, f, q) => {
    for (const n of el.childNodes) {
      if (n.nodeType === 3) {
        const t = n.textContent.replace(/[\s ]+/g, ' ');
        if (!t.trim() && !cur) continue;
        ensure(q ? 'blockquote' : 'p');
        cur.inner += wrapFmt(t, f);
        continue;
      }
      if (n.nodeType !== 1) continue;
      const tag = n.localName;
      if (SKIP.test(tag) || n.hidden || /display\s*:\s*none/.test(n.getAttribute('style') || '')) continue;
      const g = styleFmt(n, classes, {
        ...f,
        ...(/^(b|strong)$/.test(tag) && { b: true }),
        ...(/^(i|em|cite|dfn|var)$/.test(tag) && { i: true }),
        ...(tag === 'u' && { u: true }),
        ...(/^(s|strike|del)$/.test(tag) && { s: true }),
      });
      if (/^h[1-6]$/.test(tag)) { flush(); cur = { tag: 'h' + Math.min(3, +tag[1]), inner: '' }; walk(n, { ...g, b: false }, q); flush(); }
      else if (tag === 'hr') { flush(); out.push('<hr>'); }
      else if (tag === 'br') { ensure(q ? 'blockquote' : 'p'); cur.inner += '<br>'; }
      else if (tag === 'blockquote') { flush(); walk(n, g, true); flush(); }
      else if (tag === 'img') { const a = n.getAttribute('alt'); if (a && a.trim().length > 1) { ensure(); cur.inner += esc(a); } }
      else if (BLOCK.test(tag)) {
        flush();
        if (tag === 'li') { cur = { tag: q ? 'blockquote' : 'p', inner: '• ' }; }
        walk(n, g, q);
        flush();
      } else walk(n, g, q);
    }
  };
  walk(doc.body || doc.documentElement, {}, false);
  flush();
  return { html: out.filter(Boolean).join('\n').replace(/(<hr>\n?){2,}/g, '<hr>\n'), meta };
}

function decodeText(buf) {
  const u8 = new Uint8Array(buf);
  if (u8[0] === 0xff && u8[1] === 0xfe) return new TextDecoder('utf-16le').decode(u8.subarray(2));
  if (u8[0] === 0xfe && u8[1] === 0xff) return new TextDecoder('utf-16be').decode(u8.subarray(2));
  try { return new TextDecoder('utf-8', { fatal: true }).decode(u8).replace(/^﻿/, ''); }
  catch { return new TextDecoder('windows-1252').decode(u8); }
}

function plainOf(html) {
  const t = document.createElement('template');
  t.innerHTML = html;
  t.content.querySelectorAll('br').forEach(b => b.replaceWith('\n'));
  return [...t.content.children].map(e => e.localName === 'hr' ? '* * *' : e.textContent.trim()).join('\n\n');
}

const kindOf = (name, mime) => KINDS[mime] || EXT_KIND[lc(name).split('.').pop()] || null;
const cleanTitle = name => name.replace(/\.(txt|text|md|markdown|html?|xhtml|docx?|odt|rtf|epub)$/i, '').replace(/^\s*(\d{1,4}\s*[-_.)\]:]+\s*|0\d{0,3}\s+)(?=\S)/, '').replace(/_/g, ' ').trim() || name;

async function parseAny(name, kind, data) {
  const buf = data instanceof ArrayBuffer ? data : null;
  let r;
  if (kind === 'docx') r = await parseDocx(buf);
  else if (kind === 'odt') r = await parseOdt(buf);
  else if (kind === 'epub') r = await parseEpub(buf);
  else {
    const s = typeof data === 'string' ? data : decodeText(buf);
    if (kind === 'html' || kind === 'gdoc') r = parseHtml(s);
    else if (kind === 'rtf') r = parseRtf(s);
    else if (kind === 'md') r = parseMarkdown(s);
    else r = parseText(s);
  }
  if (!r.html.trim()) throw new Error('No readable text found.');
  const plain = plainOf(r.html);
  const meta = r.meta || null;
  return {
    title: meta?.title || cleanTitle(name),
    html: r.html, plain, words: wordsIn(plain), meta,
    blurb: meta?.blurb || '',
  };
}

/* ───────────── Google sign-in and Drive ───────────── */

const G = {
  token: null, exp: 0,
  valid() { return this.token && Date.now() < this.exp - 60000; },
};
try { const s = JSON.parse(localStorage.getItem('cal.token') || 'null'); if (s && s.exp > Date.now()) { G.token = s.token; G.exp = s.exp; } } catch {}
function dropToken() { G.token = null; G.exp = 0; pref.del('token'); }
function gotToken(token, expiresIn) {
  G.token = token; G.exp = Date.now() + expiresIn * 1000;
  pref.set('token', { token: G.token, exp: G.exp });
  pref.set('signedIn', true);
  gfetch(`${DRIVE}/about?fields=user(emailAddress)`).then(a => { pref.set('googleEmail', a.user.emailAddress); if (S.route.name === 'settings') render(); }, () => {});
}
const pageSignIn = () => matchMedia('(pointer: coarse)').matches;

function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = res;
    s.onerror = () => rej(new Error('Could not reach Google. Are you online?'));
    document.head.append(s);
  });
}

// Phones leave the page for Google and come back with the token in the address.
function signInByPage(after) {
  const state = uid();
  try { sessionStorage.setItem('cal.oauth', JSON.stringify({ state, after, route: location.hash })); } catch {}
  const q = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: location.origin + location.pathname, response_type: 'token', scope: SCOPE, state, include_granted_scopes: 'true' });
  const hint = pref.get('googleEmail', '');
  if (hint) q.set('login_hint', hint);
  location.assign('https://accounts.google.com/o/oauth2/v2/auth?' + q);
  return new Promise(() => {});
}
function signInReturn() {
  if (!/state=/.test(location.hash)) return null;
  const r = Object.fromEntries(new URLSearchParams(location.hash.slice(1)));
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem('cal.oauth') || 'null'); sessionStorage.removeItem('cal.oauth'); } catch {}
  history.replaceState(null, '', location.pathname + location.search + (saved?.route || '#/'));
  if (!saved || saved.state !== r.state) return null;
  if (r.error) { toast(r.error === 'access_denied' ? 'Google sign-in was cancelled.' : 'Google sign-in failed: ' + r.error); return null; }
  gotToken(r.access_token, +r.expires_in);
  return saved.after || 'signed-in';
}
let signing = null;
function signIn(after) {
  if (pageSignIn()) return signInByPage(after);
  if (signing) return signing;
  signing = (async () => {
    await loadGis();
    await new Promise((res, rej) => {
      google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: SCOPE, hint: pref.get('googleEmail', ''),
        callback: r => r.error ? rej(new Error(r.error_description || r.error)) : (gotToken(r.access_token, r.expires_in), res()),
        error_callback: e => rej(new Error(e.message || 'Sign-in was closed.')),
      }).requestAccessToken({ prompt: '' });
    });
  })().finally(() => { signing = null; });
  return signing;
}
function signOut() {
  if (G.token && window.google?.accounts?.oauth2) google.accounts.oauth2.revoke(G.token, () => {});
  dropToken(); pref.del('signedIn'); pref.del('googleEmail');
}

async function gsend(url, as = 'json') {
  const c = new AbortController(), t = setTimeout(() => c.abort(), 90000);
  let r;
  try { r = await fetch(url, { headers: { Authorization: 'Bearer ' + G.token }, signal: c.signal }); }
  catch (e) { throw new Error(e.name === 'AbortError' ? 'Google did not answer in time.' : 'Could not reach Google. Are you online?'); }
  finally { clearTimeout(t); }
  if (r.status === 401) { dropToken(); throw Object.assign(new Error('Google sign-in expired. Sign in again.'), { status: 401 }); }
  if (!r.ok) { let msg = r.statusText; try { msg = (await r.json()).error.message; } catch {} throw Object.assign(new Error(msg), { status: r.status }); }
  return as === 'json' ? r.json() : as === 'text' ? r.text() : r.arrayBuffer();
}
const gfetch = url => gsend(url, 'json');

const DRIVE_MIMES = Object.keys(KINDS);
const DRIVE_FIELDS = 'nextPageToken,files(id,name,mimeType,modifiedTime,size,shortcutDetails)';
async function driveList(q) {
  const files = [];
  let page = '';
  do {
    const p = new URLSearchParams({ q, fields: DRIVE_FIELDS, pageSize: '1000', orderBy: 'folder,name_natural', supportsAllDrives: 'true', includeItemsFromAllDrives: 'true', ...(page && { pageToken: page }) });
    const r = await gfetch(`${DRIVE}/files?${p}`);
    files.push(...r.files);
    page = r.nextPageToken;
  } while (page);
  return files.map(f => f.mimeType === GSHORTCUT && f.shortcutDetails ? { ...f, id: f.shortcutDetails.targetId, mimeType: f.shortcutDetails.targetMimeType, shortcut: true } : f)
    .filter(f => f.mimeType === GFOLDER || KINDS[f.mimeType] || kindOf(f.name, ''));
}
const mimeQ = () => '(' + [GFOLDER, GSHORTCUT, ...DRIVE_MIMES].map(m => `mimeType='${m}'`).join(' or ') + ')';
const qstr = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

// Google only exports a Doc up to 10 MB. HTML (kept for italics and bold) is bulky, so a long Doc
// or one with pictures can pass that: then ask for EPUB (zipped, keeps the styling), then plain text.
const tooLarge = e => e.status === 403 && /too large|exportSizeLimitExceeded/i.test(e.message);
async function driveFetch(f) {
  const kind = kindOf(f.name, f.mimeType);
  if (kind !== 'gdoc') return { kind, data: await gsend(`${DRIVE}/files/${f.id}?alt=media&supportsAllDrives=true`, 'buf') };
  const exp = type => `${DRIVE}/files/${f.id}/export?mimeType=${encodeURIComponent(type)}`;
  try { return { kind, data: await gsend(exp('text/html'), 'text') }; }
  catch (e) { if (!tooLarge(e)) throw e; }
  try { return { kind: 'epub', data: await gsend(exp('application/epub+zip'), 'buf') }; }
  catch (e) { if (!tooLarge(e)) throw e; }
  try { return { kind: 'txt', data: await gsend(exp('text/plain'), 'buf') }; }
  catch (e) { if (tooLarge(e)) throw new Error('too large for Google to export, even as plain text. Download it as a Word file and add that instead.'); throw e; }
}

// Expands chosen folders into files (with the folder each came from), depth-limited.
async function expandFolders(folders, onStep) {
  const out = [];
  const walk = async (folder, depth) => {
    onStep?.(folder.name);
    const items = await driveList(`'${folder.id}' in parents and trashed=false and ${mimeQ()}`);
    for (const it of items) {
      if (it.mimeType === GFOLDER) { if (depth < 6) await walk(it, depth + 1); }
      else out.push({ ...it, folder: folder.name });
    }
  };
  for (const f of folders) await walk(f, 0);
  return out;
}

async function pool(items, n, fn) {
  let i = 0;
  const run = async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, run));
}

/* ───────────── search ───────────── */

function parseQuery(q) {
  const terms = [], neg = [], filters = [];
  for (const m of q.matchAll(/(-?)(?:([a-z]+):)?(?:"([^"]*)"?|(\S+))/gi)) {
    const not = !!m[1], key = lc(m[2] || ''), val = lc((m[3] ?? m[4] ?? '').trim());
    if (!val && !key) continue;
    if (key) filters.push({ key, val, not });
    else (not ? neg : terms).push(val);
  }
  return { terms: terms.filter(Boolean), neg: neg.filter(Boolean), filters };
}
function lev1(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return false;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return false;
  }
  return d[a.length][b.length] <= max;
}
function passFilter(s, f) {
  const tags = s.tags.map(id => S.tags.get(id)).filter(Boolean);
  const v = f.val;
  let ok;
  switch (f.key) {
    case 'tag': case 't': ok = tags.some(t => lc(t.name).includes(v)); break;
    case 'in': case 'u': case 'universe': ok = v === 'unsorted' ? !s.universeId : lc(uName(s.universeId)).includes(v); break;
    case 'era': ok = lc(s.era).includes(v); break;
    case 'is': case 'status':
      { const p = prog(s.id); ok = v === 'fav' || v === 'favourite' || v === 'favorite' ? p.fav : v === 'unread' || v === 'reading' || v === 'read' ? p.status === v : v === 'google' ? s.source?.kind === 'gdrive' : false; break; }
    case 'has': ok = v === 'summary' ? !!s.summary : v === 'tags' ? tags.length > 0 : v === 'era' ? !!s.era : false; break;
    case 'no': ok = v === 'summary' ? !s.summary : v === 'tags' ? !tags.length : v === 'era' ? !s.era : false; break;
    case 'words': {
      const m = v.match(/^(<|>)?=?(\d+)(k)?(?:-(\d+)(k)?)?$/);
      if (!m) { ok = true; break; }
      const a = +m[2] * (m[3] ? 1000 : 1), b = m[4] ? +m[4] * (m[5] ? 1000 : 1) : null;
      ok = m[1] === '<' ? s.words < a : m[1] === '>' ? s.words > a : b != null ? s.words >= a && s.words <= b : s.words >= a;
      break;
    }
    case 'by': case 'author': ok = lc(s.author).includes(v); break;
    default: {
      // group:value, e.g. character:anna or pairing:"a/b"
      const g = groups().find(x => lc(x).replace(/\s+/g, '') === f.key || lc(x).replace(/s$/, '') === f.key);
      ok = g ? tags.some(t => lc(t.group) === lc(g) && lc(t.name).includes(v)) : true;
    }
  }
  return f.not ? !ok : ok;
}
function search(q) {
  const { terms, neg, filters } = parseQuery(q);
  const out = [];
  for (const s of S.stories.values()) {
    if (!filters.every(f => passFilter(s, f))) continue;
    const tagText = lc(s.tags.map(id => S.tags.get(id)?.name).join(' · '));
    const body = lc(S.texts.get(s.id)?.plain);
    const fields = [lc(s.title), tagText, lc(s.era), lc(uName(s.universeId)), lc(`${s.summary || ''} ${s.blurb || ''}`), lc(s.author), body];
    if (neg.some(t => fields.some(f => f.includes(t)))) continue;
    let score = 0, ok = true;
    for (const t of terms) {
      let sc = 0;
      const title = fields[0];
      if (title.includes(t)) sc += 12 + (new RegExp('(^|\\W)' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(title) ? 6 : 0);
      if (fields[1].includes(t)) sc += 8;
      if (fields[2].includes(t)) sc += 5;
      if (fields[3].includes(t)) sc += 4;
      if (fields[4].includes(t)) sc += 4;
      if (fields[5].includes(t)) sc += 4;
      if (body.includes(t)) { let n = 0, i = -1; while (n < 20 && (i = body.indexOf(t, i + 1)) >= 0) n++; sc += 1 + n * .25; }
      if (!sc && t.length >= 4) {
        const words = (fields[0] + ' ' + fields[1]).split(/[^\p{L}\p{N}']+/u);
        if (words.some(w => w.length >= 3 && lev1(w, t, t.length >= 8 ? 2 : 1))) sc += 5;
      }
      if (!sc) { ok = false; break; }
      score += sc;
    }
    if (ok) out.push({ s, score, terms });
  }
  const uo = new Map(universesSorted().map((u, i) => [u.id, i]));
  out.sort((a, b) => b.score - a.score || (uo.get(a.s.universeId) ?? 1e9) - (uo.get(b.s.universeId) ?? 1e9) || a.s.pos - b.s.pos);
  return out;
}
function snippet(s, terms) {
  const body = S.texts.get(s.id)?.plain || '';
  const low = lc(body);
  let at = -1, hit = '';
  for (const t of terms) { const i = low.indexOf(t); if (i >= 0 && (at < 0 || i < at)) { at = i; hit = t; } }
  if (at < 0) return null;
  const start = Math.max(0, body.lastIndexOf(' ', Math.max(0, at - 70)));
  const end = at + hit.length + 110;
  const text = (start > 0 ? '…' : '') + body.slice(start, end).replace(/\s+/g, ' ').trim() + (end < body.length ? '…' : '');
  return markTerms(text, terms);
}
function markTerms(text, terms) {
  const frag = document.createDocumentFragment();
  if (!terms.length) { frag.append(text); return frag; }
  const re = new RegExp('(' + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
  let last = 0;
  for (const m of text.matchAll(re)) { frag.append(text.slice(last, m.index), h('mark', m[0])); last = m.index + m[0].length; }
  frag.append(text.slice(last));
  return frag;
}

/* ───────────── sheets and dialogs ───────────── */

// One history entry while any sheet is open, so the phone's Back button closes it.
// A sheet closed by a button hides at once; the history step back follows (backPending).
let sheetOpen = false, backPending = false, pendingNav = null, sheetOnClose = null;
function openSheet(content, onClose) {
  const sh = $('#sheet');
  put(sh, h('div.grab'), content);
  sheetOnClose = onClose || null;
  if (!sheetOpen) {
    sheetOpen = true;
    $('#sheetWrap').hidden = false;
    if (!backPending) history.pushState({ sheet: true }, '');
  }
  sh.scrollTop = 0;
  setTimeout(() => sh.querySelector('[autofocus]')?.focus(), 30);
}
function hideSheet() {
  if (!sheetOpen) return;
  sheetOpen = false;
  $('#sheetWrap').hidden = true;
  $('#sheet').replaceChildren();
  const f = sheetOnClose; sheetOnClose = null;
  f?.();
}
function closeSheet() {
  if (!sheetOpen) return;
  hideSheet();
  if (history.state?.sheet && !backPending) { backPending = true; history.back(); }
}
function go(hash) {
  if (sheetOpen) closeSheet();
  if (backPending) pendingNav = hash; else location.hash = hash;
}
window.addEventListener('popstate', () => {
  if (backPending) {
    backPending = false;
    if (sheetOpen) history.pushState({ sheet: true }, '');
    if (pendingNav) { const to = pendingNav; pendingNav = null; if (location.hash !== to) location.hash = to; }
    return;
  }
  if (sheetOpen) hideSheet();
});
$('#sheetBack').addEventListener('click', closeSheet);
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (sheetOpen) { e.preventDefault(); closeSheet(); }
  else if (!$('#reader').hidden) closeReader();
});

// In-app replacement for alert/confirm/prompt.
function ask({ title, text, ok = 'OK', cancel = 'Cancel', input, danger, extra }) {
  return new Promise(res => {
    let done = false;
    const field = input ? h('input.field', { type: 'text', value: input.value || '', placeholder: input.placeholder || '', autofocus: true, list: input.list || null }) : null;
    const finish = v => { if (done) return; done = true; res(v); closeSheet(); };
    // With an input: OK gives the text ('' when empty), Cancel gives null.
    if (field) field.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); finish(field.value.trim()); } });
    openSheet([
      h('h2', title),
      text && h('p.sub', { style: { whiteSpace: 'pre-wrap' } }, text),
      field, extra,
      h('div.foot',
        cancel && h('button.btn', { type: 'button', on: { click: () => finish(null) } }, cancel),
        h('button.btn' + (danger ? '.danger' : '.primary'), { type: 'button', on: { click: () => finish(field ? field.value.trim() : true) } }, ok)),
    ], () => { if (!done) { done = true; res(null); } });
  });
}

/* story details */
// Everyone taps a story into the reading sheet; the manager's tools sit behind "Edit details".
function openStory(id) { return openStoryReader(id); }

async function openStoryManage(id) {
  const s = S.stories.get(id);
  if (!s) return;
  const list = storiesIn(s.universeId);
  const i = list.findIndex(x => x.id === id);
  const tags = s.tags.map(t => S.tags.get(t)).filter(Boolean);
  const refresh = () => openStoryManage(id);
  const eras = [...new Set(list.map(x => x.era).filter(Boolean))];
  const pg = prog(id);
  const pct = Math.round(pg.readPos * 100);

  const summaryBox = h('div',
    s.summary ? h('p.summary', s.summary) : h('p.muted.small', 'No summary yet.'),
    s.summaryStale && s.summary ? h('p.muted.small', 'The text has changed since this summary was written.') : null,
    s.blurb ? [h('h3', "Author's summary"), h('p.blurb', s.blurb)] : null);
  openSheet([
    h('h2', s.title),
    h('p.sub', [uName(s.universeId), s.universeId ? ` · #${i + 1} of ${list.length}` : '', s.era ? ` · ${s.era}` : '', ` · ${fmtWords(s.words)}`, s.author ? ` · by ${s.author}` : ''].join('')),
    universeField(s, refresh),
    storyActions(id, () => { refresh(); rerenderSoon(); }),
    h('h3', 'Summary'), summaryBox,
    h('h3', 'Tags'),
    h('div.chips',
      tags.map(t => h('button.chip', { type: 'button', css: { '--c': tagColor(t) }, title: 'Remove this tag', on: { click: async () => { await saveStories({ ...s, tags: s.tags.filter(x => x !== t.id) }); refresh(); rerenderSoon(); } } }, t.name, h('span.x', '×'))),
      h('button.chip.add', { type: 'button', on: { click: () => pickTags([id], refresh) } }, '+ Tag')),
    h('h3', 'Timeline'),
    h('div.btn-row',
      h('button.btn.small', { type: 'button', disabled: i <= 0, on: { click: async () => { const ids = list.map(x => x.id); [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]]; await setOrder(s.universeId, ids); refresh(); rerenderSoon(); } } }, '↑ Earlier'),
      h('button.btn.small', { type: 'button', disabled: i >= list.length - 1, on: { click: async () => { const ids = list.map(x => x.id); [ids[i + 1], ids[i]] = [ids[i], ids[i + 1]]; await setOrder(s.universeId, ids); refresh(); rerenderSoon(); } } }, '↓ Later'),
      h('button.btn.small', { type: 'button', on: { click: () => pickPlace([id], async (u, at) => { await placeStories([id], u, at); rerenderSoon(); openStoryManage(id); }) } }, 'Move…'),
      h('button.btn.small', {
        type: 'button', on: {
          click: async () => {
            const v = await askEra(eras, s.era);
            if (v === null) return openStoryManage(id);
            await saveStories({ ...S.stories.get(id), era: v });
            rerenderSoon(); openStoryManage(id);
          },
        },
      }, s.era ? 'Change era' : 'Set era'),
      h('button.btn.small', { type: 'button', on: { click: () => addFlow({ u: s.universeId, at: i + 1 }) } }, '+ Add a story after this')),
    h('h3', 'Details'),
    h('dl.kv',
      h('dt', 'Source'), h('dd', s.source?.kind === 'gdrive' ? `Google Drive: ${s.source.name}` : s.source?.name || 'File'),
      h('dt', 'Added'), h('dd', fmtDate(s.addedAt)),
      pg.lastRead ? [h('dt', 'Last read'), h('dd', fmtDate(pg.lastRead))] : null,
      s.summaryAt ? [h('dt', 'Summary'), h('dd', fmtDate(s.summaryAt))] : null),
    h('div.foot',
      h('button.btn.small', {
        type: 'button', on: {
          click: async () => {
            const v = await ask({ title: 'Rename story', input: { value: s.title }, ok: 'Rename' });
            if (v) { await saveStories({ ...S.stories.get(id), title: v }); rerenderSoon(); }
            openStoryManage(id);
          },
        },
      }, 'Rename'),
      s.source?.kind === 'gdrive' ? h('button.btn.small', { type: 'button', on: { click: async () => { await refreshFromDrive([id], true); openStoryManage(id); } } }, 'Reload from Google') : null,
      h('button.btn.small.danger', {
        type: 'button', on: {
          click: async () => {
            if (await ask({ title: 'Remove this story?', text: `"${s.title}" leaves Callisto on this device. The original file is not touched.`, ok: 'Remove', danger: true })) {
              await deleteStories([id]); toast('Story removed.');
              if (R.id === id) location.replace('#/'); else render();
            } else openStoryManage(id);
          },
        },
      }, 'Remove')),
  ]);
}

// The story sheet readers see: no editing, tags link to their page, neighbours in the timeline.
function openStoryReader(id) {
  const s = S.stories.get(id);
  if (!s) return;
  const list = storiesIn(s.universeId);
  const i = list.findIndex(x => x.id === id);
  const tags = s.tags.map(t => S.tags.get(t)).filter(Boolean);
  const pg = prog(id);
  const pct = Math.round(pg.readPos * 100);
  const near = (x, label) => x && h('button.next-link', { type: 'button', on: { click: () => openStory(x.id) } }, h('small', label), h('b', x.title));
  openSheet([
    h('h2', s.title),
    h('p.sub', [uName(s.universeId), s.universeId ? ` · #${i + 1} of ${list.length}` : '', s.era ? ` · ${s.era}` : '', ` · ${fmtWords(s.words)}`, s.author ? ` · by ${s.author}` : ''].join('')),
    storyActions(id, () => { openStory(id); rerenderSoon(); }),
    s.summary ? [h('h3', 'Summary'), h('p.summary', s.summary)] : null,
    s.blurb ? [h('h3', "Author's summary"), h('p.blurb', s.blurb)] : null,
    tags.length ? [h('h3', 'Tags'), h('div.chips', tags.map(t => h('button.chip', { type: 'button', css: { '--c': tagColor(t) }, on: { click: () => go('#/tag/' + t.id) } }, t.name)))] : null,
    s.universeId && (list[i - 1] || list[i + 1]) ? [h('h3', 'In the timeline'), h('div.near', near(list[i - 1], 'Before this'), near(list[i + 1], 'After this'))] : null,
    isAdmin() ? h('div.manage-link', h('button.btn.small', { type: 'button', on: { click: () => openStoryManage(id) } }, 'Edit details')) : null,
  ]);
}

// The story's universe, changed in place: it goes to the end of the new universe's timeline.
function universeField(s, after) {
  const sel = h('select.field', { 'aria-label': 'Universe' },
    h('option', { value: '' }, 'Unsorted'), universesSorted().map(x => h('option', { value: x.id }, x.name)), h('option', { value: '__new' }, '+ New universe…'));
  sel.value = s.universeId || '';
  sel.addEventListener('change', async () => {
    let to = sel.value;
    if (to === '__new') {
      const name = await ask({ title: 'New universe', input: { placeholder: 'Name' }, ok: 'Create' });
      if (!name) return after();
      to = (await newUniverse(name)).id;
    }
    await placeStories([s.id], to, null);
    toast(`Moved to ${uName(to)}.`);
    rerenderSoon(); after();
  });
  return h('label.field-row', h('span', 'Universe'), sel);
}

// Read, plus favourite and read/unread as two round icon buttons: one line on a phone.
function storyActions(id, after) {
  const pg = prog(id), pct = Math.round(pg.readPos * 100);
  const toggle = (patch, label, on, ic) => {
    const b = iconBtn(ic, label, () => { setProg(id, patch); after(); }, { 'aria-pressed': String(on) });
    b.classList.add('round');
    if (on) b.classList.add('on');
    return b;
  };
  return h('div.actions',
    h('button.btn.primary', { type: 'button', on: { click: () => go('#/read/' + id) } }, pg.status === 'reading' && pct > 0 ? `Continue · ${pct}%` : pg.status === 'read' && !isAdmin() ? 'Read again' : 'Read'),
    toggle({ fav: !pg.fav }, pg.fav ? 'Remove from favourites' : 'Add to favourites', pg.fav, 'star'),
    isAdmin() ? null : toggle({ status: pg.status === 'read' ? 'unread' : 'read', readPos: 0 }, pg.status === 'read' ? 'Mark as unread' : 'Mark as read', pg.status === 'read', 'check'));
}

function askEra(eras, current) {
  const listId = 'eraList';
  const dl = h('datalist#' + listId, eras.map(e => h('option', { value: e })));
  return ask({
    title: 'Era', text: 'A label for this point in the timeline, such as "Year 2" or "Before the war". Stories next to each other with the same era are grouped under it. Leave it empty for none.',
    input: { value: current || '', placeholder: 'Era', list: listId }, ok: 'Save', extra: dl,
  });
}

/* tag picker: works for one story or many (tri-state) */
function pickTags(ids, after) {
  const chosen = new Map();
  for (const t of S.tags.values()) {
    const n = ids.filter(id => S.stories.get(id)?.tags.includes(t.id)).length;
    chosen.set(t.id, n === 0 ? 'none' : n === ids.length ? 'all' : 'some');
  }
  const start = new Map(chosen);
  const q = h('input.field', { type: 'search', placeholder: 'Find or create a tag', autofocus: true });
  const groupSel = h('select.field', { style: { maxWidth: '180px' } }, groups().map(g => h('option', { value: g }, g)));
  groupSel.value = 'Other';
  const box = h('div');
  const create = h('div.btn-row', { style: { marginTop: '10px' } });
  const draw = () => {
    const f = lc(q.value.trim());
    box.replaceChildren();
    for (const g of groups()) {
      const ts = tagsSorted().filter(t => (t.group || 'Other') === g && (!f || lc(t.name).includes(f)));
      if (!ts.length) continue;
      box.append(h('h3', g), h('div.chips', ts.map(t => {
        const st = chosen.get(t.id);
        return h('button.chip' + (st === 'all' ? '.on' : ''), {
          type: 'button', css: { '--c': tagColor(t) }, style: st === 'some' ? { borderStyle: 'dashed', borderColor: 'var(--accent)' } : null,
          'aria-pressed': st === 'all' ? 'true' : st === 'some' ? 'mixed' : 'false',
          on: { click: () => { chosen.set(t.id, st === 'all' ? 'none' : 'all'); draw(); } },
        }, st === 'all' ? '✓ ' : '', t.name);
      })));
    }
    if (!box.children.length) box.append(h('p.muted.small', S.tags.size ? 'No tags match.' : 'No tags yet. Type a name above to make one.'));
    const exact = [...S.tags.values()].some(t => lc(t.name) === f);
    create.replaceChildren();
    if (f && !exact) create.append(groupSel, h('button.btn.small', {
      type: 'button', on: {
        click: async () => { const t = await findOrMakeTag(q.value.trim(), groupSel.value); chosen.set(t.id, 'all'); start.set(t.id, 'none'); q.value = ''; draw(); },
      },
    }, `Create "${q.value.trim()}"`));
  };
  q.addEventListener('input', draw);
  q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); create.querySelector('button')?.click(); } });
  draw();
  openSheet([
    h('h2', ids.length > 1 ? `Tags for ${ids.length} stories` : 'Tags'),
    ids.length > 1 ? h('p.sub', 'Dashed tags are on some of them. Tap to put a tag on all, tap again to take it off all.') : null,
    q, create, box,
    h('div.foot',
      h('button.btn', { type: 'button', on: { click: () => { closeSheet(); after && setTimeout(after, 60); } } }, 'Cancel'),
      h('button.btn.primary', {
        type: 'button', on: {
          click: async () => {
            const upd = ids.map(id => {
              const s = S.stories.get(id);
              const set = new Set(s.tags);
              for (const [tid, st] of chosen) { if (st === start.get(tid)) continue; if (st === 'all') set.add(tid); if (st === 'none') set.delete(tid); }
              return { ...s, tags: [...set] };
            });
            await saveStories(upd);
            closeSheet(); rerenderSoon(); after && setTimeout(after, 60);
          },
        },
      }, 'Done')),
  ]);
}

/* placement: pick a universe and a slot in its timeline */
function pickPlace(ids, done, opts = {}) {
  const moving = new Set(ids);
  let u = opts.u ?? (ids.length ? S.stories.get(ids[0])?.universeId : '') ?? '';
  let at = opts.at ?? null;
  const sel = h('select.field');
  const fill = () => {
    sel.replaceChildren(h('option', { value: '' }, 'Unsorted'), ...universesSorted().map(x => h('option', { value: x.id }, x.name)), h('option', { value: '__new' }, '+ New universe…'));
    sel.value = u;
  };
  fill();
  const box = h('div.pick-list');
  const draw = () => {
    const list = storiesIn(u).filter(s => !moving.has(s.id));
    if (at == null || at > list.length) at = list.length;
    const slot = (k, label) => h('button.slot' + (k === at ? '.on' : ''), { type: 'button', on: { click: () => { at = k; draw(); } } }, k === at ? (opts.verb || 'Here') : label);
    box.replaceChildren(slot(0, list.length ? 'At the start' : 'Here'));
    list.forEach((s, k) => box.append(h('div.item', `${k + 1}. ${s.title}`, s.era ? h('span.muted', ` · ${s.era}`) : null), slot(k + 1, k + 1 === list.length ? 'At the end' : 'Put here')));
    box.querySelector('.slot.on')?.scrollIntoView({ block: 'nearest' });
  };
  sel.addEventListener('change', async () => {
    if (sel.value === '__new') {
      const name = await ask({ title: 'New universe', input: { placeholder: 'Name' }, ok: 'Create' });
      if (name) { const nu = await newUniverse(name); u = nu.id; }
      return pickPlace(ids, done, { ...opts, u, at: null });
    }
    u = sel.value; at = null; draw();
  });
  draw();
  openSheet([
    h('h2', opts.title || (ids.length > 1 ? `Move ${ids.length} stories` : 'Move story')),
    h('p.sub', 'Choose the universe, then where in its timeline.'),
    sel, h('h3', 'Position'), box,
    h('div.foot',
      h('button.btn', { type: 'button', on: { click: closeSheet } }, 'Cancel'),
      h('button.btn.primary', { type: 'button', on: { click: () => { const a = at; closeSheet(); setTimeout(() => done(u, a), 60); } } }, opts.ok || 'Move')),
  ]);
}

/* ───────────── importing ───────────── */

function addFlow(preset = {}) {
  S.importPreset = preset;
  openSheet([
    h('h2', 'Add stories'),
    h('p.sub', 'Text files, Word (.docx), OpenDocument, RTF, Markdown, HTML, EPUB, AO3 downloads and Google Docs.'),
    h('div.menu-list',
      h('button', { type: 'button', on: { click: () => { $('#filePick').click(); closeSheet(); } } }, icon('doc'), 'From files on this device'),
      h('button', { type: 'button', on: { click: () => openDrive() } }, icon('folder'), 'From Google Drive (Docs, Word, text)'),
      h('button', { type: 'button', on: { click: () => newUniverseFlow() } }, icon('plus'), 'New universe')),
  ]);
}

$('#filePick').addEventListener('change', async e => {
  const files = [...e.target.files];
  e.target.value = '';
  if (!files.length) return;
  const items = [], errors = [];
  toast(`Reading ${files.length} file${files.length > 1 ? 's' : ''}…`, null, 0);
  await pool(files, 3, async f => {
    const kind = kindOf(f.name, f.type);
    if (!kind) { errors.push(`${f.name}: ${/\.doc$/i.test(f.name) ? 'old Word format, save it as .docx' : /\.pdf$/i.test(f.name) ? 'PDF is not supported' : 'not a supported file type'}`); return; }
    try {
      const p = await parseAny(f.name, kind, await f.arrayBuffer());
      items.push({ ...p, sortName: f.name, source: { kind: 'file', name: f.name, modifiedTime: f.lastModified } });
    } catch (err) { errors.push(`${f.name}: ${err.message}`); }
  });
  $('#toast').hidden = true;
  if (!items.length) return ask({ title: 'Nothing imported', text: errors.join('\n'), cancel: null });
  importOptions(items, errors);
});

async function newUniverseFlow() {
  const name = await ask({ title: 'New universe', text: 'A universe holds stories that share a world, in timeline order.', input: { placeholder: 'Name' }, ok: 'Create' });
  if (!name) return;
  const u = await newUniverse(name);
  go('#/u/' + u.id);
}

function importOptions(items, errors = [], ctx = {}) {
  items.sort((a, b) => collator.compare(a.folderPath || '', b.folderPath || '') || collator.compare(a.sortName, b.sortName));
  const preset = S.importPreset || {};
  let u = preset.u ?? (S.route.name === 'universe' ? S.route.id : '');
  let at = preset.at ?? null;
  const tagIds = new Set();
  const hasAo3 = items.some(i => i.meta && Object.keys(i.meta.tags || {}).length);
  const folders = [...new Set(items.map(i => i.folder).filter(Boolean))];
  const byDrive = new Map([...S.stories.values()].filter(s => s.source?.driveId).map(s => [s.source.driveId, s]));
  const byTitle = new Map([...S.stories.values()].map(s => [lc(s.title) + '|' + s.words, s]));
  const dupOf = it => (it.source.driveId && byDrive.get(it.source.driveId)) || byTitle.get(lc(it.title) + '|' + it.words);
  const dups = items.filter(dupOf).length;

  const uSel = h('select.field');
  const fill = () => { uSel.replaceChildren(h('option', { value: '' }, 'Unsorted'), ...universesSorted().map(x => h('option', { value: x.id }, x.name)), h('option', { value: '__new' }, '+ New universe…')); uSel.value = u; };
  fill();
  const perFolder = h('input', { type: 'checkbox', checked: folders.length > 1 });
  const ao3 = h('input', { type: 'checkbox', checked: pref.get('ao3Tags', false) });
  const dupSel = h('select.field', h('option', { value: 'update' }, 'Update their text, keep their place and tags'), h('option', { value: 'skip' }, 'Skip them'), h('option', { value: 'copy' }, 'Add them again as copies'));
  const era = h('input.field', { type: 'text', placeholder: 'Era for all of these (optional)' });
  const tagBox = h('div.chips');
  const drawTags = () => tagBox.replaceChildren(
    ...[...tagIds].map(id => S.tags.get(id)).filter(Boolean).map(t => h('button.chip', { type: 'button', css: { '--c': tagColor(t) }, on: { click: () => { tagIds.delete(t.id); drawTags(); } } }, t.name, h('span.x', '×'))),
    h('button.chip.add', { type: 'button', on: { click: () => chooseTags() } }, '+ Tag all of them'));
  const chooseTags = async () => {
    const name = await ask({ title: 'Tag all of them', input: { placeholder: 'Tag name', list: 'allTags' }, ok: 'Add', extra: h('datalist#allTags', tagsSorted().map(t => h('option', { value: t.name }))) });
    if (name) { const t = await findOrMakeTag(name); tagIds.add(t.id); }
    importOptions(items, errors, { ...ctx, restore: { u, at, tagIds, era: era.value } });
  };
  if (ctx.restore) { u = ctx.restore.u; at = ctx.restore.at; ctx.restore.tagIds.forEach(t => tagIds.add(t)); era.value = ctx.restore.era; uSel.value = u; }
  drawTags();
  const posBox = h('div.pick-list');
  const drawPos = () => {
    const list = storiesIn(u);
    if (at == null || at > list.length) at = list.length;
    const slot = (k, label) => h('button.slot' + (k === at ? '.on' : ''), { type: 'button', on: { click: () => { at = k; drawPos(); } } }, k === at ? `New stories go here (${items.length})` : label);
    posBox.replaceChildren(slot(0, list.length ? 'At the start' : 'Here'));
    list.forEach((s, k) => posBox.append(h('div.item', `${k + 1}. ${s.title}`), slot(k + 1, k + 1 === list.length ? 'At the end' : 'Put here')));
  };
  uSel.addEventListener('change', async () => {
    if (uSel.value === '__new') {
      const name = await ask({ title: 'New universe', input: { placeholder: 'Name' }, ok: 'Create' });
      if (name) u = (await newUniverse(name)).id;
      return importOptions(items, errors, { ...ctx, restore: { u, at: null, tagIds, era: era.value } });
    }
    u = uSel.value; at = null; drawPos();
  });
  drawPos();
  const posWrap = h('div', h('h3', 'Where in the timeline'), posBox);
  // Files picked on their own (not inside a picked folder) still go to the chosen universe.
  const loose = items.some(i => !i.folder);
  const uHead = h('h3', 'Universe');
  const syncFolder = () => {
    const on = folders.length > 0 && perFolder.checked;
    posWrap.hidden = on;
    uSel.hidden = uHead.hidden = on && !loose;
    uHead.textContent = on ? 'Universe for the files picked on their own' : 'Universe';
  };
  perFolder.addEventListener('change', syncFolder);
  syncFolder();

  openSheet([
    h('h2', `Add ${items.length} stor${items.length === 1 ? 'y' : 'ies'}`),
    h('p.sub', items.slice(0, 6).map(i => i.title).join(' · ') + (items.length > 6 ? ` and ${items.length - 6} more` : '')),
    errors.length ? h('p.small', { style: { color: 'var(--danger)', whiteSpace: 'pre-wrap' } }, `Skipped ${errors.length}:\n` + errors.slice(0, 8).join('\n') + (errors.length > 8 ? '\n…' : '')) : null,
    folders.length ? h('label.check', perFolder, `One universe per Drive folder (${folders.length} folders: ${folders.slice(0, 4).join(', ')}${folders.length > 4 ? '…' : ''})`) : null,
    uHead, uSel,
    posWrap,
    h('h3', 'Era and tags'), era, h('div', { style: { marginTop: '10px' } }, tagBox),
    hasAo3 ? h('h3', 'Options') : null,
    hasAo3 ? h('label.check', ao3, 'Use the AO3 tags in these files (fandom, relationships, characters, additional tags)') : null,
    dups ? [h('h3', `${dups} already in your library`), dupSel] : null,
    h('div.foot',
      h('button.btn', { type: 'button', on: { click: closeSheet } }, 'Cancel'),
      h('button.btn.primary', {
        type: 'button', on: {
          click: async e => {
            e.currentTarget.disabled = true;
            pref.set('ao3Tags', ao3.checked);
            const ids = await commitImport(items, { u, at, perFolder: folders.length > 0 && perFolder.checked, tagIds: [...tagIds], era: era.value.trim(), ao3: hasAo3 && ao3.checked, dup: dupSel.value, dupOf });
            S.importPreset = null;
            closeSheet();
            const target = folders.length && perFolder.checked ? '#/' : '#/u/' + (u || '_');
            toast(`Added ${ids.added} stor${ids.added === 1 ? 'y' : 'ies'}${ids.updated ? `, updated ${ids.updated}` : ''}${ids.skipped ? `, skipped ${ids.skipped}` : ''}.`, { label: 'Open', run: () => go(target) }, 6000);
            if (location.hash !== target) go(target); else render();
          },
        },
      }, 'Add to library')),
  ]);
}

const AO3_GROUPS = { Fandom: 'Fandom', Fandoms: 'Fandom', Relationship: 'Pairing', Relationships: 'Pairing', Character: 'Character', Characters: 'Character', 'Additional Tags': 'Trope', 'Archive Warning': 'Warning', 'Archive Warnings': 'Warning', Rating: 'Rating', Category: 'Category', Categories: 'Category' };

async function commitImport(items, o) {
  const now = Date.now();
  const res = { added: 0, updated: 0, skipped: 0 };
  const groupsByU = new Map();
  const folderU = new Map();
  for (const it of items) {
    const dup = o.dupOf(it);
    if (dup && o.dup === 'skip') { res.skipped++; continue; }
    if (dup && o.dup === 'update') {
      await dbPut('texts', { id: dup.id, html: it.html, plain: it.plain });
      S.texts.set(dup.id, { id: dup.id, html: it.html, plain: it.plain });
      await saveStories({ ...dup, words: it.words, source: { ...dup.source, ...it.source }, summaryStale: !!dup.summary, updatedAt: now });
      res.updated++;
      continue;
    }
    let u = o.u || '';
    if (o.perFolder && it.folder) {
      if (!folderU.has(it.folder)) {
        const hit = [...S.universes.values()].find(x => lc(x.name) === lc(it.folder));
        folderU.set(it.folder, hit ? hit.id : (await newUniverse(it.folder)).id);
      }
      u = folderU.get(it.folder);
    }
    const tags = new Set(o.tagIds);
    if (o.ao3 && it.meta?.tags) {
      for (const [k, vals] of Object.entries(it.meta.tags)) {
        const g = AO3_GROUPS[k];
        if (!g || g === 'Rating' || g === 'Category') continue;
        for (const v of vals) if (v && v.length < 80) tags.add((await findOrMakeTag(v, g)).id);
      }
    }
    const s = {
      id: uid(), title: it.title, universeId: u, pos: 1e9, era: o.era || '', tags: [...tags],
      words: it.words, blurb: it.blurb || '', author: it.meta?.author || '', summary: '',
      addedAt: now + res.added, source: it.source,
    };
    await dbPut('texts', { id: s.id, html: it.html, plain: it.plain });
    S.texts.set(s.id, { id: s.id, html: it.html, plain: it.plain });
    await saveStories(s);
    if (!groupsByU.has(u)) groupsByU.set(u, []);
    groupsByU.get(u).push(s.id);
    res.added++;
  }
  for (const [u, ids] of groupsByU) await placeStories(ids, u, o.perFolder ? null : o.at);
  return res;
}

/* Google Drive browser with multi-select (files and whole folders) */
async function openDrive(state) {
  if (!G.valid()) {
    openSheet([
      h('h2', 'Google Drive'),
      h('p.sub', 'Sign in to pick Google Docs, Word and text files from your Drive. Callisto only reads them; it never changes anything in your Drive.'),
      h('div.foot',
        h('button.btn', { type: 'button', on: { click: closeSheet } }, 'Cancel'),
        h('button.btn.primary', { type: 'button', on: { click: async () => { try { await signIn('drive'); openDrive(); } catch (e) { toast(e.message); } } } }, 'Sign in with Google')),
    ]);
    return;
  }
  const st = state || { path: [{ id: 'root', name: 'My Drive' }], picked: new Map(), q: '', shared: false };
  const here = st.path[st.path.length - 1];
  const list = h('div.drive-list', h('p.muted.small', 'Loading…'));
  const count = h('span.muted.small');
  const importBtn = h('button.btn.primary', { type: 'button', disabled: !st.picked.size, on: { click: () => importDrive(st) } }, 'Import');
  const upd = () => { count.textContent = st.picked.size ? `${st.picked.size} picked` : ''; importBtn.disabled = !st.picked.size; importBtn.textContent = st.picked.size ? `Import ${st.picked.size}` : 'Import'; };
  const q = h('input.field', { type: 'search', placeholder: 'Search your Drive by name', value: st.q });
  q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); openDrive({ ...st, q: q.value.trim() }); } });
  const crumbs = h('div.crumbs',
    h('button', { type: 'button', on: { click: () => openDrive({ ...st, path: [{ id: 'root', name: 'My Drive' }], shared: false, q: '' }) } }, 'My Drive'),
    h('button', { type: 'button', on: { click: () => openDrive({ ...st, path: [{ id: 'shared', name: 'Shared with me' }], shared: true, q: '' }) } }, 'Shared with me'),
    h('span.muted', '·'),
    ...(st.q ? [h('span', `Results for "${st.q}"`)] : st.path.map((p, k) => [k ? h('span.muted', '›') : null, h('button', { type: 'button', on: { click: () => openDrive({ ...st, path: st.path.slice(0, k + 1) }) } }, p.name)]).flat()));
  openSheet([
    h('h2', 'Import from Google Drive'),
    h('p.sub', 'Tick files, or tick a whole folder to bring in everything inside it (subfolders too).'),
    q, crumbs, list,
    h('div.foot', count, h('button.btn', { type: 'button', on: { click: closeSheet } }, 'Cancel'), importBtn),
  ]);
  upd();
  let files;
  try {
    const query = st.q ? `name contains '${qstr(st.q)}' and trashed=false and ${mimeQ()}`
      : here.id === 'shared' ? `sharedWithMe and trashed=false and ${mimeQ()}`
        : `'${here.id}' in parents and trashed=false and ${mimeQ()}`;
    files = await driveList(query);
  } catch (e) {
    if (e.status === 401) return openDrive(st);
    list.replaceChildren(h('p.small', { style: { color: 'var(--danger)' } }, e.message));
    return;
  }
  if (!sheetOpen) return;
  const rows = files.map(f => {
    const folder = f.mimeType === GFOLDER;
    const kind = folder ? 'folder' : kindOf(f.name, f.mimeType);
    const box = h('input', { type: 'checkbox', checked: st.picked.has(f.id), 'aria-label': 'Pick ' + f.name, on: { change: e => { e.target.checked ? st.picked.set(f.id, { ...f, path: st.path.map(p => p.name) }) : st.picked.delete(f.id); upd(); } } });
    const already = !folder && [...S.stories.values()].some(s => s.source?.driveId === f.id);
    return h('div.drive-row', box,
      folder
        ? h('button.open', { type: 'button', on: { click: () => openDrive({ ...st, q: '', path: [...(st.q ? [{ id: 'root', name: 'My Drive' }] : st.path), { id: f.id, name: f.name }] }) } }, icon('folder'), h('span.nm', f.name), h('span.muted', '›'))
        : h('span.nm', f.name, already ? h('span.muted.small', ' · in library') : null),
      folder ? null : h('span.kind', kind === 'gdoc' ? 'Doc' : kind));
  });
  const fileRows = files.filter(f => f.mimeType !== GFOLDER);
  put(list,
    fileRows.length > 1 ? h('div.btn-row', { style: { margin: '4px 0 8px' } },
      h('button.btn.small', { type: 'button', on: { click: () => { fileRows.forEach(f => st.picked.set(f.id, { ...f, path: st.path.map(p => p.name) })); list.querySelectorAll('input').forEach((b, k) => { if (files[k].mimeType !== GFOLDER) b.checked = true; }); upd(); } } }, `Tick all ${fileRows.length} files here`),
      h('button.btn.small', { type: 'button', on: { click: () => { st.picked.clear(); list.querySelectorAll('input').forEach(b => { b.checked = false; }); upd(); } } }, 'Clear')) : null,
    ...(rows.length ? rows : [h('p.muted.small', 'Nothing here that Callisto can read.')]));
}

async function importDrive(st) {
  const picked = [...st.picked.values()];
  const folders = picked.filter(f => f.mimeType === GFOLDER);
  let files = picked.filter(f => f.mimeType !== GFOLDER).map(f => ({ ...f, folder: null }));
  const bar = h('i', { style: { width: '0%' } });
  const status = h('p.sub', 'Looking inside folders…');
  openSheet([h('h2', 'Importing from Google Drive'), status, h('div.progress', bar)]);
  try {
    if (folders.length) files.push(...await expandFolders(folders, n => { status.textContent = `Looking inside "${n}"…`; }));
  } catch (e) { status.textContent = e.message; return; }
  const seen = new Set();
  files = files.filter(f => !seen.has(f.id) && seen.add(f.id));
  const items = [], errors = [];
  let n = 0;
  status.textContent = `Reading ${files.length} file${files.length === 1 ? '' : 's'}…`;
  await pool(files, 4, async f => {
    try {
      const kind = kindOf(f.name, f.mimeType);
      if (!kind) throw new Error('not a supported file type');
      const got = await driveFetch(f);
      const p = await parseAny(f.name, got.kind, got.data);
      if (got.kind !== kind) p.title = cleanTitle(f.name);
      items.push({ ...p, sortName: f.name, folder: f.folder || null, folderPath: f.folder || '', source: { kind: 'gdrive', name: f.name, driveId: f.id, mime: f.mimeType, modifiedTime: f.modifiedTime } });
    } catch (e) { errors.push(`${f.name}: ${e.message}`); }
    n++;
    bar.style.width = (n / files.length * 100).toFixed(1) + '%';
    status.textContent = `Read ${n} of ${files.length}…`;
  });
  if (!items.length) return ask({ title: 'Nothing imported', text: errors.join('\n') || 'No readable files were found.', cancel: null });
  importOptions(items, errors);
}

// quiet: the automatic check. No sign-in, no toasts unless something changed, and when nothing
// else was waiting to be published it publishes the updated stories itself.
async function refreshFromDrive(ids, force, quiet) {
  if (!G.valid()) { if (quiet) return; try { await signIn('refresh'); } catch (e) { return toast(e.message); } }
  const list = ids.map(id => S.stories.get(id)).filter(s => s?.source?.driveId);
  if (!list.length) return quiet ? null : toast('None of these came from Google Drive.');
  const cleanBefore = !pref.get('dirtyAt', 0);
  if (!quiet) toast(`Checking ${list.length} on Google Drive…`, null, 0);
  let changed = 0, failed = 0, gone = 0;
  await pool(list, 4, async s => {
    try {
      const f = await gfetch(`${DRIVE}/files/${s.source.driveId}?fields=id,name,mimeType,modifiedTime,trashed&supportsAllDrives=true`);
      if (f.trashed) { gone++; return; }
      if (!force && f.modifiedTime === s.source.modifiedTime) return;
      const got = await driveFetch(f);
      const p = await parseAny(f.name, got.kind, got.data);
      const old = await getText(s.id);
      if (old && old.plain === p.plain && !force) { await saveStories({ ...S.stories.get(s.id), source: { ...s.source, modifiedTime: f.modifiedTime } }); return; }
      await dbPut('texts', { id: s.id, html: p.html, plain: p.plain });
      S.texts.set(s.id, { id: s.id, html: p.html, plain: p.plain });
      const cur = S.stories.get(s.id);
      await saveStories({ ...cur, words: p.words, source: { ...cur.source, name: f.name, modifiedTime: f.modifiedTime }, summaryStale: !!cur.summary && old?.plain !== p.plain, updatedAt: Date.now() });
      changed++;
    } catch (e) { if (e.status === 404) gone++; else failed++; }
  });
  if (quiet) {
    if (!changed) { if (cleanBefore) pref.del('dirtyAt'); return; }
    toast(`${changed} stor${changed === 1 ? 'y' : 'ies'} updated from Google Docs.`, null, 5000);
    rerenderSoon();
    if (cleanBefore) publish();
    return;
  }
  toast(`${changed} updated${gone ? `, ${gone} no longer on Drive` : ''}${failed ? `, ${failed} could not be checked` : ''}.`, null, 6000);
  rerenderSoon();
}

/* ───────────── reader ───────────── */

const R = { id: null, saveT: 0, lastY: 0 };
async function openReader(id) {
  const s = S.stories.get(id);
  const t = s && await getText(id);
  if (!s || !t) { toast('That story is not on this device.'); location.replace('#/'); return; }
  R.id = id;
  R.openedAt = Date.now();
  $('#rTitle').textContent = s.title;
  const page = $('#rPage');
  page.innerHTML = t.html; // our own sanitised output from import
  const first = page.firstElementChild;
  if (!(first && /^h[1-3]$/.test(first.localName) && lc(first.textContent.trim()) === lc(s.title))) page.prepend(h('h1', s.title));
  const list = storiesIn(s.universeId);
  const i = list.findIndex(x => x.id === id);
  const next = s.universeId ? list[i + 1] : null;
  put($('#rEnd'),
    h('p.done', '— The end —'),
    next ? h('button.next', { type: 'button', on: { click: () => location.replace('#/read/' + next.id) } }, h('small', `Next in ${uName(s.universeId)}${next.era && next.era !== s.era ? ' · ' + next.era : ''}`), h('b', next.title), next.summary ? h('p', { style: { margin: '6px 0 0', fontSize: '14px', opacity: .8 } }, next.summary) : null) : null);
  const r = $('#reader');
  r.hidden = false;
  r.classList.remove('hide-ui');
  document.title = s.title + ' · Callisto';
  const sc = $('#rScroll');
  sc.scrollTop = 0;
  await new Promise(requestAnimationFrame);
  const pg = prog(id);
  if (pg.readPos > 0 && pg.readPos < .985) sc.scrollTop = pg.readPos * (sc.scrollHeight - sc.clientHeight);
  R.lastY = sc.scrollTop;
  setProg(id, { status: pg.status === 'read' ? 'read' : 'reading', lastRead: Date.now() });
  onReadScroll();
  sc.focus({ preventScroll: true });
}
function closeReader() {
  if ($('#reader').hidden) return;
  saveReadPos();
  if (location.hash.startsWith('#/read/')) history.length > 1 && S.cameFromApp ? history.back() : location.replace('#/');
}
function saveReadPos() {
  if (!R.id) return;
  const sc = $('#rScroll');
  const max = sc.scrollHeight - sc.clientHeight;
  // A story that fits on one screen counts as read once it has been open for 15 seconds.
  const p = max > 0 ? sc.scrollTop / max : Date.now() - R.openedAt > 15000 ? 1 : 0;
  const s = S.stories.get(R.id);
  if (!s) return;
  const status = p >= .985 || prog(R.id).status === 'read' ? 'read' : 'reading';
  setProg(R.id, { readPos: p >= .985 ? 0 : p, status, lastRead: Date.now() });
}
function onReadScroll() {
  const sc = $('#rScroll');
  const max = sc.scrollHeight - sc.clientHeight;
  const p = max > 0 ? Math.min(1, sc.scrollTop / max) : 1;
  $('#rBar').style.width = (p * 100).toFixed(1) + '%';
  $('#rPct').textContent = Math.round(p * 100) + '%';
  const y = sc.scrollTop;
  if (Math.abs(y - R.lastY) > 24) { $('#reader').classList.toggle('hide-ui', y > R.lastY && y > 80); R.lastY = y; }
  clearTimeout(R.saveT);
  R.saveT = setTimeout(saveReadPos, 800);
}
$('#rScroll').addEventListener('scroll', onReadScroll, { passive: true });
$('#rScroll').addEventListener('click', e => {
  if (e.target.closest('a, button')) return;
  if (getSelection().toString()) return;
  $('#reader').classList.toggle('hide-ui');
});
$('#rClose').append(icon('back'));
$('#rClose').addEventListener('click', closeReader);
$('#rInfo').append(icon('info'));
$('#rInfo').addEventListener('click', () => R.id && openStory(R.id));
document.addEventListener('visibilitychange', () => { if (document.hidden && !$('#reader').hidden) saveReadPos(); });

/* ───────────── views ───────────── */

function setBar(title, { back = false, actions = [], home = false } = {}) {
  $('#barTitle').textContent = title;
  $('.app').classList.toggle('home-bar', home);
  const bb = $('#backBtn');
  bb.hidden = !back;
  // Manager: one small Publish button in the bar when there is something to publish.
  const pub = isAdmin() && pref.get('dirtyAt', 0) ? h('button.pub', { type: 'button', title: 'Changes not published yet', on: { click: publish } }, h('i'), 'Publish') : null;
  put($('#barActions'), pub, actions);
  document.title = !title || title === 'Callisto' ? 'Callisto' : title + ' · Callisto';
}

function storyRow(s, { num, showU, terms, arranging } = {}) {
  const tags = s.tags.map(id => S.tags.get(id)).filter(Boolean);
  const pg = prog(s.id);
  const pct = Math.round(pg.readPos * 100);
  const meta = [showU ? uName(s.universeId) + (s.era ? ' · ' + s.era : '') : null, pg.status === 'reading' && pct ? pct + '% read' : null, s.author ? 'by ' + s.author : null].filter(Boolean).join(' · ');
  const row = h('div.row' + (S.sel.has(s.id) ? '.sel' : ''), { 'data-id': s.id, role: arranging ? null : 'button', tabindex: arranging ? null : '0' },
    arranging ? h('span.handle', { 'aria-label': 'Drag to reorder', title: 'Drag to reorder' }, icon('handle')) : null,
    num != null ? h('span.num', num) : null,
    h('div.body',
      h('div.t', isAdmin() ? null : h('span.dot' + (pg.status === 'read' ? '.read' : pg.status === 'reading' ? '.reading' : ''), { title: pg.status }), h('span', terms?.length ? markTerms(s.title, terms) : s.title), pg.fav ? h('span.fav', { 'aria-label': 'Favourite' }, '★') : null, h('span.leader'), h('span.len', fmtWords(s.words))),
      meta || (arranging && s.era) ? h('div.meta', meta, arranging && s.era ? h('span', (meta ? ' · ' : '') + s.era) : null) : null,
      s.summary || s.blurb ? h('p.sum', s.summary || s.blurb) : null,
      tags.length ? h('div.tagline', tags.slice(0, 4).map(t => h('span', { css: { '--c': tagColor(t) } }, t.name)), tags.length > 4 ? h('span.more', `+${tags.length - 4}`) : null) : null),
    arranging ? h('label.pick', h('input', { type: 'checkbox', checked: S.sel.has(s.id), 'aria-label': 'Select ' + s.title, on: { change: e => { e.target.checked ? S.sel.add(s.id) : S.sel.delete(s.id); row.classList.toggle('sel', e.target.checked); drawBulk(); } } })) : null);
  if (!arranging) {
    const open = () => openStory(s.id);
    row.addEventListener('click', open);
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  }
  return row;
}

function viewLibrary(v) {
  const A = isAdmin();
  setBar('Callisto', { home: true, actions: [A ? iconBtn('plus', 'Add stories', () => addFlow()) : null, iconBtn('gear', 'Settings', () => go('#/settings'))] });
  if (!A && !S.stories.size) {
    v.append(h('div.wrap.empty',
      h('h2', S.loadError ? 'Could not load the library' : 'Nothing to read yet'),
      h('p', S.loadError || 'No stories have been published here yet. Come back soon.'),
      S.loadError ? h('div.btn-row', h('button.btn.primary', { type: 'button', on: { click: async () => { await loadPublished(); render(); } } }, 'Try again')) : null));
    return;
  }
  if (!S.stories.size && !S.universes.size) {
    v.append(h('div.wrap.empty',
      h('h2', 'Your library is empty'),
      h('p', 'Add stories from files or Google Drive, then arrange them into universes and timelines.'),
      h('div.btn-row',
        h('button.btn.primary', { type: 'button', on: { click: () => $('#filePick').click() } }, 'Add files'),
        h('button.btn', { type: 'button', on: { click: () => openDrive() } }, 'Import from Google Drive'))));
    return;
  }
  const w = h('div.wrap');
  const home = h('div.home');
  w.prepend(h('header.title-page', h('p', 'Stories of Frey and Jun'), h('span.orn', { 'aria-hidden': 'true' }, '❦')));
  searchUI(w, home);
  w.append(home);
  const count = n => `${n} stor${n === 1 ? 'y' : 'ies'}`;
  const recent = [...S.stories.values()].filter(s => prog(s.id).status === 'reading').sort((a, b) => prog(b.id).lastRead - prog(a.id).lastRead).slice(0, 5);
  if (recent.length) {
    home.append(h('div.section-h', h('h2', 'Bookmarks')),
      h('div.bookmarks', recent.map(s => h('a.bookmark', { href: '#/read/' + s.id },
        h('span.bm-t', s.title), h('span.leader'), h('span.bm-p', Math.round(prog(s.id).readPos * 100) + '%'),
        h('span.bm-u', uName(s.universeId) + (s.era ? ' · ' + s.era : ''))))));
  }
  // The universes as a table of contents.
  home.append(h('div.section-h', h('h2', 'Contents'), A ? h('button.btn.small', { type: 'button', on: { click: newUniverseFlow } }, '+ New universe') : null));
  const toc = h('ol.toc');
  const entry = (href, num, u, name, n, sub) => h('li', h('a.toc-row', { href },
    h('span.toc-n', num), uIcon(u, 'u-icon-sm'), h('span.toc-t', name), h('span.leader'), h('span.toc-p', count(n)),
    sub ? h('span.toc-sub', sub) : null));
  universesSorted().forEach((u, k) => {
    const list = storiesIn(u.id);
    const unread = list.filter(s => prog(s.id).status === 'unread').length;
    toc.append(entry('#/u/' + u.id, roman(k + 1), u, u.name, list.length,
      [A ? '' : unread ? `${unread} unread` : list.length ? 'all read' : '', list.length ? fmtWords(list.reduce((n, s) => n + s.words, 0)) : ''].filter(Boolean).join(' · ')));
  });
  const loose = storiesIn('');
  if (loose.length) toc.append(entry('#/u/_', '·', null, 'Unsorted', loose.length, 'not in a universe yet'));
  home.append(toc.children.length ? toc : h('p.muted', 'No universes yet.'));
  // Tags as the index at the back: most used first; "All tags" for the full list and new tags.
  const used = tagsSorted().map(t => [t, tagUse(t.id)]).filter(([t, n]) => n || A).sort((a, b) => b[1] - a[1]);
  if (used.length || A) {
    home.append(h('div.section-h', h('h2', 'Index'), h('a.small', { href: '#/tags' }, A ? 'All tags and new tags' : 'All tags')),
      h('p.index', used.slice(0, 24).flatMap(([t], k) => [k ? h('span.sep', ' · ') : null, h('a', { href: '#/tag/' + t.id }, t.name)])));
  }
  v.append(w);
}

function viewUniverse(v, id) {
  const u = id === '_' ? '' : id;
  const uni = u ? S.universes.get(u) : null;
  if (u && !uni) { location.replace('#/'); return; }
  const all = storiesIn(u);
  const arranging = S.arranging;
  const menu = () => openSheet([
    h('h2', uName(u)),
    h('div.menu-list',
      all.length > 1 ? h('button', { type: 'button', 'aria-label': 'Arrange the timeline', on: { click: () => { closeSheet(); S.arranging = true; S.sel.clear(); render(); } } }, icon('arrange'), 'Arrange the timeline') : null,
      h('button', { type: 'button', on: { click: () => addFlow({ u, at: null }) } }, icon('plus'), 'Add stories here'),
      all.some(s => s.source?.driveId) ? h('button', { type: 'button', on: { click: () => { closeSheet(); refreshFromDrive(all.map(s => s.id)); } } }, 'Check Google Drive for changes') : null,
      uni ? h('button', { type: 'button', on: { click: async () => { const n = await ask({ title: 'Rename universe', input: { value: uni.name }, ok: 'Rename' }); if (n) { await saveUniverse({ ...uni, name: n }); render(); } } } }, 'Rename') : null,
      uni ? h('button', { type: 'button', on: { click: () => { closeSheet(); pickIcon(uni); } } }, uni.icon ? 'Change icon…' : 'Icon…') : null,
      uni?.icon ? h('button', { type: 'button', on: { click: async () => { const { icon, ...rest } = uni; await saveUniverse(rest); closeSheet(); render(); } } }, 'Remove icon') : null,
      uni ? h('button', { type: 'button', on: { click: () => colourFlow(uni) } }, 'Colour') : null,
      uni ? h('button', {
        type: 'button', on: {
          click: async () => {
            const us = universesSorted(), k = us.findIndex(x => x.id === u);
            if (k > 0) { [us[k - 1], us[k]] = [us[k], us[k - 1]]; for (const [n, x] of us.entries()) await saveUniverse({ ...x, order: n }); }
            closeSheet(); toast(k > 0 ? 'Moved up in the library.' : 'It is already first.');
          },
        },
      }, 'Move up in the library') : null,
      uni ? h('button.danger', {
        type: 'button', on: {
          click: async () => {
            if (!await ask({ title: `Delete "${uni.name}"?`, text: `Its ${all.length} stories move to Unsorted. Nothing else is deleted.`, ok: 'Delete universe', danger: true })) return;
            const base = storiesIn('').length;
            await saveStories(all.map((s, k) => ({ ...s, universeId: '', pos: base + k })));
            S.universes.delete(u); await dbDel('universes', u);
            go('#/');
          },
        },
      }, 'Delete universe') : null),
  ]);
  const A = isAdmin();
  setBar(uName(u), {
    back: true,
    actions: !A ? [] : arranging
      ? [h('button.btn.small.primary', { type: 'button', on: { click: () => { S.arranging = false; S.sel.clear(); render(); } } }, 'Done')]
      : [iconBtn('plus', 'Add stories here', () => addFlow({ u })), iconBtn('more', 'More', menu)],
  });
  const w = h('div.wrap');
  if (!all.length) {
    w.append(A ? h('div.empty', h('h2', 'No stories here yet'), h('p', 'Add stories, or move some here from another universe.'), h('div.btn-row', h('button.btn.primary', { type: 'button', on: { click: () => addFlow({ u }) } }, 'Add stories'))) : h('div.empty', h('h2', 'No stories here yet')));
    v.append(w);
    return;
  }
  const words = all.reduce((n, s) => n + s.words, 0);
  w.append(h('div.u-head', uIcon(uni, 'u-icon-big'), h('p.muted.small', { style: { margin: 0 } }, `${all.length} stor${all.length === 1 ? 'y' : 'ies'} · ${fmtWords(words)}${isAdmin() ? '' : ` · ${all.filter(s => prog(s.id).status === 'read').length} read`}`)));
  let shown = all;
  if (!arranging) {
    const used = new Map();
    for (const s of all) for (const t of s.tags) used.set(t, (used.get(t) || 0) + 1);
    const tagList = [...used.keys()].map(id => S.tags.get(id)).filter(Boolean).sort((a, b) => used.get(b.id) - used.get(a.id) || collator.compare(a.name, b.name));
    const f = S.filter;
    w.append(h('div.filters',
      isAdmin() ? null : h('button.chip.plain' + (f.unread ? '.on' : ''), { type: 'button', on: { click: () => { f.unread = !f.unread; render(); } } }, 'Unread'),
      tagList.map(t => h('button.chip' + (f.tags.has(t.id) ? '.on' : ''), { type: 'button', css: { '--c': tagColor(t) }, on: { click: () => { f.tags.has(t.id) ? f.tags.delete(t.id) : f.tags.add(t.id); render(); } } }, t.name))));
    shown = all.filter(s => (!f.unread || prog(s.id).status !== 'read') && [...f.tags].every(t => !S.tags.has(t) || s.tags.includes(t)));
    if (!shown.length) w.append(h('p.muted', 'No stories match these filters.'));
  } else {
    w.append(h('p.hint', { style: { margin: '0 0 12px' } }, 'Drag ', h('b', '⠿'), ' to reorder. Tick stories to move, tag or set the era of several at once.'));
  }
  const list = h('div.list' + (arranging ? '.arranging' : ''));
  let lastEra = null;
  for (const s of shown) {
    const n = all.indexOf(s) + 1;
    if (!arranging && u && (s.era || '') !== (lastEra ?? '') && s.era) list.append(h('div.era', s.era));
    lastEra = s.era || '';
    list.append(storyRow(s, { num: u ? n : null, arranging }));
  }
  w.append(list);
  v.append(w);
  if (arranging) { wireDrag(list, u); drawBulk(); }
}

// A universe's icon: an image from the device, cropped square and kept small (published with the library).
function pickIcon(uni) {
  const input = h('input', { type: 'file', accept: 'image/*' });
  input.addEventListener('change', async () => {
    const f = input.files[0];
    if (!f) return;
    try { await setIcon(uni.id, f); toast('Icon set.'); render(); }
    catch { toast('That image could not be read.'); }
  });
  input.click();
}
async function setIcon(id, file) {
  const img = await createImageBitmap(file);
  const side = Math.min(img.width, img.height), size = 160;
  const c = h('canvas', { width: size, height: size });
  c.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
  let url = c.toDataURL('image/webp', .85);
  if (!url.startsWith('data:image/webp')) url = c.toDataURL('image/jpeg', .85);
  await saveUniverse({ ...S.universes.get(id), icon: url });
}
const roman = n => [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].reduce((out, [v, r]) => { while (n >= v) { out += r; n -= v; } return out; }, '');
const uIcon = (u, cls = 'u-icon') => u?.icon ? h('img.' + cls, { src: u.icon, alt: '' }) : null;
// The square tile beside a universe: its icon, or its first letter on its colour.
const uTile = (u, cls = 'u-icon') => uIcon(u, cls) || h('span.' + cls + '.mono', { css: { '--c': u?.color || 'var(--ink-2)' }, 'aria-hidden': 'true' }, (u?.name || '?').trim().charAt(0).toUpperCase());

function colourFlow(uni) {
  openSheet([
    h('h2', 'Colour'),
    h('div.chips', PALETTE.map(c => h('button.chip' + (uni.color === c ? '.on' : ''), { type: 'button', css: { '--c': c }, 'aria-label': c, on: { click: async () => { await saveUniverse({ ...uni, color: c }); closeSheet(); render(); } } }, ' '))),
  ]);
}

function drawBulk() {
  document.querySelector('.bulk')?.remove();
  if (!S.arranging) return;
  const u = S.route.id === '_' ? '' : S.route.id;
  const ids = () => storiesIn(u).filter(s => S.sel.has(s.id)).map(s => s.id);
  const n = S.sel.size;
  const all = storiesIn(u);
  const bar = h('div.bulk',
    h('span.n', n ? `${n} selected` : 'None selected'),
    h('button.btn.small', { type: 'button', on: { click: () => { if (S.sel.size === all.length) S.sel.clear(); else all.forEach(s => S.sel.add(s.id)); render(); } } }, S.sel.size === all.length ? 'Select none' : 'Select all'),
    h('button.btn.small', { type: 'button', disabled: !n, on: { click: () => pickPlace(ids(), async (to, at) => { await placeStories(ids(), to, at); S.sel.clear(); render(); toast('Moved.'); }) } }, 'Move…'),
    h('button.btn.small', { type: 'button', disabled: !n, on: { click: () => pickTags(ids()) } }, 'Tags…'),
    h('button.btn.small', {
      type: 'button', disabled: !n, on: {
        click: async () => {
          const eras = [...new Set(all.map(x => x.era).filter(Boolean))];
          const v = await askEra(eras, '');
          if (v === null) return;
          await saveStories(ids().map(id => ({ ...S.stories.get(id), era: v })));
          render();
        },
      },
    }, 'Era…'),
    h('button.btn.small.danger', {
      type: 'button', disabled: !n, on: {
        click: async () => {
          if (!await ask({ title: `Remove ${n} stor${n === 1 ? 'y' : 'ies'}?`, text: 'They leave Callisto on this device. The original files are not touched.', ok: 'Remove', danger: true })) return;
          await deleteStories(ids()); S.sel.clear(); render();
        },
      },
    }, 'Remove'));
  document.body.append(bar);
}

// Drag to reorder: pointer events on the handle, live reordering, auto-scroll near the edges.
function wireDrag(list, u) {
  const view = $('#view');
  let drag = null;
  const place = () => {
    if (!drag) return;
    const { row, y } = drag;
    const rows = [...list.querySelectorAll('.row')].filter(r => r !== row);
    const before = rows.find(r => { const b = r.getBoundingClientRect(); return y < b.top + b.height / 2; });
    if (before) { if (row.nextElementSibling !== before) list.insertBefore(row, before); }
    else if (list.lastElementChild !== row) list.append(row);
    row.style.transform = 'none';
    const top = row.getBoundingClientRect().top;
    row.style.transform = `translateY(${y - drag.grab - top}px)`;
  };
  const tick = () => {
    if (!drag) return;
    const b = view.getBoundingClientRect();
    const edge = 70;
    let dy = 0;
    if (drag.y < b.top + edge) dy = -Math.ceil((b.top + edge - drag.y) / 6);
    else if (drag.y > b.bottom - edge) dy = Math.ceil((drag.y - (b.bottom - edge)) / 6);
    if (dy) { view.scrollTop += dy; place(); }
    drag.raf = requestAnimationFrame(tick);
  };
  list.addEventListener('pointerdown', e => {
    const handle = e.target.closest('.handle');
    if (!handle || e.button > 0) return;
    e.preventDefault();
    const row = handle.closest('.row');
    const r = row.getBoundingClientRect();
    drag = { row, grab: e.clientY - r.top, y: e.clientY, id: e.pointerId };
    handle.setPointerCapture(e.pointerId);
    row.classList.add('dragging');
    drag.raf = requestAnimationFrame(tick);
  });
  list.addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id) return; drag.y = e.clientY; place(); });
  const end = async e => {
    if (!drag || e.pointerId !== drag.id) return;
    cancelAnimationFrame(drag.raf);
    drag.row.classList.remove('dragging');
    drag.row.style.transform = '';
    drag = null;
    const ids = [...list.querySelectorAll('.row')].map(r => r.dataset.id);
    const before = storiesIn(u).map(s => s.id);
    if (ids.join() !== before.join()) { await setOrder(u, ids); render(); }
  };
  list.addEventListener('pointerup', end);
  list.addEventListener('pointercancel', end);
}

// The search box at the top of the home screen. While there is a query, the results replace `home`.
function searchUI(w, home) {
  const input = h('input.field.search', { type: 'search', value: S.searchQ, placeholder: 'Search stories', 'aria-label': 'Search stories', enterkeyhint: 'search' });
  const results = h('div.list');
  const quick = h('div.filters',
    [...(isAdmin() ? [] : [['is:unread', 'Unread'], ['is:reading', 'Reading']]), ['is:fav', 'Favourites'], ...(isAdmin() ? [['no:summary', 'No summary'], ['no:tags', 'No tags']] : []), ['words:<3000', 'Under 3k words']].map(([q, label]) =>
      h('button.chip.plain' + (S.searchQ.includes(q) ? '.on' : ''), { type: 'button', 'data-q': q, on: { click: () => { const has = input.value.includes(q); input.value = has ? input.value.replace(q, '').replace(/\s+/g, ' ').trim() : (input.value + ' ' + q).trim(); run(); } } }, label)),
    universesSorted().map(u => { const q = `in:"${u.name}"`; return h('button.chip' + (S.searchQ.includes(q) ? '.on' : ''), { type: 'button', 'data-q': q, css: { '--c': u.color }, on: { click: () => { const has = input.value.includes(q); input.value = has ? input.value.replace(q, '').replace(/\s+/g, ' ').trim() : (input.value + ' ' + q).trim(); run(); } } }, u.name); }));
  const hint = h('p.hint', 'Try ', ...['tag:angst', 'in:"Star Wars"', 'character:anna', 'era:"year 2"', '-tag:wip', 'words:1k-5k', '"exact phrase"'].flatMap((x, k) => [k ? ' ' : '', h('code', x)]), '. Typos in titles and tags are forgiven.');
  const searching = h('div.searching', quick, results);
  w.append(h('div.search-box', input), searching);
  const show = () => { const on = !!input.value.trim() || document.activeElement === input; searching.hidden = !on; home.hidden = !!input.value.trim(); };
  input.addEventListener('focus', show);
  input.addEventListener('blur', () => setTimeout(show, 150));
  const run = async () => {
    S.searchQ = input.value;
    if (!S.allTexts) { results.replaceChildren(h('p.muted.small', 'Indexing your library…')); await loadAllTexts(); }
    quick.querySelectorAll('button').forEach(b => b.classList.toggle('on', input.value.includes(b.dataset.q)));
    const q = input.value.trim();
    show();
    if (!q) { put(results, hint); return; }
    const r = search(q);
    results.replaceChildren(h('p.muted.small', { style: { margin: '0 0 4px' } }, `${r.length} result${r.length === 1 ? '' : 's'}`),
      ...r.slice(0, 200).map(({ s, terms }) => {
        const row = storyRow(s, { showU: true, terms });
        const sn = terms.length ? snippet(s, terms) : null;
        if (sn) { row.querySelector('.sum')?.remove(); row.querySelector('.tagline')?.remove(); row.querySelector('.body').append(h('p.snip', sn)); }
        return row;
      }));
  };
  input.addEventListener('input', debounce(run, 160));
  run();
  if (S.focusSearch) { S.focusSearch = false; setTimeout(() => input.focus(), 50); }
}

function viewTags(v) {
  const A = isAdmin();
  setBar('Tags', { back: true });
  const w = h('div.wrap');
  if (A && S.tags.size) w.append(h('div.btn-row', { style: { marginBottom: '16px' } }, h('button.btn.primary', { type: 'button', on: { click: () => newTagFlow() } }, '+ New tag')));
  if (!S.tags.size) {
    w.append(A ? h('div.empty', h('h2', 'No tags yet'), h('p', 'Tags can be characters, pairings, genres, tropes, moods or anything else. Add them from a story, or make some here.'), h('div.btn-row', h('button.btn.primary', { type: 'button', on: { click: () => newTagFlow() } }, '+ New tag'))) : h('div.empty', h('h2', 'No tags yet')));
    v.append(w); return;
  }
  for (const g of groups()) {
    const ts = tagsSorted().filter(t => (t.group || 'Other') === g);
    if (!ts.length) continue;
    w.append(h('div.tag-group', h('div.section-h', h('h2', g), A ? h('button.chip.add', { type: 'button', on: { click: () => newTagFlow(g) } }, `+ Add to ${g}`) : null),
      ts.map(t => h('div.tag-line', { role: 'button', tabindex: '0', css: { '--c': tagColor(t) }, on: { click: () => go('#/tag/' + t.id), keydown: e => { if (e.key === 'Enter') go('#/tag/' + t.id); } } },
        h('span.sw'), h('span', t.name), h('span.n', tagUse(t.id))))));
  }
  v.append(w);
}

async function newTagFlow(group = 'Character') {
  const sel = h('select.field', { 'aria-label': 'Group' }, groups().map(g => h('option', { value: g }, g)), h('option', { value: '__new' }, 'New group…'));
  sel.value = group;
  const own = h('input.field', { type: 'text', placeholder: 'Name of the new group', hidden: true, style: { marginTop: '10px' } });
  sel.addEventListener('change', () => { own.hidden = sel.value !== '__new'; if (!own.hidden) own.focus(); });
  const name = await ask({ title: 'New tag', input: { placeholder: 'Tag name, e.g. Rhea or Slow burn' }, extra: [h('label.small.muted', { style: { display: 'block', margin: '12px 0 6px' } }, 'Group'), sel, own], ok: 'Create' });
  if (!name) return;
  const g = sel.value === '__new' ? own.value.trim() || 'Other' : sel.value;
  if ([...S.tags.values()].some(t => lc(t.name) === lc(name) && lc(t.group) === lc(g))) return toast(`"${name}" is already a tag.`);
  await saveTag({ id: uid(), name: name.trim(), group: g, createdAt: Date.now() });
  toast(`Tag "${name}" made. Add it to stories from their Edit details.`);
  render();
}

function viewTag(v, id) {
  const t = S.tags.get(id);
  if (!t) { location.replace('#/tags'); return; }
  const manage = () => openSheet([
    h('h2', t.name), h('p.sub', t.group),
    h('div.menu-list',
      h('button', { type: 'button', on: { click: async () => { const n = await ask({ title: 'Rename tag', input: { value: t.name }, ok: 'Rename' }); if (n) { await saveTag({ ...t, name: n }); render(); } } } }, 'Rename'),
      h('button', {
        type: 'button', on: {
          click: async () => {
            const sel = h('select.field', groups().map(g => h('option', { value: g }, g)));
            sel.value = t.group || 'Other';
            const custom = h('input.field', { type: 'text', placeholder: 'Or a new group name', style: { marginTop: '10px' } });
            if (await ask({ title: 'Group', extra: [sel, custom], ok: 'Save' })) { await saveTag({ ...t, group: custom.value.trim() || sel.value, color: undefined }); render(); }
          },
        },
      }, 'Change group'),
      h('button', {
        type: 'button', on: {
          click: async () => {
            const sel = h('select.field', tagsSorted().filter(x => x.id !== t.id).map(x => h('option', { value: x.id }, `${x.name} (${x.group})`)));
            if (!sel.options.length) return toast('There is no other tag to merge into.');
            if (!await ask({ title: `Merge "${t.name}" into…`, text: 'Every story with this tag gets the other one instead, and this tag goes.', extra: sel, ok: 'Merge' })) return;
            const into = sel.value;
            await saveStories([...S.stories.values()].filter(s => s.tags.includes(t.id)).map(s => ({ ...s, tags: [...new Set(s.tags.map(x => x === t.id ? into : x))] })));
            S.tags.delete(t.id); await dbDel('tags', t.id);
            go('#/tag/' + into);
          },
        },
      }, 'Merge into another tag'),
      h('button.danger', {
        type: 'button', on: {
          click: async () => {
            if (!await ask({ title: `Delete "${t.name}"?`, text: `It comes off ${tagUse(t.id)} stories. The stories stay.`, ok: 'Delete tag', danger: true })) return;
            await saveStories([...S.stories.values()].filter(s => s.tags.includes(t.id)).map(s => ({ ...s, tags: s.tags.filter(x => x !== t.id) })));
            S.tags.delete(t.id); await dbDel('tags', t.id);
            go('#/tags');
          },
        },
      }, 'Delete tag')),
  ]);
  setBar(t.name, { back: true, actions: isAdmin() ? [iconBtn('more', 'Manage tag', manage)] : [] });
  const w = h('div.wrap', h('p.muted.small', { style: { margin: '0 0 12px' } }, `${t.group || 'Other'} · ${tagUse(t.id)} stories`));
  const list = [...S.stories.values()].filter(s => s.tags.includes(t.id));
  const byU = new Map();
  for (const s of list) { if (!byU.has(s.universeId || '')) byU.set(s.universeId || '', []); byU.get(s.universeId || '').push(s); }
  for (const u of [...universesSorted().map(x => x.id), '']) {
    const ss = byU.get(u);
    if (!ss) continue;
    ss.sort((a, b) => a.pos - b.pos);
    w.append(h('div.section-h', h('h2', uName(u))), h('div.list', ss.map(s => storyRow(s, { num: u ? storiesIn(u).indexOf(s) + 1 : null }))));
  }
  if (!list.length) w.append(h('p.muted', 'No stories have this tag yet.'));
  v.append(w);
}

function viewSettings(v) {
  setBar('Settings', { back: true });
  const w = h('div.wrap');
  const A = isAdmin();
  if (A) {
    const dirty = pref.get('dirtyAt', 0), base = pref.get('pubBase', '');
    w.append(h('section.panel',
      h('h2', 'Publishing'),
      h('p', `Manager mode is on. Readers see what was last published${base ? ` (${new Date(base).toLocaleString()})` : ''}. ${dirty ? 'This device has changes that are not published yet.' : 'Everything on this device is published.'}`),
      h('div.btn-row',
        h('button.btn.small.primary', { type: 'button', on: { click: publish } }, 'Publish now'),
        h('button.btn.small', {
          type: 'button', on: {
            click: async () => {
              if (dirty && !await ask({ title: 'Load the published library?', text: 'This replaces the copy on this device, including changes that are not published yet.', ok: 'Replace with the published one', danger: true })) return;
              try { toast('Loading the published library…', null, 0); await pullPublished(); toast('Loaded.'); render(); } catch (e) { toast(e.message, null, 6000); }
            },
          },
        }, 'Load the published library'),
        h('button.btn.small', { type: 'button', on: { click: leaveManager } }, 'Leave manager mode'))));
  }
  const signed = G.valid() || pref.get('signedIn', false);
  if (A) w.append(h('section.panel',
    h('h2', 'Google Drive'),
    h('p', signed ? `Signed in${pref.get('googleEmail', '') ? ' as ' + pref.get('googleEmail', '') : ''}. Callisto reads your files and never changes them.` : 'Sign in to import Google Docs, Word and text files from your Drive.'),
    h('div.btn-row',
      signed ? h('button.btn.small', { type: 'button', on: { click: () => openDrive() } }, 'Import from Drive') : h('button.btn.small.primary', { type: 'button', on: { click: async () => { try { await signIn('settings'); render(); } catch (e) { toast(e.message); } } } }, 'Sign in with Google'),
      [...S.stories.values()].some(s => s.source?.driveId) ? h('button.btn.small', { type: 'button', on: { click: () => refreshFromDrive([...S.stories.values()].map(s => s.id)) } }, 'Check all for changes') : null,
      signed ? h('button.btn.small', { type: 'button', on: { click: () => { signOut(); render(); } } }, 'Sign out') : null)));


  const ver = h('span', '…');
  navigator.serviceWorker?.controller?.postMessage('version');
  S.onVersion = x => { ver.textContent = x; };
  w.append(h('section.panel', h('h2', 'Callisto'), h('p', 'Version ', ver, '. Works offline once opened.'),
    h('div.btn-row', h('button.btn.small', { type: 'button', on: { click: () => checkUpdate() } }, 'Check for updates'))));
  if (!A) w.append(h('section.panel', h('h2', 'Manage the library'), h('p', 'Only for the person who runs this library.'), h('div.btn-row', h('button.btn.small', { type: 'button', on: { click: managerFlow } }, 'Manager sign-in'))));
  v.append(w);
}

/* ───────────── router ───────────── */

function parseRoute() {
  const p = location.hash.replace(/^#\/?/, '').split('/');
  switch (p[0]) {
    case 'u': return { name: 'universe', id: p[1] || '_' };
    case 'search': S.focusSearch = true; return { name: 'library' };
    case 'tags': return { name: 'tags' };
    case 'tag': return { name: 'tag', id: p[1] };
    case 'settings': return { name: 'settings' };
    case 'read': return { name: 'read', id: p[1] };
    default: return { name: 'library' };
  }
}
function render() {
  const v = $('#view');
  const y = S.route.name === S.lastView?.name && S.route.id === S.lastView?.id ? v.scrollTop : 0;
  document.querySelector('.bulk')?.remove();
  v.replaceChildren();
  const r = S.route;
  if (r.name === 'library') viewLibrary(v);
  else if (r.name === 'universe') viewUniverse(v, r.id);
  else if (r.name === 'tags') viewTags(v);
  else if (r.name === 'tag') viewTag(v, r.id);
  else if (r.name === 'settings') viewSettings(v);
  v.scrollTop = y;
  S.lastView = { name: r.name, id: r.id };
}
const rerenderSoon = debounce(() => { if (S.route.name !== 'search') render(); }, 50);

function route() {
  const r = parseRoute();
  if (r.name === 'read') {
    if (!S.lastView) { S.route = { name: 'library' }; render(); }
    openReader(r.id);
    return;
  }
  if (!$('#reader').hidden) { saveReadPos(); $('#reader').hidden = true; R.id = null; }
  if (r.name !== 'universe' || r.id !== S.route.id) { S.arranging = false; S.sel.clear(); if (r.id !== S.route.id) S.filter = { tags: new Set(), unread: false }; }
  S.importPreset = null;
  S.route = r;
  render();
}
window.addEventListener('hashchange', () => { S.cameFromApp = true; route(); });
$('#backBtn').append(icon('back'));
$('#backBtn').addEventListener('click', () => { if (S.cameFromApp) history.back(); else location.hash = '#/'; });

/* ───────────── updates (service worker) ───────────── */

// New app versions install themselves (sw.js skips waiting). When one takes over, the page
// reloads: straight away if it is the first seconds after opening and nothing is open,
// otherwise the next time the app is hidden (reading position is saved on hide).
const startedAt = Date.now();
let newApp = false;
function applyUpdate() {
  if (!newApp) return;
  const idle = $('#reader').hidden && !sheetOpen && !(document.activeElement?.value);
  if (document.hidden || (idle && !isAdmin() && Date.now() - startedAt < 15000)) location.reload();
}
document.addEventListener('visibilitychange', applyUpdate);
async function checkUpdate(quiet) {
  const reg = await navigator.serviceWorker?.getRegistration();
  if (!reg) return quiet || toast('Updates need the app to be served over https.');
  pref.set('appCheckedAt', Date.now());
  await reg.update().catch(() => {});
  if (!quiet) toast(reg.installing || reg.waiting ? 'A new version is loading.' : 'Callisto is up to date.');
}

/* ───────────── start ───────────── */

(async function start() {
  const after = signInReturn();
  try { if (isAdmin()) await loadAll(); else await loadPublished(); }
  catch (e) { document.body.replaceChildren(h('p', { style: { padding: '20px' } }, 'Callisto could not open its storage: ' + e.message)); return; }
  navigator.storage?.persist?.();
  route();
  setTimeout(backgroundChecks, 3000);
  if (after === 'drive') openDrive();
  else if (after === 'manager') turnOnManager();
  else if (after === 'publish' && isAdmin()) publish();
  else if (after === 'settings' || after === 'signed-in') toast('Signed in to Google.');
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (had) { newApp = true; applyUpdate(); } });
    navigator.serviceWorker.register('sw.js').catch(() => {});
    navigator.serviceWorker.addEventListener('message', e => { if (e.data?.version) S.onVersion?.(e.data.version.replace('callisto-shell-', 'v')); });
  }
})();
