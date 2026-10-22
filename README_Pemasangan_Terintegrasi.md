# SILAS — Landing Page + Animasi Login (Paket Terintegrasi)

Paket ini menggabungkan landing page SILAS dengan aplikasi laundry dan animasi login.

## Alur saat dibuka
1. Pengunjung membuka link website dan langsung melihat `index.html` (landing page).
2. Tombol **Masuk Sistem** / **Buka Aplikasi SILAS** menuju `sistem.html`.
3. Jika belum login, halaman aplikasi menampilkan login dengan animasi pintu terbuka.
4. Setelah Supabase memverifikasi email dan password, kartu login tersobek dan pintu dashboard terbuka.
5. Jika login gagal, form tetap tersedia dan pesan kesalahan ditampilkan.

## Isi penting
- `index.html` — landing page utama yang dibuka otomatis oleh GitHub Pages.
- `landing.html` — salinan landing page untuk referensi/pengeditan.
- `landing.css`, `landing.js` — gaya dan interaksi landing page.
- `sistem.html` — aplikasi SILAS dengan halaman login dan dashboard.
- `app.js`, `styles.css` — aplikasi laundry dan animasi login.
- `assets/landing/` — foto masjid, santri, dan logo untuk landing page.
- `assets/` — aset aplikasi SILAS.

## Cara memasang
1. Cadangkan repository / folder proyek SILAS terlebih dahulu.
2. Ekstrak ZIP ini.
3. Salin file dan folder dari paket ke folder repository website.
4. Izinkan penggantian `index.html`, `landing.html`, `landing.css`, `landing.js`, `sistem.html`, `app.js`, `styles.css`, dan folder `assets` jika diminta.
5. **Jangan hapus atau ganti `supabase-config.js` milikmu.** File itu tidak disertakan agar URL dan publishable key Supabase milikmu tetap aman. Pastikan file tersebut berada di folder yang sama dengan `sistem.html` dan `app.js`.
6. Commit dan push perubahan ke GitHub, lalu tunggu GitHub Pages selesai menerbitkan.
7. Buka link utama repository (tanpa `/sistem.html`) — landing page seharusnya muncul lebih dulu.

## Catatan keamanan dan data
- Tidak ada perubahan database atau skema SQL.
- `supabase-config.js` sengaja dipertahankan dari proyek milik pengguna.
- Landing page tidak mengakses database.
- Paket telah diperiksa secara statis; autentikasi tetap perlu diuji dengan konfigurasi Supabase milik pengguna.


## Revisi animasi V2 — lebih lambat dan sobekan terlihat
- Animasi pintu saat halaman login terbuka diperpanjang menjadi sekitar 1,95 detik.
- Kartu login kini dibuat menjadi dua lapisan visual dengan isi form yang sama, lalu dipisahkan mengikuti tepi sobekan bergerigi. Efek ini menggantikan sobekan pseudo-element yang sebelumnya sulit terlihat.
- Garis sobekan memakai aksen vermilion dan emas, dengan serpihan kertas yang terlempar.
- Efek sobekan berlangsung sekitar 2,3 detik sebelum transisi dashboard dimulai.
- Pintu dashboard diberi jeda singkat lalu terbuka selama sekitar 1,9 detik.
- Autentikasi Supabase tetap sama; animasi sobekan hanya berjalan setelah login berhasil.
