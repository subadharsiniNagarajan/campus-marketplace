const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dns = require('dns');

// Force Google/Cloudflare DNS to bypass system DNS issues (only in development)
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
}

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://campusmart:suba%401401@cluster0.k8zcvfn.mongodb.net/campusmart?retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET = process.env.JWT_SECRET || 'campusmart_admin_jwt_secret_2024';

console.log('🚀 Starting CampusMart server...');
console.log('📍 Port:', PORT);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔗 Connecting to MongoDB...');

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'] }));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    const allowed = /jpeg|jpg|png|webp/;
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
  category:    { type: String, required: true, enum: ['Books', 'Notes', 'Lab Materials', 'Electronics', 'Project Materials', 'Combo Kits', 'Shared / Giveaway', 'Others'] },
  subject:     { type: String, required: true },
  price:       { type: Number, required: true, min: 1 },
  condition:   { type: String, required: true, enum: ['New', 'Good', 'Used'] },
  description:  { type: String, default: '' },
  contact:      { type: String, default: '' },
  image:        { type: String, default: null },
  images:       { type: [String], default: [] },
  deal_type:    { type: String, enum: ['sell', 'exchange'], default: 'sell' },
  exchange_for: { type: String, default: '' },
  sold:         { type: Boolean, default: false },
  buyer_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sellerEmail:      { type: String, default: '' },
  // Item availability status for chat system
  item_status:      { type: String, enum: ['Available', 'Pending Approval', 'Reserved', 'Completed'], default: 'Available' },
  reserved_for:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Moderation
  status:           { type: String, enum: ['Pending','Approved','Rejected','Needs Correction'], default: 'Pending' },
  rejection_reason: { type: String, default: '' },
  admin_comment:    { type: String, default: '' },
  approved_at:      { type: Date, default: null },
  reviewed_by:      { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Item = mongoose.model('Item', itemSchema);

// ===== RATING SCHEMA =====
const ratingSchema = new mongoose.Schema({
  itemId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  userEmail: { type: String, required: true, lowercase: true },
  stars:     { type: Number, required: true, min: 1, max: 5 }
}, { timestamps: true });

// One rating per user per item
ratingSchema.index({ itemId: 1, userEmail: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);

// ===== PURCHASE SCHEMA =====
const purchaseSchema = new mongoose.Schema({
  itemId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  itemName:      { type: String, required: true },
  buyerEmail:    { type: String, required: true, lowercase: true },
  buyerName:     { type: String, required: true },
  sellerEmail:   { type: String, required: true, lowercase: true },
  interaction:   { type: String, enum: ['meet_campus', 'chat_first'], default: 'chat_first' },
  pickupTime:    { type: String, enum: ['Morning', 'Afternoon', 'Evening'], default: 'Afternoon' },
  note:          { type: String, default: '', maxlength: 500 },
  // Seller response
  purchaseStatus: { type: String, enum: ['pending', 'accepted', 'rejected', 'reserved'], default: 'pending' },
  sellerNote:    { type: String, default: '' }
}, { timestamps: true });

purchaseSchema.index({ itemId: 1, buyerEmail: 1 });
const Purchase = mongoose.model('Purchase', purchaseSchema);

// A conversation is uniquely identified by itemId + the two participant emails (buyer + seller).
// Messages are only returned if the requester's email matches one of the two participants.
const messageSchema = new mongoose.Schema({
  itemId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  senderEmail:   { type: String, required: true, lowercase: true },
  receiverEmail: { type: String, required: true, lowercase: true },
  senderName:    { type: String, required: true },
  text:          { type: String, default: '', maxlength: 1000 },
  imageUrl:      { type: String, default: '' }
}, { timestamps: true });

// Index for fast private-thread lookup
messageSchema.index({ itemId: 1, senderEmail: 1, receiverEmail: 1 });

const Message = mongoose.model('Message', messageSchema);

// ===== ADMIN SCHEMA =====
const adminSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

// ===== ADMIN MIDDLEWARE — JWT =====
function adminAuth(req, res, next) {
  const auth = req.headers['authorization'] || req.headers['x-admin-token'];
  if (!auth) return res.status(401).json({ error: 'Admin token required.' });
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId    = decoded.id;
    req.adminEmail = decoded.email;
    next();
  } catch {
    // Fallback: try legacy base64 token for backwards compat
    try {
      const legacy = Buffer.from(token, 'base64').toString('utf8');
      const [id, email] = legacy.split(':');
      if (!id || !email) throw new Error();
      req.adminId = id; req.adminEmail = email;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired admin token.' });
    }
  }
}
const ALLOWED_DOMAINS = ['ritchennai.edu.in', 'college.edu', 'university.edu', 'edu.in', 'ac.in', 'ac.uk'];

function isCollegeEmail(email) {
  const domain = (email || '').split('@')[1];
  if (!domain) return false;
  return ALLOWED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
}

// ===== ROUTES =====

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CampusMart server is running' });
});

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

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      message: 'Account created successfully.', 
      userId: user._id, 
      name: user.name,
      token: token
    });
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

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      message: 'Login successful.', 
      userId: user._id, 
      name: user.name,
      token: token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// POST /addItem
