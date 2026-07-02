const axios = require("axios");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

module.exports = async (req, res) => {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") return res.status(200).end();

  const path = req.url.split("?")[0];
  const token = req.headers["authorization"];

  // Health check
  if (req.method === "GET") {
    return res.json({ status: true, message: "Fonnte Proxy HR aktif ✓" });
  }

  if (!token) return res.json({ status: false, reason: "Token tidak ditemukan" });

  // Validate
  if (path.includes("validate")) {
    try {
      const response = await axios.get("https://api.fonnte.com/device", {
        headers: { Authorization: token }
      });
      return res.json({ status: true, detail: response.data });
    } catch (err) {
      return res.json({ status: false, reason: err.response?.data || "Gagal terhubung" });
    }
  }

  // Send
  if (path.includes("send")) {
    const { target, message, typing = true, delay = 2 } = req.body;
    if (!target || !message) return res.json({ status: false, reason: "target dan message wajib diisi" });
    try {
      const params = new URLSearchParams({ target, message, typing, delay });
      const response = await axios.post("https://api.fonnte.com/send", params.toString(), {
        headers: { Authorization: token, "Content-Type": "application/x-www-form-urlencoded" }
      });
      return res.json(response.data);
    } catch (err) {
      return res.json({ status: false, reason: err.response?.data || "Gagal kirim" });
    }
  }

  return res.json({ status: false, reason: "Endpoint tidak ditemukan" });
};
