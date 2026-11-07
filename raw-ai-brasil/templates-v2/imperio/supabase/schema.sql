-- =====================================================================
-- Barbearia do Império — backend (Supabase, projeto team476 "team476's Project")
-- Fase 2: agenda por cadeira + comanda/POS + vendas. Aplicado em 2026-11-07.
-- Público (anon): lê cadeiras/serviços/produtos ativos e os horários ocupados,
--   e cria agendamentos (status 'agendado'). Tudo o mais exige login (owner).
-- =====================================================================
create extension if not exists pgcrypto;

create table if not exists public.imperio_chairs (
  id          serial primary key,
  numero      text not null,                 -- '01'
  barbeiro    text not null,                 -- nome do barbeiro
  especialidade text,
  dias        text,                          -- texto livre p/ o site
  pin_hash    text,                          -- PIN de 4 dígitos (crypt) p/ a visão do barbeiro
  comissao_pct numeric(5,2) not null default 50,
  ativo       boolean not null default true,
  ordem       int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.imperio_services (
  id          serial primary key,
  nome        text not null,
  preco       numeric(10,2),                 -- null = "consulte"
  duracao_min int not null default 30,
  ativo       boolean not null default true,
  ordem       int not null default 0
);

create table if not exists public.imperio_products (
  id          serial primary key,
  nome        text not null,
  categoria   text,
  preco       numeric(10,2) not null,
  estoque     int,
  ativo       boolean not null default true
);

create table if not exists public.imperio_appointments (
  id          uuid primary key default gen_random_uuid(),
  chair_id    int not null references public.imperio_chairs(id),
  service_id  int references public.imperio_services(id),
  cliente_nome text not null,
  cliente_whatsapp text,
  inicio      timestamptz not null,
  fim         timestamptz not null,
  status      text not null default 'agendado'
              check (status in ('agendado','confirmado','atendido','cancelado','faltou')),
  origem      text not null default 'site' check (origem in ('site','balcao','whatsapp')),
  obs         text,
  created_at  timestamptz not null default now(),
  check (fim > inicio)
);
create index if not exists imperio_appointments_chair_inicio on public.imperio_appointments (chair_id, inicio);

create table if not exists public.imperio_sales (
  id          uuid primary key default gen_random_uuid(),
  chair_id    int references public.imperio_chairs(id),
  appointment_id uuid references public.imperio_appointments(id),
  data        timestamptz not null default now(),
  itens       jsonb not null default '[]',   -- [{tipo:'servico'|'produto'|'curso', nome, preco, qtd}]
  total       numeric(10,2) not null,
  pagamento   text not null check (pagamento in ('pix','cartao','dinheiro')),
  comissao_pct numeric(5,2),
  comissao_valor numeric(10,2),
  obs         text,
  created_at  timestamptz not null default now()
);
create index if not exists imperio_sales_data on public.imperio_sales (data);

create table if not exists public.imperio_settings (
  key   text primary key,
  value jsonb not null
);

-- Horários ocupados (sem dados do cliente) p/ o site montar a grade de slots.
create or replace view public.imperio_slots_taken as
  select chair_id, inicio, fim from public.imperio_appointments
  where status in ('agendado','confirmado');

-- ---------------- RLS ----------------
alter table public.imperio_chairs       enable row level security;
alter table public.imperio_services     enable row level security;
alter table public.imperio_products     enable row level security;
alter table public.imperio_appointments enable row level security;
alter table public.imperio_sales        enable row level security;
alter table public.imperio_settings     enable row level security;

drop policy if exists "public read chairs"   on public.imperio_chairs;
drop policy if exists "public read services" on public.imperio_services;
drop policy if exists "public read products" on public.imperio_products;
drop policy if exists "public book"          on public.imperio_appointments;
create policy "public read chairs"   on public.imperio_chairs   for select to anon, authenticated using (ativo);
create policy "public read services" on public.imperio_services for select to anon, authenticated using (ativo);
create policy "public read products" on public.imperio_products for select to anon, authenticated using (ativo);
create policy "public book" on public.imperio_appointments for insert to anon
  with check (status = 'agendado' and origem = 'site' and inicio > now());

-- Owner (qualquer usuário logado no Supabase Auth = dono/gerente): tudo.
do $$ declare t text; begin
  foreach t in array array['imperio_chairs','imperio_services','imperio_products','imperio_appointments','imperio_sales','imperio_settings'] loop
    execute format('drop policy if exists "owner all" on public.%I', t);
    execute format('create policy "owner all" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop; end $$;

-- A view roda como dono (bypassa RLS) e só expõe horário + cadeira.
grant select on public.imperio_slots_taken to anon, authenticated;
revoke all on public.imperio_chairs from anon; grant select on public.imperio_chairs to anon;   -- pin_hash nunca sai: ver coluna abaixo
revoke select (pin_hash) on public.imperio_chairs from anon;

-- ---------------- Seed (do config.js do site) ----------------
insert into public.imperio_chairs (numero, barbeiro, especialidade, dias, ordem)
select * from (values
  ('01','Barbeiro 1','Degradê & navalhado','Seg a sáb · 08:30 às 20:00',1),
  ('02','Barbeiro 2','Barba & pigmentação','Seg a sáb · 08:30 às 20:00',2),
  ('03','Barbeiro 3','Corte social & moderno','Seg a sáb · 08:30 às 20:00',3),
  ('04','Barbeiro 4','Corte + barba completo','Seg a sáb · 08:30 às 20:00',4)) v
where not exists (select 1 from public.imperio_chairs);

insert into public.imperio_services (nome, preco, duracao_min, ordem)
select * from (values
  ('Corte masculino',35,30,1),('Barba completa',35,30,2),('Corte + barba',70,60,3),
  ('Sobrancelha',15,15,4),('Pigmentação',25,30,5),('Tratamento VIP',null,90,6)) v
where not exists (select 1 from public.imperio_services);

insert into public.imperio_settings (key, value) values
  ('horario', '{"seg":["08:30","20:00"],"ter":["08:30","20:00"],"qua":["08:30","20:00"],"qui":["08:30","20:00"],"sex":["08:30","20:00"],"sab":["08:30","20:00"],"dom":null}'),
  ('slot_min', '30'),
  ('pix_chave', '""'),
  ('whatsapp', '"5561992281225"')
on conflict (key) do nothing;

-- Fix (2026-11-07): um REVOKE de coluna não vale se há GRANT na tabela inteira.
-- Anon só enxerga as colunas públicas da cadeira; pin_hash fica só p/ logado.
revoke all on public.imperio_chairs from anon;
grant select (id, numero, barbeiro, especialidade, dias, ativo, ordem) on public.imperio_chairs to anon;
