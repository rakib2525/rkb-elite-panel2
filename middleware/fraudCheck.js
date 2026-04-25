const axios = require('axios');
const Click = require('../models/Click'); // Click মডেল ইমপোর্ট করা হয়েছে
const useragent = require('useragent');

const fraudCheck = async (req, res, next) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ip && ip.includes(',')) ip = ip.split(',')[0].trim();

    if (ip === '::1' || ip === '127.0.0.1' || !ip) {
        return next();
    }

    try {
        const apiKey = "1a5f3ac02f06473a9a6eefd8eb7481b7";
        const url = `https://ipgeolocation.abstractapi.com/v1/?api_key=${apiKey}&ip_address=${ip}`;
        
        const response = await axios.get(url);
        const data = response.data;
        const agent = useragent.parse(req.headers['user-agent']);

        if (data.security) {
            const isVPN = data.security.is_vpn;
            const isProxy = data.security.is_proxy;
            const isTor = data.security.is_tor;

            if (isVPN || isProxy || isTor) {
                console.warn(`[Blocked] Fraud attempt from IP: ${ip}`);

                // ৩. ব্লকড ক্লিক ডাটাবেসে সেভ করা
                await Click.create({
                    userId: req.params.userId,
                    ip: ip,
                    country: data.country_code || 'Unknown',
                    device: agent.device.toString(),
                    os: agent.os.toString(),
                    browser: agent.toAgent(),
                    domain: req.headers.host,
                    status: 'blocked'
                });

                return res.status(403).send(`
                    <div style="text-align:center; padding:50px; font-family: sans-serif; background-color: #0a0a0a; color: #fff; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <h1 style="color: #d4af37; font-size: 40px;">⚠️ Access Denied</h1>
                        <p style="color: #ccc; font-size: 18px;">VPN/Proxy connections are not allowed for security reasons.</p>
                        <p style="font-size: 12px; color: #444; margin-top: 30px;">RKB ELITE Security Engine</p>
                    </div>
                `);
            }
        }
        
        next();

    } catch (err) {
        console.error("Fraud Check Error:", err.message);
        next();
    }
};

module.exports = fraudCheck;