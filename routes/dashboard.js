const express = require('express');
const router = express.Router();
const Domain = require('../models/Domain');

// ১. ডোমেইন লিস্ট গেট করা (মেম্বার ও এডমিন উভয়ের জন্য)
router.get('/', async (req, res) => {
    try {
        // ডাটাবেস থেকে একটিভ ডোমেইনগুলো নিয়ে আসা
        const activeDomains = await Domain.find({ status: 'active' });
        
        // যেহেতু আপনি ফ্রন্টএন্ড থেকে fetch করছেন, তাই JSON ডাটা পাঠানোই ভালো
        res.json(activeDomains);
    } catch (err) {
        console.error("Dashboard Loading Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

// ২. নতুন ডোমেইন অ্যাড করা (এডমিন প্যানেলের জন্য)
router.post('/add-domain', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ message: "URL is required" });

        const newDomain = new Domain({
            url: url,
            status: 'active'
        });

        await newDomain.save();
        res.json(newDomain);
    } catch (err) {
        console.error("Add Domain Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

// ৩. ডোমেইন ডিলিট করা (এডমিন প্যানেলের জন্য)
router.delete('/domain/:id', async (req, res) => {
    try {
        await Domain.findByIdAndDelete(req.params.id);
        res.json({ message: "Domain removed" });
    } catch (err) {
        console.error("Delete Domain Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;