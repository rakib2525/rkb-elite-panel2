const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
    // Admin jeno specific member ke offer dite pare ba globally rakhte pare
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: false // globally thakle false thakbe
    },
    offerName: {
        type: String,
        required: true,
        trim: true
    },
    offerLink: {
        type: String,
        required: true
    },
    payout: {
        type: Number, // Original Payout (Network theke ja paben)
        required: true
    },
    // --- Revenue Share Logic ---
    memberPercent: { 
        type: Number, 
        default: 60 // Member koto % pabe
    },
    // --- Offer Source Type ---
    offerType: {
        type: String,
        enum: ['manual', 'api'],
        default: 'manual'
    },
    // --- Cap System Fields ---
    dailyCap: {
        type: Number,
        default: 0 // 0 means Unlimited
    },
    totalCap: {
        type: Number,
        default: 0
    },
    currentDailyCount: {
        type: Number,
        default: 0
    },
    currentTotalCount: {
        type: Number,
        default: 0
    },
    // --- Targeting & Status ---
    targetCountry: {
        type: String, 
        default: 'ALL',
        uppercase: true
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'capped', 'banned'],
        default: 'active'
    },
    description: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Offer', OfferSchema);