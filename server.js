const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); 

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const Offer = require('./models/Offer');

const app = express();

app.set('trust proxy', true); 
app.use(express.json());
app.use(cors());

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("🚀 Database Connected Successfully!"))
    .catch(err => console.log("❌ DB Error: " + err.message));

// --- API Routes (Statics theke age thakte hobe) ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin')); 
app.use('/api/leads', require('./routes/leads'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/withdraw', require('./routes/withdraw'));
app.use('/api/users', require('./routes/users'));

// --- Static Files Serving ---
app.use(express.static(path.join(__dirname, 'public')));

// Admin Page access
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// SPA Routing Fix (Regex for Node 25+)
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Daily Cap Reset ---
cron.schedule('0 0 * * *', async () => {
    try {
        await Offer.updateMany({}, { currentDailyCount: 0, status: 'active' });
        console.log('✅ Daily caps reset!');
    } catch (err) { console.error(err); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});