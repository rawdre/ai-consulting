-- 002 · Agendamento online por cadeira (2026-11-07)
-- Sem choque de horário (constraint de exclusão), sinal de 50% e settings públicas.
create extension if not exists btree_gist;

alter table public.imperio_appointments
  add column if not exists sinal_valor  numeric(10,2),
  add column if not exists sinal_status text not null default 'pendente'
    check (sinal_status in ('pendente','pago','dispensado')),
  add column if not exists servico_nome text,
  add column if not exists servico_preco numeric(10,2);

-- Nunca dois agendamentos ativos na mesma cadeira com horários sobrepostos.
alter table public.imperio_appointments drop constraint if exists imperio_no_clash;
alter table public.imperio_appointments add constraint imperio_no_clash
  exclude using gist (chair_id with =, tstzrange(inicio, fim, '[)') with &&)
  where (status in ('agendado','confirmado'));

-- O site precisa de horário/slot/pix/whatsapp (só essas chaves) sem login.
drop policy if exists "public settings" on public.imperio_settings;
create policy "public settings" on public.imperio_settings for select to anon
  using (key in ('horario','slot_min','pix_chave','pix_nome','whatsapp','sinal_pct','antecedencia_min','dias_a_frente'));
grant select on public.imperio_settings to anon;

insert into public.imperio_settings (key, value) values
  ('sinal_pct', '50'),
  ('pix_nome', '"Barbearia do Império"'),
  ('antecedencia_min', '60'),
  ('dias_a_frente', '14')
on conflict (key) do nothing;

-- Insert público: também aceita o snapshot do serviço e o sinal calculado pelo site.
drop policy if exists "public book" on public.imperio_appointments;
create policy "public book" on public.imperio_appointments for insert to anon
  with check (status = 'agendado' and origem = 'site' and inicio > now() and sinal_status = 'pendente');
