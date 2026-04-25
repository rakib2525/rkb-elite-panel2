const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Withdraw = require('../models/Withdraw');
const Offer = require('../models/Offer');
const Lead = require('../models/Lead');
const auth = require('../middleware/auth');
const admin = require('../middleware/adminMiddleware');

// @route    GET api/admin/stats
// @desc     Dashboard stats and member list
router.get('/stats', auth, admin, async (req, res) => {
    try {
        // Shudhu 'user' role-er member-der khuje ber kora
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
            totalUsers, 
            totalBalance, 
            activeOffers, 
            pendingLeads, 
            pendingWithdraws,
            users, 
            withdraws 
        });
    } catch (err) {
        console.error("Admin Stats Error:", err.message);
        res.status(500).send("Server Error");
    }
});

// @route    GET api/admin/user/:id
router.get('/user/:id', auth, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ msg: "User Not Found" });
        
        const userLeads = await Lead.find({ user: req.params.id }).sort({ date: -1 });
        res.json({ user, leads: userLeads });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// @route    POST api/admin/domain
router.post('/domain', auth, admin, async (req, res) => {
    try {
        const { domain } = req.body;
        if(!domain) return res.status(400).json({ msg: "Domain URL is required" });
        res.json({ msg: "Domain added successfully", domain });
    } catch (err) {
        res.status(500).send("Error adding domain");
    }
});

// @route    PUT api/admin/user/approve/:id
router.put('/user/approve/:id', auth, admin, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id, 
            { status: 'approved' }, 
            { new: true }
        );
        if (!user) return res.status(404).json({ msg: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).send("Approval Error");
    }
});

// @route    DELETE api/admin/user/:id
router.delete('/user/:id', auth, admin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: "User removed successfully" });
    } catch (err) {
        res.status(500).send("Delete Error");
    }
});

module.exports = router;