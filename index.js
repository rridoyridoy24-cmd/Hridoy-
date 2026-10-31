const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// পেন্ডিং কি এবং তার সঠিক মেয়াদ (মিলি সেকেন্ডে) স্টোর করার মেমোরি
let pendingKeys = new Map(); // Format: { "KEY_CODE": duration_ms }

// অলরেডি অ্যাক্টিভ হওয়া লাইসেন্স (Device ID অনুযায়ী)
let activeUserLicenses = new Map(); // Format: { "device_id": { key, expires_at } }

// ১. অ্যাডমিন প্যানেল থেকে কাস্টম মেয়াদসহ কি জেনারেট করার রাউট
app.post('/api/admin/generate-key', (req, res) => {
    const { custom_key, duration_ms } = req.body;
    
    if (custom_key) {
        // প্যানেল থেকে পাঠানো সঠিক মেয়াদসহ কি সেভ করা হলো
        pendingKeys.set(custom_key, Number(duration_ms));
        console.log(`[GENERATE] Key: ${custom_key}, Duration (ms): ${duration_ms}`);
        
        res.json({
            success: true,
            message: "Key generated successfully",
            key: custom_key
        });
    } else {
        res.status(400).json({ success: false, message: "Invalid key data" });
    }
});

// ২. অ্যাপ থেকে কি ভেরিফাই করার সুনির্দিষ্ট ও কঠোর লজিক
app.post('/api/license/verify', (req, res) => {
    const { key, device_id } = req.body;
    console.log(`[VERIFY ATTEMPT] Key: ${key}, Device: ${device_id}`);

    // যদি এই ডিভাইস ইতিমধ্যে একটিভ থাকে এবং মেয়াদ শেষ না হয়
    if (activeUserLicenses.has(device_id)) {
        const license = activeUserLicenses.get(device_id);
        if (Date.now() < license.expires_at) {
            return res.json({
                valid: true,
                message: "Already Activated!",
                expires_at: license.expires_at
            });
        } else {
            activeUserLicenses.delete(device_id);
        }
    }

    // অত্যন্ত কঠোর চেক: কি-টি সত্যি সত্যি প্যানেল থেকে জেনারেট করা পেন্ডিং লিস্টে আছে কি না?
    if (pendingKeys.has(key)) {
        const duration_ms = pendingKeys.get(key);
        
        // ১. কি একবার ব্যবহার হওয়া মাত্র সার্ভার থেকে চিরতরে ডিলিট (Burn on use)
        pendingKeys.delete(key);

        let expires_at = 0;
        if (duration_ms === 0 || isNaN(duration_ms)) {
            expires_at = 8640000000000000; // Lifetime
        } else {
            // প্যানেল থেকে পাঠানো সঠিক সময় (মিনিট, ঘণ্টা বা দিন) যোগ করা হলো
            expires_at = Date.now() + duration_ms;
        }

        // ডিভাইসের সাথে বাইন্ধ করে সেভ করা হলো
        activeUserLicenses.set(device_id, { key, expires_at });

        console.log(`[SUCCESS] Key consumed & burned: ${key}, Expires at: ${new Date(expires_at)}`);

        return res.json({
            valid: true,
            message: "Premium activated successfully!",
            expires_at: expires_at
        });
    } else {
        // ভুল কোড বা অলরেডি ইউজ করা কোড হলে সরাসরি রিজেক্ট করবে!
        console.log(`[REJECTED] Invalid or reused key attempted: ${key}`);
        return res.json({
            valid: false,
            message: "Invalid or Already Used Key!"
        });
    }
});

app.get('/', (req, res) => {
    res.send('Secure License Server is Live!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
