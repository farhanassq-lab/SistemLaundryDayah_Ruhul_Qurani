# SILAS — Animasi Login Premium

Paket ini berisi file SILAS terbaru dengan animasi login berurutan:
1. Pintu terbuka untuk memperlihatkan halaman login.
2. Setelah email/password valid di Supabase, kartu login tersobek menjadi dua bagian.
3. Pintu dashboard terbuka dan memperlihatkan halaman utama.

## Cara memasang
1. Cadangkan folder proyek SILAS yang sekarang.
2. Ekstrak ZIP ini.
3. Salin `index.html`, `app.js`, `styles.css`, serta folder `assets/` ke folder SILAS dan izinkan file dengan nama sama diganti.
4. Pertahankan `supabase-config.js` milikmu. File konfigurasi itu sengaja tidak disertakan agar URL dan publishable key milikmu tidak tertimpa.
5. Buka aplikasi melalui server lokal atau GitHub Pages, lalu coba login dengan akun uji.

## Perilaku login
- Animasi sobekan dan pintu dashboard hanya berjalan setelah Supabase menyatakan login berhasil.
- Jika kredensial salah, form tetap tersedia dan pesan error tetap ditampilkan.
- Animasi tidak membutuhkan tabel, kolom, atau migrasi SQL tambahan.
- Animasi menghormati pengaturan `prefers-reduced-motion`.

## Catatan
File diperiksa secara statis untuk sintaks JavaScript, keseimbangan kurung CSS, dan referensi aset lokal. Paket tidak diuji dengan kredensial Supabase aktif.
