# Império — POS (NEXT BUILD, on hold until the owner pays)

Status 2026-11-14: spec agreed with André, **not started**. Build only after the client pays for the current phase.

## Flow (one chair at a time)
1. **Minha cadeira** screen. Owner login with an "Atendendo como: <barbeiro> ▾" switcher; per-barber logins later.
   - NA CADEIRA (current client) and the PRÓXIMOS list.
2. **[✅ Terminei]** opens the comanda prefilled with the service.
   - Add products. Loyalty card (10 cortes = 50% OFF) applied.
3. **PAGAMENTO, required:**
   - Pix: QR with the amount (already built), then "Pix recebido ✓".
   - Cartão: the card machine, then the receipt number (NSU).
   - Dinheiro: amount received, change calculated.
   - Split payments allowed.
4. **PAGO ✓** writes the sale and marks the appointment `atendido`.
5. **[Chamar próximo]** unlocks ONLY after PAGO.
   - The next booking goes first, then walk-ins (fila digital).
   - TV panel and public "Fila agora" show "<Barbeiro> chama: <cliente>".
   - Pre-written WhatsApp "é sua vez" (wa.me, one tap).
   - "Não veio" skips without payment but is logged.
   - An unfinished comanda persists across reloads.
6. **Fechar meu caixa** (per barber, end of day):
   - Count the cash and show the difference.
   - Day report (services, products, Pix/Cartão/Dinheiro, commission) sent to the owner on WhatsApp or PDF.

## Data changes
- New status `em_atendimento` ("na cadeira") on appointments; a `chamado_em` timestamp.
- `imperio_sales`: `pagamentos` jsonb (split), `nsu`, `troco`.
- `imperio_caixa` (barber, date, expected, counted, difference, closed_at).
- `imperio_chairs.user_id` for per-barber logins. RLS: a barber sees only his chair; the owner sees all.
- Realtime (Supabase channel) so the panel and agenda update in seconds.

## Later phases
- Product stock (each sale lowers it, low-stock alert).
- Mercado Pago auto-confirm: Pix webhook, plus the Point card machine (needs the owner's MP Access Token).

## Waiting on
- Client payment (gate).
- The owner's Mercado Pago Pix key in Config (for the Pix QR already live).
- The 4 barber emails (only for per-barber logins).
