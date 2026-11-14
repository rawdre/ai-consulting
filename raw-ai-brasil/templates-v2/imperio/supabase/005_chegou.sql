-- Barbeiro marca quando o cliente chegou (fila da cadeira).
alter table public.imperio_appointments add column if not exists chegou_em timestamptz;
