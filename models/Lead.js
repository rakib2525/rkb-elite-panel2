const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // কোন মেম্বার লিড এনেছে তার আইডি
        required: true
    },
    offerName: {
        type: String,
        required: true // অ্যাফিলিয়েট নেটওয়ার্কের অফার নাম
    },
    leadEmail: {
        type: String,
        default: 'N/A' // অটো পোস্টব্যাকে অনেক সময় ইমেইল আসে না, তাই ডিফল্ট রাখা হয়েছে
    },
    payout: {
        type: Number,
        default: 0.00 // এই লিড থেকে মেম্বার কত ডলার পেল
    },
    vertical: {
        type: String, 
        default: 'CPL' // Dating, Sweepstakes, or CPL
    },
    status: {
        type: String,
        default: 'approved' // পোস্টব্যাকে লিড আসা মানেই সাধারণত সেটি অ্যাপ্রুভড
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Lead', LeadSchema);