/* =====================================================
   FESTPRO - Inter-College Fest Management
   Main JavaScript
   ===================================================== */

'use strict';

// ── App State ──
const App = {
  currentPage: 'home',
  darkMode: false,
  adminLoggedIn: false,
  adminUser: { username: 'admin', password: 'fest2024' },

  // In-memory data (synced with localStorage)
  data: {
    registrations: [],
    leaderboard: [],
    events: [],
    winners: []
  }
};

// ── Events Master Data ──
const EVENTS = {
  technical: [
    { id: 't1', name: 'Code Clash', icon: '💻', desc: 'Competitive programming battle across 3 elimination rounds. Solve algorithmic challenges under time pressure.', rules: ['Solo or pair entry', '2 hour time limit', 'No AI tools allowed', 'Any language permitted'], points: { participation: 10, first: 50, second: 30, third: 20 } },
    { id: 't2', name: 'Hack Sprint', icon: '⚡', desc: '24-hour hackathon to build innovative solutions for real-world problems. Showcase creativity and tech skills.', rules: ['Teams of 3–4 only', 'Original ideas required', 'Working demo mandatory', 'Mentors available'], points: { participation: 15, first: 60, second: 40, third: 25 } },
    { id: 't3', name: 'Circuit Minds', icon: '🔌', desc: 'Electronics and hardware design challenge. Build functional circuits with provided components.', rules: ['Team of 2 members', 'Components are provided', 'Safety rules apply', 'Judged on innovation'], points: { participation: 10, first: 50, second: 30, third: 20 } },
  ],
  cultural: [
    { id: 'c1', name: 'Rhythm Riot', icon: '💃', desc: 'High-energy dance competition open to all styles — contemporary, folk, hip-hop, fusion and more.', rules: ['4–8 minute performance', 'No recorded vocals', 'Solo or group accepted', 'Costumes encouraged'], points: { participation: 10, first: 50, second: 30, third: 20 } },
    { id: 'c2', name: 'Stage Thunder', icon: '🎭', desc: 'Drama and skit performance showcase. Original scripts bring extra marks from judges.', rules: ['Max 12 team members', '15 minute slot', 'Original script preferred', 'Props provided on request'], points: { participation: 10, first: 50, second: 30, third: 20 } },
    { id: 'c3', name: 'Vocal Storm', icon: '🎤', desc: 'Solo and group singing competition. Any language, any genre — let your voice thunder.', rules: ['Backing track allowed', '5 minute performance', 'Any language permitted', 'No lip-syncing'], points: { participation: 10, first: 50, second: 30, third: 20 } },
  ],
  sports: [
    { id: 's1', name: 'Turf Wars', icon: '⚽', desc: '5-a-side football knockout tournament. Fast, fierce, and thrilling — may the best team win.', rules: ['5 players + 2 substitutes', '15-minute halves', 'Fair play enforced', 'Referee decisions are final'], points: { participation: 10, first: 60, second: 40, third: 25 } },
    { id: 's2', name: 'Smash Arena', icon: '🏸', desc: 'Badminton singles and doubles championship. Equipment is provided.', rules: ['Standard BWF rules', 'Rackets & shuttles provided', 'Best of 3 sets', 'Singles and doubles tracks'], points: { participation: 10, first: 50, second: 30, third: 20 } },
    { id: 's3', name: 'Track Blaze', icon: '🏃', desc: '100m, 200m, and 400m sprint events. Represent your college on the track.', rules: ['Standard athletics rules', 'Spiked shoes allowed', 'Three elimination heats', 'Finals for top 8'], points: { participation: 10, first: 50, second: 30, third: 20 } },
  ],
  management: [
    { id: 'm1', name: 'Biz Pitch', icon: '📈', desc: 'Present your startup idea to a panel of industry judges. The next unicorn could emerge here.', rules: ['Team of 2–4 members', '10-minute pitch + 5 Q&A', 'PPT slides required', 'Business plan must be original'], points: { participation: 10, first: 50, second: 30, third: 20 } },
    { id: 'm2', name: 'Ad Blitz', icon: '🎯', desc: 'Create a live advertisement campaign for a mystery product revealed on the day.', rules: ['Team of 3 max', '6 hours to create campaign', 'Any medium: digital/print', 'Judged on creativity & impact'], points: { participation: 10, first: 50, second: 30, third: 20 } },
    { id: 'm3', name: 'Case Crunch', icon: '🧩', desc: 'Analyze and solve a real business case study under competitive conditions.', rules: ['Solo or duo', '90 minutes to solve', 'Written + verbal presentation', 'Judges from industry'], points: { participation: 10, first: 50, second: 30, third: 20 } },
  ]
};

