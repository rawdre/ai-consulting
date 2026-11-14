-- Agenda pública: mostra "Primeiro nome + inicial" (ex.: André R.) e trava a view como SOMENTE LEITURA.
-- (Antes, a view simples era auto-atualizável e anon/authenticated tinham INSERT/UPDATE/DELETE nela.)
create or replace view public.imperio_slots_taken as
  select chair_id, inicio, fim,
         split_part(btrim(cliente_nome), ' ', 1)
           || case when position(' ' in btrim(cliente_nome)) > 0
                   then ' ' || upper(left(split_part(btrim(cliente_nome), ' ', array_length(regexp_split_to_array(btrim(cliente_nome), '\s+'), 1)), 1)) || '.'
                   else '' end as cliente_label
  from public.imperio_appointments
  where status in ('agendado','confirmado');
revoke all on public.imperio_slots_taken from anon, authenticated;
grant select on public.imperio_slots_taken to anon, authenticated;
