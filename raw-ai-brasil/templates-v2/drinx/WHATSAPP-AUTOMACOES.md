# Drinx Bebidas — automações do WhatsApp

O site já manda o pedido **pronto** pro WhatsApp da loja (61 96404-4046):
número do pedido `#DRX-…`, itens, subtotal, taxa da região, total, endereço,
**link do Google Maps pro entregador**, horário (agora ou agendado), forma de
pagamento/troco e a confirmação de 18+. O cliente só toca em "enviar".

Configure no **WhatsApp Business** (Ferramentas comerciais):

## 1. Mensagem de saudação (primeiro contato)
> Oi! 🍻 Aqui é a Drinx Bebidas. Pra pedir mais rápido, monte seu carrinho no site
> e ele chega aqui prontinho: [link do site]
> Ou manda aqui o que você precisa + seu endereço que a gente resolve.

## 2. Mensagem de ausência (fora do horário)
> Estamos fechados agora 🌙 Funcionamos ter–qui e dom 12h–24h, sex e sáb 12h–02h
> (segunda fechado). Deixe seu pedido aqui ou agende no site que a gente confirma
> assim que abrir: [link do site]

## 3. Respostas rápidas (digite "/" + atalho)
| Atalho | Mensagem |
|---|---|
| `/confirma` | Pedido confirmado ✅ Total R$ ___. Previsão de entrega: ___. Qualquer coisa é só chamar! |
| `/pix` | Chave Pix: ___ — Drinx Bebidas. Manda o comprovante aqui 🙏 |
| `/saiu` | Seu pedido saiu pra entrega 🛵 Chega em ~___ min. Tenha um documento com foto em mãos (venda só pra maiores de 18). |
| `/entregue` | Entregue! 🍻 Obrigado pela preferência. Avalia a gente no Google? Leva 10s e ajuda muito: [link Google] |
| `/falta` | Esse item acabou agora 😕 Posso trocar por ___ (mesmo preço) ou tirar do pedido? |
| `/area` | Entregamos em Brasília e região. Me manda seu bairro que te passo taxa e prazo. |

## 4. Etiquetas (organizar a fila)
`Novo pedido` → `Confirmado` → `Saiu p/ entrega` → `Entregue` · e `Cliente fixo`.
Mensagens que começam com "🍻 NOVO PEDIDO" = vieram do site.

## 5. Catálogo do WhatsApp Business
Cadastrar os mesmos produtos/kits do site (fotos reais + preço). **Não** colocar
tabacaria nem vape no catálogo — propaganda de fumígenos é proibida fora do
ponto de venda (Lei 9.294/96) e vape é proibido no Brasil (Anvisa).

## Próximo nível (opcional, pago)
- WhatsApp Cloud API + bot: confirma pedido sozinho, manda "/saiu" quando o
  entregador marcar, e pede avaliação no Google 1h depois.
- Disparo semanal de ofertas só para quem pediu e aceitou receber (opt-in).
