const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('License Server is Live!');
});

// অ্যাপ যে সঠিক এন্ডপয়েন্টে রিকোয়েস্ট পাঠায় সেটি এখানে যুক্ত করা হলো
app.post('/api/license/verify', (req, res) => {
    const { key, device_id } = req.body;
    console.log("Received verification request for key:", key, "Device:", device_id);

    // যেকোনো কি দিলেই সাথে সাথে ভ্যালিড বলে পাস করবে
    res.json({
        valid: true,
        message: "Premium Key activated successfully!",
        plan_name: "VIP Premium",
        expires_at: 0, // 0 মানে লাইফটাইম
        device_limit: 5,
        devices_used: 1,
        server_time: Date.now()
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
