const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const express = require('express');
const multer = require('multer');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');

// ─── Initialize Firebase ──────────────────────────────────────────────────────
admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();

const app = express();

// ─── Constants ───────────────────────────────────────────────────────────────
const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS     = process.env.ADMIN_PASS || 'kec123';
const ADMIN_HASH     = bcrypt.hashSync(ADMIN_PASS, 10);

// ─── Global Middleware ───────────────────────────────────────────────────────
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Session Logic (Cookie name MUST be __session for Firebase Hosting)
app.use(session({
  name: '__session', 
  secret: process.env.SESSION_SECRET || 'kec-portal-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true, 
    sameSite: 'none',
    maxAge: 8 * 60 * 60 * 1000
  }
}));

// 2. Prefix Stripper
// Rewrites /api/xxx internally to /xxx to match Express routes
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace('/api', '');
  }
  next();
});

// ─── Auth Guard ──────────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Unauthorised. Admin session required.' });
}

// ─── Multer Setup ────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

// ═════════════════════════════════════════════════════════════════════════════
// ─── ROUTES ──────────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && bcrypt.compareSync(password, ADMIN_HASH)) {
    req.session.isAdmin = true;
    return res.json({ success: true, username });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/assignments', async (req, res) => {
  try {
    const snap = await db.collection('assignments').orderBy('createdAt', 'desc').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/assignments', requireAdmin, upload.single('pdf'), async (req, res) => {
  try {
    const { title, course, due, desc } = req.body;
    if (!title || !course || !due) return res.status(400).json({ error: 'Missing fields' });

    const assignment = {
      title, course, due, desc: desc || '',
      createdAt: new Date().toISOString(),
      pdfUrl: null, pdfName: null, storagePath: null
    };

    if (req.file) {
      const filename = `uploads/${Date.now()}-${req.file.originalname}`;
      const file = bucket.file(filename);
      await file.save(req.file.buffer, { 
        metadata: { contentType: 'application/pdf' },
        public: true 
      });
      assignment.pdfUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      assignment.pdfName = req.file.originalname;
      assignment.pdfSize = formatBytes(req.file.size);
      assignment.storagePath = filename;
    }

    const doc = await db.collection('assignments').add(assignment);
    res.status(201).json({ id: doc.id, ...assignment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save assignment' });
  }
});

app.delete('/assignments/:id', requireAdmin, async (req, res) => {
  try {
    const docRef = db.collection('assignments').doc(req.params.id);
    const doc = await docRef.get();
    if (doc.exists && doc.data().storagePath) {
      await bucket.file(doc.data().storagePath).delete().catch(() => {});
    }
    await docRef.delete();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ─── Export Function ─────────────────────────────────────────────────────────
exports.api = onRequest({ region: 'us-central1' }, app);
