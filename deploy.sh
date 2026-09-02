#!/bin/bash
set -e

echo "====================================================="
echo "   🚀 Memulai Deployment DealHunter di Server Lenovo"
echo "====================================================="

# 1. Periksa Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker belum terinstall di server ini."
    echo "Silakan install Docker terlebih dahulu: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# 2. Setup File .env jika belum ada
if [ ! -f .env ]; then
    echo "⚠️  File .env tidak ditemukan. Menyalin dari .env.example..."
    cp .env.example .env
    echo "✅ File .env berhasil dibuat. Silakan sesuaikan password atau IP jika diperlukan."
fi

# 3. Pull & Build Container
echo "📦 Membangun image Docker (PostgreSQL, Backend, Frontend)..."
docker compose down || true
docker compose up -d --build

# 4. Status Layanan
echo ""
echo "====================================================="
echo "   🎉 DealHunter Berhasil Berjalan di Server Lenovo!"
echo "====================================================="
echo ""
docker compose ps
echo ""
echo "Akses Aplikasi:"
echo "👉 Frontend (Web UI): http://<IP_SERVER_LENOVO>:3000"
echo "👉 Backend API:       http://<IP_SERVER_LENOVO>:8080/api/v1"
echo ""
echo "Periksa log dengan perintah: docker compose logs -f"
