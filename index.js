const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ডাটাবেস হিসেবে জেনারেট করা কি-গুলো এখানে স্টোর থাকবে (কিছু ডিফল্ট টেস্ট কি রাখতে পারেন)
let activeKeys = new Set(["HRIDOY-VIP-2026", "HRIDOY-AI-PRO-30D"]); 
let globalNotice = "Server optimized to v4.0! Enjoy AI features.";

// ১. লাইসেন্স ভেরিফিকেশন এন্ডপয়েন্ট (অ্যাপ এখান থেকে চেক করবে)
app.post('/api/license/verify', (req, res) => {
    const { key, device_id } = req.body;
    console.log("Received verification request for key:", key, "Device:", device_id);

    // চেক করা হচ্ছে কি-টি আমাদের activeKeys লিস্টে আছে কি না
    if (key && activeKeys.has(key)) {
        res.json({
            valid: true,
            message: "Premium Key activated successfully!",
            plan_name: "VIP Premium",
            expires_at: 0, // 0 মানে লাইফটাইম
            device_limit: 5,
            devices_used: 1,
            server_time: Date.now()
        });
    } else {
        // যদি কি ভুল বা ভুয়া হয়, তবে এটি রিটার্ন করবে
        res.json({
            valid: false,
            message: "Invalid License Key! Please enter a valid key."
        });
    }
});

// ২. অ্যাডমিন প্যানেল থেকে নতুন কি জেনারেট করার এন্ডপয়েন্ট
app.post('/api/admin/generate-key', (req, res) => {
    const { custom_key, duration_ms, plan_name, device_limit } = req.body;
    
    if (custom_key) {
        activeKeys.add(custom_key); // নতুন কি-টি লিস্টে যুক্ত হলো
        console.log("New Key Generated:", custom_key);
        res.json({
            success: true,
            message: "Key generated and saved successfully",
            key: custom_key
        });
    } else {
        res.status(400).json({ success: false, message: "Invalid key data" });
    }
});

// ৩. ব্রডকাস্ট নোটিশ এন্ডপয়েন্ট
app.post('/api/admin/broadcast', (req, res) => {
    const { message } = req.body;
    if (message) {
        globalNotice = message;
        res.json({ success: true, message: "Notice updated" });
    } else {
        res.status(400).json({ success: false, message: "Message is required" });
    }
});

app.get('/', (req, res) => {
    res.send('License Server is Live!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