const DEPT_LABELS = { technical: 'Technical', cultural: 'Cultural', sports: 'Sports', management: 'Management' };
const FEST_DATE = new Date('2026-05-04T09:00:00');

// ── Utility Functions ──
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }
function el(tag, cls = '', html = '') { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }

function saveData() { localStorage.setItem('festpro_data', JSON.stringify(App.data)); }
function loadData() {
  const saved = localStorage.getItem('festpro_data');
  if (saved) App.data = JSON.parse(saved);
  // Seed demo leaderboard data if empty
  if (!App.data.leaderboard.length) {
    App.data.leaderboard = [
      { ccCode: 'CC-101', clName: 'Arjun Mehta',    totalPR: 0, dept: 'Technical' },
      { ccCode: 'CC-205', clName: 'Priya Sharma',   totalPR: 0, dept: 'Cultural'  },
      { ccCode: 'CC-312', clName: 'Rohan Verma',    totalPR: 0, dept: 'Sports'    },
      { ccCode: 'CC-418', clName: 'Sneha Patel',    totalPR: 0, dept: 'Management'},
      { ccCode: 'CC-509', clName: 'Vikram Singh',   totalPR: 0, dept: 'Technical' },
    ];
    saveData();
  }
}

// ── Toast Notifications ──
function showToast(msg, type = 'success') {
  const container = $('#toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
  const t = el('div', `toast-custom ${type === 'error' ? 'error' : ''}`);
  t.innerHTML = `<span>${icons[type] || '✅'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(30px)'; setTimeout(() => t.remove(), 400); }, 3000);
}

// ── Scroll Progress ──
function initScrollProgress() {
  const bar = $('#scroll-progress');
  window.addEventListener('scroll', () => {
    const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    bar.style.width = pct + '%';
  }, { passive: true });
}

// ── Navbar Scroll Effect ──
function initNavbar() {
  const nav = $('.navbar-festpro');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

// ── Dark Mode ──
function initDarkMode() {
  App.darkMode = localStorage.getItem('festpro_dark') === 'true';
  if (App.darkMode) document.body.classList.add('dark-mode');
  updateDarkToggle();
}
function toggleDark() {
  App.darkMode = !App.darkMode;
  document.body.classList.toggle('dark-mode', App.darkMode);
  localStorage.setItem('festpro_dark', App.darkMode);
  updateDarkToggle();
}
function updateDarkToggle() {
  $$('.dark-toggle-btn').forEach(btn => btn.innerHTML = App.darkMode ? '☀️' : '🌙');
}

// ── Particles ──
function initParticles() {
  const canvas = $('#hero');
  const count = 25;
  for (let i = 0; i < count; i++) {
    const p = el('div', 'particle');
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (8 + Math.random() * 14) + 's';
    p.style.animationDelay = (Math.random() * 12) + 's';
    p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
    p.style.opacity = 0.3 + Math.random() * 0.5;
    canvas.querySelector('.hero-canvas').appendChild(p);
  }
}

// ── Countdown ──
function initCountdown() {
  var daysEl  = document.getElementById('cntDays');
  var hoursEl = document.getElementById('cntHours');
  var minsEl  = document.getElementById('cntMins');
  var secsEl  = document.getElementById('cntSecs');

  if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

  function update() {
    var now  = new Date().getTime();
    var fest = FEST_DATE.getTime();
    var diff = fest - now;

    if (diff <= 0) {
      daysEl.textContent  = '00';
      hoursEl.textContent = '00';
      minsEl.textContent  = '00';
      secsEl.textContent  = '00';
      return;
    }

    var fmt = function(n) { return String(n).padStart(2, '0'); };

    var d = Math.floor(diff / (1000 * 60 * 60 * 24));
    var h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    var s = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent  = fmt(d);
    hoursEl.textContent = fmt(h);
    minsEl.textContent  = fmt(m);
    secsEl.textContent  = fmt(s);

    secsEl.style.transform = 'scale(1.15)';
    secsEl.style.color = 'var(--yellow)';
    setTimeout(function() {
      secsEl.style.transform = 'scale(1)';
      secsEl.style.color = '';
    }, 250);
  }

  update();
  setInterval(update, 1000);
}

// ── Animated Counters ──
function animateCounter(el, target, duration = 1500) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { el.textContent = target.toLocaleString(); clearInterval(timer); return; }
    el.textContent = Math.floor(start).toLocaleString();
  }, 16);
}
function initCounters() {
  const counters = $$('[data-counter]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target, +e.target.dataset.counter); obs.unobserve(e.target); } });
  }, { threshold: 0.5 });
  counters.forEach(c => obs.observe(c));
}

// ── Scroll Reveal ──
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.15 });
  $$('.reveal').forEach(el => obs.observe(el));
}

// ── Ripple Effect ──
function addRipple(e) {
  const btn = e.currentTarget;
  const r = el('span', 'ripple-circle');
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 700);
}
function initRipples() { $$('.btn-ripple').forEach(b => b.addEventListener('click', addRipple)); }

// ── Page Navigation ──
function showPage(page) {
  App.currentPage = page;
  // Handle admin page
  if (page === 'admin') {
    if (!App.adminLoggedIn) { showAdminLogin(); return; }
    showAdminPanel(); return;
  }
  $('#adminPage').style.display = 'none';
  $('#mainContent').style.display = 'block';

  // Scroll to section
  const target = $(`#${page}`);
  if (target) { window.scrollTo({ top: target.offsetTop - 70, behavior: 'smooth' }); }

  // Update nav links
  $$('.nav-link-custom').forEach(l => l.classList.toggle('active', l.dataset.page === page));
}

// ── Events Rendering ──
function renderEvents(dept = 'technical') {
  const container = $('#events-container');
  container.innerHTML = '';
  const deleted = App.data.deletedEventIds || [];
  const custom  = App.data.customEvents   || {};
  const deptEvs = [
    ...(EVENTS[dept] || []).filter(e => !deleted.includes(e.id)),
    ...Object.values(custom).filter(e => e.dept === dept)
  ];
  deptEvs.forEach((ev, i) => {
    const card = el('div', 'col-md-6 col-lg-4 mb-4 reveal reveal-delay-' + (i + 1));
    card.innerHTML = `
      <div class="event-card h-100">
        <div class="event-card-header">
          <div class="event-icon">${ev.icon}</div>
          <div class="event-name">${ev.name}</div>
        </div>
        <div class="event-body">
          <p class="event-desc">${ev.desc}</p>
          <div class="event-rules-title">Rules</div>
          <ul class="event-rules mb-3">${ev.rules.map(r => `<li>${r}</li>`).join('')}</ul>
          <div class="event-rules-title">PR Points</div>
          <div class="pr-badges">
            <span class="pr-badge participate">🎟️ Participation: ${ev.points.participation} PR</span>
            <span class="pr-badge gold">🥇 1st: ${ev.points.first} PR</span>
            <span class="pr-badge silver">🥈 2nd: ${ev.points.second} PR</span>
            <span class="pr-badge bronze">🥉 3rd: ${ev.points.third} PR</span>
          </div>
          <button class="btn-event-reg btn-ripple mt-3 w-100" onclick="openRegModal('${ev.id}','${dept}','${ev.name}')">Register Now →</button>
        </div>
      </div>`;
    container.appendChild(card);
  });
  initReveal();
  initRipples();
}

// Dept tab switch
function switchDept(dept) {
  $$('.dept-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.dept === dept));
  renderEvents(dept);
}

// ── Registration ──
function openRegModal(eventId, dept, eventName) {
  $('#regEventId').value = eventId;
  $('#regEventDept').value = dept;
  $('#regEventName').value = eventName;
  $('#regEventDisplay').textContent = eventName + ' · ' + DEPT_LABELS[dept];
  new bootstrap.Modal($('#regModal')).show();
}

function submitRegistration() {
  const form = $('#regForm');
  const fields = ['regName', 'regCCCode', 'regCLName', 'regContact'];
  let valid = true;
  fields.forEach(id => {
    const inp = $('#' + id);
    if (!inp.value.trim()) { inp.style.borderColor = '#dc2626'; valid = false; }
    else inp.style.borderColor = '';
  });
  if (!valid) { showToast('Please fill all required fields.', 'error'); return; }

  const reg = {
    id: 'REG' + Date.now(),
    name: $('#regName').value.trim(),
    ccCode: $('#regCCCode').value.trim().toUpperCase(),
    clName: $('#regCLName').value.trim(),
    contact: $('#regContact').value.trim(),
    eventId: $('#regEventId').value,
    eventName: $('#regEventName').value,
    dept: $('#regEventDept').value,
    status: 'pending',
    timestamp: new Date().toISOString(),
    prAdded: false
  };

  App.data.registrations.push(reg);

  // Create or update leaderboard entry
  let lb = App.data.leaderboard.find(l => l.ccCode === reg.ccCode);
  if (!lb) {
    lb = { ccCode: reg.ccCode, clName: reg.clName, totalPR: 0, dept: reg.dept };
    App.data.leaderboard.push(lb);
  }

  saveData();
  bootstrap.Modal.getInstance($('#regModal')).hide();
  form.reset();
  showToast('Registration submitted! Awaiting admin approval.', 'success');
}

// ── PR Point Calculation ──
function addPRPoints(ccCode, eventId, position) {
  // Find event
  let event = null, dept = null;
  for (const [d, evs] of Object.entries(EVENTS)) {
    const found = evs.find(e => e.id === eventId);
    if (found) { event = found; dept = d; break; }
  }
  if (!event) return false;

  // Prevent duplicates
  const winnerKey = `${ccCode}_${eventId}_${position}`;
  if (App.data.winners.includes(winnerKey)) { showToast('PR points already assigned for this entry.', 'warn'); return false; }

  const pts = {
    1: event.points.first,
    2: event.points.second,
    3: event.points.third,
    0: event.points.participation
  }[position] || event.points.participation;

  let lb = App.data.leaderboard.find(l => l.ccCode === ccCode);
  if (!lb) { showToast('CC Code not found in leaderboard.', 'error'); return false; }

  lb.totalPR += pts;
  App.data.winners.push(winnerKey);
  saveData();
  return { pts, lb };
}

// ── Leaderboard ──
let lbFilter = 'all';
function renderLeaderboard(search = '') {
  let data = [...App.data.leaderboard];
  if (lbFilter !== 'all') data = data.filter(l => l.dept.toLowerCase() === lbFilter);
  if (search) data = data.filter(l => l.ccCode.toLowerCase().includes(search.toLowerCase()) || l.clName.toLowerCase().includes(search.toLowerCase()));
  data.sort((a, b) => b.totalPR - a.totalPR);

  // Top 3 podium
  const podium = $('#lb-podium');
  podium.innerHTML = '';
  const medals = ['silver', 'gold', 'bronze'];
  const crowns = ['🥈', '🏆', '🥉'];
  const order = [1, 0, 2]; // Silver, Gold, Bronze display order
  if (data.length >= 3) {
    order.forEach(idx => {
      const entry = data[idx];
      if (!entry) return;
      const card = el('div', `lb-podium-card ${medals[idx === 0 ? 1 : idx === 1 ? 0 : 2]}`);
      card.innerHTML = `
        <div class="rank-crown">${crowns[idx === 0 ? 1 : idx === 1 ? 0 : 2]}</div>
        <div class="rank-badge">${['1st Place','2nd Place','3rd Place'][idx]}</div>
        <div class="podium-cc">${entry.ccCode}</div>
        <div class="podium-cl">${entry.clName}</div>
        <div class="podium-pts">${entry.totalPR.toLocaleString()} PR</div>`;
      podium.appendChild(card);
    });
  }

  // Table
  const tbody = $('#lb-tbody');
  tbody.innerHTML = '';
  data.forEach((entry, i) => {
    const tr = document.createElement('tr');
    const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
    tr.innerHTML = `
      <td><span class="rank-num">${rankIcon || '#' + (i + 1)}</span></td>
      <td><span class="cc-code-cell">${entry.ccCode}</span></td>
      <td>${entry.clName}</td>
      <td><span class="lb-dept-badge">${entry.dept}</span></td>
      <td><span class="pts-cell">${entry.totalPR.toLocaleString()}</span></td>`;
    tbody.appendChild(tr);
  });
}

// ── Admin Login ──
function showAdminLogin() {
  const modal = new bootstrap.Modal($('#adminLoginModal'));
  modal.show();
}

function adminLogin() {
  const user = $('#adminUsername').value.trim();
  const pass = $('#adminPassword').value.trim();
  if (user === App.adminUser.username && pass === App.adminUser.password) {
    App.adminLoggedIn = true;
    bootstrap.Modal.getInstance($('#adminLoginModal')).hide();
    showAdminPanel();
    showToast('Welcome back, Admin!', 'success');
  } else {
    showToast('Invalid credentials.', 'error');
    $('#adminPassword').value = '';
  }
}

function adminLogout() {
  App.adminLoggedIn = false;
  $('#adminPage').style.display = 'none';
  $('#mainContent').style.display = 'block';
  showToast('Logged out successfully.', 'info');
}

function showAdminPanel() {
  $('#mainContent').style.display = 'none';
  $('#adminPage').style.display = 'flex';
  refreshAdminDashboard();
  renderAdminRegistrations();
  renderAdminLeaderboard();
  renderAdminWinners();
  renderAdminEvents();
  renderCharts();
}

function switchAdminSection(section) {
  $$('.admin-panel-section').forEach(s => s.classList.remove('active'));
  $('#admin-' + section).classList.add('active');
  $$('.admin-nav-item').forEach(n => n.classList.toggle('active', n.dataset.section === section));
}

function refreshAdminDashboard() {
  const regs = App.data.registrations;
  const lbSize = App.data.leaderboard.length;
  $('#admin-total-colleges').textContent = lbSize;
  $('#admin-total-participants').textContent = regs.length;
  $('#admin-total-events').textContent = Object.values(EVENTS).flat().length;
  const approved = regs.filter(r => r.status === 'approved').length;
  $('#admin-approved').textContent = approved;
}

function renderAdminRegistrations() {
  const tbody = $('#admin-reg-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  App.data.registrations.slice().reverse().forEach(reg => {
    const tr = document.createElement('tr');
    tr.id = 'reg-row-' + reg.id;
    tr.innerHTML = `
      <td>${reg.id}</td>
      <td>${reg.name}</td>
      <td><strong>${reg.ccCode}</strong></td>
      <td>${reg.clName}</td>
      <td>${reg.eventName}</td>
      <td><span class="lb-dept-badge">${DEPT_LABELS[reg.dept] || reg.dept}</span></td>
      <td>${reg.contact}</td>
      <td><span class="status-badge ${reg.status}" id="status-${reg.id}">${reg.status}</span></td>
      <td>
        ${reg.status === 'pending' ? `
          <button class="btn-green me-1" onclick="approveReg('${reg.id}')">✓ Approve</button>
          <button class="btn-danger-sm" onclick="rejectReg('${reg.id}')">✗ Reject</button>
        ` : '—'}
      </td>`;
    tbody.appendChild(tr);
  });
}

function approveReg(id) {
  const reg = App.data.registrations.find(r => r.id === id);
  if (!reg) return;
  reg.status = 'approved';

  // Award participation PR
  if (!reg.prAdded) {
    let lb = App.data.leaderboard.find(l => l.ccCode === reg.ccCode);
    if (!lb) { lb = { ccCode: reg.ccCode, clName: reg.clName, totalPR: 0, dept: reg.dept }; App.data.leaderboard.push(lb); }
    const event = Object.values(EVENTS).flat().find(e => e.id === reg.eventId);
    if (event) { lb.totalPR += event.points.participation; reg.prAdded = true; }
  }

  saveData();
  renderAdminRegistrations();
  refreshAdminDashboard();
  renderAdminLeaderboard();
  showToast(`${reg.name} approved! Participation PR awarded.`, 'success');
}

function rejectReg(id) {
  const reg = App.data.registrations.find(r => r.id === id);
  if (!reg) return;
  reg.status = 'rejected';
  saveData();
  renderAdminRegistrations();
  showToast(`Registration rejected.`, 'warn');
}

function renderAdminLeaderboard() {
  const tbody = $('#admin-lb-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const sorted = [...App.data.leaderboard].sort((a, b) => b.totalPR - a.totalPR);
  sorted.forEach((entry, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${i + 1}</td>
      <td><strong>${entry.ccCode}</strong></td>
      <td>${entry.clName}</td>
      <td>${entry.dept}</td>
      <td><strong style="color:var(--green)">${entry.totalPR}</strong></td>`;
    tbody.appendChild(tr);
  });
}

function renderAdminWinners() {
  const tbody = $('#admin-winners-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  // Populate event dropdown
  const evSelect = $('#win-event-select');
  if (evSelect && !evSelect.options.length) {
    Object.values(EVENTS).flat().forEach(ev => {
      const opt = document.createElement('option');
      opt.value = ev.id; opt.textContent = ev.name;
      evSelect.appendChild(opt);
    });
  }
}

function declareWinner() {
  const ccCode = $('#win-cc-code').value.trim().toUpperCase();
  const eventId = $('#win-event-select').value;
  const position = parseInt($('#win-position').value);

  if (!ccCode || !eventId) { showToast('Fill all winner fields.', 'error'); return; }

  const result = addPRPoints(ccCode, eventId, position);
  if (result) {
    const evName = Object.values(EVENTS).flat().find(e => e.id === eventId)?.name || eventId;
    const posLabel = position === 0 ? 'Participation' : position === 1 ? '1st Place' : position === 2 ? '2nd Place' : '3rd Place';
    showToast(`🏆 ${ccCode} awarded ${result.pts} PR for ${posLabel} in ${evName}!`, 'success');
    renderAdminLeaderboard();
    renderLeaderboard();
    refreshAdminDashboard();

    // Confetti for 1st place
    if (position === 1) launchConfetti();
  }
  $('#win-cc-code').value = '';
}

// ── Confetti ──
function launchConfetti() {
  const canvas = $('#confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#009B4D', '#FFCC00', '#fff', '#00C261', '#FFD740'];
  const pieces = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    r: 4 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    speed: 3 + Math.random() * 5,
    vx: (Math.random() - 0.5) * 4,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.2,
    alpha: 1
  }));

  let frame;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.speed; p.x += p.vx; p.angle += p.spin; p.alpha -= 0.006;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 2.2);
      ctx.restore();
    });
    if (pieces.some(p => p.alpha > 0)) frame = requestAnimationFrame(draw);
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); cancelAnimationFrame(frame); }
  }
  draw();
}

// ── Charts (Pure CSS bars) ──
function renderCharts() {
  const depts = Object.keys(DEPT_LABELS);
  const container = $('#dept-chart');
  if (!container) return;
  const counts = {};
  depts.forEach(d => { counts[d] = App.data.registrations.filter(r => r.dept === d).length; });
  const max = Math.max(...Object.values(counts), 1);

  container.innerHTML = '<div class="chart-bar-wrap">' + depts.map(d => `
    <div class="chart-row">
      <div class="chart-label">${DEPT_LABELS[d]}</div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="width:${(counts[d] / max * 100)}%">
          <span>${counts[d]}</span>
        </div>
      </div>
    </div>`).join('') + '</div>';

  // PR chart
  const prContainer = $('#pr-chart');
  if (!prContainer) return;
  const sorted = [...App.data.leaderboard].sort((a, b) => b.totalPR - a.totalPR).slice(0, 6);
  const prMax = Math.max(...sorted.map(s => s.totalPR), 1);
  prContainer.innerHTML = '<div class="chart-bar-wrap">' + sorted.map(s => `
    <div class="chart-row">
      <div class="chart-label" style="font-size:0.75rem">${s.ccCode}</div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="width:${(s.totalPR / prMax * 100)}%;background:linear-gradient(90deg,var(--yellow),var(--green))">
          <span>${s.totalPR}</span>
        </div>
      </div>
    </div>`).join('') + '</div>';
}

// ── CSV Export ──
function exportCSV() {
  const rows = [['Rank', 'CC Code', 'CL Name', 'Department', 'Total PR Points']];
  const sorted = [...App.data.leaderboard].sort((a, b) => b.totalPR - a.totalPR);
  sorted.forEach((e, i) => rows.push([i + 1, e.ccCode, e.clName, e.dept, e.totalPR]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'festpro_leaderboard.csv';
  a.click();
  showToast('CSV exported successfully!', 'success');
}


// ── Admin Event Management ──

// Custom event counter for unique IDs
let customEventCounter = App.data.customEventCounter || 100;

function getAllEvents() {
  // Return merged: default EVENTS + any custom ones stored in App.data.customEvents
  const custom = App.data.customEvents || {};
  const merged = {};
  Object.keys(EVENTS).forEach(dept => {
    merged[dept] = [...EVENTS[dept]];
  });
  Object.values(custom).forEach(ev => {
    if (!merged[ev.dept]) merged[ev.dept] = [];
    if (!merged[ev.dept].find(e => e.id === ev.id)) {
      merged[ev.dept].push(ev);
    }
  });
  return merged;
}

function getDeletedEventIds() {
  return App.data.deletedEventIds || [];
}

function getEffectiveEvents() {
  // Default events minus deleted ones, plus custom ones
  const deleted = getDeletedEventIds();
  const custom  = App.data.customEvents || {};
  const result  = {};
  Object.entries(EVENTS).forEach(([dept, evs]) => {
    result[dept] = evs.filter(e => !deleted.includes(e.id));
  });
  Object.values(custom).forEach(ev => {
    if (!result[ev.dept]) result[ev.dept] = [];
    result[ev.dept].push(ev);
  });
  return result;
}

let adminEventFilter = 'all';

function renderAdminEvents(filterDept) {
  if (filterDept !== undefined) adminEventFilter = filterDept;
  const tbody = $('#admin-events-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const deleted = getDeletedEventIds();
  const custom  = App.data.customEvents || {};

  // Build flat list: default events + custom events
  const allFlat = [];
  Object.entries(EVENTS).forEach(([dept, evs]) => {
    evs.forEach(ev => allFlat.push({ ...ev, dept, isCustom: false }));
  });
  Object.values(custom).forEach(ev => {
    allFlat.push({ ...ev, isCustom: true });
  });

  const filtered = adminEventFilter === 'all' ? allFlat : allFlat.filter(e => e.dept === adminEventFilter);

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-light);padding:32px">No events found.</td></tr>';
    return;
  }

  filtered.forEach(ev => {
    const isDeleted = deleted.includes(ev.id);
    const tr = document.createElement('tr');
    tr.style.opacity = isDeleted ? '0.4' : '1';
    tr.innerHTML = `
      <td style="font-size:1.6rem;line-height:1">${ev.icon}</td>
      <td><strong>${ev.name}</strong>${ev.isCustom ? ' <span style="font-size:0.7rem;background:rgba(255,204,0,0.15);color:#b38b00;padding:2px 8px;border-radius:50px;font-weight:700">CUSTOM</span>' : ''}</td>
      <td><span class="lb-dept-badge" style="text-transform:capitalize">${ev.dept}</span></td>
      <td><span style="color:var(--green);font-weight:700">${ev.points.participation}</span></td>
      <td><span style="color:#c8a000;font-weight:700">${ev.points.first}</span></td>
      <td style="color:#888;font-weight:700">${ev.points.second}</td>
      <td style="color:#a0622a;font-weight:700">${ev.points.third}</td>
      <td>
        ${isDeleted
          ? `<button class="btn-green" onclick="restoreEvent('${ev.id}')" style="font-size:0.78rem;padding:5px 12px;border-radius:8px">↩ Restore</button>`
          : `<button class="btn-outline-green me-1" onclick="openEditEventModal('${ev.id}')" style="font-size:0.78rem;padding:5px 12px;border-radius:8px">✏️ Edit</button>
             <button class="btn-danger-sm" onclick="confirmDeleteEvent('${ev.id}','${ev.name.replace(/'/g,"\'")}')">🗑️ Remove</button>`
        }
      </td>`;
    tbody.appendChild(tr);
  });

  // Keep winner event dropdown in sync
  refreshWinnerEventDropdown();
}

function filterAdminEvents(dept, btn) {
  $$('#events-filter-tabs .filter-chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAdminEvents(dept);
}

function openAddEventModal() {
  $('#editEventId').value = '';
  $('#addEventModalTitle').textContent = '➕ Add New Event';
  $('#evName').value = '';
  $('#evIcon').value = '🎯';
  $('#evDept').value = 'technical';
  $('#evDesc').value = '';
  $('#evRules').value = '';
  $('#evPRpart').value = 10;
  $('#evPR1st').value = 50;
  $('#evPR2nd').value = 30;
  $('#evPR3rd').value = 20;
  new bootstrap.Modal($('#addEventModal')).show();
}

function openEditEventModal(eventId) {
  // Find event in defaults or custom
  let ev = null;
  Object.values(EVENTS).flat().forEach(e => { if (e.id === eventId) ev = e; });
  if (!ev && App.data.customEvents) ev = App.data.customEvents[eventId];
  if (!ev) { showToast('Event not found.', 'error'); return; }

  // Find dept
  let dept = ev.dept || 'technical';
  if (!ev.dept) {
    Object.entries(EVENTS).forEach(([d, evs]) => { if (evs.find(e => e.id === eventId)) dept = d; });
  }

  $('#editEventId').value = eventId;
  $('#addEventModalTitle').textContent = '✏️ Edit Event';
  $('#evName').value = ev.name;
  $('#evIcon').value = ev.icon;
  $('#evDept').value = dept;
  $('#evDesc').value = ev.desc;
  $('#evRules').value = ev.rules.join('\n');
  $('#evPRpart').value = ev.points.participation;
  $('#evPR1st').value = ev.points.first;
  $('#evPR2nd').value = ev.points.second;
  $('#evPR3rd').value = ev.points.third;
  new bootstrap.Modal($('#addEventModal')).show();
}

function saveEvent() {
  const name  = $('#evName').value.trim();
  const icon  = $('#evIcon').value.trim() || '🎯';
  const dept  = $('#evDept').value;
  const desc  = $('#evDesc').value.trim();
  const rules = $('#evRules').value.trim().split('\n').map(r => r.trim()).filter(r => r);
  const pPart = parseInt($('#evPRpart').value) || 10;
  const p1st  = parseInt($('#evPR1st').value) || 50;
  const p2nd  = parseInt($('#evPR2nd').value) || 30;
  const p3rd  = parseInt($('#evPR3rd').value) || 20;

  if (!name) { showToast('Event name is required.', 'error'); return; }
  if (!desc) { showToast('Description is required.', 'error'); return; }
  if (!rules.length) { showToast('At least one rule is required.', 'error'); return; }

  const editId = $('#editEventId').value;

  if (!App.data.customEvents) App.data.customEvents = {};

  if (editId) {
    // Edit: update in customEvents if it's custom, or shadow-override a default
    const ev = {
      id: editId, name, icon, dept, desc, rules,
      points: { participation: pPart, first: p1st, second: p2nd, third: p3rd }
    };
    App.data.customEvents[editId] = ev;

    // Also update in EVENTS array if it's a default event (in-memory only)
    Object.entries(EVENTS).forEach(([d, evs]) => {
      const idx = evs.findIndex(e => e.id === editId);
      if (idx !== -1) {
        EVENTS[d][idx] = { ...EVENTS[d][idx], ...ev };
      }
    });

    showToast(`✏️ "${name}" updated successfully!`, 'success');
  } else {
    // New custom event
    customEventCounter++;
    const newId = 'custom_' + customEventCounter;
    App.data.customEvents[newId] = {
      id: newId, name, icon, dept, desc, rules,
      points: { participation: pPart, first: p1st, second: p2nd, third: p3rd }
    };
    App.data.customEventCounter = customEventCounter;
    showToast(`✅ "${name}" added to ${dept} department!`, 'success');
  }

  saveData();
  bootstrap.Modal.getInstance($('#addEventModal')).hide();
  renderAdminEvents();
  renderEvents($('.dept-tab-btn.active')?.dataset.dept || 'technical');
  refreshAdminDashboard();
  refreshWinnerEventDropdown();
}

function confirmDeleteEvent(eventId, eventName) {
  $('#deleteEventName').textContent = eventName;
  const modal = new bootstrap.Modal($('#deleteEventModal'));
  modal.show();
  $('#confirmDeleteBtn').onclick = function() {
    deleteEvent(eventId, eventName);
    bootstrap.Modal.getInstance($('#deleteEventModal')).hide();
  };
}

function deleteEvent(eventId, eventName) {
  if (!App.data.deletedEventIds) App.data.deletedEventIds = [];

  // If it's a custom event, remove it entirely
  if (App.data.customEvents && App.data.customEvents[eventId]) {
    delete App.data.customEvents[eventId];
    showToast(`🗑️ "${eventName}" removed.`, 'warn');
  } else {
    // Mark default event as deleted
    if (!App.data.deletedEventIds.includes(eventId)) {
      App.data.deletedEventIds.push(eventId);
    }
    showToast(`🗑️ "${eventName}" removed from public view.`, 'warn');
  }

  saveData();
  renderAdminEvents();
  renderEvents($('.dept-tab-btn.active')?.dataset.dept || 'technical');
  refreshAdminDashboard();
  refreshWinnerEventDropdown();
}

function restoreEvent(eventId) {
  if (!App.data.deletedEventIds) return;
  App.data.deletedEventIds = App.data.deletedEventIds.filter(id => id !== eventId);
  saveData();
  renderAdminEvents();
  renderEvents($('.dept-tab-btn.active')?.dataset.dept || 'technical');
  showToast('↩ Event restored successfully!', 'success');
  refreshWinnerEventDropdown();
}

function refreshWinnerEventDropdown() {
  const select = $('#win-event-select');
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">Select Event…</option>';
  const deleted = getDeletedEventIds();
  const custom  = App.data.customEvents || {};

  // Default events (non-deleted)
  Object.values(EVENTS).flat()
    .filter(e => !deleted.includes(e.id))
    .forEach(ev => {
      const opt = document.createElement('option');
      opt.value = ev.id; opt.textContent = ev.name;
      select.appendChild(opt);
    });

  // Custom events
  Object.values(custom).forEach(ev => {
    const opt = document.createElement('option');
    opt.value = ev.id; opt.textContent = ev.name + ' ✦';
    select.appendChild(opt);
  });

  if (current) select.value = current;
}

// ── Loader ──
function hideLoader() {
  const loader = $('#page-loader');
  setTimeout(() => {
    loader.style.opacity = '0';
    loader.style.pointerEvents = 'none';
    setTimeout(() => loader.remove(), 500);
  }, 1400);
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initDarkMode();
  initScrollProgress();
  initNavbar();
  initParticles();
  initCountdown();
  initCounters();
  initReveal();
  initRipples();
  renderEvents('technical');
  renderLeaderboard();
  hideLoader();

  // Nav click handlers
  $$('[data-page]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); showPage(el.dataset.page); });
  });

  // Dept tabs
  $$('.dept-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchDept(btn.dataset.dept));
  });

  // Leaderboard search
  const lbSearch = $('#lb-search');
  if (lbSearch) lbSearch.addEventListener('input', e => renderLeaderboard(e.target.value));

  // Filter chips
  $$('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      lbFilter = chip.dataset.filter;
      renderLeaderboard(lbSearch?.value || '');
    });
  });

  // Admin nav
  $$('.admin-nav-item[data-section]').forEach(item => {
    item.addEventListener('click', () => {
      switchAdminSection(item.dataset.section);
      if (item.dataset.section === 'dashboard') { refreshAdminDashboard(); renderCharts(); }
      if (item.dataset.section === 'leaderboard') renderAdminLeaderboard();
      if (item.dataset.section === 'events') renderAdminEvents();
    });
  });
});