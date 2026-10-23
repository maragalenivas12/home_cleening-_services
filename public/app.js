const $ = s => document.querySelector(s), app = $('#app');
const S = { user: JSON.parse(localStorage.getItem('tn_user') || 'null'), token: localStorage.getItem('tn_token') || '', packages: [], staff: [], filter: 'All', view: 'home', quick: {}, cleanerFilters: { search: '', category: 'All', experience: 'All', rating: 'All', page: 1 } };
const SLOT_LABEL = t => { const h = +t.slice(0, 2); return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = n => '₹' + Number(n).toLocaleString('en-IN');
const COLORS = ['#0b8f9c', '#e0702f', '#6a5acd', '#2e9e5b', '#c2417c', '#3b6fd4'];
const av = (name, id) => `<div class="avatar" style="background:${COLORS[id % COLORS.length]}">${esc(name.split(' ').map(w => w[0]).join('').slice(0, 2))}</div>`;
const WORKER_PHOTOS = { 1: 'cleaner-1.jpg', 2: 'cleaner-2.jpg', 3: 'cleaner-3.jpg', 4: 'cleaner-4.jpg', 5: 'cleaner-5.jpg', 6: 'cleaner-6.jpg', 7: 'cleaner-7.jpg', 8: 'cleaner-8.jpg', 9: 'cleaner-9.jpg', 28: 'cleaner-28.jpg' };
const workerPhoto = id => `images/cleaners/${WORKER_PHOTOS[id] || `cleaner-${(Math.max(1, Number(id) || 1) % 9) + 1}.jpg`}`;
const workerAvatar = (worker, className = 'avatar') => `<div class="${className}"><img src="${workerPhoto(worker.id)}" alt="${esc(worker.name)} profile photo" loading="lazy"></div>`;
const workerInitials = name => String(name || '?').split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
const stars = r => `<span class="stars" aria-label="${r} out of 5">${'★'.repeat(Math.round(r))}<i>${'★'.repeat(5 - Math.round(r))}</i></span>`;
const ICONS = { sparkle: '<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>', home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>', drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>', sofa: '<path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3"/><path d="M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2z"/>', box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>', wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>' };
const icon = k => `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k] || ICONS.sparkle}</svg>`;
const PACKAGE_PHOTOS = ['package-express.jpg', 'package-appliance.jpg', 'package-deep.jpg', 'package-upholstery.jpg', 'hero-living-room.jpg', 'package-express.jpg'];

async function api(path, opts = {}) {
  const r = await fetch('/api' + path, { method: opts.method || 'GET', headers: { 'Content-Type': 'application/json', ...(S.token && { Authorization: 'Bearer ' + S.token }) }, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { if (r.status === 401 && S.token) logout(true); throw new Error(data.error || 'Something went wrong.'); }
  return data;
}
function toast(msg, bad) { const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = msg; $('#toasts').append(t); setTimeout(() => t.remove(), 3200); }
const openModal = html => { $('#modalBody').innerHTML = html; $('#modal').hidden = false; };
const closeModal = () => { $('#modal').hidden = true; };
$('#closeModal').onclick = closeModal; $('#modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function renderAuth() {
  $('#authArea').innerHTML = S.user
    ? `${av(S.user.name, S.user.id)}<span style="font-weight:600">${esc(S.user.name.split(' ')[0])}</span><button class="btn ghost sm" id="outBtn">Sign out</button>`
    : `<button class="btn ghost sm" id="inBtn">Sign in</button><button class="btn sm" id="upBtn">Create account</button>`;
  if (S.user) $('#outBtn').onclick = () => logout();
  else { $('#inBtn').onclick = () => authModal('login'); $('#upBtn').onclick = () => authModal('register'); }
}
function logout(silent) { S.user = null; S.token = ''; localStorage.removeItem('tn_user'); localStorage.removeItem('tn_token'); renderAuth(); go('home'); if (!silent) toast('Signed out.'); }
function completeSignIn(data, then) {
  S.user = data.user; S.token = data.token;
  localStorage.setItem('tn_user', JSON.stringify(data.user)); localStorage.setItem('tn_token', data.token);
  closeModal(); renderAuth(); toast(`Signed in as ${data.user.name.split(' ')[0]}.`);
  then ? then() : S.view === 'bookings' && go('bookings');
}
function authModal(mode, then) {
  const reg = mode === 'register';
  openModal(`<div class="auth-layout">
    <aside class="auth-aside"><img src="images/hero-living-room.jpg" alt="A bright, freshly cared-for home"><div class="auth-aside-copy">
      <span class="auth-kicker">A little more room to breathe</span><h3>${reg ? 'Come home to clean.' : 'Welcome back home.'}</h3>
      <p>${reg ? 'Book a trusted cleaner in minutes and keep every visit in one place.' : 'Your next fresh start is just a few taps away.'}</p>
      <span class="auth-benefit">✓ Trusted local professionals</span><span class="auth-benefit">✓ Flexible booking times</span>
    </div></aside>
    <div class="auth-form"><h3>${reg ? 'Create your account' : 'Welcome back'}</h3><p class="sub">${reg ? 'Create an account to get started.' : 'Sign in to book and manage your visits.'}</p>
      <div class="tabs"><button class="${reg ? '' : 'on'}" data-m="login">Sign in</button><button class="${reg ? 'on' : ''}" data-m="register">Create account</button></div>
      ${reg ? '<label for="fn">Full name</label><input id="fn" autocomplete="name" placeholder="Your full name"><label for="ph">Mobile number (optional)</label><input id="ph" type="tel" inputmode="tel" autocomplete="tel" placeholder="+91 98765 43210">' : ''}
      <label for="em">Email address</label><input id="em" type="email" autocomplete="email" placeholder="you@example.com"><label for="pw">Password</label><input id="pw" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="At least 6 characters">
      <div class="err" id="err"></div><div class="row"><span></span><button class="btn" id="go">${reg ? 'Continue to OTP' : 'Sign in'} <span aria-hidden="true">→</span></button></div>
      <p class="auth-footnote">${reg ? 'Already have an account?' : 'New to Nestora?'} <button class="text-button" data-m="${reg ? 'login' : 'register'}">${reg ? 'Sign in' : 'Create an account'}</button></p>
    </div>
  </div>`);
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => authModal(b.dataset.m, then));
  document.querySelectorAll('.text-button').forEach(b => b.onclick = () => authModal(b.dataset.m, then));
  $('#go').onclick = async () => {
    try {
      const body = { email: $('#em').value, password: $('#pw').value, ...(reg && { name: $('#fn').value, phone: $('#ph').value }) };
      const d = await api('/auth/' + mode, { method: 'POST', body });
      if (reg) { otpModal(d, then); return; }
      completeSignIn(d, then);
    } catch (e) { $('#err').textContent = e.message; }
  };
}
function otpModal(registration, then) {
  openModal(`<div class="form-page-heading"><span class="form-icon">✉</span><h3>Verify your email</h3></div><p class="sub">${esc(registration.message || 'A six-digit OTP was sent to your email.')} Enter it to create your account.</p>
    <label for="otp">Six-digit OTP</label><input id="otp" inputmode="numeric" autocomplete="one-time-code" pattern="\\d{6}" maxlength="6" placeholder="123456">
    <div class="err" id="err"></div><div class="row"><button class="btn ghost" id="otp-back">Back</button><button class="btn" id="otp-verify">Verify & create account</button></div>`);
  $('#otp-back').onclick = () => authModal('register', then);
  $('#otp-verify').onclick = async () => {
    try {
      const d = await api('/auth/register/verify-otp', { method: 'POST', body: { verificationId: registration.verificationId, otp: $('#otp').value.trim() } });
      completeSignIn(d, then);
    } catch (e) { $('#err').textContent = e.message; }
  };
}

function go(view) {
  S.view = view;
  window.scrollTo(0, 0);
  if (view === 'cleaners') renderCleaners();
  else if (view === 'bookings') renderBookings();
  else renderHome();
}
document.addEventListener('click', e => {
  const authLink = e.target.closest('[data-auth-register]');
  if (authLink) { e.preventDefault(); authModal('register'); return; }

  const g = e.target.closest('[data-go]');
  if (!g) return;
  e.preventDefault();
  const same = S.view === 'home' && g.dataset.go === 'home';
  if (g.closest('.nav nav')) {
    document.querySelectorAll('.nav nav a').forEach(link => link.classList.toggle('active', link === g));
  }
  go(g.dataset.go);
  if (g.dataset.registerWorker !== undefined) { openWorkerRegistration(); return; }
  if (g.hash) setTimeout(() => document.querySelector(g.hash)?.scrollIntoView({ behavior: 'smooth' }), 50);
  if (same) document.querySelector(g.hash || 'body')?.scrollIntoView({ behavior: 'smooth' });
});

function renderHome() {
  const cats = ['All', ...new Set(S.packages.map(p => p.category))];
  const list = S.packages.filter(p => S.filter === 'All' || p.category === S.filter);
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  const profiles = uniqueCleaners();
  const ratedStaff = profiles.filter(person => Number(person.reviews) > 0 && Number(person.rating) > 0);
  const averageRating = ratedStaff.length ? (ratedStaff.reduce((sum, person) => sum + Number(person.rating), 0) / ratedStaff.length).toFixed(1) : '';
  app.innerHTML = `
  <section class="hero"><div class="wrap hero-in">
    <div class="hero-copy">
      <span class="eyebrow"><span class="eyebrow-icon">✓</span> Trusted home cleaning services</span>
      <h1>A spotless home,<br><span>booked before</span><br>your tea cools.</h1>
      <p class="lead">Professional, reliable home cleaning, right at your convenience. Clean spaces, healthier living.</p>
      <div class="trust">
        <span class="trust-item"><span class="trust-icon">✓</span><span><b>${profiles.length} cleaner profiles</b><small>Ready for your booking</small></span></span>
        <span class="trust-item"><span class="trust-icon">★</span><span><b>${averageRating ? `${averageRating}★ rating` : 'New ratings'}</b><small>From completed visits</small></span></span>
        <span class="trust-item"><span class="trust-icon">◷</span><span><b>Easy booking</b><small>Pick a time that works</small></span></span>
      </div>
    </div>
    <div class="hero-scene">
      <img class="hero-photo" src="images/hero-living-room.jpg" alt="Bright, welcoming living room" fetchpriority="high">
      <div class="quick"><h3>Book a visit</h3><label for="qp">Service</label>
        <select id="qp">${S.packages.map(p => `<option value="${p.id}">${esc(p.name)} — ${inr(p.price)}</option>`).join('')}</select>
        <label for="qd">Date</label><input id="qd" type="date" min="${new Date().toISOString().slice(0, 10)}" value="${tomorrow}">
        <button class="btn" id="qgo"><span>◷</span> Choose a time slot <span aria-hidden="true">→</span></button>
      </div>
    </div>
  </div></section>
  <div class="feature-strip wrap" aria-label="Nestora service benefits">
    <div class="feature-item"><span class="feature-icon">▦</span><span><b>Easy booking</b><small>Book in minutes</small></span></div>
    <div class="feature-item"><span class="feature-icon">✓</span><span><b>Trusted professionals</b><small>People you can trust</small></span></div>
    <div class="feature-item"><span class="feature-icon">◷</span><span><b>Flexible slots</b><small>Choose your time</small></span></div>
    <div class="feature-item"><span class="feature-icon">♡</span><span><b>Made for your home</b><small>Thoughtful every visit</small></span></div>
  </div>
  <section class="services-section" id="services"><div class="wrap"><div class="sec-h"><div><span class="section-kicker"></span><h2>Cleaning packages</h2><p>Find the right clean for every room in your home.</p></div><div class="chips">${cats.map(c => `<button class="chip ${c === S.filter ? 'on' : ''}" data-f="${c}">${c}</button>`).join('')}</div></div>
    <div class="grid">${list.map((p, index) => `<article class="pkg">
      <div class="pkg-photo"><img src="images/${esc(p.photo || PACKAGE_PHOTOS[(Number(p.id) - 1) % PACKAGE_PHOTOS.length])}" alt="${esc(p.name)} service" loading="lazy"><span class="pkg-category">${esc(p.category)}</span></div>
      <div class="pkg-body"><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>
      <details class="pkg-includes"><summary>What's included</summary><ul>${p.includes.map(i => `<li>${esc(i)}</li>`).join('')}</ul></details>
      <div class="foot2"><div class="price">${inr(p.price)} <small>/ visit</small></div><button class="btn sm" data-book="${p.id}">Book now <span aria-hidden="true">→</span></button></div>
      <div class="card-meta"><span><i>✓</i> Verified cleaners</span><span><i>★</i> ${averageRating ? `${averageRating} avg` : 'New service'}</span><span>~${p.hours}h</span></div></div>
    </article>`).join('')}</div></div></section>
  <section id="about" class="about-section"><div class="wrap"><div class="how">
    <div class="about-copy"><span class="section-kicker"></span><h2>A cleaner home, made simple</h2><p class="about-lead">A little less to worry about, and a little more time for what matters. Nestora makes booking dependable home care straightforward.</p>
      <div class="about-points"><span><i>✓</i> Choose a service that fits your home</span><span><i>✓</i> Pick a convenient date and time</span><span><i>✓</i> Meet a rated local professional</span></div>
      <button class="btn" data-scroll-services>Explore our services <span aria-hidden="true">→</span></button>
    </div>
    <div class="how-visual"><img src="images/package-express.jpg" alt="A home-care professional cleaning a bright window" loading="lazy"><div class="how-caption"><b>Fresh, comfortable, yours.</b><span>Home care that fits your day.</span></div></div>
  </div>
  <div class="steps-heading"><span class="section-kicker"></span><h2>How it works</h2><p>Get your home cleaned in three simple steps.</p></div>
  <div class="steps">
    <article class="step-card"><span class="step-icon">01</span><h3>Choose a service</h3><p>Explore our packages and find the right clean for your home.</p></article>
    <article class="step-card"><span class="step-icon">02</span><h3>Pick a date &amp; time</h3><p>See available slots and choose a time that suits you.</p></article>
    <article class="step-card"><span class="step-icon">03</span><h3>Enjoy a clean home</h3><p>Relax while your selected professional takes care of the rest.</p></article>
  </div></div></section>
  <section id="cleaners"><div class="wrap"><div class="sec-h"><h2>Meet the cleaners</h2><p>Ratings come from real completed bookings.</p><button class="btn ghost sm" id="workerRegOpen">New worker registration</button></div>
    <div class="grid">${profiles.map(s => `<article class="staff">${workerAvatar(s)}<div><h3>${esc(s.name)}</h3>${s.rating === null ? '<small>New worker — no ratings yet</small>' : `${stars(s.rating)} <small>${s.rating} (${s.reviews})</small>`}<br><small>${esc(s.skills)} · ${s.years} yrs</small><p style="font-size:.93rem;color:var(--mute);margin-top:6px">${esc(cleanerDescription(s))}</p></div></article>`).join('')}</div></div></section>`;
  document.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { S.filter = b.dataset.f; renderHome(); setTimeout(() => $('#services').scrollIntoView(), 0); });
  document.querySelectorAll('[data-book]').forEach(b => b.onclick = () => startBooking(+b.dataset.book));
  $('#qgo').onclick = () => startBooking(+$('#qp').value, $('#qd').value);
  document.querySelector('[data-scroll-services]').onclick = () => $('#services').scrollIntoView({ behavior: 'smooth' });
  $('#workerRegOpen')?.addEventListener('click', openWorkerRegistration);
}

function uniqueCleaners() {
  const cleaners = new Map();
  S.staff.forEach(worker => {
    const digits = String(worker.phone || '').replace(/\D/g, '');
    const phoneKey = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
    const key = phoneKey ? `phone:${phoneKey}` : `id:${worker.id}`;
    const previous = cleaners.get(key);
    if (!previous || Number(worker.id) > Number(previous.id)) cleaners.set(key, worker);
  });
  return [...cleaners.values()];
}

function cleanerDescription(worker) {
  const bio = String(worker.bio || '').trim();
  if (bio && !bio.startsWith('Mobile:')) return bio;
  return `${worker.skills || 'Home service'} professional, ready to help care for your home.`;
}

function renderCleanerCard(worker) {
  const isNew = !Number(worker.reviews);
  const color = COLORS[(Number(worker.id) || 0) % COLORS.length];
  const phone = String(worker.phone || '').trim();
  const location = String(worker.address || '').trim();
  const rating = Number(worker.rating);
  const hasRating = !isNew && Number.isFinite(rating);
  return `<article class="cleaner-card">
    <div class="cleaner-card-cover"><img class="cleaner-card-photo" src="${workerPhoto(worker.id)}" alt="${esc(worker.name)} cleaning professional" loading="lazy"><span class="cleaner-badge ${isNew ? 'new' : 'verified'}">${isNew ? '✦ New worker' : '✓ Verified'}</span><div class="cleaner-avatar" style="background:${color}">${workerInitials(worker.name)}</div></div>
    <div class="cleaner-card-body"><div class="cleaner-title"><h2>${esc(worker.name)}</h2></div><div class="cleaner-card-rating">${hasRating ? `${stars(rating)} <b>${rating.toFixed(1)}</b>` : '<span class="unrated">☆ No ratings yet</span>'}</div>
      <small class="review-count">${hasRating ? `${Number(worker.reviews)} reviews` : 'Be the first to review'}</small>
      <span class="cleaner-specialty">${esc(worker.skills || 'Home service worker')}</span>
      <p class="cleaner-description">${esc(cleanerDescription(worker))}</p>
      <div class="cleaner-details"><span><i aria-hidden="true">♙</i>${Number(worker.years) || 0} ${Number(worker.years) === 1 ? 'year' : 'years'} experience</span>
        <span><i aria-hidden="true">☎</i>${phone ? esc(phone) : 'Phone not provided'}</span>
        <span><i aria-hidden="true">⌖</i>${location ? esc(location) : 'Location not provided'}</span></div>
      ${phone ? `<a class="cleaner-contact" href="tel:${esc(phone)}">Contact <span aria-hidden="true">→</span></a>` : '<button class="cleaner-contact unavailable" type="button" disabled>Contact unavailable</button>'}
    </div>
  </article>`;
}

function renderCleaners() {
  const filters = S.cleanerFilters;
  const workers = uniqueCleaners();
  const categories = ['All', ...new Set(workers.map(worker => worker.skills).filter(Boolean))];
  const query = filters.search.trim().toLowerCase();
  let filtered = workers.filter(worker => {
    const searchText = [worker.name, worker.skills, worker.address, cleanerDescription(worker)].join(' ').toLowerCase();
    const years = Number(worker.years) || 0;
    const rating = Number(worker.rating) || 0;
    const experienceMatch = filters.experience === 'All'
      || (filters.experience === '0-2' && years <= 2)
      || (filters.experience === '3-5' && years >= 3 && years <= 5)
      || (filters.experience === '6-9' && years >= 6 && years <= 9)
      || (filters.experience === '10+' && years >= 10);
    const ratingMatch = filters.rating === 'All'
      || (filters.rating === '4+' && rating >= 4)
      || (filters.rating === '4.5+' && rating >= 4.5);
    return (!query || searchText.includes(query))
      && (filters.category === 'All' || worker.skills === filters.category)
      && experienceMatch && ratingMatch;
  }).sort((first, second) => (Number(second.rating) || 0) - (Number(first.rating) || 0) || String(first.name).localeCompare(String(second.name)));
  const pageSize = 9;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  filters.page = Math.min(filters.page, pageCount);
  const pageWorkers = filtered.slice((filters.page - 1) * pageSize, filters.page * pageSize);
  const firstResult = filtered.length ? (filters.page - 1) * pageSize + 1 : 0;

  app.innerHTML = `<section class="cleaner-directory"><div class="directory-layout">
    <aside class="directory-sidebar" aria-label="Site navigation"><a class="directory-side-link" href="#" data-go="home"><span>⌂</span>Home</a><a class="directory-side-link" href="#services" data-go="home"><span>▦</span>Services</a><a class="directory-side-link active" href="#" data-go="cleaners"><span>♧</span>Meet the Cleaners</a><a class="directory-side-link" href="#about" data-go="home"><span>ⓘ</span>About</a><button class="directory-side-link" id="sidebarRegister"><span>♙</span>New registration</button><a class="directory-side-link" href="#" data-go="bookings"><span>▣</span>My bookings</a><div class="sidebar-promo"><span>✦</span><b>Trusted &amp; Verified Cleaners</b><p>Meet experienced professionals ready to care for your home.</p></div></aside>
    <div class="directory-content"><section class="directory-hero"><div><span class="directory-kicker">✓ Trusted professionals</span><h1>Meet the <span>Cleaners</span></h1><p>Skilled, verified, and ready to help.</p><small>Discover local home-service professionals with real experience and reviews.</small></div><div class="directory-hero-stat"><span>✦</span><div><b>${workers.length} professionals</b><small>Profiles from your Nestora database</small></div></div><button class="btn directory-register" id="directoryRegister">＋ New Worker Registration <span aria-hidden="true">→</span></button></section>
      <section class="directory-results" aria-label="Cleaner directory"><div class="directory-tools"><label class="cleaner-search"><span aria-hidden="true">⌕</span><input id="cleanerSearch" type="search" value="${esc(filters.search)}" placeholder="Search by name, service or location..." aria-label="Search cleaners"></label>
        <label class="filter-field"><span>Category</span><select id="cleanerCategory">${categories.map(category => `<option value="${esc(category)}" ${filters.category === category ? 'selected' : ''}>${esc(category)}</option>`).join('')}</select></label>
        <label class="filter-field"><span>Experience</span><select id="cleanerExperience"><option value="All">Any experience</option><option value="0-2" ${filters.experience === '0-2' ? 'selected' : ''}>0–2 years</option><option value="3-5" ${filters.experience === '3-5' ? 'selected' : ''}>3–5 years</option><option value="6-9" ${filters.experience === '6-9' ? 'selected' : ''}>6–9 years</option><option value="10+" ${filters.experience === '10+' ? 'selected' : ''}>10+ years</option></select></label>
        <label class="filter-field"><span>Rating</span><select id="cleanerRating"><option value="All">Any rating</option><option value="4+" ${filters.rating === '4+' ? 'selected' : ''}>4+ stars</option><option value="4.5+" ${filters.rating === '4.5+' ? 'selected' : ''}>4.5+ stars</option></select></label>
        <button class="directory-reset" id="cleanerReset">↻ Reset</button></div>
        <div class="cleaner-grid">${pageWorkers.length ? pageWorkers.map(renderCleanerCard).join('') : '<div class="cleaner-empty"><span>⌕</span><h2>No cleaners match these filters</h2><p>Try another name, service, or filter.</p></div>'}</div>
        <div class="directory-pagination"><span>Showing ${firstResult}–${Math.min(filters.page * pageSize, filtered.length)} of ${filtered.length} cleaners</span><div><button type="button" data-page="${filters.page - 1}" aria-label="Previous page" ${filters.page <= 1 ? 'disabled' : ''}>←</button>${Array.from({ length: pageCount }, (_, index) => index + 1).map(page => `<button type="button" data-page="${page}" class="${page === filters.page ? 'active' : ''}" aria-label="Page ${page}" ${page === filters.page ? 'aria-current="page"' : ''}>${page}</button>`).join('')}<button type="button" data-page="${filters.page + 1}" aria-label="Next page" ${filters.page >= pageCount ? 'disabled' : ''}>→</button></div></div>
      </section></div></div></section>`;

  const updateFilters = () => { filters.page = 1; renderCleaners(); };
  $('#cleanerSearch').addEventListener('input', event => {
    const cursor = event.target.selectionStart;
    filters.search = event.target.value;
    updateFilters();
    $('#cleanerSearch').focus();
    $('#cleanerSearch').setSelectionRange(cursor, cursor);
  });
  $('#cleanerCategory').addEventListener('change', event => { filters.category = event.target.value; updateFilters(); });
  $('#cleanerExperience').addEventListener('change', event => { filters.experience = event.target.value; updateFilters(); });
  $('#cleanerRating').addEventListener('change', event => { filters.rating = event.target.value; updateFilters(); });
  $('#cleanerReset').addEventListener('click', () => { Object.assign(filters, { search: '', category: 'All', experience: 'All', rating: 'All', page: 1 }); renderCleaners(); });
  $('#sidebarRegister').addEventListener('click', openWorkerRegistration);
  $('#directoryRegister').addEventListener('click', openWorkerRegistration);
  document.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => { filters.page = Number(button.dataset.page); renderCleaners(); }));
}

