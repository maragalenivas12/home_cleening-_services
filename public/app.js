const $ = s => document.querySelector(s), app = $('#app');
const S = { user: JSON.parse(localStorage.getItem('tn_user') || 'null'), token: localStorage.getItem('tn_token') || '', packages: [], staff: [], filter: 'All', view: 'home', quick: {} };
const SLOT_LABEL = t => { const h = +t.slice(0, 2); return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = n => '₹' + Number(n).toLocaleString('en-IN');
const COLORS = ['#0b8f9c', '#e0702f', '#6a5acd', '#2e9e5b', '#c2417c', '#3b6fd4'];
const av = (name, id) => `<div class="avatar" style="background:${COLORS[id % COLORS.length]}">${esc(name.split(' ').map(w => w[0]).join('').slice(0, 2))}</div>`;
const stars = r => `<span class="stars" aria-label="${r} out of 5">${'★'.repeat(Math.round(r))}<i>${'★'.repeat(5 - Math.round(r))}</i></span>`;
const ICONS = { sparkle: '<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>', home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>', drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>', sofa: '<path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3"/><path d="M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2z"/>', box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>', wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>' };
const icon = k => `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k] || ICONS.sparkle}</svg>`;

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
function authModal(mode, then) {
  const reg = mode === 'register';
  openModal(`<h3>${reg ? 'Create your account' : 'Welcome back'}</h3><p class="sub">${reg ? 'Book cleaners and track every visit in one place.' : 'Sign in to book and manage your visits.'}</p>
  <div class="tabs"><button class="${reg ? '' : 'on'}" data-m="login">Sign in</button><button class="${reg ? 'on' : ''}" data-m="register">Create account</button></div>
  ${reg ? '<label>Full name</label><input id="fn" autocomplete="name"><label>Phone</label><input id="ph" type="tel" autocomplete="tel">' : ''}
  <label>Email</label><input id="em" type="email" autocomplete="email"><label>Password</label><input id="pw" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="At least 6 characters">
  <div class="err" id="err"></div><div class="row"><span></span><button class="btn" id="go">${reg ? 'Create account' : 'Sign in'}</button></div>`);
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => authModal(b.dataset.m, then));
  $('#go').onclick = async () => {
    try {
      const body = { email: $('#em').value, password: $('#pw').value, ...(reg && { name: $('#fn').value, phone: $('#ph').value }) };
      const d = await api('/auth/' + mode, { method: 'POST', body });
      S.user = d.user; S.token = d.token; localStorage.setItem('tn_user', JSON.stringify(d.user)); localStorage.setItem('tn_token', d.token);
      closeModal(); renderAuth(); toast(`Signed in as ${d.user.name.split(' ')[0]}.`); then ? then() : S.view === 'bookings' && go('bookings');
    } catch (e) { $('#err').textContent = e.message; }
  };
}

function go(view) { S.view = view; window.scrollTo(0, 0); view === 'home' ? renderHome() : renderBookings(); }
document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); const same = S.view === 'home' && g.dataset.go === 'home'; go(g.dataset.go); if (g.hash) setTimeout(() => document.querySelector(g.hash)?.scrollIntoView({ behavior: 'smooth' }), 50); if (same) document.querySelector(g.hash || 'body')?.scrollIntoView({ behavior: 'smooth' }); } });

