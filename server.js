const express = require('express'), cors = require('cors'), crypto = require('crypto'), fs = require('fs'), path = require('path');
// Load local development secrets without requiring an extra dependency. Environment
// variables supplied by the host always take precedence over .env values.
const loadEnv = () => {
  const envFile = path.join(__dirname, '.env');
  if (!fs.existsSync(envFile)) return;
  for (const rawLine of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) continue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[key] = value;
  }
};
loadEnv();
const app = express(), DB_FILE = path.join(__dirname, 'data', 'db.json'), PORT = process.env.PORT || 3000;
app.use(cors()); app.use(express.json()); app.use(express.static(path.join(__dirname, 'public')));

const SLOTS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
const addedPackages = [
  { id: 7, name: 'Bathroom Deep Clean', category: 'Cleaning', price: 1299, hours: 2, icon: 'drop', photo: 'package-bathroom-deep.jpg', desc: 'Remove grime, soap scum and buildup for a sparkling bathroom.', includes: ['Tile and grout scrubbing', 'Toilet and sink sanitization', 'Tap and shower descaling', 'Mirror and fixture polish'] },
  { id: 8, name: 'Balcony & Window Clean', category: 'Cleaning', price: 899, hours: 2, icon: 'home', photo: 'package-balcony-window.jpg', desc: 'Clear dust and streaks for brighter rooms and a fresher balcony.', includes: ['Interior window glass cleaning', 'Window frame and sill wipe-down', 'Balcony floor sweeping and mopping', 'Railings and ledge dusting'] }
];
const seed = () => ({
  users: [], sessions: {}, bookings: [], nextId: 1,
  packages: [
    { id: 1, name: 'Express Home Clean', category: 'Cleaning', price: 999, hours: 2, icon: 'sparkle', desc: 'Dusting, sweeping, mopping and a tidy-up of every room.', includes: ['Dusting & wiping', 'Floor mopping', 'Bed making', 'Trash removal'] },
    { id: 2, name: 'Deep Home Cleaning', category: 'Cleaning', price: 2499, hours: 5, icon: 'home', desc: 'Top-to-bottom scrub for a home that feels brand new.', includes: ['Full-room scrubbing', 'Window & grill cleaning', 'Cabinet exteriors', 'Fan & light fittings'] },
    { id: 3, name: 'Kitchen & Bathroom', category: 'Cleaning', price: 1299, hours: 3, icon: 'drop', desc: 'Degreasing, descaling and disinfecting where it matters most.', includes: ['Chimney & hob degrease', 'Tile & tap descaling', 'Toilet disinfection', 'Sink polish'] },
    { id: 4, name: 'Sofa & Carpet Shampoo', category: 'Upholstery', price: 1499, hours: 3, icon: 'sofa', desc: 'Deep shampoo and vacuum to lift stains and odour.', includes: ['Dry vacuuming', 'Foam shampoo', 'Stain treatment', 'Quick-dry finish'] },
    { id: 5, name: 'Move-in / Move-out Clean', category: 'Cleaning', price: 3499, hours: 6, icon: 'box', desc: 'Get an empty flat handover-ready or ready to unpack.', includes: ['Deep clean of all rooms', 'Inside cupboards', 'Appliance exteriors', 'Balcony wash'] },
    { id: 6, name: 'AC Service & Cleaning', category: 'Appliance', price: 699, hours: 1, icon: 'wind', desc: 'Jet-wash of indoor unit, filters and a cooling check.', includes: ['Filter jet wash', 'Coil cleaning', 'Gas pressure check', 'Drain flush'] },
    ...addedPackages
  ],
  staff: [
    { id: 1, name: 'Sunita Patil', skills: 'Deep cleaning', years: 8, bio: 'Detail-obsessed; known for spotless kitchens.', baseRating: 4.9, baseCount: 212 },
    { id: 2, name: 'Rahul Deshmukh', skills: 'Sofa & carpet', years: 5, bio: 'Upholstery specialist with eco-safe shampoos.', baseRating: 4.7, baseCount: 148 },
    { id: 3, name: 'Meera Kulkarni', skills: 'Kitchen & bath', years: 6, bio: 'Fast, careful and always on time.', baseRating: 4.8, baseCount: 176 },
    { id: 4, name: 'Imran Shaikh', skills: 'AC service', years: 7, bio: 'Certified technician for split and window ACs.', baseRating: 4.6, baseCount: 133 },
    { id: 5, name: 'Pooja Jadhav', skills: 'Express clean', years: 3, bio: 'Quick turnarounds without cutting corners.', baseRating: 4.5, baseCount: 94 },
    { id: 6, name: 'Vikas More', skills: 'Move-in / out', years: 9, bio: 'Leads our largest handover cleans.', baseRating: 4.8, baseCount: 121 }
  ]
});
const ensureDataDir = () => { fs.mkdirSync(path.dirname(DB_FILE), { recursive: true }); if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(seed(), null, 2)); };
ensureDataDir();
let db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
delete db.pendingRegistrations;
const save = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
if (!Array.isArray(db.packages)) db.packages = [];
addedPackages.forEach(packageToAdd => {
  const existing = db.packages.find(entry => String(entry.name || '').trim().toLowerCase() === packageToAdd.name.toLowerCase());
  if (existing) {
    existing.photo = packageToAdd.photo;
    return;
  }
  const nextPackageId = db.packages.reduce((maxId, existing) => Math.max(maxId, Number(existing.id) || 0), 0) + 1;
  db.packages.push({ ...packageToAdd, id: nextPackageId });
});
save();

