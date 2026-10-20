-- Jalankan hanya untuk memeriksa apakah tabel utama SILAS sudah tersedia.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'jenjang','kamar','santri','periode_laundry','tahap_laundry','catatan_laundry'
  )
ORDER BY table_name;
