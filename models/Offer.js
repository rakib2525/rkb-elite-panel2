const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    offerName: {
        type: String,
        required: true
    },
    offerLink: {
        type: String,
        required: true
    },
    payout: {
        type: Number, // এটি তোমার নেটওয়ার্ক থেকে পাওয়া অরিজিনাল পে-আউট
        required: true
    },
    // --- New Field: Member Revenue Share ---
    memberPercent: { 
        type: Number, 
        default: 60 // যেমন: ৭০ লিখলে মেম্বার ৭০% পাবে, তুমি পাবে ৩০%
    },
    // --- Phase 2: Cap System Fields ---
    dailyCap: {
        type: Number,
        default: 0 // 0 মানে আনলিমিটেড
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
    // --- Phase 3: Smartlink/Geo Logic ---
    targetCountry: {
        type: String, 
        default: 'ALL', // যেমন: 'US', 'UK', 'BD' অথবা 'ALL'
        uppercase: true
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'capped'],
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