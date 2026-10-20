-- SILAS migration: periode bernomor + pengaturan kop surat PDF
-- Jalankan sekali di Supabase Dashboard > SQL Editor.
-- Data santri/catatan yang sudah ada tidak dihapus.

-- 1) Tambahkan nomor periode berurutan. Periode lama (bulan/tahun) dipetakan
-- menurut urutan tahun-bulan ke Periode 1, Periode 2, dan seterusnya.
ALTER TABLE public.periode_laundry
  ADD COLUMN IF NOT EXISTS nomor_periode INTEGER;

WITH urutan AS (
  SELECT id,
         ROW_NUMBER() OVER (
           ORDER BY COALESCE(tahun, 0), COALESCE(bulan, 0), id
         )::INTEGER AS nomor_baru
  FROM public.periode_laundry
  WHERE nomor_periode IS NULL
)
UPDATE public.periode_laundry p
SET nomor_periode = u.nomor_baru
FROM urutan u
WHERE p.id = u.id;

-- Nomor periode sekarang menjadi identitas urutan; bulan dan tahun lama tidak wajib.
ALTER TABLE public.periode_laundry
  ALTER COLUMN nomor_periode SET NOT NULL,
  ALTER COLUMN tahun DROP NOT NULL,
  ALTER COLUMN bulan DROP NOT NULL;

-- Hapus constraint unik lama (tahun, bulan) bila masih ada, karena periode
-- sekarang tidak lagi dibedakan berdasarkan kalender.
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    WHERE con.conrelid = 'public.periode_laundry'::regclass
      AND con.contype = 'u'
      AND (
        SELECT array_agg(att.attname::TEXT ORDER BY keycols.ordinality)
        FROM unnest(con.conkey) WITH ORDINALITY AS keycols(attnum, ordinality)
        JOIN pg_attribute att
          ON att.attrelid = con.conrelid AND att.attnum = keycols.attnum
      ) = ARRAY['tahun','bulan']::TEXT[]
  LOOP
    EXECUTE format('ALTER TABLE public.periode_laundry DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_periode_laundry_nomor_periode
  ON public.periode_laundry (nomor_periode);

-- Batasi tahap ke 1–8. Jika sebelumnya ada tahap > 8, periksa data itu dahulu.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.tahap_laundry WHERE nomor_tahap > 8 OR nomor_tahap < 1) THEN
    RAISE EXCEPTION 'Ada data tahap di luar rentang 1–8. Periksa tabel tahap_laundry sebelum melanjutkan migrasi.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.tahap_laundry'::regclass
      AND conname = 'tahap_laundry_nomor_tahap_1_8_check'
  ) THEN
    ALTER TABLE public.tahap_laundry
      ADD CONSTRAINT tahap_laundry_nomor_tahap_1_8_check
      CHECK (nomor_tahap BETWEEN 1 AND 8);
  END IF;
END $$;

-- 2) Pengaturan kop surat dan logo untuk laporan PDF.
-- Logo disimpan sebagai data URL base64; batas unggahan pada web adalah 1 MB per logo.
CREATE TABLE IF NOT EXISTS public.pengaturan_laporan (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nama_dayah TEXT NOT NULL DEFAULT 'Dayah Ruhul Qur’ani',
  alamat TEXT NOT NULL DEFAULT '',
  kontak TEXT NOT NULL DEFAULT '',
  judul_laporan TEXT NOT NULL DEFAULT 'REKAPITULASI LAUNDRY SANTRI',
  logo_dayah_data TEXT,
  logo_laundry_data TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pengaturan_laporan ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.pengaturan_laporan TO authenticated;

DROP POLICY IF EXISTS "petugas_kelola_pengaturan_laporan" ON public.pengaturan_laporan;
CREATE POLICY "petugas_kelola_pengaturan_laporan"
  ON public.pengaturan_laporan
  FOR ALL TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

INSERT INTO public.pengaturan_laporan (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Verifikasi hasil migrasi.
SELECT id, nomor_periode FROM public.periode_laundry ORDER BY nomor_periode;
SELECT id, nama_dayah, judul_laporan, updated_at FROM public.pengaturan_laporan;
