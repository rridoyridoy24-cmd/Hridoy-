<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice Call</title>
    <style>
        body { font-family: sans-serif; text-align: center; background: #222; color: #fff; padding: 15px; }
        input { font-size: 18px; padding: 8px; width: 85%; text-align: center; margin-bottom: 10px; }
        .box { background: #333; padding: 10px; border-radius: 8px; margin-bottom: 15px; }
        .hint { color: #ffca28; font-size: 14px; }
    </style>
</head>
<body>
    <h3>P2P Voice Call</h3>
    <div class="box">
        <p>আমার ID: <strong id="my-id" style="color:#00ff88;">...</strong></p>
        <p>স্ট্যাটাস: <span id="status" style="color:#ff4444;">Offline</span></p>
    </div>
    <div id="incoming-box" class="box" style="display:none; border: 2px solid #00ff88;">
        <p>🚨 <strong id="caller-id"></strong> কল দিচ্ছেন!</p>
        <p class="hint">ধরতে <b>OK</b> | কাটতে <b>Back/End</b></p>
    </div>
    <div class="box">
        <input type="tel" id="peer-id" placeholder="যাকে কল করবেন তার ID">
        <p class="hint">ডায়াল করতে <b>OK</b> চাপুন</p>
    </div>
    <audio id="remote-audio" autoplay></audio>
    <script src="app.js"></script>
</body>
</html>
