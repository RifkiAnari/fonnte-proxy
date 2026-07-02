# Fonnte Proxy – HR System Rifky

Server kecil ini jadi jembatan antara dashboard HR dan Fonnte API,
supaya tidak kena blokir CORS di browser.

## Endpoints

| Method | Path        | Fungsi                        |
|--------|-------------|-------------------------------|
| GET    | /           | Health check                  |
| POST   | /validate   | Cek token Fonnte              |
| POST   | /send       | Kirim pesan ke 1 nomor        |
| POST   | /blast      | Kirim ke banyak nomor + delay |

## Deploy ke Railway (GRATIS)

1. Buat akun di **railway.app**
2. Klik **"New Project"** → **"Deploy from GitHub"**
3. Upload folder `fonnte-proxy` ini ke GitHub repo baru
4. Railway otomatis detect Node.js dan deploy
5. Copy URL yang diberikan Railway (contoh: `https://fonnte-proxy-xxx.up.railway.app`)
6. Paste URL itu ke field **"Proxy URL"** di Pengaturan dashboard HR

## Deploy ke Render (GRATIS)

1. Buat akun di **render.com**
2. Klik **"New Web Service"**
3. Connect GitHub repo → pilih folder ini
4. Build command: `npm install`
5. Start command: `node index.js`
6. Klik **Deploy**
7. Copy URL Render → paste ke Pengaturan dashboard HR

## Test lokal

```bash
npm install
npm start
# Server jalan di http://localhost:3001
```

Test kirim pesan:
```bash
curl -X POST http://localhost:3001/send \
  -H "Authorization: TOKEN_FONNTE_KAMU" \
  -H "Content-Type: application/json" \
  -d '{"target":"628xxxxxxxxx","message":"Test HR System!"}'
```