const hash = (pw, salt = crypto.randomBytes(16).toString('hex')) => salt + ':' + crypto.scryptSync(pw, salt, 32).toString('hex');
const verify = (pw, stored) => { const [salt] = stored.split(':'); return hash(pw, salt) === stored; };
const pub = u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone });
const createSession = user => { const token = crypto.randomBytes(24).toString('hex'); db.sessions[token] = user.id; return token; };
const auth = (req, res, next) => {
  const uid = db.sessions[(req.headers.authorization || '').replace('Bearer ', '')];
  const user = db.users.find(u => u.id === uid);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });
  req.user = user; next();
};
const staffView = s => {
  const rated = db.bookings.filter(b => b.staffId === s.id && b.rating);
  const baseCount = Number(s.baseCount) || 0;
  const sum = rated.reduce((a, b) => a + b.rating, 0), n = baseCount + rated.length;
  const rating = n ? +((s.baseRating * baseCount + sum) / n).toFixed(2) : null;
  return { ...s, rating, reviews: n };
};
const busy = (date, slot) => db.bookings.filter(b => b.date === date && b.slot === slot && b.status !== 'cancelled').map(b => b.staffId);
const today = () => new Date().toISOString().slice(0, 10);

// ---- Auth ----
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone } = req.body || {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanPassword = typeof password === 'string' ? password : '';
  if (!cleanName || !cleanEmail || cleanPassword.length < 6) return res.status(400).json({ error: 'Name, email and a password of 6+ characters are required.' });
  const cleanPhone = String(phone || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (cleanPhone && !/^\+[1-9]\d{7,14}$/.test(cleanPhone)) return res.status(400).json({ error: 'Enter a valid mobile number with country code, for example +919876543210.' });
  if (db.users.some(user => user.email === cleanEmail)) return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
  const user = { id: db.nextId++, name: cleanName, email: cleanEmail, phone: cleanPhone, password: hash(cleanPassword) };
  db.users.push(user);
  const token = createSession(user);
  save();
  res.status(201).json({ token, user: pub(user) });
});
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.users.find(u => u.email === (email || '').toLowerCase());
  if (!user || !verify(password || '', user.password)) return res.status(401).json({ error: 'Email or password is incorrect.' });
  const token = createSession(user); save();
  res.json({ token, user: pub(user) });
});
app.get('/api/auth/me', auth, (req, res) => res.json({ user: pub(req.user) }));

