const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminMiddleware = require('../middleware/adminMiddleware');
const Lead = require('../models/Lead');
const User = require('../models/User');

// --- ১. লিড স্ট্যাটাস আপডেট (Admin Only) ---
router.put('/admin/status/:id', auth, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body; 
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ msg: 'Lead not found' });

        const user = await User.findById(lead.user);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // logic: যদি 'pending' থেকে 'approved' হয়, ব্যালেন্স যোগ হবে
        if (status === 'approved' && lead.status !== 'approved') {
            user.balance += lead.payout;
        } 
        // logic: যদি আগে 'approved' ছিল এখন 'declined' হয়, ব্যালেন্স বিয়োগ হবে
        else if (status === 'declined' && lead.status === 'approved') {
            user.balance -= lead.payout;
        }

        lead.status = status;
        await lead.save();
        await user.save();

        res.json({ msg: `Lead ${status} successful`, balance: user.balance });
    } catch (err) {
        res.status(500).send('Server error during lead update');
    }
});

// --- ২. সব লিড দেখা (Admin) ---
router.get('/admin/all', auth, adminMiddleware, async (req, res) => {
    try {
        const leads = await Lead.find().populate('user', ['name', 'email']).sort({ date: -1 });
        res.json(leads);
    } catch (err) { res.status(500).send('Server error'); }
});

module.exports = router;