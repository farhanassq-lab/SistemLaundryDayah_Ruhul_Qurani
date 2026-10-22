# SILAS Blue Horizon — Mobile-first redesign

Pembaruan visual untuk SILAS. Fokus: nuansa biru/navy/indigo di semua halaman, kartu premium, form input lebih teratur, tabel dan panel berwarna gelap, tipografi Manrope + DM Sans + Noto Sans JP, serta perbaikan posisi placeholder logo laundry agar tetap sejajar di header pada HP.

## Cara menerapkan dengan aman
1. Cadangkan file `styles.css` yang sekarang.
2. Ekstrak ZIP ini.
3. Salin `styles.css` dari ZIP ke folder project SILAS (mis. `D:\SILAS_Web`) dan pilih Replace.
4. Jangan mengganti `app.js`, `index.html`, atau `supabase-config.js` untuk pembaruan tema ini.
5. Jalankan `npx serve .` di folder project dan tekan `Ctrl+F5` di browser.
6. Periksa tampilan pada lebar HP 320–430 px serta desktop.
7. Jika sudah cocok, jalankan `git add styles.css && git commit -m "Redesign SILAS blue mobile first" && git push`.

## Catatan
- Tidak ada migrasi SQL yang dibutuhkan.
- Tidak ada pengubahan struktur database atau fungsi Supabase.
- Font Google (Manrope, DM Sans, Noto Sans JP) dimuat dari Google Fonts; jika offline, browser memakai fallback.
- Placeholder logo Laundry BUD_RQ ditampilkan ringkas pada HP agar tetap sejajar dengan identitas SILAS. Setelah logo asli ditambahkan di Pengaturan, periksa hasilnya lagi.
