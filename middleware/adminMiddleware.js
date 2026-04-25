const adminMiddleware = (req, res, next) => {
    // ১. চেক করা হচ্ছে রিকোয়েস্টে ইউজার ডাটা আছে কি না (যা auth middleware থেকে আসার কথা)
    if (!req.user) {
        console.log("❌ Admin Middleware Error: No user data found in request.");
        return res.status(401).json({ msg: "No token, authorization denied." });
    }

    // ২. ইউজারের রোল চেক করা
    // এখানে console.log রাখা হয়েছে যাতে তুমি বুঝতে পারো তোমার ডাটাবেসে রোল কী হিসেবে আছে
    console.log(`🔍 Checking Admin Access for User: ${req.user.id}, Role: ${req.user.role}`);

    if (req.user.role === 'admin') {
        next(); // অ্যাডমিন হলে পরের ধাপে যাবে
    } else {
        console.log("⚠️ Access Denied: User is not an admin.");
        return res.status(403).json({ msg: "Access denied. Admin resources only." });
    }
};

module.exports = adminMiddleware;