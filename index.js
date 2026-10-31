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

// ব্যাকএন্ডে কি এবং তার মেয়াদ (Duration in ms) স্টোর করার জন্য মেমোরি স্টোরেজ
// এখানে কি জেনারেট হয়ে জমা থাকবে
let pendingKeys = new Map(); // Format: { "HRIDOY-AI-XXXX": duration_ms }

// যেসব কি অলরেডি একবার ইউজ হয়ে গেছে বা একটিভ আছে
let activeUserLicenses = new Map(); // Format: { "device_id": { key, expires_at } }

// ১. অ্যাডমিন প্যানেল থেকে নতুন কি জেনারেট করে সার্ভারে সেভ করার রাউট
app.post('/api/admin/generate-key', (req, res) => {
    const { custom_key, duration_ms } = req.body;
    
    if (custom_key) {
        // সার্ভারে কি এবং তার মেয়াদ সেভ হলো
        pendingKeys.set(custom_key, duration_ms);
        console.log("New Key Generated & Saved to Server:", custom_key, "Duration (ms):", duration_ms);
        
        res.json({
            success: true,
            message: "Key generated and saved successfully",
            key: custom_key
        });
    } else {
        res.status(400).json({ success: false, message: "Invalid key data" });
    }
});

// ২. অ্যাপ থেকে কি দিয়ে ভেরিফাই ও অ্যাক্টিভ করার রাউট (একবার ব্যবহার করলে কি সার্ভার থেকে মুছে যাবে)
app.post('/api/license/verify', (req, res) => {
    const { key, device_id } = req.body;
    console.log("Verification request - Key:", key, "Device:", device_id);

    // চেক করা যাক ইউজার ইতিপূর্বে এই ডিভাইসে প্রিমিয়াম আছে কি না
    if (activeUserLicenses.has(device_id)) {
        const license = activeUserLicenses.get(device_id);
        if (Date.now() < license.expires_at) {
            return res.json({
                valid: true,
                message: "Already Activated!",
                expires_at: license.expires_at
            });
        } else {
            activeUserLicenses.delete(device_id); // মেয়াদ শেষ হলে রিমুভ
        }
    }

    // চেক করা যাক কি-টি পেন্ডিং লিস্টে আছে কি না
    if (pendingKeys.has(key)) {
        const duration_ms = pendingKeys.get(key);
        
        // অত্যন্ত গুরুত্বপূর্ণ অংশ: কি একবার ব্যবহার হওয়ামাত্র সার্ভার থেকে চিরতরে মুছে ফেলা হলো!
        pendingKeys.delete(key);

        let expires_at = 0;
        if (duration_ms === 0) {
            expires_at = 8640000000000000; // Lifetime (আনলিমিটেড)
        } else {
            expires_at = Date.now() + duration_ms; // বর্তমান সময় + কাস্টম মেয়াদ
        }

        // ডিভাইসের সাথে বাইন্ড করে সেভ করা হলো
        activeUserLicenses.set(device_id, { key, expires_at });

        console.log("Key successfully consumed and deleted from server:", key);

        return res.json({
            valid: true,
            message: "Premium activated successfully!",
            expires_at: expires_at
        });
    } else {
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
