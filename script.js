/* =============================================
   OUR LITTLE WORLD — script.js
   ============================================= */

'use strict';

/* ---- Quotes & Prompts ---- */
const QUOTES = [
  "In the middle of every difficulty lies opportunity. — Einstein",
  "Together is a wonderful place to be.",
  "Small moments, big memories.",
  "Love is not about how many days, but how much love you put into those days.",
  "Every day may not be good, but there is something good in every day.",
  "Home is wherever you are.",
  "You are my today and all of my tomorrows.",
  "The best thing to hold onto in life is each other. — Audrey Hepburn",
  "Where there is love there is life. — Gandhi",
  "Life is a journey best traveled together.",
  "You are enough, just as you are.",
  "Happiness is a journey, not a destination.",
  "Two hearts, one story.",
  "Little by little, day by day.",
  "Love is the bridge between two hearts.",
];

const DAILY_QUESTIONS = [
  "What made today meaningful?",
  "What are you proud of today?",
  "What moment do you want to remember?",
  "What is something kind that happened today?",
  "What brought you peace today?",
  "Who made you smile today?",
  "What did you do for yourself today?",
  "What would you tell your future self about today?",
  "What surprised you today?",
  "What moment would you replay if you could?",
];

const ENCOURAGE_MSGS = [
  "Every small moment is worth remembering.",
  "Progress is built one day at a time.",
  "Thank you for sharing this journey together.",
  "Today's memories become tomorrow's stories.",
  "You are doing better than you think.",
  "Cherish the ordinary days — they are actually extraordinary.",
  "Two is always better than one.",
  "The little things are the big things.",
  "You have so much to look forward to.",
  "Keep going. Your story isn't over.",
];

/* ---- Utilities ---- */
const $ = (id) => document.getElementById(id);
const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function showToast(msg, duration = 2500) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

/* ---- Supabase ---- */
const SUPABASE_URL     = 'https://rureaschsepwrwpsdngs.supabase.co';
const SUPABASE_ANON    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cmVhc2Noc2Vwd3J3cHNkbmdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNDk1MjUsImV4cCI6MjA5NzkyNTUyNX0.3nqbKMhniKb7gBjndIkh98lJ0HmsX2FgwWe4l-UiGKk';
const db               = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
let   COUPLE_CODE      = null;
const cache            = {};

async function loadAllFromSupabase() {
  const { data, error } = await db
    .from('couple_data')
    .select('collection, data')
    .eq('couple_code', COUPLE_CODE);
  if (error) throw error;
  data.forEach(row => { cache[row.collection] = row.data; });
}

function load(key, fallback = []) {
  return cache[key] !== undefined ? cache[key] : fallback;
}

function save(key, data) {
  cache[key] = data;
  if (!COUPLE_CODE) return;
  db.from('couple_data')
    .upsert({ couple_code: COUPLE_CODE, collection: key, data, updated_at: new Date().toISOString() },
            { onConflict: 'couple_code,collection' })
    .then(({ error }) => { if (error) console.error('Save error:', error); });
}

function subscribeRealtime() {
  db.channel(`room:${COUPLE_CODE}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'couple_data',
      filter: `couple_code=eq.${COUPLE_CODE}`
    }, (payload) => {
      if (!payload.new) return;
      const { collection, data } = payload.new;
      cache[collection] = data;
      const map = {
        olw_journals:      renderJournal,
        olw_gratitude:     renderGratitude,
        olw_letters:       renderLetters,
        olw_memories:      renderMemories,
        olw_goals:         renderGoals,
        olw_special_dates: renderDates,
        olw_music:         renderMusic,
        olw_reflections:   renderReflections,
      };
      if (map[collection]) map[collection]();
      updateStats();
    })
    .subscribe();
}

/* ---- Animated Background ---- */
function buildBackground(style = 'circles') {
  const container = $('bgAnimation');
  container.innerHTML = '';
  const symbols = { circles: [''], hearts: ['♡', '❤', '♥'], stars: ['✦', '✧', '⭐', '★'] };
  const sym = symbols[style] || symbols.circles;
  const count = 18;
  for (let i = 0; i < count; i++) {
    const span = document.createElement('span');
    const size = 20 + Math.random() * 60;
    span.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      animation-duration:${10 + Math.random() * 18}s;
      animation-delay:${-Math.random() * 18}s;
      background:${style === 'circles' ? 'var(--accent)' : 'none'};
      color:var(--accent);
      font-size:${size * 0.8}px;
      display:flex; align-items:center; justify-content:center;
      border-radius:50%;
    `;
    if (style !== 'circles') span.textContent = sym[Math.floor(Math.random() * sym.length)];
    container.appendChild(span);
  }
}

/* ---- Clock & Date ---- */
function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const clockEl = $('homeClock');
  const dateEl  = $('homeDateDisplay');
  if (clockEl) clockEl.textContent = timeStr;
  if (dateEl)  dateEl.textContent  = dateStr;
}

/* ---- Together Counter ---- */
function updateTogetherCounter() {
  const startStr = load('olw_startDate', '');
  if (!startStr) return;
  const start = new Date(startStr + 'T00:00:00');
  const now   = new Date();
  const diffMs = now - start;
  if (diffMs < 0) return;
  const days  = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  const mins  = Math.floor((diffMs % 3600000) / 60000);
  $('counterDays').textContent  = days;
  $('counterHours').textContent = hours;
  $('counterMins').textContent  = mins;
  $('statTogether').textContent = days;
}

