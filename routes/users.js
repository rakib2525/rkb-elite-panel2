const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminMiddleware = require('../middleware/adminMiddleware');

// @route    POST api/users/admin/add
// @desc     অ্যাডমিন নতুন মেম্বার তৈরি করবে
router.post('/admin/add', auth, adminMiddleware, async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({ name, email, password, role: 'member' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        res.json({ msg: 'Member added successfully', user: { id: user.id, name, email } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    GET api/users/admin/list
// @desc     সব মেম্বারের লিস্ট দেখা (অ্যাডমিন ছাড়া বাকি সবাই)
router.get('/admin/list', auth, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route    DELETE api/users/admin/:id
// @desc     মেম্বার রিমুভ করা
router.delete('/admin/:id', auth, adminMiddleware, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User removed successfully' });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;