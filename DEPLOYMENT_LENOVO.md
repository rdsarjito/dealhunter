# 🚀 Panduan Lengkap: Pembuatan Repo Git & Deployment di Server Lenovo

Panduan praktis dan detail mulai dari membuat repository di GitHub, menghubungkan kode dari laptop Mac, hingga menjalankan kontainer Docker di server **Lenovo**.

---

## 📌 Rangkuman Alur Kerja

```
[Laptop Mac] 
  1. git init & commit (Sudah selesai disiapkan!)
  2. Push ke GitHub (atau transfer via rsync)
          │
          ▼
[Server Lenovo]
  3. git clone repo
  4. Atur .env (isi IP server Lenovo)
  5. Jalankan ./deploy.sh (docker compose up -d --build)
```

---

## 🛠️ LANGKAH 1: Buat Repository Baru di GitHub

1. Buka browser dan kunjungi: **[https://github.com/new](https://github.com/new)**
2. Isi formulir pembuatan repository:
   - **Repository name**: `reseller-app` (atau `dealhunter`)
   - **Visibility**: Pilih **Private** (disarankan) atau **Public**
   - ⚠️ **PENTING**: **JANGAN centang** *"Add a README file"*, *"Add .gitignore"*, atau *"Choose a license"* (karena di folder lokal kita sudah memiliki semua berkas dan commit pertama yang rapi).
3. Klik tombol hijau **Create repository**.
4. Salin URL repository yang muncul (misalnya: `https://github.com/USERNAME/reseller-app.git`).

---

## 💻 LANGKAH 2: Hubungkan & Push Kode dari Mac Anda

Buka Terminal di Mac Anda dan jalankan perintah berikut (ganti `USERNAME` dengan username GitHub Anda):

```bash
cd /Users/rama/projects/reseller-app

# 1. Hubungkan repo lokal dengan GitHub
git remote add origin https://github.com/USERNAME/reseller-app.git

# 2. Pastikan branch utama bernama main
git branch -M main

# 3. Push kode ke GitHub
git push -u origin main
```

*(Jika diminta login/token di terminal, gunakan Personal Access Token GitHub Anda).*

---

## 🏢 LANGKAH 3: Di Server Lenovo (Clone & Konfigurasi)

Buka terminal Server Lenovo Anda (misalnya via SSH: `ssh user@IP_SERVER_LENOVO`):

### 1. Install Docker jika belum ada di Lenovo
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone Repository ke Server Lenovo
```bash
git clone https://github.com/USERNAME/reseller-app.git
cd reseller-app
```

### 3. Buat dan Sesuaikan File `.env`
Salin template konfigurasi:
```bash
cp .env.example .env
nano .env
```

Sesuaikan isi `.env`:
```env
# Database Credentials
DB_USER=dealhunter
DB_PASSWORD=buat_password_kuat_disini
DB_NAME=dealhunter
DB_PORT=5432

# Token Bot Telegram (Opsional, dari @BotFather)
TELEGRAM_BOT_TOKEN=

# PENTING: Masukkan IP Server Lenovo Anda
# Contoh jika IP lokal Lenovo adalah 192.168.1.150:
NEXT_PUBLIC_API_URL=http://192.168.1.150:8080/api/v1
```
*(Tekan `Ctrl + O` lalu `Enter` untuk simpan, dan `Ctrl + X` untuk keluar dari nano).*

### 4. Buka Port Firewall di Lenovo (Jika server menggunakan UFW)
```bash
sudo ufw allow 3000/tcp   # Web UI Frontend
sudo ufw allow 8080/tcp   # Backend API
```

---

## 🚀 LANGKAH 4: Jalankan Aplikasi di Server Lenovo

Cukup jalankan script deployment otomatis yang telah disediakan:
```bash
./deploy.sh
```

Atau jalankan perintah docker compose secara manual:
```bash
docker compose up -d --build
```

Docker di server Lenovo akan otomatis:
1. Menyalakan kontainer **PostgreSQL 16** dan menunggu sampai database siap.
2. Membangun image **Backend Go Fiber** yang sudah dilengkapi browser **Chromium Headless** untuk scraping Facebook Marketplace.
3. Membangun image **Frontend Next.js** dalam mode standalone yang hemat RAM (~120MB).
4. Melakukan *auto-migrate* tabel-tabel database.

---

## 🌐 LANGKAH 5: Buka Aplikasi dari Browser

Buka browser dari laptop Mac, HP, atau tablet Anda yang terhubung ke jaringan yang sama dengan server Lenovo:
- **Tampilan Web DealHunter**: `http://<IP_SERVER_LENOVO>:3000`
- **Backend Health Check**: `http://<IP_SERVER_LENOVO>:8080/health`
- **Endpoint API**: `http://<IP_SERVER_LENOVO>:8080/api/v1/listings`

---

## ⚡ OPSI ALTERNATIF: Langsung Transfer dari Mac ke Lenovo (Tanpa GitHub)

Jika Anda ingin langsung menguji coba di server Lenovo sekarang tanpa perlu membuat repository di GitHub terlebih dahulu, jalankan perintah **rsync** ini langsung dari terminal Mac Anda:

```bash
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' /Users/rama/projects/reseller-app/ user@<IP_SERVER_LENOVO>:~/reseller-app/
```

Setelah transfer selesai, masuk ke server Lenovo (`ssh user@<IP_SERVER_LENOVO>`), lalu:
```bash
cd ~/reseller-app
cp .env.example .env
nano .env # Ganti NEXT_PUBLIC_API_URL ke IP Lenovo
./deploy.sh
```

---

## 🔄 Perintah Berguna di Server Lenovo

- **Melihat log real-time**: `docker compose logs -f`
- **Melihat status kontainer**: `docker compose ps`
- **Menghentikan aplikasi**: `docker compose down`
- **Restart kontainer**: `docker compose restart`
- **Update kode terbaru (jika pakai git)**: `git pull && docker compose up -d --build`