/* ---- Quote & Daily Question ---- */
function setRandomQuote() {
  const el = $('quoteText');
  if (el) el.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

function setDailyQuestion() {
  const el = $('dqText');
  if (!el) return;
  const idx = new Date().getDate() % DAILY_QUESTIONS.length;
  el.textContent = DAILY_QUESTIONS[idx];
}

/* ---- Inspire Button ---- */
$('inspireBtn').addEventListener('click', () => {
  const msg  = ENCOURAGE_MSGS[Math.floor(Math.random() * ENCOURAGE_MSGS.length)];
  const box  = $('inspireMsg');
  box.textContent = msg;
  box.style.display = 'block';
  box.style.animation = 'none';
  requestAnimationFrame(() => { box.style.animation = ''; });
});

/* ====================================================
   JOURNAL
==================================================== */
let selectedMood = '';

function initJournal() {
  $('journalDate').value = today();
  renderJournal();

  // Mood selector
  $$('.mood-btn', $('moodSelector')).forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.mood-btn', $('moodSelector')).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMood = btn.dataset.mood;
    });
  });

  $('journalSaveBtn').addEventListener('click', saveJournal);
  $('journalCancelBtn').addEventListener('click', cancelJournalEdit);
  $('journalSearch').addEventListener('input', renderJournal);
  $('journalDateFilter').addEventListener('change', renderJournal);
  $('journalClearFilter').addEventListener('click', () => {
    $('journalSearch').value = '';
    $('journalDateFilter').value = '';
    renderJournal();
  });
}

function saveJournal() {
  const entries = load('olw_journals');
  const editId  = $('journalEditId').value;

  const entry = {
    id:        editId || uid(),
    date:      $('journalDate').value || today(),
    mood:      selectedMood,
    day:       $('journalDay').value.trim(),
    smile:     $('journalSmile').value.trim(),
    challenge: $('journalChallenge').value.trim(),
    grateful:  $('journalGrateful').value.trim(),
    best:      $('journalBest').value.trim(),
    created:   editId ? undefined : Date.now(),
  };

  if (!entry.day && !entry.smile && !entry.best) {
    showToast('Please fill in at least one field.');
    return;
  }

  if (editId) {
    const idx = entries.findIndex(e => e.id === editId);
    if (idx > -1) entries[idx] = { ...entries[idx], ...entry };
  } else {
    entry.created = Date.now();
    entries.unshift(entry);
  }

  save('olw_journals', entries);
  clearJournalForm();
  renderJournal();
  updateStats();
  showToast(editId ? 'Entry updated!' : 'Journal entry saved!');
}

function clearJournalForm() {
  $('journalEditId').value = '';
  $('journalDate').value = today();
  $('journalDay').value = '';
  $('journalSmile').value = '';
  $('journalChallenge').value = '';
  $('journalGrateful').value = '';
  $('journalBest').value = '';
  selectedMood = '';
  $$('.mood-btn').forEach(b => b.classList.remove('active'));
  $('journalSaveBtn').textContent = 'Save Entry';
  $('journalCancelBtn').style.display = 'none';
}

function cancelJournalEdit() {
  clearJournalForm();
}

function renderJournal() {
  const entries  = load('olw_journals');
  const search   = ($('journalSearch').value || '').toLowerCase();
  const dateFilter = $('journalDateFilter').value;
  const container  = $('journalCards');

  const filtered = entries.filter(e => {
    const matchSearch = !search || [e.day, e.smile, e.challenge, e.grateful, e.best]
      .some(f => f && f.toLowerCase().includes(search));
    const matchDate = !dateFilter || e.date === dateFilter;
    return matchSearch && matchDate;
  });

  if (!filtered.length) {
    container.innerHTML = '<p class="empty-state">No journal entries yet. Start writing your story!</p>';
    return;
  }

  container.innerHTML = filtered.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div class="card-header">
        <span class="card-date">${formatDate(e.date)}</span>
        <span class="card-mood">${e.mood || ''}</span>
      </div>
      ${e.day      ? `<div class="card-field"><div class="card-field-label">How was your day?</div><div class="card-field-value">${esc(e.day)}</div></div>` : ''}
      ${e.smile    ? `<div class="card-field"><div class="card-field-label">Made me smile</div><div class="card-field-value">${esc(e.smile)}</div></div>` : ''}
      ${e.best     ? `<div class="card-field"><div class="card-field-label">Best moment</div><div class="card-field-value">${esc(e.best)}</div></div>` : ''}
      <div class="card-actions">
        <button class="card-btn card-btn-view" onclick="viewJournal('${e.id}')">View</button>
        <button class="card-btn card-btn-edit" onclick="editJournal('${e.id}')">Edit</button>
        <button class="card-btn card-btn-del"  onclick="deleteJournal('${e.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function viewJournal(id) {
  const e = load('olw_journals').find(x => x.id === id);
  if (!e) return;
  const fields = [
    ['Date', formatDate(e.date)],
    ['Mood', e.mood || '—'],
    ['How was your day?', e.day],
    ['What made you smile?', e.smile],
    ['What challenged you?', e.challenge],
    ['What are you grateful for?', e.grateful],
    ['Best moment', e.best],
  ].filter(([, v]) => v);
  openModal(fields.map(([l, v]) => `
    <div class="modal-field">
      <div class="modal-field-label">${l}</div>
      <div class="modal-field-value">${esc(v)}</div>
    </div>
  `).join(''));
}

