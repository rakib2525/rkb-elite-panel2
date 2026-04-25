const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    
    // --- অফার অ্যাসাইনমেন্ট ফিল্ড (নতুন যোগ করা হয়েছে) ---
    assignedOffers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Offer' // এখানে আপনার Offer মডেলের নামের সাথে মিল থাকতে হবে
        }
    ],

    // --- পেমেন্ট মেথড ও ইনভয়েস সংক্রান্ত ফিল্ডস ---
    paymentMethod: { 
        type: String, 
        enum: ['', 'Bkash', 'Nagad', 'Rocket', 'Binance', 'Bank Transfer', 'Payoneer'], 
        default: '' 
    },
    paymentDetails: { 
        type: String, 
        default: '' 
    }, // এখানে মেম্বার তার নাম্বার বা বিন্যান্স আইডি লিখবে
    
    balance: { 
        type: Number, 
        default: 0 
    }, // মেম্বারের বর্তমান ব্যালেন্স (যা এখনো উইথড্র করেনি)
    
    totalWithdrawn: { 
        type: Number, 
        default: 0 
    }, // এ পর্যন্ত মেম্বার কত টাকা ক্যাশ-আউট করেছে
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);