const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Lead = require('../models/Lead');
const Offer = require('../models/Offer');

// @route    GET api/postback
// @desc     CPA Network Postback with Automatic Revenue Share
router.get('/', async (req, res) => {
    try {
        // নেটওয়ার্ক থেকে আসা ডাটা (s1=userId, s2=offerId, payout=network_payout)
        // স্মার্টলিঙ্ক বা অফারের ক্ষেত্রে নেটওয়ার্ক পোস্টব্যাক ইউআরএল-এ এগুলো সেট করতে হবে
        const { s1, s2, payout } = req.query; 

        if (!s1 || !payout) {
            return res.status(400).send('Missing Required Data (s1 or payout)');
        }

        // ১. অফারটি খুঁজে বের করা (যদি s2 তে আইডি আসে)
        let sharePercent = 0.60; // ডিফল্ট ৬০% যদি অফার খুঁজে না পাওয়া যায়
        let oName = 'Smartlink Lead';
        let targetGeo = 'Global';

        if (s2) {
            const offer = await Offer.findById(s2);
            if (offer) {
                // অফারে সেট করা পার্সেন্টেজ (যেমন: ৮০ হলে ০.৮০ হবে)
                sharePercent = offer.memberPercent / 100;
                oName = offer.offerName;
                targetGeo = offer.targetCountry || 'Global';
            }
        }
        
        // ২. ফাইনাল পে-আউট ক্যালকুলেশন (অটোমেটিক কমিশন কাটা)
        // উদাহরণ: নেটওয়ার্ক থেকে এল $১.০০, শেয়ার ৮০% হলে মেম্বার পাবে $০.৮০
        const networkPayoutAmount = parseFloat(payout);
        const finalMemberPayout = networkPayoutAmount * sharePercent;

        // ৩. মেম্বার খুঁজে বের করা
        const user = await User.findById(s1);
        if (!user) {
            console.error(`❌ Postback: User ID ${s1} not found!`);
            return res.status(404).send('User Not Found');
        }

        // ৪. মেম্বারের ব্যালেন্স অটোমেটিক আপডেট করা
        // ব্যালেন্সের সাথে নতুন ইনকাম যোগ করা
        user.balance = (user.balance || 0) + finalMemberPayout;
        await user.save();

        // ৫. লিড হিস্ট্রিতে ডাটা সেভ করা (যাতে মেম্বার তার রিপোর্টে দেখতে পায়)
        const newLead = new Lead({
            user: s1,
            offerName: oName, 
            payout: finalMemberPayout.toFixed(4), // ৪ দশমিক পর্যন্ত মেম্বার পে-আউট
            vertical: targetGeo, 
            status: 'approved',
            date: new Date()
        });
        await newLead.save();

        // অ্যাডমিন কনসোল লগ (মনিটরিং এর জন্য)
        console.log(`-----------------------------------------`);
        console.log(`🚀 [AUTO REVENUE] New Lead Processed!`);
        console.log(`👤 Member: ${user.name} (${user.email})`);
        console.log(`🎁 Offer: ${oName}`);
        console.log(`💰 Network Payout: $${networkPayoutAmount}`);
        console.log(`📊 RevShare: ${sharePercent * 100}%`);
        console.log(`💵 Member Earned: $${finalMemberPayout.toFixed(2)}`);
        console.log(`-----------------------------------------`);

        res.status(200).send('OK'); // নেটওয়ার্ককে সাকসেস সিগন্যাল পাঠানো

    } catch (err) {
        console.error("❌ Postback Error:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;