function editJournal(id) {
  const e = load('olw_journals').find(x => x.id === id);
  if (!e) return;
  $('journalEditId').value   = e.id;
  $('journalDate').value     = e.date;
  $('journalDay').value      = e.day || '';
  $('journalSmile').value    = e.smile || '';
  $('journalChallenge').value= e.challenge || '';
  $('journalGrateful').value = e.grateful || '';
  $('journalBest').value     = e.best || '';
  selectedMood = e.mood || '';
  $$('.mood-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mood === selectedMood);
  });
  $('journalSaveBtn').textContent = 'Update Entry';
  $('journalCancelBtn').style.display = 'inline-flex';
  showSection('journal');
}

function deleteJournal(id) {
  if (!confirm('Delete this journal entry?')) return;
  save('olw_journals', load('olw_journals').filter(e => e.id !== id));
  renderJournal();
  updateStats();
  showToast('Entry deleted.');
}

/* ====================================================
   GRATITUDE
==================================================== */
const STICKY_COLORS = ['var(--sticky1)', 'var(--sticky2)', 'var(--sticky3)', 'var(--sticky4)', 'var(--sticky5)'];
const ROTATIONS = [-2, -1, 0, 1, 2, 1.5, -1.5];

function initGratitude() {
  renderGratitude();
  $('gratSaveBtn').addEventListener('click', saveGratitude);
}

function saveGratitude() {
  const text = $('gratText').value.trim();
  if (!text) { showToast('Write something you are grateful for!'); return; }
  const notes = load('olw_gratitude');
  notes.unshift({ id: uid(), text, date: today(), created: Date.now() });
  save('olw_gratitude', notes);
  $('gratText').value = '';
  renderGratitude();
  updateStats();
  showToast('Gratitude note added!');
}

function renderGratitude() {
  const notes = load('olw_gratitude');
  const wall  = $('stickyWall');
  if (!notes.length) {
    wall.innerHTML = '<p class="empty-state" style="width:100%">Add your first gratitude note!</p>';
    return;
  }
  wall.innerHTML = notes.map((n, i) => {
    const color = STICKY_COLORS[i % STICKY_COLORS.length];
    const rot   = ROTATIONS[i % ROTATIONS.length];
    return `
      <div class="sticky-note" style="background:${color}; --rot:${rot}deg;">
        <div class="sticky-note-actions">
          <button class="sticky-del-btn" onclick="deleteGratitude('${n.id}')" title="Delete">✕</button>
        </div>
        <p>${esc(n.text)}</p>
        <span class="sticky-note-date">${formatDate(n.date)}</span>
      </div>
    `;
  }).join('');
}

function deleteGratitude(id) {
  if (!confirm('Remove this note?')) return;
  save('olw_gratitude', load('olw_gratitude').filter(n => n.id !== id));
  renderGratitude();
  updateStats();
}

/* ====================================================
   LETTERS
==================================================== */
function initLetters() {
  renderLetters();
  $('letterSaveBtn').addEventListener('click', saveLetter);
  $('letterCancelBtn').addEventListener('click', clearLetterForm);
}

function saveLetter() {
  const editId = $('letterEditId').value;
  const letters = load('olw_letters');
  const entry = {
    id:    editId || uid(),
    from:  $('letterFrom').value.trim(),
    to:    $('letterTo').value.trim(),
    title: $('letterTitle').value.trim(),
    body:  $('letterBody').value.trim(),
    date:  today(),
  };
  if (!entry.body) { showToast('Write your letter first!'); return; }
  if (editId) {
    const idx = letters.findIndex(l => l.id === editId);
    if (idx > -1) letters[idx] = { ...letters[idx], ...entry };
  } else {
    entry.created = Date.now();
    letters.unshift(entry);
  }
  save('olw_letters', letters);
  clearLetterForm();
  renderLetters();
  updateStats();
  showToast(editId ? 'Letter updated!' : 'Letter saved!');
}

function clearLetterForm() {
  $('letterEditId').value = '';
  $('letterFrom').value = '';
  $('letterTo').value = '';
  $('letterTitle').value = '';
  $('letterBody').value = '';
  $('letterSaveBtn').textContent = 'Send Letter';
  $('letterCancelBtn').style.display = 'none';
}

