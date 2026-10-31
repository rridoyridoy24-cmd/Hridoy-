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

// কি এবং তার বিস্তারিত তথ্য (যেমন: মেয়াদ ও কার কাছে দেওয়া হলো) স্টোর করার মেমোরি
let pendingKeys = new Map(); // Format: { "KEY_CODE": { duration_ms, note, created_at } }
let activeUserLicenses = new Map(); // Format: { "device_id": { key, expires_at } }
let globalNotice = "Server optimized to v4.0! Enjoy AI features.";

// ১. কি জেনারেট করার রাউট (নোটসহ সেভ হবে)
app.post('/api/admin/generate-key', (req, res) => {
    const { custom_key, duration_ms, note } = req.body;
    if (custom_key) {
        pendingKeys.set(custom_key, {
            duration_ms: Number(duration_ms),
            note: note || "No Name",
            created_at: new Date().toLocaleString()
        });
        res.json({ success: true, message: "Key generated with note successfully", key: custom_key });
    } else {
        res.status(400).json({ success: false, message: "Invalid key data" });
    }
});

// ২. অ্যাপ থেকে কি ভেরিফাই করার রাউট
app.post('/api/license/verify', (req, res) => {
    const { key, device_id } = req.body;

    if (activeUserLicenses.has(device_id)) {
        const license = activeUserLicenses.get(device_id);
        if (Date.now() < license.expires_at) {
            return res.json({ valid: true, message: "Already Activated!", expires_at: license.expires_at });
        } else {
            activeUserLicenses.delete(device_id);
        }
    }

    if (pendingKeys.has(key)) {
        const keyData = pendingKeys.get(key);
        pendingKeys.delete(key); // একবার ইউজ করলে সার্ভার থেকে ডিলিট (Burn on use)

        let expires_at = (keyData.duration_ms === 0 || isNaN(keyData.duration_ms)) ? 8640000000000000 : Date.now() + keyData.duration_ms;
        activeUserLicenses.set(device_id, { key, expires_at });

        return res.json({ valid: true, message: "Premium activated successfully!", expires_at: expires_at });
    } else {
        return res.json({ valid: false, message: "Invalid or Already Used Key!" });
    }
});

// ৩. লগআউট বা ক্যান্সেল রাউট
app.post('/api/license/logout', (req, res) => {
    const { device_id } = req.body;
    if (device_id && activeUserLicenses.has(device_id)) {
        activeUserLicenses.delete(device_id);
        return res.json({ success: true, message: "License revoked." });
    }
    res.json({ success: true, message: "No active license." });
});

// ৪. গ্লোবাল নোটিশ ব্রডকাস্ট
app.post('/api/admin/broadcast', (req, res) => {
    const { message } = req.body;
    if (message) {
        globalNotice = message;
        return res.json({ success: true, message: "Notice updated." });
    }
    res.status(400).json({ success: false, message: "Message required." });
});

app.get('/api/admin/notice', (req, res) => {
    res.json({ success: true, message: globalNotice });
});

// ৫. মেয়াদ বাড়ানো (Extend Validity)
app.post('/api/admin/extend', (req, res) => {
    const { target, extra_days } = req.body;
    let extended = false;
    const extraMs = Number(extra_days) * 24 * 60 * 60 * 1000;

    for (let [devId, license] of activeUserLicenses.entries()) {
        if (devId === target || license.key === target) {
            license.expires_at = Math.max(Date.now(), license.expires_at) + extraMs;
            extended = true;
        }
    }

    if (extended) {
        res.json({ success: true, message: "Validity extended successfully!" });
    } else {
        res.status(404).json({ success: false, message: "Key or Device not found." });
    }
});

// ৬. ডিভাইস বাইন্ডিং রিসেট (Clear HWID)
app.post('/api/admin/reset', (req, res) => {
    const { target } = req.body;
    let resetDone = false;

    for (let [devId, license] of activeUserLicenses.entries()) {
        if (devId === target || license.key === target) {
            activeUserLicenses.delete(devId);
            resetDone = true;
        }
    }

    if (resetDone) {
        res.json({ success: true, message: "Device limit cleared successfully!" });
    } else {
        res.status(404).json({ success: false, message: "Target not found." });
    }
});

// ৭. কি সরাসরি ডিলিট বা ব্লক করা (Revoke / Delete Key instantly)
app.post('/api/admin/revoke', (req, res) => {
    const { target } = req.body;
    let revoked = false;

    if (pendingKeys.has(target)) {
        pendingKeys.delete(target); // পেন্ডিং লিস্ট থেকে চিরতরে ডিলিট
        revoked = true;
    }

    for (let [devId, license] of activeUserLicenses.entries()) {
        if (devId === target || license.key === target) {
            activeUserLicenses.delete(devId); // একটিভ লিস্ট থেকেও ডিলিট
            revoked = true;
        }
    }

    if (revoked) {
        res.json({ success: true, message: "Key permanently deleted/revoked from server!" });
    } else {
        res.status(404).json({ success: false, message: "Target key not found." });
    }
});

// ৮. ডাটাবেজ ব্যাকআপ (Download JSON Backup)
app.get('/api/admin/backup', (req, res) => {
    const backupData = {
        pendingKeys: Object.fromEntries(pendingKeys),
        activeUserLicenses: Object.fromEntries(activeUserLicenses),
        globalNotice: globalNotice,
        timestamp: new Date().toISOString()
    };
    res.json(backupData);
});

app.get('/', (req, res) => {
    res.send('Secure License Server is Live!');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