function openWorkerRegistration() {
  openModal(`<div class="registration-shell"><span class="registration-icon">✦</span><h3>Join the Nestora team</h3><p class="sub">Share your details to join our home-service professionals.</p>
    <div class="registration-fields"><div><label for="w-name">Full name</label><input id="w-name" autocomplete="name" placeholder="Your full name" required></div>
    <div><label for="w-experience">Experience (years)</label><input id="w-experience" type="number" min="0" step="1" placeholder="e.g. 5" required></div>
    <div><label for="w-mobile">Mobile number</label><input id="w-mobile" type="tel" autocomplete="tel" placeholder="+91 98765 43210" required></div>
    <div><label for="w-specialty">Service specialty <span class="optional-label">Optional</span></label><input id="w-specialty" placeholder="e.g. Deep cleaning"></div>
    <div><label for="w-address">Address</label><textarea id="w-address" rows="3" placeholder="House no., street, area, city" required></textarea></div></div>
    <div class="err" id="w-err"></div>
    <div class="row"><span></span><button class="btn" id="w-submit">Submit registration <span aria-hidden="true">→</span></button></div></div>`);

  $('#w-submit').onclick = async () => {
    try {
      const payload = {
        name: $('#w-name').value,
        experience: $('#w-experience').value,
        mobile: $('#w-mobile').value,
        skills: $('#w-specialty').value,
        address: $('#w-address').value
      };
      if (!payload.name.trim() || payload.experience === '' || !payload.mobile.trim() || !payload.address.trim()) {
        $('#w-err').textContent = 'Please fill in name, experience, mobile number, and address.';
        return;
      }
      const worker = await api('/workers/register', { method: 'POST', body: payload });
      closeModal();
      toast(`Worker registered: ${worker.name}`);
      S.staff = await api('/staff');
      S.view === 'cleaners' ? renderCleaners() : renderHome();
    } catch (e) { $('#w-err').textContent = e.message; }
  };
}

