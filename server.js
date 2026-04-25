const dns = require('dns');
// MongoDB Connection এরর (ETIMEOUT) ফিক্স করার জন্য এই লাইনটি অত্যন্ত জরুরি
dns.setServers(['8.8.8.8', '8.8.4.4']); 

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const Offer = require('./models/Offer');

const app = express();

// --- Middleware ---
app.set('trust proxy', true); 
app.use(express.json());
app.use(cors());

// --- Database Connection (With Better Options) ---
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // ৫ সেকেন্ডের বেশি সময় নিলে এরর দিবে
})
.then(() => console.log("🚀 Database Connected Successfully!"))
.catch(err => {
    console.log("❌ DB Error: " + err.message);
    console.log("👉 টিপস: MongoDB Atlas এ গিয়ে Network Access থেকে 0.0.0.0/0 (Allow Everywhere) করা আছে কি না চেক করুন।");
});

// --- API Routes (অবশ্যই স্ট্যাটিক ফাইলের উপরে থাকবে) ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin')); 
app.use('/api/leads', require('./routes/leads'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/withdraw', require('./routes/withdraw'));
app.use('/api/users', require('./routes/users'));

// --- Static Files Serving ---
app.use(express.static(path.join(__dirname, 'public')));

// Admin Page এর জন্য নির্দিষ্ট রুট
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// --- Frontend Routing FIX (Node.js 25+ Solution) ---
// API বাদে অন্য সব রুটকে index.html এ পাঠিয়ে দিবে (SPA সাপোর্ট)
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Daily Cap Reset (রাত ১২টায় অটোমেটিক রিসেট) ---
cron.schedule('0 0 * * *', async () => {
    try {
        await Offer.updateMany({}, { currentDailyCount: 0, status: 'active' });
        console.log('✅ All Daily Caps have been reset at midnight!');
    } catch (err) {
        console.error('❌ Cron Job Error:', err);
    }
});

// --- Server Startup ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ RKB ELITE Server running on port ${PORT}`);
    console.log(`🔗 Local Link: http://localhost:${PORT}`);
});