// ---- Catalogue ----
app.get('/api/packages', (req, res) => res.json(db.packages));
app.get('/api/staff', (req, res) => res.json(db.staff.map(staffView).sort((a, b) => b.rating - a.rating)));
app.post('/api/workers/register', (req, res) => {
  const { name, experience, mobile, address, skills } = req.body || {};
  const cleanName = String(name || '').trim();
  const cleanMobile = String(mobile || '').trim();
  const cleanAddress = String(address || '').trim();
  const cleanSkills = String(skills || '').trim();
  const years = Number(experience);

  if (!cleanName) return res.status(400).json({ error: 'Worker name is required.' });
  if (experience === undefined || experience === null || String(experience).trim() === '') return res.status(400).json({ error: 'Worker experience is required.' });
  if (!Number.isFinite(years) || years < 0) return res.status(400).json({ error: 'Enter valid experience in years.' });
  if (!/^\+?[0-9()\-\s]{7,15}$/.test(cleanMobile)) return res.status(400).json({ error: 'Enter a valid mobile number.' });
  if (cleanAddress.length < 8) return res.status(400).json({ error: 'Enter the worker address with at least 8 characters.' });

  const phoneKey = value => {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  };
  if (db.staff.some(worker => phoneKey(worker.phone) === phoneKey(cleanMobile))) {
    return res.status(409).json({ error: 'A worker is already registered with this mobile number.' });
  }

  const worker = {
    id: db.staff.reduce((maxId, staffMember) => Math.max(maxId, staffMember.id || 0), 0) + 1,
    name: cleanName,
    skills: cleanSkills || (years >= 5 ? 'Experienced cleaner' : 'Home service worker'),
    years,
    bio: `${cleanSkills || 'Home service'} professional, ready to help care for your home.`,
    baseRating: 4.5,
    baseCount: 0,
    phone: cleanMobile,
    address: cleanAddress
  };

  db.staff.push(worker); save();
  res.status(201).json(worker);
});
app.get('/api/slots', (req, res) => {           // free cleaners per slot for a date
  const { date } = req.query;
  res.json(SLOTS.map(slot => ({ slot, free: db.staff.length - busy(date, slot).length })));
});
app.get('/api/availability', (req, res) => {    // which cleaners are free in a slot
  const { date, slot } = req.query, taken = busy(date, slot);
  res.json(db.staff.filter(s => !taken.includes(s.id)).map(staffView).sort((a, b) => b.rating - a.rating));
});

// ---- Bookings ----
const bookingView = b => ({ ...b, package: db.packages.find(p => p.id === b.packageId), staff: staffView(db.staff.find(s => s.id === b.staffId)) });
app.get('/api/bookings', auth, (req, res) => res.json(db.bookings.filter(b => b.userId === req.user.id).map(bookingView).reverse()));
app.post('/api/bookings', auth, (req, res) => {
  const { packageId, date, slot, address, notes, staffId } = req.body || {};
  const pkg = db.packages.find(p => p.id === +packageId);
  if (!pkg) return res.status(400).json({ error: 'Choose a service package.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || date < today()) return res.status(400).json({ error: 'Pick a date that is today or later.' });
  if (!SLOTS.includes(slot)) return res.status(400).json({ error: 'Pick a time slot.' });
  if (!address || address.trim().length < 8) return res.status(400).json({ error: 'Enter your full address (8+ characters).' });
  const taken = busy(date, slot);
  let free = db.staff.filter(s => !taken.includes(s.id)).map(staffView).sort((a, b) => b.rating - a.rating);
  if (!free.length) return res.status(409).json({ error: 'That slot just filled up. Please pick another time.' });
  const chosen = staffId ? free.find(s => s.id === +staffId) : free[0];
  if (!chosen) return res.status(409).json({ error: 'That cleaner is no longer free in this slot.' });
  const b = { id: db.nextId++, userId: req.user.id, packageId: pkg.id, staffId: chosen.id, date, slot, address: address.trim(), notes: (notes || '').trim(), price: pkg.price, status: 'confirmed', rating: null, review: '', createdAt: new Date().toISOString() };
  db.bookings.push(b); save(); res.status(201).json(bookingView(b));
});
const mine = (req, res) => { const b = db.bookings.find(x => x.id === +req.params.id && x.userId === req.user.id); if (!b) res.status(404).json({ error: 'Booking not found.' }); return b; };
app.patch('/api/bookings/:id/cancel', auth, (req, res) => {
  const b = mine(req, res); if (!b) return;
  if (b.status !== 'confirmed') return res.status(400).json({ error: 'Only upcoming bookings can be cancelled.' });
  b.status = 'cancelled'; save(); res.json(bookingView(b));
});
app.patch('/api/bookings/:id/complete', auth, (req, res) => { // demo helper so rating can be shown in a viva
  const b = mine(req, res); if (!b) return;
  if (b.status !== 'confirmed') return res.status(400).json({ error: 'Only confirmed bookings can be completed.' });
  b.status = 'completed'; save(); res.json(bookingView(b));
});
app.post('/api/bookings/:id/rate', auth, (req, res) => {
  const b = mine(req, res); if (!b) return;
  const rating = +req.body.rating;
  if (b.status !== 'completed') return res.status(400).json({ error: 'You can rate a cleaner after the service is completed.' });
  if (b.rating) return res.status(400).json({ error: 'You already rated this service.' });
  if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: 'Rating must be 1 to 5 stars.' });
  b.rating = Math.round(rating); b.review = (req.body.review || '').trim().slice(0, 300); save(); res.json(bookingView(b));
});

app.listen(PORT, () => console.log(`Nestora running → http://localhost:${PORT}`));
