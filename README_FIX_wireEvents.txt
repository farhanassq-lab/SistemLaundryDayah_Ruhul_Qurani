# SILAS V7 — Fix duplicate wireEvents

Perbaikan ini menghapus deklarasi `wireEvents()` yang terduplikasi di `app.js`.
Deklarasi yang dipertahankan adalah versi lengkap yang juga memuat event handler untuk modul Laporan Masalah.

## Pemasangan aman
1. Cadangkan `D:\SILAS_Web\app.js`.
2. Ekstrak ZIP ini.
3. Salin **hanya `app.js`** ke `D:\SILAS_Web\app.js`, lalu pilih Replace.
4. Jangan mengganti `sistem.html`, `supabase-config.js`, atau file database untuk perbaikan ini.
5. Di CMD jalankan:

```bat
cd /d D:\SILAS_Web
git add app.js
git commit -m "Fix duplicate wireEvents declaration"
git push origin main
```

6. Setelah GitHub Pages diperbarui, buka website lalu tekan `Ctrl + Shift + R`.

## Yang dipertahankan
- Landing page tetap ada.
- Animasi login dan pintu dashboard tetap ada.
- Modul Laporan Masalah dan event handler-nya tetap ada.
- Tidak ada perubahan database/SQL.
