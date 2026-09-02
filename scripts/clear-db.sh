#!/bin/bash
echo "🧹 Membersihkan database DealHunter..."
docker exec dealhunter-db psql -U dealhunter -d dealhunter -c "
  TRUNCATE listings, price_histories CASCADE;
  DELETE FROM price_alerts;
"
echo "✅ Database bersih! Semua listings, alerts, dan price history telah dihapus."
