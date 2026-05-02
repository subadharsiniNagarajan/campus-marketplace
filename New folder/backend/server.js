const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dns = require('dns');

// Force Google/Cloudflare DNS to bypass system DNS issues
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const app = express();
const PORT = 3000;
const MONGO_URI = 'mongodb+srv://campusmart:suba%401401@cluster0.k8zcvfn.mongodb.net/campusmart?retryWrites=true&w=majority&appName=Cluster0';

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Ensure uploads folder exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});

// ===== MONGOOSE SCHEMAS =====
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }
}, { timestamps: true });

const itemSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  category:    { type: String, required: true, enum: ['Books', 'Calculator', 'Notes', 'Lab Materials'] },
  subject:     { type: String, required: true },
  price:       { type: Number, required: true, min: 1 },
  condition:   { type: String, required: true, enum: ['New', 'Good', 'Used'] },
  description: { type: String, default: '' },
  contact:     { type: String, required: true },
  image:       { type: String, default: null },
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Item = mongoose.model('Item', itemSchema);

// ===== ALLOWED DOMAINS =====
const ALLOWED_DOMAINS = ['ritchennai.edu.in', 'college.edu', 'university.edu', 'edu.in', 'ac.in', 'ac.uk'];

function isCollegeEmail(email) {
  const domain = (email || '').split('@')[1];
  if (!domain) return false;
  return ALLOWED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
}

// ===== ROUTES =====

// POST /signup
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields are required.' });

    if (!isCollegeEmail(email))
      return res.status(400).json({ error: 'Only college email addresses are allowed (e.g. @ritchennai.edu.in).' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ error: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });

    res.json({ success: true, message: 'Account created successfully.', userId: user._id, name: user.name });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

// POST /login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: 'Invalid email or password.' });

    res.json({ success: true, message: 'Login successful.', userId: user._id, name: user.name });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// POST /addItem
app.post('/addItem', upload.single('image'), async (req, res) => {
  try {
    const { name, category, subject, price, condition, description, contact, user_id } = req.body;

    if (!name || !category || !subject || !price || !condition || !contact)
      return res.status(400).json({ error: 'Required fields are missing.' });

    if (isNaN(price) || Number(price) <= 0)
      return res.status(400).json({ error: 'Price must be a positive number.' });

    const image = req.file ? req.file.filename : null;

    const item = await Item.create({
      name, category, subject,
      price: Number(price),
      condition,
      description: description || '',
      contact,
      image,
      user_id: user_id && mongoose.Types.ObjectId.isValid(user_id) ? new mongoose.Types.ObjectId(user_id) : null
    });

    res.json({ success: true, message: 'Item listed successfully.', itemId: item._id });
  } catch (err) {
    console.error('AddItem error:', err);
    res.status(500).json({ error: 'Server error while listing item.' });
  }
});

// GET /items
app.get('/items', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category && category !== 'all') filter.category = category;

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { subject: regex }, { description: regex }];
    }

    const items = await Item.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (err) {
    console.error('Get items error:', err);
    res.status(500).json({ error: 'Server error while fetching items.' });
  }
});

// ===== CONNECT & START =====
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`✅ CampusMart server running at http://localhost:${PORT}`);
      console.log(`   Open http://localhost:${PORT} in your browser\n`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
