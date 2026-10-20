# SILAS — Pembaruan Layout Dashboard

Pembaruan ini mengatur dashboard menjadi:
- Banner identitas bermotif foto masjid di paling atas dengan tinggi lebih kecil.
- Hero utama menggunakan foto santri berkelompok.
- Card Direktur ditempatkan di sebelah kanan hero santri pada laptop.
- Pada HP, hero santri tampil terlebih dahulu lalu card Direktur tepat di bawahnya; foto, nama, jabatan, dan kutipan tetap terlihat tanpa card yang terlalu tinggi.
- Ringkasan statistik dan periode tetap berada di bawah bagian hero.

## Penerapan
1. Cadangkan folder project yang berjalan.
2. Ganti `index.html` dan `styles.css` dengan versi dalam paket ini.
3. Pertahankan `app.js` dan `supabase-config.js` milik project yang sudah terhubung.
4. Jalankan `npx serve .` untuk menguji secara lokal.
5. Setelah cocok, commit dan push ke GitHub Pages.

Tidak ada migrasi SQL untuk pembaruan layout ini.