app.post('/addItem', upload.array('images', 7), async (req, res) => {
  try {
    const { name, category, subject, price, condition, description, user_id, seller_email, deal_type, exchange_for } = req.body;

    if (!name || !category || !subject || !condition)
      return res.status(400).json({ error: 'Required fields are missing.' });

    const dealType = deal_type === 'exchange' ? 'exchange' : 'sell';

    if (dealType === 'sell') {
      if (!price || isNaN(price) || Number(price) < 0)
        return res.status(400).json({ error: 'Price must be a non-negative number for sell listings.' });
    }

    // Support up to 7 uploaded images � validate each
    const imageFiles = req.files || [];
    if (imageFiles.length > 7)
      return res.status(400).json({ error: 'Maximum 7 images allowed per item.' });
    for (const f of imageFiles) {
      if (f.size > 5 * 1024 * 1024)
        return res.status(400).json({ error: 'Each image must be less than 5 MB.' });
    }
    const images = imageFiles.map(f => f.filename);
    const image  = images[0] || null; // keep legacy single-image field

    const item = await Item.create({
      name, category, subject,
      price:        dealType === 'sell' ? Number(price) : 0,
      condition,
      description:  description || '',
      deal_type:    dealType,
      exchange_for: dealType === 'exchange' ? (exchange_for || '') : '',
      image,
      images,
      sellerEmail:  seller_email ? seller_email.toLowerCase() : '',
      user_id:      user_id && mongoose.Types.ObjectId.isValid(user_id) ? new mongoose.Types.ObjectId(user_id) : null
    });

    res.json({ success: true, message: 'Item listed successfully.', itemId: item._id });
  } catch (err) {
    console.error('AddItem error:', err);
    res.status(500).json({ error: 'Server error while listing item.' });
  }
});

// GET /items � supports: search, category, minPrice, maxPrice, department, deal_type
// GET /items/:id -- single item fetch (public — blocks sold/reserved items)
app.get('/items/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: 'Invalid item ID.' });

    const item = await Item.findById(id).lean();
    if (!item)
      return res.status(404).json({ error: 'Item not found.' });

    // Block public access to sold or reserved items unconditionally
    if (item.item_status === 'Sold' || item.item_status === 'Reserved' || item.sold) {
      return res.status(410).json({ error: 'This item is no longer available.', gone: true });
    }

    res.json({ success: true, item });
  } catch (err) {
    console.error('Get item error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.get('/items', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, department, deal_type } = req.query;

    // Only show Approved + Available + not sold items
    // sold: false catches legacy items that were marked sold before item_status field existed
    const filter = {
      status: 'Approved',
      item_status: 'Available',
      sold: false
    };

    if (category && category !== 'all') filter.category = category;
    if (deal_type && deal_type !== 'all') filter.deal_type = deal_type;

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { description: regex }, { subject: regex }];
    }

    if (department) {
      const deptRegex = new RegExp(department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.subject = deptRegex;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const items = await Item.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, items });
  } catch (err) {
    console.error('Get items error:', err);
    res.status(500).json({ error: 'Server error while fetching items.' });
  }
});

// PUT /items/:id/sold — seller marks their own item as sold
// Deletes all messages for this item and notifies both parties via socket
app.put('/items/:id/sold', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: 'Invalid item ID.' });

    const item = await Item.findById(id);
    if (!item)
      return res.status(404).json({ error: 'Item not found.' });

    if (item.sold)
      return res.status(409).json({ error: 'Item is already marked as sold.' });

    // Only the seller can mark it sold
    if (!user_id || !item.user_id || item.user_id.toString() !== user_id.toString())
      return res.status(403).json({ error: 'Only the seller can mark this item as sold.' });

    item.sold = true;
    item.item_status = 'Sold';
    await item.save();

    // Emit conversation_completed so both buyer and seller chat disappears in real time
    try {
      const itemIdStr    = id.toString();
      const sellerEmail  = (item.sellerEmail || '').toLowerCase();
      const allEmails    = await Message.find({ itemId: id }).distinct('senderEmail');
      const participants = [...new Set([...allEmails, sellerEmail])];
      for (let i = 0; i < participants.length; i++) {
        for (let j = i + 1; j < participants.length; j++) {
          const room = getRoomId(itemIdStr, participants[i], participants[j]);
          global.io && global.io.to(room).emit('conversation_completed', { itemId: itemIdStr });
        }
      }
    } catch (emitErr) {
      console.error('[sold] socket emit error:', emitErr.message);
    }

    // Delete all messages for this item — no listing = no chat
    await Message.deleteMany({ itemId: id });
    console.log('[sold] messages deleted for item:', id);

    res.json({ success: true, message: 'Item marked as sold. Conversation removed.' });
  } catch (err) {
    console.error('Mark sold error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /items/:id/status — seller updates item status (Available, Reserved, Sold)
app.put('/items/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, item_status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: 'Invalid item ID.' });

    if (!['Available', 'Reserved', 'Sold'].includes(item_status))
      return res.status(400).json({ error: 'Invalid status. Must be Available, Reserved, or Sold.' });

    const item = await Item.findById(id);
    if (!item)
      return res.status(404).json({ error: 'Item not found.' });

    // Only the seller can update status
    if (!user_id || !item.user_id || item.user_id.toString() !== user_id.toString())
      return res.status(403).json({ error: 'Only the seller can update item status.' });

    item.item_status = item_status;
    if (item_status === 'Sold') {
      item.sold = true;
    } else {
      item.sold = false;
    }
    await item.save();

    res.json({ success: true, message: `Item status updated to ${item_status}.`, item });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});


// GET /my-items?user_id= -- student fetches their own listings with status
app.get('/my-items', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id || !mongoose.Types.ObjectId.isValid(user_id))
      return res.status(400).json({ error: 'Valid user_id is required.' });
    const items = await Item.find({ user_id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, items });
  } catch (err) {
    console.error('My items error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /items/:id/resubmit -- student edits and resubmits a Rejected/Needs Correction item
app.put('/items/:id/resubmit', upload.array('images', 7), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: 'Invalid item ID.' });
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    if (!['Rejected', 'Needs Correction'].includes(item.status))
      return res.status(400).json({ error: 'Only Rejected or Needs Correction items can be resubmitted.' });

    const { name, category, subject, price, condition, description, deal_type, exchange_for } = req.body;
    const dealType = deal_type === 'exchange' ? 'exchange' : 'sell';
    if (name)        item.name        = name;
    if (category)    item.category    = category;
    if (subject)     item.subject     = subject;
    if (condition)   item.condition   = condition;
    if (description !== undefined) item.description = description;
    item.deal_type = dealType;
    if (dealType === 'exchange' && exchange_for) item.exchange_for = exchange_for;
    if (dealType === 'sell' && price) item.price = Number(price);

    const imageFiles = req.files || [];
    if (imageFiles.length > 0) {
      item.images = imageFiles.map(f => f.filename);
      item.image  = item.images[0];
    }
    item.status           = 'Pending';
    item.rejection_reason = '';
    item.admin_comment    = '';
    item.approved_at      = null;
    item.reviewed_by      = null;
    await item.save();
    res.json({ success: true, message: 'Item resubmitted for review.' });
  } catch (err) {
    console.error('Resubmit error:', err);
    res.status(500).json({ error: 'Server error during resubmit.' });
  }
});

