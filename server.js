const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google DNS for faster DB connection

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const Offer = require('./models/Offer');

const app = express();

// --- Middleware ও সিকিউরিটি ---
app.set('trust proxy', true); 
app.use(express.json());
app.use(cors());

// --- Static Files Serving ---
// এটি আপনার public ফোল্ডারের ফাইলগুলো (CSS, JS, Images) লোড করবে
app.use(express.static(path.join(__dirname, 'public')));

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("🚀 Database Connected Successfully!"))
    .catch(err => console.log("❌ DB Error: " + err.message));

// --- API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/admin', require('./routes/admin')); 
app.use('/api/withdraw', require('./routes/withdraw'));
app.use('/api/users', require('./routes/users'));

// --- Frontend Routing FIX (Node.js 25+ Compatible) ---
// এই মিডলওয়্যারটি এরর তৈরি করা ছাড়াই /api বাদে সব রিকোয়েস্টকে index.html এ পাঠাবে
app.use((req, res, next) => {
    // যদি রিকোয়েস্ট /api দিয়ে শুরু না হয় এবং এটি কোনো স্ট্যাটিক ফাইল না হয়
    if (!req.path.startsWith('/api')) {
        // বিশেষ করে /admin রুটের জন্য admin.html পাঠানো
        if (req.path === '/admin') {
            return res.sendFile(path.join(__dirname, 'public', 'admin.html'));
        }
        // বাকি সবকিছুর জন্য index.html
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
    next();
});

// --- Daily Cap Reset (রাত ১২টায়) ---
cron.schedule('0 0 * * *', async () => {
    try {
        await Offer.updateMany({}, { currentDailyCount: 0, status: 'active' });
        console.log('✅ Daily caps reset!');
    } catch (err) { 
        console.error('Reset Error:', err.message); 
    }
});

// --- Server Start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`👉 Access Admin Panel: http://localhost:${PORT}/admin`);
});