function startBooking(pid, date) {
  const open = () => bookingFlow({ pkg: S.packages.find(p => p.id === pid), date: date || new Date(Date.now() + 864e5).toISOString().slice(0, 10), slot: '', staffId: '', address: '', notes: '', step: 1 });
  S.user ? open() : authModal('login', open);
}
async function bookingFlow(b) {
  const stepLabels = ['Choose a time', 'Select a cleaner', 'Confirm details'];
  const bar = `<div class="booking-progress" aria-label="Step ${b.step} of 3">${stepLabels.map((label, index) => `<div class="booking-progress-step ${index + 1 === b.step ? 'current' : index + 1 < b.step ? 'complete' : ''}"><span>${index + 1 < b.step ? '✓' : index + 1}</span><small>${label}</small></div>`).join('')}</div>`;
  const head = `<div class="booking-heading"><span class="section-kicker"></span><h3>${esc(b.pkg.name)}</h3><p class="sub">${inr(b.pkg.price)} <span>·</span> about ${b.pkg.hours} hours</p></div>${bar}`;
  if (b.step === 1) {
    openModal(`<div class="booking-flow">${head}<div class="booking-field"><label for="d">Choose your date</label><input id="d" type="date" min="${new Date().toISOString().slice(0, 10)}" value="${b.date}"></div><div class="booking-field"><label>Available time slots</label><div class="slots" id="slots">Loading…</div></div><div class="err" id="err"></div><div class="row"><button class="btn ghost" data-booking-close>Cancel</button><button class="btn" id="next" disabled>Choose a cleaner <span aria-hidden="true">→</span></button></div></div>`);
    $('[data-booking-close]').onclick = closeModal;
    const load = async () => {
      b.date = $('#d').value; b.slot = ''; $('#next').disabled = true;
      const slots = await api('/slots?date=' + b.date);
      $('#slots').innerHTML = slots.map(s => `<button class="slot" data-s="${s.slot}" ${s.free ? '' : 'disabled'}>${SLOT_LABEL(s.slot)}<small>${s.free ? s.free + ' cleaners free' : 'Fully booked'}</small></button>`).join('');
      document.querySelectorAll('.slot').forEach(x => x.onclick = () => { document.querySelectorAll('.slot').forEach(y => y.classList.remove('on')); x.classList.add('on'); b.slot = x.dataset.s; $('#next').disabled = false; });
    };
    $('#d').onchange = load; load();
    $('#next').onclick = () => { b.step = 2; bookingFlow(b); };
  } else if (b.step === 2) {
    openModal(`<div class="booking-flow">${head}<p class="booking-prompt">Choose your cleaner</p><div id="free" class="cleaner-options">Loading…</div><div class="row"><button class="btn ghost" id="back">Back</button><button class="btn" id="next">Continue <span aria-hidden="true">→</span></button></div></div>`);
    const free = await api(`/availability?date=${b.date}&slot=${b.slot}`);
    const opts = [{ id: '', name: 'Best available', skills: 'We assign the top-rated free cleaner', rating: null }, ...free];
    $('#free').innerHTML = opts.map(s => `<button class="pick ${String(s.id) === String(b.staffId) ? 'on' : ''}" data-id="${s.id}">${s.id ? workerAvatar(s) : '<div class="avatar" style="background:var(--ink)">★</div>'}<div><b>${esc(s.name)}</b> ${s.rating ? stars(s.rating) + ' <small>' + s.rating + '</small>' : ''}<br><small>${esc(s.skills)}</small></div></button>`).join('');
    document.querySelectorAll('.pick').forEach(x => x.onclick = () => { b.staffId = x.dataset.id; document.querySelectorAll('.pick').forEach(y => y.classList.remove('on')); x.classList.add('on'); });
    $('#back').onclick = () => { b.step = 1; bookingFlow(b); }; $('#next').onclick = () => { b.step = 3; bookingFlow(b); };
  } else {
    openModal(`<div class="booking-flow">${head}<div class="booking-field"><label for="a">Service address</label><textarea id="a" rows="2" placeholder="Flat, building, area, city">${esc(b.address)}</textarea></div><div class="booking-field"><label for="n">Notes for your cleaner <span class="optional-label">Optional</span></label><input id="n" value="${esc(b.notes)}" placeholder="Anything helpful to know?"></div>
    <div class="sum booking-summary"><div><span>Date</span><b>${new Date(b.date + 'T00:00').toDateString()}</b></div><div><span>Time</span><b>${SLOT_LABEL(b.slot)}</b></div><div><span>Total</span><b>${inr(b.pkg.price)}</b></div></div>
    <div class="err" id="err"></div><div class="row"><button class="btn ghost" id="back">Back</button><button class="btn" id="next">Confirm booking <span aria-hidden="true">→</span></button></div></div>`);
    $('#back').onclick = () => { b.address = $('#a').value; b.notes = $('#n').value; b.step = 2; bookingFlow(b); };
    $('#next').onclick = async () => {
      try {
        const r = await api('/bookings', { method: 'POST', body: { packageId: b.pkg.id, date: b.date, slot: b.slot, staffId: b.staffId || undefined, address: $('#a').value, notes: $('#n').value } });
        closeModal(); toast(`Booked! ${r.staff.name} will arrive on ${r.date}.`); go('bookings');
      } catch (e) { $('#err').textContent = e.message; }
    };
  }
}