// GET /admin/pending-items -- items awaiting review
app.get('/admin/pending-items', adminAuth, async (req, res) => {
  try {
    const items = await Item.find({ status: { $in: ['Pending', 'Needs Correction'] } })
      .sort({ createdAt: -1 }).lean();
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /admin/items/:id/approve
app.put('/admin/items/:id/approve', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID.' });
    const item = await Item.findByIdAndUpdate(id, {
      status: 'Approved', approved_at: new Date(), reviewed_by: req.adminId,
      rejection_reason: '', admin_comment: ''
    }, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    res.json({ success: true, message: 'Item approved.', item });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /admin/items/:id/reject
app.put('/admin/items/:id/reject', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason, admin_comment } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID.' });
    if (!rejection_reason) return res.status(400).json({ error: 'Rejection reason is required.' });
    const item = await Item.findByIdAndUpdate(id, {
      status: 'Rejected', rejection_reason, admin_comment: admin_comment || '',
      reviewed_by: req.adminId, approved_at: null
    }, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    res.json({ success: true, message: 'Item rejected.', item });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /admin/items/:id/needs-correction
app.put('/admin/items/:id/needs-correction', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason, admin_comment } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID.' });
    if (!rejection_reason) return res.status(400).json({ error: 'Reason is required.' });
    const item = await Item.findByIdAndUpdate(id, {
      status: 'Needs Correction', rejection_reason, admin_comment: admin_comment || '',
      reviewed_by: req.adminId, approved_at: null
    }, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    res.json({ success: true, message: 'Item marked as Needs Correction.', item });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});
// ===== RATING ROUTES =====

// POST /items/:id/rate — submit or update a rating
app.post('/items/:id/rate', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail, stars } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: 'Invalid item ID.' });

    if (!userEmail || !stars || stars < 1 || stars > 5)
      return res.status(400).json({ error: 'userEmail and stars (1-5) are required.' });

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    // Prevent seller rating their own item
    if (item.sellerEmail && item.sellerEmail === userEmail.toLowerCase())
      return res.status(403).json({ error: 'You cannot rate your own item.' });

    // Upsert: update if exists, create if not
    await Rating.findOneAndUpdate(
      { itemId: id, userEmail: userEmail.toLowerCase() },
      { stars: Number(stars) },
      { upsert: true, new: true }
    );

    // Recalculate average
    const agg = await Rating.aggregate([
      { $match: { itemId: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$itemId', avg: { $avg: '$stars' }, count: { $sum: 1 } } }
    ]);

    const avg   = agg.length ? Math.round(agg[0].avg * 10) / 10 : 0;
    const count = agg.length ? agg[0].count : 0;

    res.json({ success: true, avg, count });
  } catch (err) {
    console.error('Rate error:', err);
    res.status(500).json({ error: 'Server error while rating.' });
  }
});

// GET /items/:id/rating — get avg rating for one item
app.get('/items/:id/rating', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: 'Invalid item ID.' });

    const agg = await Rating.aggregate([
      { $match: { itemId: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$itemId', avg: { $avg: '$stars' }, count: { $sum: 1 } } }
    ]);

    const avg   = agg.length ? Math.round(agg[0].avg * 10) / 10 : 0;
    const count = agg.length ? agg[0].count : 0;
    res.json({ success: true, avg, count });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ===== CHAT ROUTES =====

// POST /chat/send — send a message
// Body: { itemId, senderEmail, receiverEmail, senderName, text }
app.post('/chat/send', async (req, res) => {
  try {
    const { itemId, senderEmail, receiverEmail, senderName, text } = req.body;

    if (!itemId || !senderEmail || !receiverEmail || !senderName || !text)
      return res.status(400).json({ error: 'All fields are required.' });

    if (senderEmail.toLowerCase() === receiverEmail.toLowerCase())
      return res.status(400).json({ error: 'You cannot message yourself.' });

    if (!mongoose.Types.ObjectId.isValid(itemId))
      return res.status(400).json({ error: 'Invalid item ID.' });

    // Verify sender exists
    const sender = await User.findOne({ email: senderEmail.toLowerCase() });
    if (!sender)
      return res.status(401).json({ error: 'Sender not found. Please log in.' });

    // Verify item exists
    const item = await Item.findById(itemId);
    if (!item)
      return res.status(404).json({ error: 'Item not found.' });

    const msg = await Message.create({
      itemId,
      senderEmail:   senderEmail.toLowerCase(),
      receiverEmail: receiverEmail.toLowerCase(),
      senderName,
      text: text.trim()
    });

    res.json({ success: true, message: msg });
  } catch (err) {
    console.error('Chat send error:', err);
    res.status(500).json({ error: 'Server error while sending message.' });
  }
});

// GET /chat/messages?itemId=&myEmail=&otherEmail=
// Only returns messages where the requester is sender OR receiver
app.get('/chat/messages', async (req, res) => {
  try {
    const { itemId, myEmail, otherEmail } = req.query;

    if (!itemId || !myEmail || !otherEmail)
      return res.status(400).json({ error: 'itemId, myEmail and otherEmail are required.' });

    if (!mongoose.Types.ObjectId.isValid(itemId))
      return res.status(400).json({ error: 'Invalid item ID.' });

    const me    = myEmail.toLowerCase();
    const other = otherEmail.toLowerCase();

    // Verify requester exists (auth check)
    const user = await User.findOne({ email: me });
    if (!user)
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });

    // Only fetch messages between these two users for this item
    const messages = await Message.find({
      itemId,
      $or: [
        { senderEmail: me,    receiverEmail: other },
        { senderEmail: other, receiverEmail: me    }
      ]
    }).sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (err) {
    console.error('Chat fetch error:', err);
    res.status(500).json({ error: 'Server error while fetching messages.' });
  }
});

// GET /chat/threads?myEmail= — list active conversations for a user.
// Conversations where the item is Completed are hidden from buyers and sellers.
// Only admins can see completed conversations (via /admin/completed-conversations).
app.get('/chat/threads', async (req, res) => {
  try {
    const { myEmail } = req.query;
    if (!myEmail) return res.status(400).json({ error: 'myEmail is required.' });

    const me = myEmail.toLowerCase();
    const user = await User.findOne({ email: me });
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    // Get all messages involving this user
    const msgs = await Message.find({
      $or: [{ senderEmail: me }, { receiverEmail: me }]
    }).sort({ createdAt: -1 });

    // Build unique threads: key = itemId + otherEmail
    const seen = new Map();
    for (const m of msgs) {
      const other = m.senderEmail === me ? m.receiverEmail : m.senderEmail;
      const key   = `${m.itemId}_${other}`;
      if (!seen.has(key)) {
        seen.set(key, {
          itemId:     m.itemId,
          otherEmail: other,
          lastMsg:    m.text,
          lastTime:   m.createdAt
        });
      }
    }

    // Enrich with item name, other user's name, buy/sell role, and item_status
    const threads = [];
    for (const t of seen.values()) {
      const [item, otherUser] = await Promise.all([
        Item.findById(t.itemId).select('name image sellerEmail item_status').lean(),
        User.findOne({ email: t.otherEmail }).select('name').lean()
      ]);

      // Hide sold/completed conversations from buyer and seller — no listing = no chat
      const itemStatus = item ? (item.item_status || 'Available') : 'Available';
      if (itemStatus === 'Completed' || itemStatus === 'Sold') continue;

      const itemName  = item ? item.name : 'Deleted item';
      const otherName = otherUser ? otherUser.name : t.otherEmail;

      const iAmSeller = item && item.sellerEmail && item.sellerEmail.toLowerCase() === me;
      const role      = iAmSeller ? 'Buying' : 'Selling';

      threads.push({ ...t, itemId: t.itemId.toString(), itemName, otherName, role, itemStatus });
    }

    res.json({ success: true, threads });
  } catch (err) {
    console.error('Threads error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ===== ADMIN ROUTES =====

// POST /admin/setup  AND  POST /api/admin/register
// Register a new admin. First admin is always allowed.
// Subsequent admins require a valid admin JWT (so only existing admins can add more).
async function handleAdminRegister(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const count = await Admin.countDocuments();
    // If admins already exist, require auth header
    if (count > 0) {
      const auth = req.headers['authorization'] || req.headers['x-admin-token'];
      if (!auth) return res.status(403).json({ error: 'An admin already exists. Provide admin token to add more.' });
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
      try { jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ error: 'Invalid admin token.' }); }
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered as admin.' });

    const hashed = await bcrypt.hash(password, 10);
    const admin  = await Admin.create({ name, email: email.toLowerCase(), password: hashed });

    res.status(201).json({ success: true, message: 'Admin account created successfully.', adminId: admin._id, name: admin.name });
  } catch (err) {
    console.error('Admin register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
}

app.post('/admin/setup',          handleAdminRegister);
app.post('/api/admin/register',   handleAdminRegister);

// POST /admin/login  AND  POST /api/admin/login
async function handleAdminLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

    // Sign JWT — expires in 24 hours
    const token = jwt.sign(
      { id: admin._id, email: admin.email, name: admin.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ success: true, token, name: admin.name, adminId: admin._id, message: 'Login successful.' });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
}

app.post('/admin/login',        handleAdminLogin);
app.post('/api/admin/login',    handleAdminLogin);

// GET /admin/admins � list all admin accounts (requires auth)
app.get('/admin/admins', adminAuth, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: 1 });
    res.json({ success: true, admins });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /admin/stats — dashboard numbers
app.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalItems, soldItems, totalMessages, pendingOrders, totalOrders] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Item.countDocuments({ item_status: 'Sold' }),
      Message.countDocuments(),
      Purchase.countDocuments({ purchaseStatus: 'pending' }),
      Purchase.countDocuments()
    ]);
    res.json({ success: true, totalUsers, totalItems, soldItems, totalMessages, pendingOrders, totalOrders });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /admin/users — all users
app.get('/admin/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /admin/users/:id — delete a user and their items
app.delete('/admin/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID.' });
    await Item.deleteMany({ user_id: id });
    await User.findByIdAndDelete(id);
    res.json({ success: true, message: 'User and their items deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /admin/items — all items
app.get('/admin/items', adminAuth, async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /admin/items/:id — delete an item
app.delete('/admin/items/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID.' });
    const item = await Item.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    // Delete image file if exists
    if (item.image) {
      const imgPath = path.join(__dirname, 'uploads', item.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    res.json({ success: true, message: 'Item deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /admin/messages — all messages (activity monitor)
app.get('/admin/messages', adminAuth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /admin/messages/:id — delete a message
app.delete('/admin/messages/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID.' });
    await Message.findByIdAndDelete(id);
    res.json({ success: true, message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ===== /api/messages — Socket.io compatible REST aliases =====

// POST /api/messages — send a message (REST, also emits via socket)
app.post('/api/messages', async (req, res) => {
  try {
    const { itemId, senderEmail, receiverEmail, senderName, text, imageUrl } = req.body;
    console.log('[POST /api/messages] send:', { senderEmail, receiverEmail, itemId });

    if (!itemId || !senderEmail || !receiverEmail || !senderName)
      return res.status(400).json({ error: 'itemId, senderEmail, receiverEmail and senderName are required.' });
    if (!text && !imageUrl)
      return res.status(400).json({ error: 'Message must have text or an image.' });
    if (senderEmail.toLowerCase() === receiverEmail.toLowerCase())
      return res.status(400).json({ error: 'Cannot message yourself.' });
    if (!mongoose.Types.ObjectId.isValid(itemId))
      return res.status(400).json({ error: 'Invalid item ID.' });

    const sender = await User.findOne({ email: senderEmail.toLowerCase() });
    if (!sender) return res.status(401).json({ error: 'Sender not found. Please log in.' });

    // Check item status - prevent new messages if Reserved or Sold
    const item = await Item.findById(itemId).select('item_status reserved_for sellerEmail').lean();
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    
    if (item.item_status === 'Reserved' || item.item_status === 'Sold') {
      // Allow messages only between seller and the reserved buyer
      const senderIsParticipant = 
        senderEmail.toLowerCase() === item.sellerEmail?.toLowerCase() ||
        (item.reserved_for && sender._id.toString() === item.reserved_for.toString());
      
      if (!senderIsParticipant) {
        return res.status(403).json({ error: 'This item has been reserved. The conversation is closed.' });
      }
    }

    const msg = await Message.create({
      itemId,
      senderEmail:   senderEmail.toLowerCase(),
      receiverEmail: receiverEmail.toLowerCase(),
      senderName,
      text:     text     ? text.trim() : '',
      imageUrl: imageUrl ? imageUrl    : ''
    });

    console.log('[POST /api/messages] saved to MongoDB:', msg._id);

    // Emit to the private room so both users get it instantly
    const room = getRoomId(itemId, senderEmail, receiverEmail);
    io.to(room).emit('new_message', msg);
    console.log('[Socket.io] emitted new_message to room:', room);

    res.json({ success: true, message: msg });
  } catch (err) {
    console.error('[POST /api/messages] error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/messages/:roomId — fetch history for a private thread
// roomId = sorted(senderEmail,receiverEmail) joined by '_' + itemId
app.get('/api/messages/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { myEmail, otherEmail } = req.query;
    console.log('[GET /api/messages] fetch:', { itemId, myEmail, otherEmail });

    if (!myEmail || !otherEmail)
      return res.status(400).json({ error: 'myEmail and otherEmail query params required.' });
    if (!mongoose.Types.ObjectId.isValid(itemId))
      return res.status(400).json({ error: 'Invalid item ID.' });

    const me    = myEmail.toLowerCase();
    const other = otherEmail.toLowerCase();

    const user = await User.findOne({ email: me });
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    // Fetch item to get status
    const item = await Item.findById(itemId).select('item_status name').lean();
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    const messages = await Message.find({
      itemId,
      $or: [
        { senderEmail: me,    receiverEmail: other },
        { senderEmail: other, receiverEmail: me    }
      ]
    }).sort({ createdAt: 1 });

    console.log('[GET /api/messages] returning', messages.length, 'messages');
    const st          = item.item_status || 'Available';
    const chatCompleted = (st === 'Sold' || st === 'Completed');
    res.json({ 
      success: true, 
      messages,
      itemStatus:    st,
      chatCompleted: chatCompleted,
      itemName:      item.name
    });
  } catch (err) {
    console.error('[GET /api/messages] error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});


// POST /api/chat/open
// Called by "Message Seller". Looks up seller from DB and returns chat context.
// Handles old items where sellerEmail is missing by falling back to user_id lookup.
app.post('/api/chat/open', async (req, res) => {
  try {
    const { itemId, buyerEmail } = req.body;
    if (!itemId || !buyerEmail)
      return res.status(400).json({ error: 'itemId and buyerEmail are required.' });
    if (!mongoose.Types.ObjectId.isValid(itemId))
      return res.status(400).json({ error: 'Invalid item ID.' });

    const buyer = await User.findOne({ email: buyerEmail.toLowerCase() });
    if (!buyer) return res.status(401).json({ error: 'Not logged in.' });

    const item = await Item.findById(itemId).lean();
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    // Resolve seller — try sellerEmail first, then look up via user_id
    let sellerEmail = (item.sellerEmail || '').toLowerCase().trim();
    let seller = null;

    if (!sellerEmail && item.user_id) {
      // Old item: sellerEmail not stored, look up by user_id
      seller = await User.findById(item.user_id).select('name email').lean();
      if (seller) sellerEmail = seller.email.toLowerCase();
    } else if (sellerEmail) {
      seller = await User.findOne({ email: sellerEmail }).select('name email').lean();
    }

    if (!sellerEmail)
      return res.status(400).json({ error: 'Could not find seller for this item.' });

    if (sellerEmail === buyerEmail.toLowerCase())
      return res.status(400).json({ error: 'This is your own listing.' });

    // Also backfill sellerEmail on the item so future lookups are fast
    if (!item.sellerEmail && sellerEmail) {
      await Item.findByIdAndUpdate(itemId, { sellerEmail: sellerEmail });
    }

    res.json({
      success:     true,
      itemId:      item._id.toString(),
      itemName:    item.name,
      itemImage:   item.image || '',
      sellerEmail: sellerEmail,
      sellerName:  seller ? seller.name : sellerEmail
    });
  } catch (err) {
    console.error('[/api/chat/open]', err);
    res.status(500).json({ error: 'Server error.' });
  }
});


// POST /api/chat/upload-image — upload an image for a chat message
app.post('/api/chat/upload-image', upload.single('image'), async (req, res) => {
  try {
    const { senderEmail } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });
    if (!senderEmail) return res.status(400).json({ error: 'senderEmail is required.' });

    const sender = await User.findOne({ email: senderEmail.toLowerCase() });
    if (!sender) return res.status(401).json({ error: 'Not logged in.' });

    const imageUrl = req.file.filename;
    console.log('[/api/chat/upload-image] uploaded:', imageUrl, 'by:', senderEmail);
    res.json({ success: true, imageUrl: imageUrl });
  } catch (err) {
    console.error('[/api/chat/upload-image]', err);
    res.status(500).json({ error: 'Server error during image upload.' });
  }
});

// GET /admin/orders — all purchase orders (admin view)
app.get('/admin/orders', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { purchaseStatus: status } : {};
    const orders = await Purchase.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /admin/orders/:id/cancel — admin force-cancels an order
app.put('/admin/orders/:id/cancel', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID.' });
    const purchase = await Purchase.findByIdAndUpdate(id, { purchaseStatus: 'rejected', sellerNote: 'Cancelled by admin.' }, { new: true });
    if (!purchase) return res.status(404).json({ error: 'Order not found.' });
    // Restore item to Available if it was Reserved for this purchase
    await Item.findByIdAndUpdate(purchase.itemId, { item_status: 'Available', reserved_for: null });
    res.json({ success: true, message: 'Order cancelled.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ===== NOTIFICATION ROUTE =====

// GET /api/notifications?email= — unread counts for bell icon
app.get('/api/notifications', async (req, res) => {
  try {
    const { email, lastSeen } = req.query;
    if (!email) return res.status(400).json({ error: 'email is required.' });

    const userEmail = email.toLowerCase();
    const since     = lastSeen ? new Date(Number(lastSeen)) : new Date(0);

    const [
      newRequestsForSeller,
      acceptedForBuyer,
      rejectedForBuyer,
      newMessages
    ] = await Promise.all([
      // New purchase requests sent TO this user as seller (pending, created after lastSeen)
      Purchase.countDocuments({
        sellerEmail:     userEmail,
        purchaseStatus:  'pending',
        createdAt:       { $gt: since }
      }),
      // Requests accepted for this user as buyer (after lastSeen)
      Purchase.countDocuments({
        buyerEmail:      userEmail,
        purchaseStatus:  'accepted',
        updatedAt:       { $gt: since }
      }),
      // Requests rejected for this user as buyer (after lastSeen)
      Purchase.countDocuments({
        buyerEmail:      userEmail,
        purchaseStatus:  'rejected',
        updatedAt:       { $gt: since }
      }),
      // New chat messages received by this user (after lastSeen)
      Message.countDocuments({
        receiverEmail: userEmail,
        createdAt:     { $gt: since }
      })
    ]);

    const total = newRequestsForSeller + acceptedForBuyer + rejectedForBuyer + newMessages;

    res.json({
      success: true,
      total,
      breakdown: {
        newRequests: newRequestsForSeller,
        accepted:    acceptedForBuyer,
        rejected:    rejectedForBuyer,
        messages:    newMessages
      }
    });
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ===== PURCHASE ROUTES =====

// POST /api/purchase — buyer submits a purchase request
app.post('/api/purchase', async (req, res) => {
  try {
    const { itemId, buyerEmail, note } = req.body;
    console.log('[POST /api/purchase]', { itemId, buyerEmail });

    if (!itemId || !buyerEmail)
      return res.status(400).json({ error: 'itemId and buyerEmail are required.' });
    if (!mongoose.Types.ObjectId.isValid(itemId))
      return res.status(400).json({ error: 'Invalid item ID.' });

    const buyer = await User.findOne({ email: buyerEmail.toLowerCase() });
    if (!buyer) return res.status(401).json({ error: 'Buyer not found. Please log in.' });

    const item = await Item.findById(itemId).lean();
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    
    // Check if item is available
    if (item.item_status !== 'Available') {
      return res.status(400).json({ error: 'This item is no longer available.' });
    }

    // Resolve seller email
    let sellerEmail = (item.sellerEmail || '').toLowerCase().trim();
    if (!sellerEmail && item.user_id) {
      const seller = await User.findById(item.user_id).select('email').lean();
      if (seller) sellerEmail = seller.email.toLowerCase();
    }
    if (!sellerEmail)
      return res.status(400).json({ error: 'Could not find seller for this item.' });
    if (sellerEmail === buyerEmail.toLowerCase())
      return res.status(400).json({ error: 'You cannot buy your own listing.' });

    // Check if buyer already has a pending request for this item
    const existingRequest = await Purchase.findOne({
      itemId,
      buyerEmail: buyerEmail.toLowerCase(),
      purchaseStatus: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        error: 'You already have a pending request for this item.',
        purchaseId: existingRequest._id
      });
    }

    // Create purchase request
    const purchase = await Purchase.create({
      itemId,
      itemName:   item.name,
      buyerEmail: buyerEmail.toLowerCase(),
      buyerName:  buyer.name,
      sellerEmail,
      note:       note ? note.trim().slice(0, 500) : '',
      purchaseStatus: 'pending'
    });

    console.log('[POST /api/purchase] created:', purchase._id);

    res.json({
      success:    true,
      message:    'Purchase request sent successfully.',
      purchaseId: purchase._id,
      sellerEmail
    });
  } catch (err) {
    console.error('[POST /api/purchase] error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/purchases/seller?sellerEmail= — seller sees all purchase requests for their items
app.get('/api/purchases/seller', async (req, res) => {
  try {
    const { sellerEmail } = req.query;
    if (!sellerEmail) return res.status(400).json({ error: 'sellerEmail is required.' });

    const seller = await User.findOne({ email: sellerEmail.toLowerCase() });
    if (!seller) return res.status(401).json({ error: 'Unauthorized.' });

    const purchases = await Purchase.find({ sellerEmail: sellerEmail.toLowerCase() })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, purchases });
  } catch (err) {
    console.error('[GET /api/purchases/seller]', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/purchases/buyer?buyerEmail= — buyer sees their own purchase requests
app.get('/api/purchases/buyer', async (req, res) => {
  try {
    const { buyerEmail } = req.query;
    if (!buyerEmail) return res.status(400).json({ error: 'buyerEmail is required.' });

    const buyer = await User.findOne({ email: buyerEmail.toLowerCase() });
    if (!buyer) return res.status(401).json({ error: 'Unauthorized.' });

    const purchases = await Purchase.find({ buyerEmail: buyerEmail.toLowerCase() })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, purchases });
  } catch (err) {
    console.error('[GET /api/purchases/buyer]', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/purchases/item/:itemId — get purchase status for a specific item (for buyer)
app.get('/api/purchases/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { buyerEmail } = req.query;
    if (!mongoose.Types.ObjectId.isValid(itemId))
      return res.status(400).json({ error: 'Invalid item ID.' });

    const query = { itemId };
    if (buyerEmail) query.buyerEmail = buyerEmail.toLowerCase();

    const purchase = await Purchase.findOne(query).sort({ createdAt: -1 }).lean();
    res.json({ success: true, purchase: purchase || null });
  } catch (err) {
    console.error('[GET /api/purchases/item]', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/purchases/:id/cancel — buyer cancels a pending request
app.put('/api/purchases/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { buyerEmail } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: 'Invalid purchase ID.' });
    const purchase = await Purchase.findById(id);
    if (!purchase) return res.status(404).json({ error: 'Purchase not found.' });
    if (purchase.buyerEmail !== (buyerEmail || '').toLowerCase())
      return res.status(403).json({ error: 'Not authorised.' });
    if (purchase.purchaseStatus !== 'pending')
      return res.status(400).json({ error: 'Only pending orders can be cancelled.' });
    purchase.purchaseStatus = 'rejected';
    purchase.sellerNote = 'Cancelled by buyer.';
    await purchase.save();
    res.json({ success: true, message: 'Order cancelled.' });
  } catch (err) {
    console.error('[PUT /api/purchases/:id/cancel]', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/purchases/:id/respond — seller accepts or declines
app.put('/api/purchases/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { sellerEmail, action, sellerNote } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: 'Invalid purchase ID.' });
    if (!['accept', 'reject'].includes(action))
      return res.status(400).json({ error: 'action must be "accept" or "reject".' });

    const purchase = await Purchase.findById(id);
    if (!purchase) return res.status(404).json({ error: 'Purchase request not found.' });

    if (purchase.sellerEmail !== sellerEmail.toLowerCase())
      return res.status(403).json({ error: 'Only the seller can respond to this request.' });

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    purchase.purchaseStatus = newStatus;
    purchase.sellerNote     = sellerNote ? sellerNote.trim() : '';
    await purchase.save();

    // If accepted → mark item as Reserved and hide from marketplace
    if (action === 'accept') {
      const buyer = await User.findOne({ email: purchase.buyerEmail });
      await Item.findByIdAndUpdate(purchase.itemId, { 
        item_status: 'Reserved',
        reserved_for: buyer ? buyer._id : null
      });
      
      // Reject all other pending requests for this item
      await Purchase.updateMany(
        { 
          itemId: purchase.itemId, 
          _id: { $ne: purchase._id },
          purchaseStatus: 'pending'
        },
        { 
          purchaseStatus: 'rejected',
          sellerNote: 'Item has been reserved for another buyer.'
        }
      );
    }

    res.json({ success: true, message: `Purchase request ${newStatus}.`, purchase });
  } catch (err) {
    console.error('[PUT /api/purchases/:id/respond]', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/purchases/:id/complete — seller marks the handoff as complete
// Sets item_status = 'Completed', closes the conversation for buyer and seller
app.put('/api/purchases/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { sellerEmail } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: 'Invalid purchase ID.' });

    const purchase = await Purchase.findById(id);
    if (!purchase) return res.status(404).json({ error: 'Purchase not found.' });
    if (purchase.sellerEmail !== (sellerEmail || '').toLowerCase())
      return res.status(403).json({ error: 'Only the seller can mark this as complete.' });
    if (purchase.purchaseStatus !== 'accepted')
      return res.status(400).json({ error: 'Only accepted orders can be completed.' });

    // Mark purchase as completed
    purchase.purchaseStatus = 'completed';
    await purchase.save();

    // Mark item as Completed — matches schema enum, hides from all public listings
    await Item.findByIdAndUpdate(purchase.itemId, {
      item_status: 'Completed',
      sold:        true
    });

    // Emit conversation_completed to both participants so their chat disappears in real time
    try {
      const buyerEmail  = purchase.buyerEmail;
      const sellerEmail = purchase.sellerEmail;
      const itemId      = purchase.itemId.toString();

      // Collect all unique participants who have messaged about this item
      const allEmails = await Message.find({ itemId: purchase.itemId })
        .distinct('senderEmail');
      const participants = [...new Set([...allEmails, buyerEmail, sellerEmail])];

      // Emit to every room pair so all open chat windows receive the event
      for (let i = 0; i < participants.length; i++) {
        for (let j = i + 1; j < participants.length; j++) {
          const room = getRoomId(itemId, participants[i], participants[j]);
          global.io && global.io.to(room).emit('conversation_completed', { itemId });
        }
      }
      console.log('[complete] conversation_completed emitted for item:', itemId);
    } catch (emitErr) {
      console.error('[complete] socket emit error:', emitErr.message);
    }

    // Delete all messages for this item — no listing = no chat
    await Message.deleteMany({ itemId: purchase.itemId });
    console.log('[complete] messages deleted for item:', purchase.itemId);

    res.json({ success: true, message: 'Purchase completed. Conversation closed.' });
  } catch (err) {
    console.error('[PUT /api/purchases/:id/complete]', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ===== CONNECT & START with Socket.io =====

// Deterministic room ID — same for both users regardless of who calls it
function getRoomId(itemId, emailA, emailB) {
  const sorted = [emailA.toLowerCase(), emailB.toLowerCase()].sort().join('__');
  return `${itemId}__${sorted}`;
}

// Serve frontend static files (AFTER all API routes to avoid conflicts)
app.use(express.static(path.join(__dirname, '../frontend'), {
  setHeaders: function(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Catch-all route: serve index.html for client-side routing (MUST be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');

    // ── One-time migration: fix legacy items where sold=true but item_status='Available' ──
    try {
      const fixed = await Item.updateMany(
        { sold: true, item_status: 'Available' },
        { $set: { item_status: 'Sold' } }
      );
      if (fixed.modifiedCount > 0)
        console.log(`🔧 Migrated ${fixed.modifiedCount} legacy sold item(s) to item_status='Sold'`);
    } catch (migErr) {
      console.warn('Migration warning:', migErr.message);
    }

    const http = require('http');
    const { Server } = require('socket.io');

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    // Make io accessible in route handlers above
    app.set('io', io);
    global.io = io;

    io.on('connection', (socket) => {
      console.log('[Socket.io] client connected:', socket.id);

      // Client joins their private room
      socket.on('join_room', ({ itemId, myEmail, otherEmail }) => {
        const room = getRoomId(itemId, myEmail, otherEmail);
        socket.join(room);
        console.log(`[Socket.io] ${myEmail} joined room: ${room}`);
        socket.emit('room_joined', { room });
      });

      // Client sends a message via socket (alternative to REST)
      socket.on('send_message', async ({ itemId, senderEmail, receiverEmail, senderName, text }) => {
        console.log('[Socket.io] send_message from:', senderEmail, 'to:', receiverEmail);
        try {
          if (!itemId || !senderEmail || !receiverEmail || !text) return;
          if (senderEmail.toLowerCase() === receiverEmail.toLowerCase()) return;

          const sender = await User.findOne({ email: senderEmail.toLowerCase() });
          if (!sender) { socket.emit('error', { message: 'Sender not found.' }); return; }

          const msg = await Message.create({
            itemId,
            senderEmail:   senderEmail.toLowerCase(),
            receiverEmail: receiverEmail.toLowerCase(),
            senderName:    senderName || senderEmail,
            text:          text.trim()
          });

          console.log('[Socket.io] message saved:', msg._id);

          const room = getRoomId(itemId, senderEmail, receiverEmail);
          io.to(room).emit('new_message', msg);
          console.log('[Socket.io] emitted new_message to room:', room);
        } catch (err) {
          console.error('[Socket.io] send_message error:', err);
          socket.emit('error', { message: 'Failed to send message.' });
        }
      });

      socket.on('disconnect', () => {
        console.log('[Socket.io] client disconnected:', socket.id);
      });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${PORT} in use — killing old process and retrying in 1s...`);
        try {
          require('child_process').execSync(
            `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${PORT}') do taskkill /F /PID %a`,
            { shell: 'cmd.exe', stdio: 'pipe' }
          );
        } catch(e) { /* already gone */ }
        setTimeout(() => server.listen(PORT, '0.0.0.0', onListening), 1200);
      } else {
        throw err;
      }
    });

    function onListening() {
      console.log(`✅ CampusMart server running on port ${PORT}`);
      console.log(`   Socket.io enabled — real-time chat active`);
      console.log(`   Server is listening on all network interfaces\n`);
    }

    server.listen(PORT, '0.0.0.0', onListening);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });



