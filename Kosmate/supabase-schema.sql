-- ============================================================
-- KosMate AI — Supabase Database Schema
-- Cara pakai: buka Supabase Dashboard > SQL Editor > New Query,
-- tempel seluruh isi file ini, lalu klik "Run".
-- ============================================================

-- 1) Tabel profil (nama tampilan tiap pengguna)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default 'Sobat Kos',
  created_at timestamp with time zone default now()
);

-- 2) Tabel target tabungan (satu baris per pengguna)
create table if not exists public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null default 'Target Tabunganku',
  target numeric not null default 1000000,
  current numeric not null default 0,
  updated_at timestamp with time zone default now()
);

-- 3) Tabel transaksi (banyak baris per pengguna)
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null check (type in ('income','expense')),
  category text not null,
  note text default '',
  amount numeric not null check (amount > 0),
  date date not null default current_date,
  created_at timestamp with time zone default now()
);

create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists goals_user_id_idx on public.goals(user_id);

-- ============================================================
-- Row Level Security: setiap pengguna HANYA bisa melihat & mengubah
-- datanya sendiri. Ini yang membuat aplikasi aman untuk multi-user.
-- ============================================================
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users manage own goals" on public.goals;
create policy "Users manage own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own transactions" on public.transactions;
create policy "Users manage own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Trigger: otomatis buat profil + target tabungan default
-- setiap kali ada pengguna baru mendaftar (sign up).
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Sobat Kos'));

  insert into public.goals (user_id, name, target, current)
  values (new.id, 'Laptop Baru untuk Kuliah', 5000000, 0);

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