function renderLetters() {
  const letters = load('olw_letters');
  const grid = $('letterCards');
  if (!letters.length) {
    grid.innerHTML = '<p class="empty-state">No letters yet. Write your first one!</p>';
    return;
  }
  grid.innerHTML = letters.map(l => `
    <div class="entry-card letter-card">
      <div class="card-header">
        <span class="card-date">${formatDate(l.date)}</span>
      </div>
      <div class="letter-from-to">From ${esc(l.from || '?')} to ${esc(l.to || '?')}</div>
      <div class="letter-title">${esc(l.title || 'Untitled')}</div>
      <div class="letter-preview">${esc(l.body.slice(0, 120))}${l.body.length > 120 ? '…' : ''}</div>
      <div class="card-actions">
        <button class="card-btn card-btn-view" onclick="viewLetter('${l.id}')">Read</button>
        <button class="card-btn card-btn-edit" onclick="editLetter('${l.id}')">Edit</button>
        <button class="card-btn card-btn-del"  onclick="deleteLetter('${l.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function viewLetter(id) {
  const l = load('olw_letters').find(x => x.id === id);
  if (!l) return;
  openModal(`
    <h2>${esc(l.title || 'Letter')}</h2>
    <div class="modal-field"><div class="modal-field-label">From → To</div>
      <div class="modal-field-value">${esc(l.from)} → ${esc(l.to)}</div></div>
    <div class="modal-field"><div class="modal-field-label">Date</div>
      <div class="modal-field-value">${formatDate(l.date)}</div></div>
    <div class="modal-field"><div class="modal-field-value" style="white-space:pre-wrap;">${esc(l.body)}</div></div>
  `);
}

function editLetter(id) {
  const l = load('olw_letters').find(x => x.id === id);
  if (!l) return;
  $('letterEditId').value = l.id;
  $('letterFrom').value   = l.from || '';
  $('letterTo').value     = l.to || '';
  $('letterTitle').value  = l.title || '';
  $('letterBody').value   = l.body || '';
  $('letterSaveBtn').textContent = 'Update Letter';
  $('letterCancelBtn').style.display = 'inline-flex';
  showSection('letters');
}

function deleteLetter(id) {
  if (!confirm('Delete this letter?')) return;
  save('olw_letters', load('olw_letters').filter(l => l.id !== id));
  renderLetters();
  updateStats();
  showToast('Letter deleted.');
}

/* ====================================================
   MEMORIES
==================================================== */
function initMemories() {
  $('memDate').value = today();
  renderMemories();

  $('memPhoto').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const prev = $('memPreview');
      prev.src = ev.target.result;
      prev.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  $('memSaveBtn').addEventListener('click', saveMemory);
  $('memCancelBtn').addEventListener('click', clearMemoryForm);
}

function saveMemory() {
  const editId  = $('memEditId').value;
  const caption = $('memCaption').value.trim();
  const date    = $('memDate').value || today();
  const preview = $('memPreview');
  const memories = load('olw_memories');

  if (editId) {
    const idx = memories.findIndex(m => m.id === editId);
    if (idx > -1) {
      memories[idx].caption = caption;
      memories[idx].date    = date;
      if (preview.style.display !== 'none' && preview.src && !preview.src.startsWith('data:')) {
        // keep existing image
      } else if (preview.style.display !== 'none' && preview.src.startsWith('data:')) {
        memories[idx].img = preview.src;
      }
    }
    save('olw_memories', memories);
    clearMemoryForm();
    renderMemories();
    showToast('Memory updated!');
    return;
  }

  const imgData = preview.style.display !== 'none' ? preview.src : '';
  if (!imgData) { showToast('Please select a photo!'); return; }

  memories.unshift({ id: uid(), img: imgData, caption, date, created: Date.now() });
  save('olw_memories', memories);
  clearMemoryForm();
  renderMemories();
  updateStats();
  showToast('Memory saved!');
}

function clearMemoryForm() {
  $('memEditId').value = '';
  $('memCaption').value = '';
  $('memDate').value = today();
  $('memPreview').style.display = 'none';
  $('memPreview').src = '';
  $('memSaveBtn').textContent = 'Save Memory';
  $('memCancelBtn').style.display = 'none';
}

function renderMemories() {
  const memories = load('olw_memories');
  const gallery  = $('memoryGallery');
  if (!memories.length) {
    gallery.innerHTML = '<p class="empty-state">No memories yet. Upload your first photo!</p>';
    return;
  }
  gallery.innerHTML = memories.map(m => `
    <div class="memory-card">
      <img src="${m.img}" alt="${esc(m.caption || 'Memory')}" loading="lazy" />
      <div class="memory-info">
        <div class="memory-caption">${esc(m.caption || '')}</div>
        <div class="memory-date">${formatDate(m.date)}</div>
      </div>
      <div class="memory-actions">
        <button class="card-btn card-btn-edit" onclick="editMemory('${m.id}')">Edit</button>
        <button class="card-btn card-btn-del"  onclick="deleteMemory('${m.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function editMemory(id) {
  const m = load('olw_memories').find(x => x.id === id);
  if (!m) return;
  $('memEditId').value = m.id;
  $('memCaption').value = m.caption || '';
  $('memDate').value    = m.date || today();
  const prev = $('memPreview');
  prev.src = m.img;
  prev.style.display = 'block';
  $('memSaveBtn').textContent = 'Update Memory';
  $('memCancelBtn').style.display = 'inline-flex';
  showSection('memories');
}

function deleteMemory(id) {
  if (!confirm('Delete this memory?')) return;
  save('olw_memories', load('olw_memories').filter(m => m.id !== id));
  renderMemories();
  updateStats();
  showToast('Memory deleted.');
}

/* ====================================================
   GOALS
==================================================== */
const DEFAULT_GOALS = [
  { id: uid(), text: 'Travel together', done: false },
  { id: uid(), text: 'Learn a new hobby', done: false },
  { id: uid(), text: 'Watch 100 movies', done: false },
  { id: uid(), text: 'Save for a trip', done: false },
  { id: uid(), text: 'Try a new restaurant', done: false },
];

function initGoals() {
  if (!load('olw_goals').length) save('olw_goals', DEFAULT_GOALS);
  renderGoals();
  $('goalAddBtn').addEventListener('click', addGoal);
  $('goalInput').addEventListener('keydown', e => { if (e.key === 'Enter') addGoal(); });
}

function addGoal() {
  const text = $('goalInput').value.trim();
  if (!text) return;
  const goals = load('olw_goals');
  goals.push({ id: uid(), text, done: false });
  save('olw_goals', goals);
  $('goalInput').value = '';
  renderGoals();
  updateStats();
}

function toggleGoal(id) {
  const goals = load('olw_goals');
  const g = goals.find(x => x.id === id);
  if (g) g.done = !g.done;
  save('olw_goals', goals);
  renderGoals();
  updateStats();
}

function deleteGoal(id) {
  save('olw_goals', load('olw_goals').filter(g => g.id !== id));
  renderGoals();
  updateStats();
}

function renderGoals() {
  const goals = load('olw_goals');
  const list  = $('goalsList');
  if (!goals.length) {
    list.innerHTML = '<p class="empty-state">No goals yet. Dream big!</p>';
    return;
  }
  list.innerHTML = goals.map(g => `
    <div class="goal-item ${g.done ? 'done' : ''}">
      <button class="goal-check ${g.done ? 'checked' : ''}" onclick="toggleGoal('${g.id}')">${g.done ? '✓' : ''}</button>
      <span class="goal-text">${esc(g.text)}</span>
      <button class="goal-del" onclick="deleteGoal('${g.id}')" title="Remove">✕</button>
    </div>
  `).join('');
}

/* ====================================================
   SPECIAL DATES
==================================================== */
function initSpecialDates() {
  renderDates();
  $('dateSaveBtn').addEventListener('click', saveDate);
  $('dateCancelBtn').addEventListener('click', clearDateForm);
  setInterval(renderDates, 60000);
}

function saveDate() {
  const editId = $('dateEditId').value;
  const dates  = load('olw_special_dates');
  const entry  = {
    id:       editId || uid(),
    label:    $('dateLabel').value.trim(),
    date:     $('dateValue').value,
    category: $('dateCategory').value,
  };
  if (!entry.label || !entry.date) { showToast('Fill in the label and date!'); return; }
  if (editId) {
    const idx = dates.findIndex(d => d.id === editId);
    if (idx > -1) dates[idx] = entry;
  } else {
    dates.push(entry);
  }
  save('olw_special_dates', dates);
  clearDateForm();
  renderDates();
  showToast('Date saved!');
}

function clearDateForm() {
  $('dateEditId').value = '';
  $('dateLabel').value  = '';
  $('dateValue').value  = '';
  $('dateCategory').value = 'anniversary';
  $('dateSaveBtn').textContent = 'Save Date';
  $('dateCancelBtn').style.display = 'none';
}

function renderDates() {
  const dates = load('olw_special_dates');
  const grid  = $('datesGrid');
  const now   = new Date();
  now.setHours(0, 0, 0, 0);

  if (!dates.length) {
    grid.innerHTML = '<p class="empty-state">No special dates yet. Add your first milestone!</p>';
    return;
  }

  grid.innerHTML = dates.map(d => {
    const target = new Date(d.date + 'T12:00:00');
    const diffMs = target - now;
    const diffDays = Math.ceil(diffMs / 86400000);
    const isPast   = diffDays < 0;
    let countdownHtml;
    if (diffDays === 0) {
      countdownHtml = `<div class="date-countdown">🎉</div><div class="date-countdown-label">Today!</div>`;
    } else if (isPast) {
      countdownHtml = `<div class="date-countdown">${Math.abs(diffDays)}</div><div class="date-countdown-label">Days Ago</div>`;
    } else {
      countdownHtml = `<div class="date-countdown">${diffDays}</div><div class="date-countdown-label">Days Remaining</div>`;
    }
    return `
      <div class="date-card ${isPast ? 'past' : ''}">
        <div class="date-card-category">${d.category}</div>
        <div class="date-card-label">${esc(d.label)}</div>
        <div class="date-card-date">${formatDate(d.date)}</div>
        ${countdownHtml}
        <div class="date-card-actions">
          <button class="card-btn card-btn-edit" onclick="editDate('${d.id}')">Edit</button>
          <button class="card-btn card-btn-del"  onclick="deleteDate('${d.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function editDate(id) {
  const d = load('olw_special_dates').find(x => x.id === id);
  if (!d) return;
  $('dateEditId').value   = d.id;
  $('dateLabel').value    = d.label;
  $('dateValue').value    = d.date;
  $('dateCategory').value = d.category;
  $('dateSaveBtn').textContent = 'Update Date';
  $('dateCancelBtn').style.display = 'inline-flex';
  showSection('special-dates');
}

function deleteDate(id) {
  if (!confirm('Delete this date?')) return;
  save('olw_special_dates', load('olw_special_dates').filter(d => d.id !== id));
  renderDates();
}

/* ====================================================
   MUSIC
==================================================== */
function initMusic() {
  renderMusic();
  $('musicAddBtn').addEventListener('click', addMusic);
}

function getYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getSpotifyEmbed(url) {
  const match = url.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
  if (!match) return null;
  return { type: match[1], id: match[2] };
}

function addMusic() {
  const url   = $('musicUrl').value.trim();
  const title = $('musicTitle').value.trim();
  const ytId  = getYouTubeId(url);
  const spData = getSpotifyEmbed(url);

  if (!ytId && !spData) {
    showToast('Please enter a valid YouTube or Spotify link!');
    return;
  }

  const entry = { id: uid(), url, title: title || 'Untitled', date: today() };
  if (ytId) {
    entry.type = 'youtube';
    entry.vid  = ytId;
  } else {
    entry.type      = 'spotify';
    entry.spType    = spData.type;
    entry.spId      = spData.id;
  }

  const list = load('olw_music');
  list.push(entry);
  save('olw_music', list);
  $('musicUrl').value   = '';
  $('musicTitle').value = '';
  renderMusic();
  showToast('Song added to playlist!');
}

function renderMusic() {
  const list     = load('olw_music');
  const playlist = $('musicPlaylist');
  if (!list.length) {
    playlist.innerHTML = '<p class="empty-state">No songs yet. Paste a YouTube or Spotify link!</p>';
    return;
  }
  playlist.innerHTML = list.map(s => {
    let embedHtml, badge;
    if (s.type === 'spotify') {
      const height = s.spType === 'track' ? '152' : '352';
      embedHtml = `<iframe class="music-embed spotify-embed"
        src="https://open.spotify.com/embed/${s.spType}/${s.spId}?utm_source=generator"
        height="${height}" frameborder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy" title="${esc(s.title)}"></iframe>`;
      badge = `<span class="music-badge music-badge-spotify">&#9679; Spotify</span>`;
    } else {
      embedHtml = `<iframe class="music-embed"
        src="https://www.youtube.com/embed/${s.vid}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen title="${esc(s.title)}"></iframe>`;
      badge = `<span class="music-badge music-badge-youtube">&#9679; YouTube</span>`;
    }
    return `
    <div class="music-card">
      ${embedHtml}
      <div class="music-info">
        ${badge}
        <span class="music-title">${esc(s.title)}</span>
        <button class="music-del" onclick="deleteMusic('${s.id}')" title="Remove">✕</button>
      </div>
    </div>`;
  }).join('');
}

