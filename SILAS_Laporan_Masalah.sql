-- SILAS: Modul Laporan Masalah Laundry
-- Jalankan satu kali di Supabase Dashboard > SQL Editor.
-- Bucket foto bersifat PRIVATE; foto tidak dapat dibuka publik tanpa signed URL.

create extension if not exists pgcrypto;

create table if not exists public.laporan_masalah_laundry (
  id uuid primary key default gen_random_uuid(),
  santri_id uuid not null references public.santri(id) on delete restrict,
  santri_nama_snapshot text not null,
  jenjang_nama_snapshot text not null default '-',
  kamar_nama_snapshot text not null default '-',
  jenis_masalah text not null check (
    jenis_masalah in ('hilang','rusak','tidak_bersih','tertukar','jumlah_kurang','basah','bau','lainnya')
  ),
  nama_pakaian text not null,
  jumlah_pakaian integer not null default 1 check (jumlah_pakaian between 1 and 100),
  deskripsi text not null,
  tanggal_ditemukan date not null default current_date,
  tahap_id uuid null references public.tahap_laundry(id) on delete set null,
  status text not null default 'baru' check (status in ('baru','diperiksa','selesai')),
  foto_path text null,
  created_by uuid null references auth.users(id) on delete set null,
  resolved_by uuid null references auth.users(id) on delete set null,
  resolved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_laporan_masalah_created_at
  on public.laporan_masalah_laundry (created_at desc);
create index if not exists idx_laporan_masalah_status
  on public.laporan_masalah_laundry (status);
create index if not exists idx_laporan_masalah_santri
  on public.laporan_masalah_laundry (santri_id);

alter table public.laporan_masalah_laundry enable row level security;

drop policy if exists "SILAS authenticated access issue reports" on public.laporan_masalah_laundry;
create policy "SILAS authenticated access issue reports"
on public.laporan_masalah_laundry
for all to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'silas-laporan-masalah',
  'silas-laporan-masalah',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "SILAS authenticated access issue photos" on storage.objects;
create policy "SILAS authenticated access issue photos"
on storage.objects
for all to authenticated
using (bucket_id = 'silas-laporan-masalah')
with check (bucket_id = 'silas-laporan-masalah');
