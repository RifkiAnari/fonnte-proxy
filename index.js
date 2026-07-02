const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); // izinkan semua origin (dashboard HR bisa akses)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check
app.get("/", (req, res) => {
  res.json({ status: true, message: "Fonnte Proxy HR aktif ✓" });
});

// ── Validate token
app.post("/validate", async (req, res) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(400).json({ status: false, reason: "Token tidak ditemukan" });
  try {
    const response = await axios.post(
      "https://api.fonnte.com/validate",
      {},
      { headers: { Authorization: token } }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ status: false, reason: "Gagal terhubung ke Fonnte" });
  }
});

// ── Kirim pesan satu
app.post("/send", async (req, res) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(400).json({ status: false, reason: "Token tidak ditemukan" });
  const { target, message, typing = true, delay = 2 } = req.body;
  if (!target || !message) return res.status(400).json({ status: false, reason: "target dan message wajib diisi" });
  try {
    const params = new URLSearchParams({ target, message, typing, delay });
    const response = await axios.post("https://api.fonnte.com/send", params.toString(), {
      headers: { Authorization: token, "Content-Type": "application/x-www-form-urlencoded" }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ status: false, reason: "Gagal kirim pesan ke Fonnte" });
  }
});

// ── Blast ke banyak nomor (dengan jeda otomatis)
app.post("/blast", async (req, res) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(400).json({ status: false, reason: "Token tidak ditemukan" });
  const { targets, message, delay = 3000 } = req.body;
  // targets: [{ name, wa, role }]
  if (!targets || !targets.length || !message) {
    return res.status(400).json({ status: false, reason: "targets dan message wajib diisi" });
  }

  const results = [];
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    try {
      const params = new URLSearchParams({ target: t.wa, message: message.replace("{name}", t.name).replace("{role}", t.role), typing: true, delay: 2 });
      const response = await axios.post("https://api.fonnte.com/send", params.toString(), {
        headers: { Authorization: token, "Content-Type": "application/x-www-form-urlencoded" }
      });
      results.push({ name: t.name, wa: t.wa, status: response.data.status, detail: response.data });
    } catch {
      results.push({ name: t.name, wa: t.wa, status: false, detail: "Connection error" });
    }
    // jeda antar pesan agar tidak kena blokir WA
    if (i < targets.length - 1) await new Promise(r => setTimeout(r, delay));
  }

  const success = results.filter(r => r.status).length;
  res.json({ status: true, total: targets.length, success, failed: targets.length - success, results });
});

app.listen(PORT, () => {
  console.log(`✅ Fonnte Proxy berjalan di port ${PORT}`);
});