function deleteMusic(id) {
  if (!confirm('Remove this song?')) return;
  save('olw_music', load('olw_music').filter(s => s.id !== id));
  renderMusic();
}

/* ====================================================
   REFLECTION
==================================================== */
function initReflection() {
  $('reflDate').value = today();
  renderReflections();
  $('reflSaveBtn').addEventListener('click', saveReflection);
  $('reflCancelBtn').addEventListener('click', clearReflForm);
}

function saveReflection() {
  const editId = $('reflEditId').value;
  const list   = load('olw_reflections');
  const entry  = {
    id:       editId || uid(),
    date:     $('reflDate').value || today(),
    learn:    $('reflLearn').value.trim(),
    tomorrow: $('reflTomorrow').value.trim(),
    remember: $('reflRemember').value.trim(),
  };
  if (!entry.learn && !entry.tomorrow && !entry.remember) {
    showToast('Write something for your reflection!');
    return;
  }
  if (editId) {
    const idx = list.findIndex(r => r.id === editId);
    if (idx > -1) list[idx] = { ...list[idx], ...entry };
  } else {
    entry.created = Date.now();
    list.unshift(entry);
  }
  save('olw_reflections', list);
  clearReflForm();
  renderReflections();
  updateStats();
  showToast(editId ? 'Reflection updated!' : 'Reflection saved!');
}

