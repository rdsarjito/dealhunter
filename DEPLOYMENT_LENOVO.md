# 🚀 Panduan Deployment DealHunter di Server Lenovo (Docker)

Panduan lengkap untuk men-deploy aplikasi **DealHunter** (Frontend Next.js, Backend Go Fiber + Chromium Scraper, dan Database PostgreSQL) ke server fisik **Lenovo** menggunakan **Docker Compose**.

---

## 🏗️ Arsitektur Kontainer

| Layanan | Image / Base | Port | Fungsi |
|---|---|---|---|
| **`postgres`** | `postgres:16-alpine` | `5432` | Database relasional untuk menyimpan listings, alerts, watchlist, dan riwayat |
| **`backend`** | Multi-stage `golang:1.24` + `debian:bookworm-slim` (dengan Chromium) | `8080` | REST API Server Go Fiber + Scraper otomatis Facebook Marketplace |
| **`frontend`** | Multi-stage `node:20-alpine` (Next.js 16 Standalone) | `3000` | Antarmuka Web responsif ala YouTube |

---

## 📋 1. Persiapan di Server Lenovo

Pastikan Server Lenovo Anda (Ubuntu/Debian/Linux) sudah terinstall **Docker** dan **Docker Compose**.

Jika belum terinstall, jalankan perintah ini di terminal Server Lenovo:
```bash
# Update repository
sudo apt update && sudo apt upgrade -y

# Install Docker otomatis
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Izinkan user saat ini menjalankan docker tanpa sudo
sudo usermod -aG docker $USER
newgrp docker

# Verifikasi instalasi
docker --version
docker compose version
```

---

## 📦 2. Mentransfer Kode ke Server Lenovo

Anda dapat menggunakan **Git** atau mentransfer folder proyek dari laptop Mac ke server Lenovo via **`rsync`**:

### Opsi A: Menggunakan Git (Direkomendasikan)
Di server Lenovo:
```bash
git clone <URL_REPO_ANDA> reseller-app
cd reseller-app
```

### Opsi B: Transfer Langsung dari Mac (via rsync)
Jalankan perintah ini dari terminal Mac Anda (ganti `user` dan `IP_LENOVO`):
```bash
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude 'dealhunter-backend' /Users/rama/projects/reseller-app/ user@<IP_SERVER_LENOVO>:~/reseller-app/
```

---

## ⚙️ 3. Konfigurasi Lingkungan (`.env`)

Masuk ke direktori proyek di server Lenovo:
```bash
cd ~/reseller-app
cp .env.example .env
nano .env
```

Sesuaikan isi `.env`:
```env
# Database Credentials
DB_USER=dealhunter
DB_PASSWORD=buat_password_rahasia_disini
DB_NAME=dealhunter
DB_PORT=5432

# Token Bot Telegram (Opsional, dapatkan dari @BotFather)
TELEGRAM_BOT_TOKEN=

# PENTING: Ganti dengan IP lokal atau domain Server Lenovo Anda
# Contoh jika IP lokal server adalah 192.168.1.150:
NEXT_PUBLIC_API_URL=http://192.168.1.150:8080/api/v1
```

> **Catatan Penting `NEXT_PUBLIC_API_URL`**:
> Karena Next.js berjalan di browser klien (laptop/HP Anda), browser Anda akan menghubungi backend melalui alamat ini. Gunakan IP lokal server Lenovo (misal `http://192.168.1.xxx:8080/api/v1`) atau nama domain jika server dapat diakses publik.

---

## 🛡️ 4. Buka Port Firewall di Server Lenovo

Jika server Lenovo Anda menggunakan firewall `ufw`, buka port untuk Web UI dan API:
```bash
sudo ufw allow 3000/tcp   # Frontend Next.js
sudo ufw allow 8080/tcp   # Backend API
sudo ufw allow 22/tcp     # SSH (Pastikan tetap terbuka)
sudo ufw status
```

---

## 🚀 5. Jalankan Deployment Otomatis

Cukup jalankan script deployment otomatis yang telah disediakan:
```bash
./deploy.sh
```

Atau jalankan perintah Docker Compose secara manual:
```bash
docker compose up -d --build
```

Docker akan otomatis:
1. Menjalankan kontainer PostgreSQL dan menunggu sampai database siap (*healthy*).
2. Membangun image backend Go beserta browser Chromium untuk scraper.
3. Mengompilasi frontend Next.js dalam mode *standalone* berukuran ringan.
4. Melakukan *auto-migration* tabel database secara otomatis.

---

## 🔍 6. Memeriksa Status & Log

### Cek Status Kontainer
```bash
docker compose ps
```
*Output seharusnya menunjukkan ketiga kontainer berstatus `Up` (dan database `healthy`).*

### Melihat Log Real-Time
```bash
# Semua log layanan
docker compose logs -f

# Hanya log backend (melihat scraper / Telegram)
docker compose logs -f backend

# Hanya log frontend
docker compose logs -f frontend

# Hanya log database
docker compose logs -f postgres
```

---

## 🌐 7. Mengakses Aplikasi

Buka browser dari laptop, tablet, atau HP apa saja yang berada di jaringan yang sama:
- **Frontend (Web UI YouTube Design)**: `http://<IP_SERVER_LENOVO>:3000`
- **Backend Healthcheck**: `http://<IP_SERVER_LENOVO>:8080/health`
- **API Endpoint**: `http://<IP_SERVER_LENOVO>:8080/api/v1/listings`

---

## 🔄 8. Perintah Operasional Sehari-hari

| Tindakan | Perintah |
|---|---|
| **Menghentikan aplikasi** | `docker compose stop` |
| **Menjalankan kembali** | `docker compose start` |
| **Mematikan & membersihkan kontainer** | `docker compose down` |
| **Update kode terbaru & build ulang** | `git pull && docker compose up -d --build` |
| **Melihat pemakaian RAM & CPU** | `docker stats` |
| **Backup database PostgreSQL** | `docker compose exec postgres pg_dump -U dealhunter dealhunter > backup.sql` |
| **Restore database PostgreSQL** | `docker compose exec -T postgres psql -U dealhunter dealhunter < backup.sql` |
