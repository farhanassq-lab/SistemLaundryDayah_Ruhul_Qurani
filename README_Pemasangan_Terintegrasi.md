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
