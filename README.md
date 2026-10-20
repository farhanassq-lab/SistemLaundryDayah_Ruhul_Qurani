# SILAS — Sistem Informasi Laundry Santri

Versi frontend statis untuk GitHub Pages dengan Supabase PostgreSQL/Auth. Tidak membutuhkan .NET SDK atau backend Node.js yang berjalan terus-menerus.

## Fitur yang disiapkan

- Login petugas melalui Supabase Auth.
- Dashboard ringkas.
- Input laundry dengan autocomplete nama/NIS dan biodata otomatis.
- Berat laundry wajib; jumlah pakaian opsional.
- Snapshot nama, jenjang, dan kamar untuk mempertahankan riwayat.
- Master data santri: tambah, edit, aktif/nonaktif.
- Periode dan jumlah tahap fleksibel per bulan.
- Rekap catatan per tahap.
- Laporan PDF gabungan dengan ringkasan, rekap per tahap, jenjang, kamar, dan santri.
- Desain responsif untuk HP dan laptop.

## 1. Konfigurasi Supabase

1. Buka `supabase-config.js`.
2. Ganti `SUPABASE_URL` dengan Project URL dari Supabase Dashboard → Project Settings → API.
3. Ganti `SUPABASE_PUBLISHABLE_KEY` dengan publishable key (umumnya diawali `sb_publishable_...`) dari dashboard.
4. Jangan masukkan secret key atau service_role key ke file frontend.

Publishable key memang akan terlihat oleh browser. Keamanan data harus ditegakkan dengan RLS di database.

## 2. Pastikan skema database

Project Supabase harus sudah memiliki tabel yang dibuat pada langkah sebelumnya:

- `jenjang(id, nama)`
- `kamar(id, jenjang_id, nama)`
- `santri(id, nis, nama, kamar_id, status_aktif, created_at)`
- `periode_laundry(id, tahun, bulan)`
- `tahap_laundry(id, periode_id, nomor_tahap, tanggal_laundry, status)`
- `catatan_laundry(id, tahap_id, santri_id, berat_kg, jumlah_pakaian, santri_nama_snapshot, jenjang_nama_snapshot, kamar_nama_snapshot, created_by, created_at)`

Aplikasi ini menggunakan kolom-kolom persis seperti skema di atas.

## 3. Buat akun petugas

1. Di Supabase Dashboard, buka Authentication → Users.
2. Tambahkan pengguna secara manual dan atur email/password petugas.
3. Nonaktifkan sign-up publik untuk mencegah orang umum membuat akun.
4. Jangan buat fitur pendaftaran umum di frontend.

SQL awal yang digunakan dalam project memberi hak CRUD kepada setiap pengguna terautentikasi. Itu cocok hanya jika semua akun yang dibuat memang petugas tepercaya. Untuk penggunaan produksi, batasi akun yang boleh masuk dan tinjau RLS sebelum mengundang petugas.

## 4. Uji lokal

Karena aplikasi menggunakan JavaScript module dan CDN, jalankan melalui server lokal, bukan membuka file HTML langsung.

Di terminal VS Code pada folder project:

```bash
npx serve .
```

Jika `serve` belum tersedia, `npx` akan menawarkan untuk mengambil paket sementara. Alternatifnya, gunakan ekstensi VS Code Live Server.

Buka alamat lokal yang ditampilkan terminal. Login memakai akun petugas yang dibuat di Supabase.

## 5. Publikasikan ke GitHub Pages

1. Buat repository `silas-dayah`.
2. Upload seluruh isi folder project ini ke root repository (pastikan `index.html` berada di root).
3. Buka Settings → Pages.
4. Pada Build and deployment, pilih Deploy from a branch.
5. Pilih branch `main` dan folder `/ (root)`, lalu Save.
6. Tunggu sampai GitHub menampilkan URL Pages.

Pastikan URL Supabase dan publishable key sudah dikonfigurasi sebelum dipublikasikan. Repository Pages publik berarti semua kode frontend dapat dilihat publik; jangan memasukkan data santri ke file project.

## Catatan keamanan dan batasan

- Semua data santri dan catatan disimpan di Supabase, bukan GitHub.
- Jangan pernah memasukkan secret/service_role key ke browser.
- Pastikan RLS aktif pada semua tabel dan jangan izinkan anon mengakses data.
- Saat ini akun yang berhasil login mempunyai akses sesuai kebijakan RLS yang telah dibuat. Untuk produksi, disarankan kebijakan lebih ketat dan proses cadangan data.
- Paket gratis memiliki batas kuota dan ketersediaan; tidak ada jaminan layanan gratis selalu aktif tanpa gangguan.
- Logo Dayah, logo Bud RQ, foto santri, dan foto siluet masjid dapat ditambahkan ke folder `assets/` pada tahap desain berikutnya.
