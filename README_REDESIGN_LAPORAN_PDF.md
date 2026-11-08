# SILAS — Redesign Laporan PDF dan Pengelolaan Periode

## A. Pembaruan laporan PDF

- PDF menggunakan format A4 landscape dengan identitas navy, biru, dan emas.
- Kop surat memakai logo Laundry di kiri dan logo Dayah di kanan.
- Halaman pertama berisi ringkasan statistik periode.
- Satu kamar dimulai pada halaman tersendiri.
- Jika jumlah santri dalam satu kamar melebihi kapasitas halaman, tabel dilanjutkan pada halaman berikutnya dengan identitas kamar yang sama.
- Kamar berikutnya selalu dimulai di halaman baru, tidak memakai sisa halaman kamar sebelumnya.
- Setiap kolom Tahap 1–8 menampilkan dua informasi bertumpuk: berat dalam kg dan jumlah pakaian dalam potong.
- Total berat dan total pakaian ditampilkan secara terpisah.
- Baris TOTAL KAMAR merangkum berat dan pakaian untuk setiap tahap serta total kamar.
- Halaman lanjutan memiliki header laporan dan footer nomor halaman.
- Catatan lama yang belum memiliki jumlah pakaian diberi tanda `*`, bukan dianggap sebagai nol.

## B. Penghapusan periode

Menu **Periode & tahap** kini memiliki tombol **Hapus periode** pada setiap kartu periode.

Saat tombol dipilih, sistem meminta konfirmasi dan menjelaskan dampak penghapusan. Penghapusan dilakukan secara transaksional melalui fungsi Supabase:
- Catatan laundry yang terhubung ke tahap dalam periode tersebut dihapus.
- Tahap dalam periode tersebut dihapus.
- Periode dihapus.
- Laporan masalah tidak ikut dihapus; hubungan ke tahap yang dihapus dilepas oleh foreign key `ON DELETE SET NULL`.

**Penting:** penghapusan periode bersifat permanen. Unduh laporan PDF terlebih dahulu jika masih dibutuhkan.

## C. Cara memasang

1. Cadangkan project dan database terlebih dahulu.
2. Unggah file project hasil revisi ke repository/hosting seperti biasa.
3. Buka Supabase Dashboard → SQL Editor.
4. Buka file `sql/05_hapus_periode.sql` dari paket ini.
5. Jalankan SQL tersebut satu kali.
6. Buka ulang aplikasi SILAS, lalu masuk ke menu **Periode & tahap**.
7. Pastikan tombol **Hapus periode** muncul. Uji terlebih dahulu pada periode percobaan yang tidak berisi data penting.

## D. File yang diubah

- `app.js` — layout PDF per kamar, ringkasan berat dan potong setiap tahap, serta aksi hapus periode.
- `app-silas-revisi.js` — disinkronkan dengan `app.js`.
- `sistem.html` — penjelasan fitur laporan dan versi cache aplikasi.
- `styles.css` — gaya tombol hapus periode dan responsivitas.
- `sql/05_hapus_periode.sql` — fungsi Supabase untuk menghapus periode secara transaksional.

## E. Yang tidak diubah

- Skema tabel utama selain fungsi SQL penghapusan.
- Data santri, jenjang, dan kamar.
- Konfigurasi Supabase.
- Sistem login dan autentikasi.
- Data laporan masalah tetap dipertahankan.


## Pembaruan V11
- Setiap kamar sekarang dimulai dengan KOP surat resmi pada halaman tersendiri.
- Di bawah KOP ditampilkan informasi periode, jenjang, kamar, dan tanggal cetak dengan gaya formal.
- Warna laporan disederhanakan menjadi formal/minimal.
- Setiap kolom Tahap 1–8 menampilkan berat dan jumlah pakaian dalam satu sel.


## Pembaruan V12 — KOP pada setiap halaman lanjutan
- Jika data satu kamar berlanjut ke halaman kedua atau seterusnya, KOP surat lengkap diulang pada setiap halaman.
- Informasi periode, jenjang, kamar, dan tanggal cetak juga diulang pada halaman lanjutan.
- Header digambar sebelum isi tabel (bukan sesudah tabel), sehingga tidak menimpa baris santri.
- Area atas halaman lanjutan disediakan khusus untuk KOP dan identitas kamar.
- Pada halaman pertama, informasi jenjang dan kamar diletakkan tepat di bawah KOP; ringkasan periode berada setelahnya.
