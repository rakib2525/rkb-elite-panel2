const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Withdraw = require('../models/Withdraw');
const Offer = require('../models/Offer');
const Lead = require('../models/Lead');
const auth = require('../middleware/auth');
const admin = require('../middleware/adminMiddleware');

// @route    GET api/admin/stats
// @desc     Dashboard card stats and full user list for management
router.get('/stats', auth, admin, async (req, res) => {
    try {
        // Fetch all users with role 'user' (excluding sensitive data)
        const users = await User.find({ role: 'user' }).select('-password').sort({ date: -1 });
        
        const totalUsers = users.length;
        const totalBalance = users.reduce((acc, u) => acc + (u.balance || 0), 0);
        
        // Dynamic stats for Dashboard
        const activeOffers = await Offer.countDocuments({ status: 'active' });
        const pendingLeads = await Lead.countDocuments({ status: 'pending' });
        const pendingWithdraws = await Withdraw.countDocuments({ status: 'pending' });

        // Response with all required data for the admin panel
        res.json({ 
            totalUsers, 
            totalBalance, 
            activeOffers, 
            pendingLeads, 
            pendingWithdraws,
            users 
        });
    } catch (err) {
        console.error("Stats Error:", err.message);
        res.status(500).send("Server Error");
    }
});

// @route    PUT api/admin/user/approve/:id
// @desc     Approve a pending member
router.put('/user/approve/:id', auth, admin, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id, 
            { status: 'approved' }, 
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        res.json({ msg: "User Approved Successfully", user });
    } catch (err) {
        console.error("Approval Error:", err.message);
        res.status(500).send("Error approving user");
    }
});

// @route    DELETE api/admin/user/:id
// @desc     Remove/Delete a user from the system
router.delete('/user/:id', auth, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: "User removed successfully" });
    } catch (err) {
        console.error("Delete Error:", err.message);
        res.status(500).send("Error deleting user");
    }
});

// @route    GET api/admin/user/:id
// @desc     Get specific user details with their lead history
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
// @desc     Add a tracking/landing domain (Mock setup)
router.post('/domain', auth, admin, async (req, res) => {
    try {
        const { domain } = req.body;
        if(!domain) return res.status(400).json({ msg: "Domain URL is required" });
        
        // In a real scenario, you might save this to a Domain model
        res.json({ msg: "Domain added successfully", domain });
    } catch (err) {
        res.status(500).send("Error adding domain");
    }
});

module.exports = router;