function renderHome() {
  const cats = ['All', ...new Set(S.packages.map(p => p.category))];
  const list = S.packages.filter(p => S.filter === 'All' || p.category === S.filter);
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  app.innerHTML = `
  <section class="hero"><div class="wrap hero-in"><div>
    <h1>A spotless home, booked before your tea cools.</h1>
    <p class="lead">Choose a package, pick a time slot that suits you, and a verified, rated cleaner arrives at your door.</p>
    <div class="trust"><span><b>6</b> verified cleaners</span><span><b>4.7★</b> average rating</span><span><b>Same-day</b> slots</span></div></div>
    <div class="quick"><h3>Book a visit</h3><label for="qp">Service</label>
      <select id="qp">${S.packages.map(p => `<option value="${p.id}">${esc(p.name)} — ${inr(p.price)}</option>`).join('')}</select>
      <label for="qd">Date</label><input id="qd" type="date" min="${new Date().toISOString().slice(0, 10)}" value="${tomorrow}">
      <button class="btn" id="qgo">Choose a time slot</button></div></div></section>
  <section id="services"><div class="wrap"><div class="sec-h"><div><h2>Cleaning packages</h2></div><div class="chips">${cats.map(c => `<button class="chip ${c === S.filter ? 'on' : ''}" data-f="${c}">${c}</button>`).join('')}</div></div>
    <div class="grid">${list.map(p => `<article class="pkg"><div class="ico">${icon(p.icon)}</div><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>
      <ul>${p.includes.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <div class="foot2"><div class="price">${inr(p.price)} <small>· ~${p.hours}h</small></div><button class="btn sm" data-book="${p.id}">Book now</button></div></article>`).join('')}</div></div></section>
  <section><div class="wrap"><div class="how"><h2 style="margin-bottom:28px">How it works</h2><div class="steps">
    <div><div class="n">1</div><h3>Pick a package</h3><p>Compare what each clean includes and what it costs.</p></div>
    <div><div class="n">2</div><h3>Choose date and slot</h3><p>See live availability and select your cleaner.</p></div>
    <div><div class="n">3</div><h3>Rate the visit</h3><p>After the service, rate your cleaner so others can choose well.</p></div></div></div></div></section>
  <section id="cleaners"><div class="wrap"><div class="sec-h"><h2>Meet the cleaners</h2><p>Ratings come from real completed bookings.</p></div>
    <div class="grid">${S.staff.map(s => `<article class="staff">${av(s.name, s.id)}<div><h3>${esc(s.name)}</h3>${stars(s.rating)} <small>${s.rating} (${s.reviews})</small><br><small>${esc(s.skills)} · ${s.years} yrs</small><p style="font-size:.93rem;color:var(--mute);margin-top:6px">${esc(s.bio)}</p></div></article>`).join('')}</div></div></section>`;
  document.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { S.filter = b.dataset.f; renderHome(); setTimeout(() => $('#services').scrollIntoView(), 0); });
  document.querySelectorAll('[data-book]').forEach(b => b.onclick = () => startBooking(+b.dataset.book));
  $('#qgo').onclick = () => startBooking(+$('#qp').value, $('#qd').value);
}

