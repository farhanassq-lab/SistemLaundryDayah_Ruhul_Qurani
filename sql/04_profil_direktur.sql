-- SILAS: tambah pengaturan profil Direktur untuk kartu dashboard
-- Jalankan satu kali di Supabase Dashboard > SQL Editor.
-- Aman dijalankan ulang karena menggunakan ADD COLUMN IF NOT EXISTS.

ALTER TABLE public.pengaturan_laporan
  ADD COLUMN IF NOT EXISTS nama_direktur TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS jabatan_direktur TEXT NOT NULL DEFAULT 'Direktur Badan Usaha Dayah Ruhul Qur’ani',
  ADD COLUMN IF NOT EXISTS kata_direktur TEXT NOT NULL DEFAULT 'Kebersihan dan kerapian adalah bagian dari pelayanan. Semoga setiap ikhtiar memudahkan santri dalam menuntut ilmu.',
  ADD COLUMN IF NOT EXISTS foto_direktur_data TEXT;

-- Verifikasi kolom setelah migrasi
SELECT id, nama_direktur, jabatan_direktur, updated_at
FROM public.pengaturan_laporan
WHERE id = 1;
