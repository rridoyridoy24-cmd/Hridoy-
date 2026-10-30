
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('License Server is Live!');
});

// সব ধরনের রিকোয়েস্ট (GET এবং POST উভয়ই) হ্যান্ডেল করার জন্য
app.all('/verify', (req, res) => {
    res.json({
        valid: true,
        message: "Premium Key activated!",
        plan_name: "VIP Premium",
        expires_at: 0,
        device_limit: 1,
        devices_used: 1,
        server_time: Date.now()
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
