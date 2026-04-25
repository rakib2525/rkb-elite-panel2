const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminMiddleware = require('../middleware/adminMiddleware');
const Offer = require('../models/Offer');
const User = require('../models/User');

// @route    POST api/offers
// @desc     অফার ডাটাবেসে সেভ করা (Manual or API Type)
router.post('/', auth, adminMiddleware, async (req, res) => {
    const { 
        offerName, 
        offerLink, 
        payout, 
        memberPercent, 
        description,
        dailyCap,      
        targetCountry,
        offerType // 'manual' or 'api'
    } = req.body;

    try {
        const newOffer = new Offer({
            offerName,
            offerLink,
            payout,
            memberPercent: memberPercent || 60,
            description,
            dailyCap: dailyCap || 0,
            targetCountry: targetCountry || 'ALL',
            offerType: offerType || 'manual',
            status: 'active'
        });

        const offer = await newOffer.save();
        res.json(offer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    POST api/offers/assign
// @desc     নির্দিষ্ট মেম্বারকে অফার এসাইন করা (Admin Only)
router.post('/assign', auth, adminMiddleware, async (req, res) => {
    const { userId, offerId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'Member not found' });

        // চেক করা যাতে একই অফার বারবার অ্যাড না হয়
        if (user.assignedOffers.includes(offerId)) {
            return res.status(400).json({ msg: 'This offer is already assigned to this member' });
        }

        user.assignedOffers.push(offerId);
        await user.save();
        
        res.json({ msg: `Offer successfully assigned to ${user.name}` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    GET api/offers/admin/list
// @desc     সব অফারের লিস্ট দেখা (With Pagination support if needed later)
router.get('/admin/list', auth, adminMiddleware, async (req, res) => {
    try {
        const offers = await Offer.find().sort({ date: -1 });
        res.json(offers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    PUT api/offers/:id
// @desc     অফার আপডেট করা (Payout বা Status change-এর জন্য)
router.put('/:id', auth, adminMiddleware, async (req, res) => {
    try {
        let offer = await Offer.findById(req.params.id);
        if (!offer) return res.status(404).json({ msg: 'Offer not found' });

        offer = await Offer.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.json(offer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    GET api/offers/my-offers
// @desc     মেম্বার শুধু তার জন্য এসাইন করা অফারগুলো দেখবে
router.get('/my-offers', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'assignedOffers',
            match: { status: 'active' }
        });

        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user.assignedOffers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    DELETE api/offers/:id
// @desc     অফার ডিলিট করা
router.delete('/:id', auth, adminMiddleware, async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) return res.status(404).json({ msg: 'Offer not found' });

        await Offer.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Offer removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;