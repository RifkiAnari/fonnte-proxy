const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Keep-alive ping supaya Railway tidak sleep
setInterval(() => {
  axios.get(`http://localhost:${PORT}/`).catch(() => {});
}, 4 * 60 * 1000); // ping setiap 4 menit

// ── Health check
app.get("/", (req, res) => {
  res.json({ status: true, message: "Fonnte Proxy HR aktif ✓" });
});

// ── Validate token — cek device aktif di Fonnte
app.post("/validate", async (req, res) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(400).json({ status: false, reason: "Token tidak ditemukan" });
  try {
    // Fonnte pakai endpoint /device untuk cek status token
    const response = await axios.get("https://api.fonnte.com/device", {
      headers: { Authorization: token }
    });
    // Kalau dapat response apapun dari Fonnte = token valid
    if (response.data) {
      res.json({ status: true, detail: response.data });
    } else {
      res.json({ status: false, reason: "Token tidak valid" });
    }
  } catch (err) {
    const errMsg = err.response?.data || "Gagal terhubung ke Fonnte";
    res.status(200).json({ status: false, reason: JSON.stringify(errMsg) });
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
    const errMsg = err.response?.data || "Gagal kirim pesan";
    res.status(200).json({ status: false, reason: JSON.stringify(errMsg) });
  }
});

// ── Blast ke banyak nomor
app.post("/blast", async (req, res) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(400).json({ status: false, reason: "Token tidak ditemukan" });
  const { targets, message, delay = 3000 } = req.body;
  if (!targets || !targets.length || !message) {
    return res.status(400).json({ status: false, reason: "targets dan message wajib diisi" });
  }
  const results = [];
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    try {
      const params = new URLSearchParams({
        target: t.wa,
        message: message.replace("{name}", t.name).replace("{role}", t.role),
        typing: true,
        delay: 2
      });
      const response = await axios.post("https://api.fonnte.com/send", params.toString(), {
        headers: { Authorization: token, "Content-Type": "application/x-www-form-urlencoded" }
      });
      results.push({ name: t.name, wa: t.wa, status: response.data.status, detail: response.data });
    } catch {
      results.push({ name: t.name, wa: t.wa, status: false, detail: "Connection error" });
    }
    if (i < targets.length - 1) await new Promise(r => setTimeout(r, delay));
  }
  const success = results.filter(r => r.status).length;
  res.json({ status: true, total: targets.length, success, failed: targets.length - success, results });
});

app.listen(PORT, () => {
  console.log(`✅ Fonnte Proxy berjalan di port ${PORT}`);
});
