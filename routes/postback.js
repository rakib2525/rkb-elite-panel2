// /routes/postback.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Lead = require('../models/Lead');
const Offer = require('../models/Offer');

// @route    GET api/postback
// @desc     CPA Network Postback with Automatic Revenue Share & Duplicate Protection
router.get('/', async (req, res) => {
    try {
        // s1=userId, s2=offerId, payout=original_payout, tid=network_transaction_id, ip=lead_ip
        const { s1, s2, payout, tid, ip } = req.query; 

        if (!s1 || !payout) {
            console.error(`❌ Postback Rejected: Missing s1 or payout`);
            return res.status(400).send('Missing Required Data');
        }

        // ১. ডুপ্লিকেট লিড চেক (একই Transaction ID বারবার আসলে রিজেক্ট করবে)
        if (tid) {
            const existingLead = await Lead.findOne({ transactionId: tid });
            if (existingLead) {
                console.log(`⚠️ Duplicate Lead detected for TID: ${tid}`);
                return res.status(200).send('Duplicate Lead'); // নেটওয়ার্ককে সাকসেস বলবে কিন্তু ডাটাবেসে সেভ করবে না
            }
        }

        // ২. অফার ও মেম্বার পার্সেন্টেজ বের করা
        let sharePercent = 0.60; // ডিফল্ট ৬০% 
        let oName = 'Smartlink/Global Lead';
        let targetGeo = 'Global';

        if (s2 && s2 !== 'undefined') {
            try {
                const offer = await Offer.findById(s2);
                if (offer) {
                    sharePercent = offer.memberPercent / 100;
                    oName = offer.offerName;
                    targetGeo = offer.targetCountry || 'Global';
                }
            } catch (e) {
                console.log("Offer ID not valid, using default share.");
            }
        }
        
        // ৩. পে-আউট ক্যালকুলেশন
        const networkPayoutAmount = parseFloat(payout);
        const finalMemberPayout = networkPayoutAmount * sharePercent;

        // ৪. মেম্বার খুঁজে বের করা
        const user = await User.findById(s1);
        if (!user) {
            console.error(`❌ Postback: User ID ${s1} not found!`);
            return res.status(404).send('User Not Found');
        }

        // ৫. লিড হিস্ট্রিতে ডাটা সেভ করা (Save Lead First)
        const newLead = new Lead({
            user: s1,
            offerName: oName, 
            payout: finalMemberPayout.toFixed(4),
            originalPayout: networkPayoutAmount, // অরিজিনাল পে-আউট ট্র্যাক রাখা ভালো
            vertical: targetGeo, 
            status: 'approved',
            ip: ip || 'Unknown',
            transactionId: tid || `MAN-${Date.now()}`, // Tid না থাকলে ইউনিক আইডি জেনারেট হবে
            date: new Date()
        });
        await newLead.save();

        // ৬. মেম্বারের ব্যালেন্স আপডেট করা
        user.balance = (user.balance || 0) + finalMemberPayout;
        await user.save();

        // অ্যাডমিন কনসোল লগ (Real-time monitoring)
        console.log(`-----------------------------------------`);
        console.log(`🚀 [CONVERSION] New Lead Processed!`);
        console.log(`👤 User: ${user.name} | 💰 Member Earned: $${finalMemberPayout.toFixed(3)}`);
        console.log(`🎁 Offer: ${oName} | 🌐 IP: ${ip || 'N/A'}`);
        console.log(`-----------------------------------------`);

        res.status(200).send('OK'); 

    } catch (err) {
        console.error("❌ Postback Error:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;