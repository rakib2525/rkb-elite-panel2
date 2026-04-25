const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Withdraw = require('../models/Withdraw');
const Offer = require('../models/Offer');
const Lead = require('../models/Lead');
const auth = require('../middleware/auth');
const admin = require('../middleware/adminMiddleware');

// @route    GET api/admin/stats
router.get('/stats', auth, admin, async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('-password');
        
        const totalUsers = users.length;
        const totalBalance = users.reduce((acc, u) => acc + (u.balance || 0), 0);
        const activeOffers = await Offer.countDocuments({ status: 'active' });
        const pendingLeads = await Lead.countDocuments({ status: 'pending' });
        const pendingWithdraws = await Withdraw.countDocuments({ status: 'pending' });

        const withdraws = await Withdraw.find()
            .populate('userId', 'name email')
            .sort({ date: -1 });

        res.json({ 
            totalUsers, totalBalance, activeOffers, 
            pendingLeads, pendingWithdraws, users, withdraws 
        });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route    PUT api/admin/user/approve/:id
router.put('/user/approve/:id', auth, admin, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
        res.json(user);
    } catch (err) { res.status(500).send("Error"); }
});

// @route    DELETE api/admin/user/:id
router.delete('/user/:id', auth, admin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: "Deleted" });
    } catch (err) { res.status(500).send("Error"); }
});

module.exports = router;