function clearReflForm() {
  $('reflEditId').value   = '';
  $('reflDate').value     = today();
  $('reflLearn').value    = '';
  $('reflTomorrow').value = '';
  $('reflRemember').value = '';
  $('reflSaveBtn').textContent = 'Save Reflection';
  $('reflCancelBtn').style.display = 'none';
}

function renderReflections() {
  const list = load('olw_reflections');
  const grid = $('reflCards');
  if (!list.length) {
    grid.innerHTML = '<p class="empty-state">No reflections yet. End your day mindfully!</p>';
    return;
  }
  grid.innerHTML = list.map(r => `
    <div class="entry-card">
      <div class="card-header">
        <span class="card-date">${formatDate(r.date)}</span>
        <span>🌙</span>
      </div>
      ${r.learn    ? `<div class="card-field"><div class="card-field-label">What I learned</div><div class="card-field-value">${esc(r.learn)}</div></div>` : ''}
      ${r.tomorrow ? `<div class="card-field"><div class="card-field-label">Looking forward to</div><div class="card-field-value">${esc(r.tomorrow)}</div></div>` : ''}
      ${r.remember ? `<div class="card-field"><div class="card-field-label">To remember</div><div class="card-field-value">${esc(r.remember)}</div></div>` : ''}
      <div class="card-actions">
        <button class="card-btn card-btn-edit" onclick="editReflection('${r.id}')">Edit</button>
        <button class="card-btn card-btn-del"  onclick="deleteReflection('${r.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function editReflection(id) {
  const r = load('olw_reflections').find(x => x.id === id);
  if (!r) return;
  $('reflEditId').value   = r.id;
  $('reflDate').value     = r.date;
  $('reflLearn').value    = r.learn || '';
  $('reflTomorrow').value = r.tomorrow || '';
  $('reflRemember').value = r.remember || '';
  $('reflSaveBtn').textContent = 'Update Reflection';
  $('reflCancelBtn').style.display = 'inline-flex';
  showSection('reflection');
}

function deleteReflection(id) {
  if (!confirm('Delete this reflection?')) return;
  save('olw_reflections', load('olw_reflections').filter(r => r.id !== id));
  renderReflections();
  updateStats();
}

/* ====================================================
   STATISTICS
==================================================== */
function animateCount(el, target) {
  const start = parseInt(el.textContent) || 0;
  const steps = 30;
  const step  = (target - start) / steps;
  let current = start;
  let i = 0;
  const interval = setInterval(() => {
    current += step;
    el.textContent = Math.round(current);
    if (++i >= steps) { el.textContent = target; clearInterval(interval); }
  }, 20);
}

function calcStreak() {
  const journals    = load('olw_journals').map(j => j.date);
  const reflections = load('olw_reflections').map(r => r.date);
  const allDates    = [...new Set([...journals, ...reflections])].sort().reverse();
  if (!allDates.length) return 0;
  let streak = 0;
  const check = new Date();
  check.setHours(0, 0, 0, 0);
  for (const d of allDates) {
    const dateStr = check.toISOString().split('T')[0];
    if (d === dateStr) { streak++; check.setDate(check.getDate() - 1); }
    else break;
  }
  return streak;
}

function updateStats() {
  const journals    = load('olw_journals').length;
  const gratitude   = load('olw_gratitude').length;
  const letters     = load('olw_letters').length;
  const memories    = load('olw_memories').length;
  const goals       = load('olw_goals').filter(g => g.done).length;
  const reflections = load('olw_reflections').length;
  const streak      = calcStreak();

  animateCount($('statJournals'),    journals);
  animateCount($('statGratitude'),   gratitude);
  animateCount($('statLetters'),     letters);
  animateCount($('statMemories'),    memories);
  animateCount($('statGoals'),       goals);
  animateCount($('statStreak'),      streak);
  animateCount($('statReflections'), reflections);
  updateTogetherCounter();
}

/* ====================================================
   SETTINGS
==================================================== */
function initSettings() {
  const prefs = load('olw_settings', {});

  // Dark mode
  const darkToggle = $('darkModeToggle');
  darkToggle.checked = !!prefs.darkMode;
  applyTheme(prefs.darkMode);
  darkToggle.addEventListener('change', () => {
    const s = load('olw_settings', {});
    s.darkMode = darkToggle.checked;
    save('olw_settings', s);
    applyTheme(darkToggle.checked);
  });

  // Accent color
  const swatches = $$('.swatch', $('colorSwatches'));
  swatches.forEach(sw => {
    if (sw.dataset.color === (prefs.accent || 'dusty-pink')) sw.classList.add('active');
    sw.addEventListener('click', () => {
      swatches.forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      const s = load('olw_settings', {});
      s.accent = sw.dataset.color;
      save('olw_settings', s);
      applyAccent(sw.dataset.color);
    });
  });
  applyAccent(prefs.accent || 'dusty-pink');

  // Font
  const fontSelect = $('fontSelect');
  if (prefs.font) { fontSelect.value = prefs.font; document.body.style.fontFamily = prefs.font; }
  fontSelect.addEventListener('change', () => {
    const s = load('olw_settings', {});
    s.font = fontSelect.value;
    save('olw_settings', s);
    document.body.style.fontFamily = fontSelect.value;
    document.documentElement.style.setProperty('--font', fontSelect.value);
  });

  // Start date
  const startInput = $('startDateInput');
  startInput.value = load('olw_startDate', '');
  startInput.addEventListener('change', () => {
    save('olw_startDate', startInput.value);
    updateTogetherCounter();
    updateStats();
  });

  // Background image
  const bgInput = $('bgImageInput');
  bgInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.body.style.backgroundImage = `url(${ev.target.result})`;
      document.body.style.backgroundSize  = 'cover';
      document.body.style.backgroundPosition = 'center';
      const s = load('olw_settings', {});
      s.bgImage = ev.target.result;
      save('olw_settings', s);
    };
    reader.readAsDataURL(file);
  });
  if (prefs.bgImage) {
    document.body.style.backgroundImage = `url(${prefs.bgImage})`;
    document.body.style.backgroundSize  = 'cover';
    document.body.style.backgroundPosition = 'center';
  }

  $('clearBgBtn').addEventListener('click', () => {
    document.body.style.backgroundImage = '';
    const s = load('olw_settings', {});
    delete s.bgImage;
    save('olw_settings', s);
    showToast('Background cleared.');
  });

  // Animation style
  const animSelect = $('animSelect');
  if (prefs.animStyle) animSelect.value = prefs.animStyle;
  buildBackground(prefs.animStyle || 'circles');
  animSelect.addEventListener('change', () => {
    const s = load('olw_settings', {});
    s.animStyle = animSelect.value;
    save('olw_settings', s);
    buildBackground(animSelect.value);
  });

  // Couple code display
  $('coupleCodeDisplay').textContent = COUPLE_CODE;
  $('changeCoupleBtn').addEventListener('click', () => {
    if (!confirm('This will log you out of your shared space. Continue?')) return;
    localStorage.removeItem('olw_couple_code');
    location.reload();
  });

  // Export
  $('exportBtn').addEventListener('click', exportData);

  // Import
  $('importFile').addEventListener('change', importData);

  // Clear all
  $('clearAllBtn').addEventListener('click', async () => {
    if (!confirm('This will delete ALL your data. Are you sure?')) return;
    if (!confirm('Are you absolutely sure? This cannot be undone.')) return;
    const keys = ['olw_journals','olw_gratitude','olw_letters','olw_memories',
                  'olw_goals','olw_special_dates','olw_music','olw_reflections'];
    keys.forEach(k => { cache[k] = []; });
    await db.from('couple_data').delete().eq('couple_code', COUPLE_CODE).in('collection', keys);
    renderAll();
    updateStats();
    showToast('All data cleared.');
  });
}

function applyTheme(dark) {
  document.body.classList.toggle('dark-mode', !!dark);
}

function applyAccent(color) {
  const classes = ['accent-dusty-pink','accent-sage-green','accent-lavender','accent-sky-blue','accent-warm-peach'];
  document.body.classList.remove(...classes);
  document.body.classList.add(`accent-${color}`);
}

function exportData() {
  const data = {
    journals:     load('olw_journals'),
    gratitude:    load('olw_gratitude'),
    letters:      load('olw_letters'),
    memories:     load('olw_memories'),
    goals:        load('olw_goals'),
    specialDates: load('olw_special_dates'),
    music:        load('olw_music'),
    reflections:  load('olw_reflections'),
    settings:     load('olw_settings', {}),
    exported:     new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `our-little-world-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported!');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.journals)     save('olw_journals',      data.journals);
      if (data.gratitude)    save('olw_gratitude',     data.gratitude);
      if (data.letters)      save('olw_letters',       data.letters);
      if (data.memories)     save('olw_memories',      data.memories);
      if (data.goals)        save('olw_goals',         data.goals);
      if (data.specialDates) save('olw_special_dates', data.specialDates);
      if (data.music)        save('olw_music',         data.music);
      if (data.reflections)  save('olw_reflections',   data.reflections);
      renderAll();
      updateStats();
      showToast('Data imported successfully!');
    } catch {
      showToast('Invalid file. Please export from this app first.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

/* ====================================================
   NAVIGATION
==================================================== */
function showSection(id) {
  $$('section[id]').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $$('.nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-link[href="#${id}"]`);
  if (activeLink) activeLink.classList.add('active');
}

function openSidebar() {
  $('sidebar').classList.add('open');
  $('navOverlay').classList.add('open');
}
function closeSidebar() {
  $('sidebar').classList.remove('open');
  $('navOverlay').classList.remove('open');
}

function initNav() {
  $('navToggle').addEventListener('click', openSidebar);
  $('sidebarClose').addEventListener('click', closeSidebar);
  $('navOverlay').addEventListener('click', closeSidebar);

  $$('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeSidebar();
      const id = link.getAttribute('href').slice(1);
      showSection(id);
    });
  });

  showSection('home');
}

/* ====================================================
   MODAL
==================================================== */
function openModal(html) {
  $('modalContent').innerHTML = html;
  $('modalOverlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('modalOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

$('modalClose').addEventListener('click', closeModal);
$('modalOverlay').addEventListener('click', (e) => {
  if (e.target === $('modalOverlay')) closeModal();
});

/* ====================================================
   XSS ESCAPE
==================================================== */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ====================================================
   RENDER ALL
==================================================== */
function renderAll() {
  renderJournal();
  renderGratitude();
  renderLetters();
  renderMemories();
  renderGoals();
  renderDates();
  renderMusic();
  renderReflections();
}

/* ====================================================
   INIT
==================================================== */
async function startApp() {
  showToast('Connecting…', 1500);
  try {
    await loadAllFromSupabase();
  } catch (e) {
    console.error('Supabase load error:', e);
    showToast('Could not reach database. Check your connection.');
  }

  initNav();
  setRandomQuote();
  setDailyQuestion();
  updateClock();
  setInterval(updateClock, 1000);
  updateTogetherCounter();
  setInterval(updateTogetherCounter, 60000);

  initJournal();
  initGratitude();
  initLetters();
  initMemories();
  initGoals();
  initSpecialDates();
  initMusic();
  initReflection();
  initSettings();
  updateStats();
  subscribeRealtime();
  lucide.createIcons();

  window.viewJournal      = viewJournal;
  window.editJournal      = editJournal;
  window.deleteJournal    = deleteJournal;
  window.deleteGratitude  = deleteGratitude;
  window.viewLetter       = viewLetter;
  window.editLetter       = editLetter;
  window.deleteLetter     = deleteLetter;
  window.editMemory       = editMemory;
  window.deleteMemory     = deleteMemory;
  window.toggleGoal       = toggleGoal;
  window.deleteGoal       = deleteGoal;
  window.editDate         = editDate;
  window.deleteDate       = deleteDate;
  window.deleteMusic      = deleteMusic;
  window.showSection      = showSection;
  window.editReflection   = editReflection;
  window.deleteReflection = deleteReflection;
}

async function handleCoupleCodeSubmit() {
  const code = $('coupleCodeInput').value.trim().toLowerCase().replace(/\s+/g, '-');
  if (!code) { showToast('Please enter a couple code!'); return; }
  COUPLE_CODE = code;
  localStorage.setItem('olw_couple_code', code);
  $('coupleGate').style.display = 'none';
  await startApp();
}

document.addEventListener('DOMContentLoaded', async () => {
  const saved = localStorage.getItem('olw_couple_code');
  if (saved) {
    COUPLE_CODE = saved;
    $('coupleGate').style.display = 'none';
    await startApp();
  } else {
    $('coupleCodeBtn').addEventListener('click', handleCoupleCodeSubmit);
    $('coupleCodeInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') handleCoupleCodeSubmit();
    });
  }
});
