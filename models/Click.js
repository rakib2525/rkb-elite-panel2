const mongoose = require('mongoose');

const ClickSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
    ip: String,
    country: String,
    device: String,
    os: String,
    browser: String,
    domain: String,
    isBot: { type: Boolean, default: false },
    status: { type: String, enum: ['allowed', 'blocked'], default: 'allowed' },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Click', ClickSchema);