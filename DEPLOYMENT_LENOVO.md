# 🌐 Panduan Deployment DealHunter: Subdomain `ramadhaninursarjito.tech` (Stack EDGE + Cloudflare Tunnel)

Panduan deployment resmi **DealHunter** menggunakan arsitektur **Stack EDGE (Caddy + Cloudflare Tunnel)** di server **Lenovo**, persis seperti setup **Habitus**.

---

## 🎯 Alamat Subdomain Resmi (HTTPS Otomatis via Cloudflare)

| Layanan | Subdomain Publik (HTTPS) | Internal Docker Network (`edge`) |
|---|---|---|
| **Frontend Web (YouTube UI)** | `https://dealhunter.ramadhaninursarjito.tech` | `dealhunter-frontend:3000` |
| **Backend REST API** | `https://dealhunter-api.ramadhaninursarjito.tech` | `dealhunter-backend:8080` |

---

## 🏗️ Cara Kerja Arsitektur

```
[Internet / Pengguna Luar]
          │ (HTTPS via Cloudflare)
          ▼
   [Cloudflare Tunnel]
          │
          ▼
   [Caddy Reverse Proxy (edge-caddy)]
          │ (Routing berdasarkan Hostname di network "edge")
          ├──► dealhunter.ramadhaninursarjito.tech     ──► dealhunter-frontend:3000
          └──► dealhunter-api.ramadhaninursarjito.tech ──► dealhunter-backend:8080
```

---

## 🚀 LANGKAH DEPLOYMENT DI SERVER LENOVO

### Langkah 1: Hubungkan DNS Cloudflare Tunnel (Cukup Sekali)
Di terminal server Lenovo Anda:
```bash
# Daftarkan DNS route untuk kedua subdomain ke tunnel Anda (misal nama tunnel: home-laptop)
cloudflared tunnel route dns home-laptop dealhunter.ramadhaninursarjito.tech
cloudflared tunnel route dns home-laptop dealhunter-api.ramadhaninursarjito.tech
```

---

### Langkah 2: Tambahkan Konfigurasi ke Caddyfile & Cloudflared di Server Lenovo

Jika belum terpasang di `~/infra/edge/Caddyfile`, tambahkan blok berikut:
```caddy
# --- dealhunter frontend (Next.js 16) ---
http://dealhunter.ramadhaninursarjito.tech {
	encode zstd gzip
	reverse_proxy dealhunter-frontend:3000
}

# --- dealhunter backend (Go + Fiber) ---
http://dealhunter-api.ramadhaninursarjito.tech {
	encode zstd gzip
	reverse_proxy dealhunter-backend:8080
}
```

Dan di file konfigurasi Cloudflare Tunnel (`~/infra/edge/cloudflared/config.yml`), pastikan ingress sudah ada:
```yaml
  - hostname: dealhunter.ramadhaninursarjito.tech
    service: http://caddy:80
  - hostname: dealhunter-api.ramadhaninursarjito.tech
    service: http://caddy:80
```

Reload Caddy agar aturan baru aktif:
```bash
docker exec edge-caddy caddy reload --config /etc/caddy/Caddyfile
# Jika perlu restart cloudflared:
docker compose -f ~/infra/edge/docker-compose.yml restart cloudflared
```

---

### Langkah 3: Deploy Aplikasi DealHunter di Server Lenovo

1. Masuk ke folder aplikasi di server Lenovo (clone atau pull kode terbaru):
   ```bash
   cd ~/reseller-app || git clone git@github.com:rdsarjito/dealhunter.git ~/reseller-app && cd ~/reseller-app
   git pull origin main
   ```

2. Siapkan file `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Secara otomatis `NEXT_PUBLIC_API_URL` sudah terisi `https://dealhunter-api.ramadhaninursarjito.tech/api/v1`)*

3. Jalankan Docker Compose:
   ```bash
   docker compose up -d --build
   ```

---

## ✅ Selesai! Akses Aplikasi Secara Publik & Aman (HTTPS):

Buka browser dari mana saja (tanpa perlu VPN / berada di jaringan lokal):
- 🖥️ **Web UI DealHunter**: **[https://dealhunter.ramadhaninursarjito.tech](https://dealhunter.ramadhaninursarjito.tech)**
- ⚙️ **API Endpoint**: **[https://dealhunter-api.ramadhaninursarjito.tech/api/v1/listings](https://dealhunter-api.ramadhaninursarjito.tech/api/v1/listings)**
- 🩺 **Health Check**: **[https://dealhunter-api.ramadhaninursarjito.tech/health](https://dealhunter-api.ramadhaninursarjito.tech/health)**
