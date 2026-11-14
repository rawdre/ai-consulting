-- Cartão fidelidade: cada comanda guarda o cliente (WhatsApp = cartão).
-- Regra: a cada 10 cortes pagos, o próximo corte sai com 50% OFF (item tipo 'fidelidade').
alter table public.imperio_sales
  add column if not exists cliente_nome text,
  add column if not exists cliente_whatsapp text;
create index if not exists imperio_sales_cliente_whatsapp_idx on public.imperio_sales (cliente_whatsapp);
