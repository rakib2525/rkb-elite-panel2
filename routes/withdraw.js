const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminMiddleware = require('../middleware/adminMiddleware');
const Withdraw = require('../models/Withdraw');
const User = require('../models/User');

// @route    POST api/withdraw/request
// @desc     মেম্বার উইথড্র রিকোয়েস্ট পাঠাবে
router.post('/request', auth, async (req, res) => {
    const { amount } = req.body;
    try {
        const user = await User.findById(req.user.id);

        // ব্যালেন্স এবং লিমিট চেক
        if (user.balance < amount || amount < 10) {
            return res.status(400).json({ msg: 'Insufficient balance or below $10 limit' });
        }

        const newRequest = new Withdraw({
            user: req.user.id,
            amount,
            method: user.paymentMethod,
            details: user.paymentDetails
        });

        // ব্যালেন্স থেকে টাকা কেটে নেওয়া
        user.balance -= amount;
        await user.save();
        
        await newRequest.save();
        res.json({ msg: 'Withdraw request sent successfully!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/withdraw/my-requests
// @desc     মেম্বার তার নিজের সব রিকোয়েস্ট হিস্ট্রি দেখবে
router.get('/my-requests', auth, async (req, res) => {
    try {
        const requests = await Withdraw.find({ user: req.user.id }).sort({ date: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ==========================================
// ADMIN ROUTES (অ্যাডমিন প্যানেলের জন্য)
// ==========================================

// @route    GET api/withdraw/admin/all
// @desc     অ্যাডমিন সব মেম্বারের রিকোয়েস্ট দেখবে (Admin Only)
router.get('/admin/all', auth, adminMiddleware, async (req, res) => {
    try {
        const requests = await Withdraw.find()
            .populate('user', ['name', 'email']) // মেম্বারের নাম-ইমেইলসহ
            .sort({ date: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route    PUT api/withdraw/admin/approve/:id
// @desc     রিকোয়েস্ট অ্যাপ্রুভ করা (Admin Only)
router.put('/admin/approve/:id', auth, adminMiddleware, async (req, res) => {
    try {
        const request = await Withdraw.findById(req.params.id);
        if (!request) return res.status(404).json({ msg: 'Request not found' });
        
        if (request.status !== 'pending') {
            return res.status(400).json({ msg: `Request already ${request.status}` });
        }

        request.status = 'approved';
        await request.save();

        // ইউজারের totalWithdrawn আপডেট করা
        const user = await User.findById(request.user);
        if (user) {
            user.totalWithdrawn = (user.totalWithdrawn || 0) + request.amount;
            await user.save();
        }

        res.json({ msg: 'Payment approved successfully!' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route    PUT api/withdraw/admin/reject/:id
// @desc     রিকোয়েস্ট রিজেক্ট করা এবং টাকা ফেরত দেওয়া (Admin Only)
router.put('/admin/reject/:id', auth, adminMiddleware, async (req, res) => {
    try {
        const request = await Withdraw.findById(req.params.id);
        if (!request) return res.status(404).json({ msg: 'Request not found' });

        if (request.status !== 'pending') {
            return res.status(400).json({ msg: 'Only pending requests can be rejected' });
        }

        // রিজেক্ট করলে টাকা ইউজারের মেইন ব্যালেন্সে ফেরত যাবে
        const user = await User.findById(request.user);
        if (user) {
            user.balance += request.amount;
            await user.save();
        }

        request.status = 'rejected';
        await request.save();

        res.json({ msg: 'Request rejected and money refunded to user' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;