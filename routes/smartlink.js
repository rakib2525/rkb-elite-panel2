// routes/smartlink.js - Updated with Click Logging & Analytics

const express = require('express');
const router = express.Router();
const geoip = require('geoip-lite');
const useragent = require('useragent'); // npm install useragent প্রয়োজন
const Offer = require('../models/Offer');
const Click = require('../models/Click'); // Click মডেল ইমপোর্ট করা হয়েছে
const domainsData = require('../domains.json'); 
const fraudCheck = require('../middleware/fraudCheck');

// @route    GET api/sl/:userId
router.get('/:userId', fraudCheck, async (req, res) => {
    try {
        const userId = req.params.userId;
        const currentHost = req.headers.host; 
        const agent = useragent.parse(req.headers['user-agent']);

        // ১. ইউজারের আইপি এবং লোকেশন বের করা
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (ip.includes(',')) ip = ip.split(',')[0].trim();
        
        // টেস্টিং আইপি হ্যান্ডলিং
        const geoIP = (ip === '::1' || ip === '127.0.0.1') ? '8.8.8.8' : ip;
        const geo = geoip.lookup(geoIP);
        const userCountry = geo ? geo.country : 'ALL';

        // ২. ক্লিক লোগিং (Allowed Traffic)
        const newClick = new Click({
            userId: userId,
            ip: ip,
            country: userCountry,
            device: agent.device.toString(),
            os: agent.os.toString(),
            browser: agent.toAgent(),
            domain: currentHost,
            status: 'allowed'
        });
        await newClick.save();

        // ৩. বেস্ট অফার খোঁজা
        let offer = await Offer.findOne({
            assignedTo: userId,
            status: 'active',
            $or: [{ targetCountry: userCountry }, { targetCountry: 'ALL' }]
        }).sort({ payout: -1 });

        if (!offer) {
            return res.status(404).send(`<h1>No active offers found for ${userCountry}</h1>`);
        }

        // ৪. ডেইলি ক্যাপ চেক এবং ব্যাকআপ অফার
        if (offer.dailyCap > 0 && offer.currentDailyCount >= offer.dailyCap) {
            const backupOffer = await Offer.findOne({
                assignedTo: userId,
                status: 'active',
                _id: { $ne: offer._id },
                $or: [{ targetCountry: userCountry }, { targetCountry: 'ALL' }]
            }).sort({ payout: -1 });

            if (backupOffer) {
                offer = backupOffer;
            } else {
                return res.send('<h1>Daily limit reached for all offers.</h1>');
            }
        }

        // ৫. ক্লিক কাউন্ট আপডেট এবং অফার আইডি ক্লিকের সাথে কানেক্ট করা
        offer.currentDailyCount += 1;
        await offer.save();
        
        // ক্লিকের সাথে অফার আইডি আপডেট (ঐচ্ছিক কিন্তু রিপোর্টের জন্য ভালো)
        newClick.offerId = offer._id;
        await newClick.save();

        // ৬. রিডাইরেক্ট প্যারামিটার সেট করা
        const separator = offer.offerLink.includes('?') ? '&' : '?';
        const finalRedirectUrl = `${offer.offerLink}${separator}s1=${userId}&s2=${offer._id}&s3=${currentHost}`;

        res.redirect(finalRedirectUrl);

    } catch (err) {
        console.error("Smartlink Error:", err.message);
        res.status(500).send('System Error.');
    }
});

module.exports = router;