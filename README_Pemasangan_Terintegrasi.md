# SILAS — Landing Page + Animasi Login + Laporan Masalah

Paket ini mempertahankan landing page di `index.html` dan memulihkan aplikasi laundry yang berisi modul Laporan Masalah.

## Alur website
1. Link utama membuka `index.html` (landing page).
2. Tombol Masuk Sistem menuju `sistem.html`.
3. Halaman aplikasi memiliki animasi pintu login.
4. Login sukses menampilkan animasi kartu sobek dan pintu dashboard.
5. Dashboard tetap memiliki navigasi mobile tujuh menu, termasuk Input di tengah dan Laporan Masalah.

## Modul yang dipulihkan
- Laporan pakaian hilang, rusak, tidak bersih/bernoda, tertukar, jumlah kurang, masih basah, bau, dan lainnya.
- Pilih santri dari saran; jenjang dan kamar terisi otomatis.
- Unggah foto bukti ke bucket privat (maksimal 5 MB).
- Riwayat laporan dan status tindak lanjut: baru, diperiksa, selesai.
- Menyiapkan pesan WhatsApp berbahasa santai tetapi sopan; petugas tetap memilih grup dan menekan kirim.
- Laporan laundry PDF dan menu terkait tetap berasal dari paket modul laporan.

## File penting
- `index.html` — landing page utama.
- `landing.html`, `landing.css`, `landing.js`, `assets/landing/` — aset landing page.
- `sistem.html` — aplikasi laundry dengan modul Laporan Masalah.
- `app.js`, `styles.css` — logika aplikasi, modul laporan, navigasi, dan animasi login.
- `SILAS_Laporan_Masalah.sql` — migrasi tabel laporan masalah dan bucket foto.

## Cara memasang
1. Cadangkan folder/repository SILAS.
2. Salin isi paket ini ke folder repository dan izinkan file yang sama diganti.
3. Pertahankan `supabase-config.js` milikmu; file konfigurasi tersebut sengaja tidak disertakan.
4. Jika migrasi Laporan Masalah belum pernah dijalankan, buka Supabase Dashboard → SQL Editor lalu jalankan `SILAS_Laporan_Masalah.sql`. Jika sudah pernah dijalankan dan tabel/bucket sudah ada, tidak perlu mengulang.
5. Commit dan push perubahan ke GitHub.
6. Buka URL utama tanpa `/sistem.html` untuk melihat landing page, lalu uji tombol Masuk Sistem.

## Catatan
- Tidak ada perubahan pada skema tabel transaksi laundry yang sudah ada.
- Paket telah diperiksa secara statis; autentikasi, unggah foto, dan query Supabase tetap perlu diuji dengan konfigurasi proyek milik pengguna.


## Perbaikan V5 — deklarasi `start()` ganda
- Menghapus hanya deklarasi `async function start()` yang terduplikasi akibat penggabungan kode.
- Mempertahankan satu fungsi startup asli untuk modul aplikasi.
- Mempertahankan animasi login, modul Laporan Masalah, pesan WhatsApp, landing page, dan konfigurasi yang ada.
- Validasi `node --check` lulus. Tidak ada perubahan database.


## V6 — Cache-busting dan startup identifier
- Mengganti `async function start()` menjadi `async function initializeSilasApp()` dan memperbarui pemanggilnya.
- Mengubah URL script di `sistem.html` menjadi `app.js?v=silas-v6-fix-start-20261022` supaya browser meminta file terbaru, bukan cache URL versi sebelumnya.
- Tetap mempertahankan modul Laporan Masalah, pembuatan pesan WhatsApp, animasi login, dan landing page.
- Tidak ada perubahan database atau SQL yang diperlukan.


## V8 — Hapus laporan dari web & WhatsApp dengan foto
- Setiap kartu Laporan Masalah sekarang memiliki tombol merah **Hapus laporan** dengan konfirmasi.
- Menghapus hanya baris pada `laporan_masalah_laundry`, bukan data santri atau transaksi laundry.
- Jika laporan memiliki `foto_path`, aplikasi juga mencoba menghapus file tersebut dari bucket `silas-laporan-masalah`.
- Jika hapus foto gagal setelah laporan dihapus, aplikasi menampilkan peringatan agar file yatim dapat diperiksa di Storage.
- Tombol WhatsApp kini berlabel **WhatsApp + Foto**.
- Pada perangkat yang mendukung Web Share API untuk file, aplikasi membagikan foto dan teks melalui menu berbagi; pilih WhatsApp dan grup tujuan.
- Pada browser yang tidak mendukung berbagi file, foto diunduh dan WhatsApp dibuka dengan pesan; lampirkan foto yang diunduh secara manual sebelum mengirim.
- Cache-buster script diperbarui ke V8 agar browser mengambil app.js terbaru.
- Tidak ada perubahan SQL/database yang diperlukan untuk fitur tombol hapus jika kebijakan akses yang ada tetap mengizinkan operasi laporan dan Storage.