function startBooking(pid, date) {
  const open = () => bookingFlow({ pkg: S.packages.find(p => p.id === pid), date: date || new Date(Date.now() + 864e5).toISOString().slice(0, 10), slot: '', staffId: '', address: '', notes: '', step: 1 });
  S.user ? open() : authModal('login', open);
}
async function bookingFlow(b) {
  const bar = `<div class="stepper">${[1, 2, 3].map(i => `<span class="${i <= b.step ? 'on' : ''}"></span>`).join('')}</div>`;
  const head = `<h3>${esc(b.pkg.name)}</h3><p class="sub">${inr(b.pkg.price)} · about ${b.pkg.hours} hours</p>${bar}`;
  if (b.step === 1) {
    openModal(`${head}<label for="d">Date</label><input id="d" type="date" min="${new Date().toISOString().slice(0, 10)}" value="${b.date}"><label>Time slot</label><div class="slots" id="slots">Loading…</div><div class="err" id="err"></div><div class="row"><span></span><button class="btn" id="next" disabled>Continue</button></div>`);
    const load = async () => {
      b.date = $('#d').value; b.slot = ''; $('#next').disabled = true;
      const slots = await api('/slots?date=' + b.date);
      $('#slots').innerHTML = slots.map(s => `<button class="slot" data-s="${s.slot}" ${s.free ? '' : 'disabled'}>${SLOT_LABEL(s.slot)}<small>${s.free ? s.free + ' cleaners free' : 'Fully booked'}</small></button>`).join('');
      document.querySelectorAll('.slot').forEach(x => x.onclick = () => { document.querySelectorAll('.slot').forEach(y => y.classList.remove('on')); x.classList.add('on'); b.slot = x.dataset.s; $('#next').disabled = false; });
    };
    $('#d').onchange = load; load();
    $('#next').onclick = () => { b.step = 2; bookingFlow(b); };
  } else if (b.step === 2) {
    openModal(`${head}<p style="margin-bottom:10px;font-weight:600">Choose your cleaner</p><div id="free">Loading…</div><div class="row"><button class="btn ghost" id="back">Back</button><button class="btn" id="next">Continue</button></div>`);
    const free = await api(`/availability?date=${b.date}&slot=${b.slot}`);
    const opts = [{ id: '', name: 'Best available', skills: 'We assign the top-rated free cleaner', rating: null }, ...free];
    $('#free').innerHTML = opts.map(s => `<button class="pick ${String(s.id) === String(b.staffId) ? 'on' : ''}" data-id="${s.id}">${s.id ? av(s.name, s.id) : '<div class="avatar" style="background:var(--ink)">★</div>'}<div><b>${esc(s.name)}</b> ${s.rating ? stars(s.rating) + ' <small>' + s.rating + '</small>' : ''}<br><small>${esc(s.skills)}</small></div></button>`).join('');
    document.querySelectorAll('.pick').forEach(x => x.onclick = () => { b.staffId = x.dataset.id; document.querySelectorAll('.pick').forEach(y => y.classList.remove('on')); x.classList.add('on'); });
    $('#back').onclick = () => { b.step = 1; bookingFlow(b); }; $('#next').onclick = () => { b.step = 3; bookingFlow(b); };
  } else {
    openModal(`${head}<label for="a">Full address</label><textarea id="a" rows="2" placeholder="Flat, building, area, Pune">${esc(b.address)}</textarea><label for="n">Notes for the cleaner (optional)</label><input id="n" value="${esc(b.notes)}">
    <div class="sum" style="margin-top:18px"><div><span>Date</span><b>${new Date(b.date + 'T00:00').toDateString()}</b></div><div><span>Time</span><b>${SLOT_LABEL(b.slot)}</b></div><div><span>Total</span><b>${inr(b.pkg.price)}</b></div></div>
    <div class="err" id="err"></div><div class="row"><button class="btn ghost" id="back">Back</button><button class="btn" id="next">Confirm booking</button></div>`);
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
  if (!S.user) { app.innerHTML = `<div class="wrap" style="padding:70px 24px"><div class="empty"><h2>Sign in to see your bookings</h2><p>Your upcoming and past visits live here.</p><button class="btn" id="si">Sign in</button></div></div>`; $('#si').onclick = () => authModal('login'); return; }
  app.innerHTML = `<div class="wrap" style="padding:48px 24px"><h2 style="margin-bottom:24px">My bookings</h2><div id="list">Loading…</div></div>`;
  try {
    const list = await api('/bookings');
    $('#list').innerHTML = list.length ? list.map(b => `<div class="bk"><div><h3>${esc(b.package.name)}<span class="pill ${b.status}">${b.status}</span></h3>
      <p class="meta">${new Date(b.date + 'T00:00').toDateString()} at ${SLOT_LABEL(b.slot)} · ${inr(b.price)}</p><p class="meta">Cleaner: <b>${esc(b.staff.name)}</b> ${stars(b.staff.rating)} · ${esc(b.address)}</p>
      ${b.rating ? `<p style="margin-top:8px">You rated ${stars(b.rating)} ${esc(b.review)}</p>` : ''}</div>
      <div class="acts">${b.status === 'confirmed' ? `<button class="btn ghost sm" data-done="${b.id}" title="Demo shortcut: marks the visit as finished">Mark completed</button><button class="btn warn sm" data-cancel="${b.id}">Cancel</button>` : ''}${b.status === 'completed' && !b.rating ? `<button class="btn sm" data-rate="${b.id}" data-name="${esc(b.staff.name)}">Rate cleaner</button>` : ''}</div></div>`).join('')
      : `<div class="empty"><h3>No bookings yet</h3><p>Pick a package and a time slot to book your first clean.</p><button class="btn" data-go="home">Browse packages</button></div>`;
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
