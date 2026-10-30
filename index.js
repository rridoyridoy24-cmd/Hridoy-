const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('License Server is Live!');
});

app.post('/verify', (req, res) => {
    const { key } = req.body;
    if (key === "HRIDOY-FULL-2026") {
        res.json({ valid: true, message: "Key is valid" });
    } else {
        res.json({ valid: false, message: "Invalid Key" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
