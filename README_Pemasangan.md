# SILAS — Laporan Masalah Laundry + Perbaikan Menu HP

## File dalam paket
- `index.html` — menu Laporan Masalah, formulir, riwayat laporan, dan mobile dock mandiri di luar appShell.
- `styles.css` — stylesheet lengkap yang berasal dari file SILAS sebelumnya ditambah aturan dock baru dan tampilan modul.
- `app.js` — logika laporan, upload foto privat, status tindak lanjut, dan berbagi WhatsApp.
- `SILAS_Laporan_Masalah.sql` — tabel Supabase, RLS, bucket foto privat, dan kebijakan storage.

Jangan mengganti `supabase-config.js` atau folder `assets`; pertahankan file yang ada pada proyek.

## Langkah pemasangan
1. Cadangkan folder `D:\SILAS_Web` terlebih dahulu.
2. Jalankan `SILAS_Laporan_Masalah.sql` di Supabase Dashboard → SQL Editor → New query → Run.
3. Ekstrak ZIP ini. Salin `index.html`, `styles.css`, dan `app.js` ke `D:\SILAS_Web`, lalu izinkan replace.
4. Jangan mengganti `supabase-config.js`, folder `assets`, atau file konfigurasi login.
5. Buka website lokal/hosting, login, lalu tekan `Ctrl+F5`.
6. Buka menu **Laporan** → tekan **Buat laporan masalah**. Di laptop, menu juga tersedia di sidebar.
7. Uji laporan tanpa foto terlebih dahulu, lalu uji dengan foto kecil JPG/PNG/WebP.

## Perbaikan menu HP
Menu bawah kini berupa elemen `<nav id="mobileBottomNav">` yang ditempatkan di luar `#appShell` dan sidebar. Ini menghindari aturan sidebar/overflow lama yang sebelumnya dapat menyembunyikan menu.
- Hanya tampil setelah login dan pada layar <= 850 px.
- Satu baris, tujuh tombol: Dashboard, Santri, Tahap, INPUT, Masalah, Laporan, Setelan. Tombol INPUT adalah item keempat (tepat di tengah) dan dibuat lebih besar.
- Tombol TAMBAH benar-benar diposisikan di tengah dock (absolute center), berwarna cokelat dengan aksen emas.
- Menu Laporan Masalah dapat dibuka langsung dari dock HP dan sidebar laptop.

## Laporan Masalah
- Jenis: hilang, rusak, tidak bersih/bernoda, tertukar, jumlah kurang, masih basah, bau, lainnya.
- Autocomplete santri aktif yang memiliki kamar; jenjang dan kamar otomatis ditampilkan.
- Foto opsional maksimal 5 MB dan disimpan dalam bucket privat `silas-laporan-masalah`.
- Status: baru, diperiksa, selesai.
- Tombol WhatsApp menyiapkan pesan dengan bagian Data Santri, Detail Pakaian, Keterangan, dan Mohon Bantuan. Bahasanya santai tetapi sopan, dengan spasi antarbagian agar mudah dibaca. Jika browser mendukung Web Share API untuk file, pengguna bisa memilih WhatsApp dan grup dari menu berbagi. Jika tidak, teks dibuka di WhatsApp dan foto mungkin perlu dilampirkan manual.
- Pesan tidak dikirim otomatis; petugas tetap memilih grup dan menekan tombol kirim.

## Keamanan
SQL memberi akses CRUD kepada pengguna Supabase yang sudah login (`authenticated`). Karena ini memberi akses bersama untuk semua akun SILAS yang terautentikasi, gunakan hanya akun petugas yang memang berhak mengakses data dayah. Foto privat tidak dibuat public; aplikasi memakai signed URL sementara untuk pratinjau.

## Troubleshooting menu HP
- Pastikan `index.html` dan `styles.css` keduanya diganti dari paket ini.
- Pastikan `app.js` juga diganti supaya `showApp()` menambahkan class `app-authenticated`.
- Login terlebih dahulu; dock memang sengaja disembunyikan pada layar login.
- Lakukan hard refresh `Ctrl+F5` di browser, atau clear cache site pada HP.
- Jika menu tetap tidak muncul di hosting, pastikan file terbaru sudah di-push dan hosting selesai deploy.


## Pembaruan terakhir
- Navigasi HP sekarang 7 item; INPUT ada di urutan ke-4 dan benar-benar berada di tengah.
- Laporan Masalah tampil langsung sebagai menu tersendiri di HP.
- Pesan WhatsApp menggunakan format terstruktur, baris kosong yang terjaga, bahasa santai-sopan, dan permintaan tindak lanjut sesuai jenis masalah.
