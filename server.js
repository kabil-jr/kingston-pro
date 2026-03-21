const express = require('express');
const multer  = require('multer');
const session = require('express-session');
const bcrypt  = require('bcryptjs');
const path    = require('path');
const fs      = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Paths ──────────────────────────────────────────────────────────────────
const DATA_FILE    = path.join(__dirname, 'data', 'assignments.json');
const UPLOADS_DIR  = path.join(__dirname, 'uploads');
const PUBLIC_DIR   = path.join(__dirname, 'public');

// Ensure directories exist
[path.join(__dirname, 'data'), UPLOADS_DIR, PUBLIC_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ─── Admin credentials (hashed at startup) ──────────────────────────────────
// Default: admin / kec123  — change ADMIN_PASS env var to override
const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS_RAW = process.env.ADMIN_PASS || 'kec123';
const ADMIN_HASH     = bcrypt.hashSync(ADMIN_PASS_RAW, 10);

// ─── Data helpers ────────────────────────────────────────────────────────────
function loadAssignments() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}
function saveAssignments(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

// ─── Multer (PDF uploads) ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_DIR),
  filename:    (_, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'kec-portal-secret-2024',
  resave: true,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000   // 8 hours
  }
}));

// Serve uploaded PDFs (protected — only if file exists)
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve the frontend
app.use(express.static(PUBLIC_DIR));

// ─── Auth guard ───────────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Unauthorised. Please log in.' });
}

// ═════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required.' });

  if (username !== ADMIN_USERNAME || !bcrypt.compareSync(password, ADMIN_HASH))
    return res.status(401).json({ error: 'Incorrect username or password.' });

  // Regenerate session to prevent fixation, then save
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Session error.' });
    req.session.isAdmin = true;
    req.session.username = username;
    req.session.save((err2) => {
      if (err2) return res.status(500).json({ error: 'Session save error.' });
      res.json({ success: true, username });
    });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/me', (req, res) => {
  if (req.session && req.session.isAdmin)
    return res.json({ loggedIn: true, username: req.session.username });
  res.json({ loggedIn: false });
});

// ── Assignments (public read) ─────────────────────────────────────────────────
app.get('/api/assignments', (req, res) => {
  const list = loadAssignments();
  // Strip server-only fields from public response
  const safe = list.map(({ storedFilename, ...rest }) => rest);
  res.json(safe);
});

// ── Assignments (admin write) ─────────────────────────────────────────────────
app.post('/api/assignments', requireAdmin, upload.single('pdf'), (req, res) => {
  const { title, course, desc, due } = req.body;
  if (!title || !course || !due)
    return res.status(400).json({ error: 'title, course, and due are required.' });

  const list = loadAssignments();
  const id   = Date.now();

  const assignment = {
    id,
    title: title.trim(),
    course: course.trim(),
    desc: (desc || '').trim(),
    due,
    createdAt: new Date().toISOString(),
    pdfName: null,
    pdfSize: null,
    pdfUrl: null,
    storedFilename: null
  };

  if (req.file) {
    assignment.pdfName        = req.file.originalname;
    assignment.pdfSize        = formatBytes(req.file.size);
    assignment.pdfUrl         = `/uploads/${req.file.filename}`;
    assignment.storedFilename = req.file.filename;
  }

  list.unshift(assignment);
  saveAssignments(list);

  const { storedFilename, ...safe } = assignment;
  res.status(201).json(safe);
});

app.delete('/api/assignments/:id', requireAdmin, (req, res) => {
  const idNum = parseInt(req.params.id, 10);
  const idStr = req.params.id;
  let   list  = loadAssignments();
  // Match by number OR string to handle any JSON type mismatch
  const asgn  = list.find(a => a.id === idNum || String(a.id) === idStr);
  if (!asgn) return res.status(404).json({ error: 'Assignment not found.' });

  // Delete the uploaded PDF file if present
  if (asgn.storedFilename) {
    try {
      const filePath = path.join(UPLOADS_DIR, asgn.storedFilename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Could not delete file:', e.message);
    }
  }

  list = list.filter(a => a.id !== idNum && String(a.id) !== idStr);
  saveAssignments(list);
  res.json({ success: true });
});

// ─── 404 → serve index.html (SPA fallback) ───────────────────────────────────
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(400).json({ error: 'File too large — max 20 MB.' });
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🟢  KEC Assign Portal running at http://localhost:${PORT}`);
  console.log(`    Admin login → username: ${ADMIN_USERNAME}  password: ${ADMIN_PASS_RAW}`);
  console.log('    Press Ctrl+C to stop.\n');
});

// ─── Util ─────────────────────────────────────────────────────────────────────
function formatBytes(b) {
  if (b < 1024)           return b + ' B';
  if (b < 1024 * 1024)   return (b / 1024).toFixed(1) + ' KB';
  return (b / (1024 * 1024)).toFixed(1) + ' MB';
}