async function renderBookings() {
  if (!S.user) { app.innerHTML = `<section class="bookings-page"><div class="wrap"><div class="empty"><span class="empty-icon">▦</span><h2>Sign in to see your bookings</h2><p>Your upcoming and past visits live here.</p><button class="btn" id="si">Sign in <span aria-hidden="true">→</span></button></div></div></section>`; $('#si').onclick = () => authModal('login'); return; }
  app.innerHTML = `<section class="bookings-page"><div class="wrap">
    <div class="page-heading"><div><span class="section-kicker"></span><p class="page-eyebrow">YOUR NESTORA ACCOUNT</p><h1>My bookings</h1><p class="page-subtitle">Your home-care visits, all in one place.</p></div><button class="btn" data-go="home">Book a service <span aria-hidden="true">→</span></button></div>
    <div class="booking-stats" id="booking-stats"></div><div class="bookings-list" id="list"><div class="loading-card">Loading your bookings…</div></div></div></section>`;
  try {
    const list = await api('/bookings');
    $('#booking-stats').innerHTML = `<div><span class="stat-icon">▦</span><span><b>${list.length}</b><small>Total visits</small></span></div><div><span class="stat-icon">◷</span><span><b>${list.filter(b => b.status === 'confirmed').length}</b><small>Upcoming</small></span></div><div><span class="stat-icon">✓</span><span><b>${list.filter(b => b.status === 'completed').length}</b><small>Completed</small></span></div>`;
    $('#list').innerHTML = list.length ? list.map(b => `<article class="bk booking-card"><div class="booking-date"><b>${new Date(b.date + 'T00:00').toLocaleDateString('en', { day: '2-digit' })}</b><span>${new Date(b.date + 'T00:00').toLocaleDateString('en', { month: 'short' })}</span></div><div class="booking-details"><div class="booking-title"><h2>${esc(b.package.name)}</h2><span class="pill ${b.status}">${esc(b.status)}</span></div>
      <div class="booking-meta"><span>▦ ${new Date(b.date + 'T00:00').toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span><span>◷ ${SLOT_LABEL(b.slot)}</span><span class="booking-price">${inr(b.price)}</span></div><p class="meta booking-cleaner"><span class="mini-avatar"><img src="${workerPhoto(b.staff.id)}" alt="${esc(b.staff.name)} profile photo" loading="lazy"></span><span>Cleaner<br><b>${esc(b.staff.name)}</b> ${stars(b.staff.rating)}</span></p><p class="booking-address">${esc(b.address)}</p>
      ${b.rating ? `<p class="booking-review">Your review: ${stars(b.rating)} ${esc(b.review)}</p>` : ''}</div>
      <div class="acts">${b.status === 'confirmed' ? `<button class="btn ghost sm" data-done="${b.id}" title="Demo shortcut: marks the visit as finished">Mark completed</button><button class="btn warn sm" data-cancel="${b.id}">Cancel</button>` : ''}${b.status === 'completed' && !b.rating ? `<button class="btn sm" data-rate="${b.id}" data-name="${esc(b.staff.name)}">Rate cleaner</button>` : ''}</div></article>`).join('')
      : `<div class="empty"><span class="empty-icon">▦</span><h3>Your next fresh start is waiting</h3><p>Choose a package and a time slot to book your first home clean.</p><button class="btn" data-go="home">Browse services <span aria-hidden="true">→</span></button></div>`;
    document.querySelectorAll('[data-cancel]').forEach(x => x.onclick = async () => { if (!confirm('Cancel this booking?')) return; try { await api(`/bookings/${x.dataset.cancel}/cancel`, { method: 'PATCH' }); toast('Booking cancelled.'); renderBookings(); } catch (e) { toast(e.message, 1); } });
    document.querySelectorAll('[data-done]').forEach(x => x.onclick = async () => { try { await api(`/bookings/${x.dataset.done}/complete`, { method: 'PATCH' }); toast('Marked as completed. You can rate now.'); renderBookings(); } catch (e) { toast(e.message, 1); } });
    document.querySelectorAll('[data-rate]').forEach(x => x.onclick = () => rateModal(x.dataset.rate, x.dataset.name));
  } catch (e) { $('#list').textContent = e.message; }
}
function rateModal(id, name) {
  let val = 0;
  openModal(`<h3>Rate ${esc(name)}</h3><p class="sub">Your rating updates their public score.</p><div class="rate">${[1, 2, 3, 4, 5].map(i => `<button data-v="${i}" aria-label="${i} stars">★</button>`).join('')}</div><label for="rv">Review (optional)</label><textarea id="rv" rows="3" maxlength="300"></textarea><div class="err" id="err"></div><div class="row"><span></span><button class="btn" id="sub">Submit rating</button></div>`);
  document.querySelectorAll('.rate button').forEach(x => x.onclick = () => { val = +x.dataset.v; document.querySelectorAll('.rate button').forEach(y => y.classList.toggle('on', +y.dataset.v <= val)); });
  $('#sub').onclick = async () => { try { await api(`/bookings/${id}/rate`, { method: 'POST', body: { rating: val, review: $('#rv').value } }); closeModal(); toast('Thanks for rating!'); S.staff = await api('/staff'); renderBookings(); } catch (e) { $('#err').textContent = e.message; } };
}

(async () => { renderAuth(); [S.packages, S.staff] = await Promise.all([api('/packages'), api('/staff')]); renderHome(); })();
