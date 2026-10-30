const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('License Server is Live!');
});

app.post('/verify', (req, res) => {
    const { key } = req.body;
    // যেকোনো কি দিলেই সাথে সাথে ভ্যালিড বলে পাস করে দেবে
    res.json({ 
        valid: true, 
        message: "Premium Key activated!",
        plan_name: "VIP Premium",
        expires_at: 0 // 0 মানে লাইফটাইম
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
