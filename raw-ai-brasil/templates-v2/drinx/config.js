/* =====================================================================
   DRINX BEBIDAS — configuração do site (edite SÓ este arquivo).
   Textos aceitam {nome}, {bairro} e {cidade}.
   ATENÇÃO: preços, taxas de entrega e anúncios abaixo são EXEMPLOS para a
   demo — confirmar a tabela real com o cliente antes de publicar.
   Regras de conformidade (não remover):
     - Tabacaria NÃO entra no carrinho nem nos anúncios (Lei 9.294/96 proíbe
       propaganda de fumígenos fora do ponto de venda). Só "consulte".
     - Nada de vape / cigarro eletrônico (venda proibida no Brasil — Anvisa).
     - Venda de bebida alcoólica só para maiores de 18 anos (portão 18+).
   ===================================================================== */
window.SITE = {
  versao: 'v1.0.0',

  negocio: {
    nome: 'Drinx Bebidas',
    slogan: 'Distribuidora · Brasília/DF',
    bairro: 'Grande Colorado',
    cidade: 'Brasília - DF',
    logo: 'assets/logo.webp',
    cnpj: '33.543.685/0001-71'
  },

  contato: {
    whatsapp: '5561964044046',
    telefone: '(61) 96404-4046',
    endereco: 'SH Grande Colorado · Condomínio Jardim Europa 2, 5 · Brasília/DF · CEP 70297-400',
    mapa: 'Drinx Bebidas, Grande Colorado, Brasília DF',
    instagram: 'https://instagram.com/drinx_distribuidora',
    instagramUser: '@drinx_distribuidora',
    google: 'https://www.google.com/maps/search/?api=1&query=Drinx+Bebidas+Grande+Colorado+Brasilia'
  },

  // IDs de rastreamento (deixe vazio na demo para não sujar os dados do cliente)
  rastreamento: { metaPixel: '', gtm: '' },

  seo: {
    titulo: 'Drinx Bebidas | Distribuidora de bebidas com entrega em Brasília/DF',
    descricao: 'Há 18 anos entregando cerveja, refrigerante, destilados e gelo em Brasília e região. Monte seu pedido no site e finalize pelo WhatsApp.'
  },

  tema: { cor: '#E3B04B' },

  topo: [
    '🚚 Entrega em Brasília e região no horário combinado',
    '🧊 Gelo e caixa térmica pra festa não parar',
    '⭐ Nota 5,0 no Google · 18 anos de distribuidora',
    '🔞 Venda proibida para menores de 18 anos'
  ],

  hero: {
    selo: 'Entrega em Brasília e região',
    titulo1: 'Pediu,',
    titulo2: 'chegou gelado.',
    texto: 'Há 18 anos entregando cerveja, refrigerante, destilados e gelo em Brasília e região — no horário que a gente combina. Monte o carrinho aqui e finalize no WhatsApp.',
    imagem: 'assets/hero.jpg',
    destaques: [
      { valor: '18 anos', rotulo: 'de distribuidora' },
      { valor: '5,0 ★', rotulo: 'nota no Google' },
      { valor: '100%', rotulo: 'entrega no prazo' }
    ]
  },

  // Carrossel de anúncios / ofertas (espaço comercial — trade marketing)
  anuncios: [
    { tag: 'Oferta da semana', titulo: 'Engradado gelado pro jogo', texto: 'Cerveja trincando + gelo na porta antes do apito inicial.', imagem: 'assets/geladeiras.webp', cta: 'Quero a oferta', whatsapp: 'Olá! Vi a oferta do engradado pro jogo no site da {nome}.' },
    { tag: 'Novidade', titulo: 'Sabores geladinhos', texto: 'Xeque Mate, maracujá com caju, melancia com framboesa e mais.', imagem: 'assets/latas.webp', cta: 'Ver sabores', whatsapp: 'Olá! Quero saber dos sabores novos da {nome}.' },
    { tag: 'Drinks na hora', titulo: 'O copão da região', texto: 'Drinks montados na hora — peça junto com sua bebida.', imagem: 'assets/drink.webp', cta: 'Pedir drink', whatsapp: 'Olá! Quero pedir um drink da {nome}.' }
  ],

  // Categorias do catálogo (filtros)
  categorias: [
    { id: 'cerveja', titulo: 'Cervejas', icone: '🍺' },
    { id: 'refri', titulo: 'Refris & águas', icone: '🥤' },
    { id: 'destilado', titulo: 'Destilados', icone: '🥃' },
    { id: 'energetico', titulo: 'Energéticos', icone: '⚡' },
    { id: 'gelo', titulo: 'Gelo & festa', icone: '🧊' }
  ],

  // Produtos (preço em reais, número). selo opcional: 'Mais pedido', 'Promo'...
  produtos: [
    { id: 'heineken-ln', cat: 'cerveja', nome: 'Heineken long neck', detalhe: '330 ml · unidade', preco: 7.5, selo: 'Mais pedido' },
    { id: 'heineken-cx', cat: 'cerveja', nome: 'Heineken long neck', detalhe: 'Caixa com 24', preco: 168 },
    { id: 'brahma-lata', cat: 'cerveja', nome: 'Brahma Duplo Malte lata', detalhe: '350 ml · pack 12', preco: 48 },
    { id: 'skol-litrao', cat: 'cerveja', nome: 'Skol litrão', detalhe: '1 L · retornável', preco: 9.9 },
    { id: 'original-600', cat: 'cerveja', nome: 'Original 600 ml', detalhe: 'Garrafa · retornável', preco: 11.9 },
    { id: 'spaten-lata', cat: 'cerveja', nome: 'Spaten lata', detalhe: '350 ml · pack 12', preco: 54, selo: 'Promo' },
    { id: 'coca-2l', cat: 'refri', nome: 'Coca-Cola 2 L', detalhe: 'Garrafa', preco: 12.5 },
    { id: 'guarana-2l', cat: 'refri', nome: 'Guaraná Antarctica 2 L', detalhe: 'Garrafa', preco: 9.5 },
    { id: 'agua-500', cat: 'refri', nome: 'Água mineral 500 ml', detalhe: 'Fardo com 12', preco: 18 },
    { id: 'agua-coco', cat: 'refri', nome: 'Água de coco 1 L', detalhe: 'Caixa', preco: 13.9 },
    { id: 'smirnoff', cat: 'destilado', nome: 'Vodka Smirnoff 998 ml', detalhe: 'Garrafa', preco: 44.9 },
    { id: 'red-label', cat: 'destilado', nome: 'Johnnie Walker Red Label 1 L', detalhe: 'Garrafa', preco: 119.9 },
    { id: 'gin', cat: 'destilado', nome: 'Gin Tanqueray 750 ml', detalhe: 'Garrafa', preco: 129.9 },
    { id: 'xeque-mate', cat: 'destilado', nome: 'Xeque Mate lata', detalhe: '355 ml · unidade', preco: 12, selo: 'Novidade' },
    { id: 'redbull', cat: 'energetico', nome: 'Red Bull 250 ml', detalhe: 'Lata', preco: 10.9 },
    { id: 'monster', cat: 'energetico', nome: 'Monster 473 ml', detalhe: 'Lata', preco: 11.9 },
    { id: 'gelo-5', cat: 'gelo', nome: 'Gelo em cubo 5 kg', detalhe: 'Saco', preco: 14 },
    { id: 'gelo-coco', cat: 'gelo', nome: 'Gelo de coco 1 kg', detalhe: 'Saco', preco: 12 },
    { id: 'caixa-termica', cat: 'gelo', nome: 'Caixa térmica (aluguel)', detalhe: '120 L · por evento', preco: 40 },
    { id: 'copo', cat: 'gelo', nome: 'Copos descartáveis', detalhe: 'Pacote com 50', preco: 9 }
  ],

  // Kits por ocasião (entram no carrinho como 1 item)
  kits: [
    { id: 'kit-churrasco', ocasiao: 'Churrasco', titulo: 'Kit Churrasco', itens: '24 latas + 2 refri 2 L + gelo 5 kg + copos', preco: 159, imagem: 'assets/churrasco.jpg' },
    { id: 'kit-jogo', ocasiao: 'Dia de jogo', titulo: 'Kit Dia de Jogo', itens: '12 long necks + 6 litrões + gelo 5 kg', preco: 169, imagem: 'assets/cerveja.jpg', selo: 'Mais pedido' },
    { id: 'kit-evento', ocasiao: 'Eventos', titulo: 'Kit Festa 30 pessoas', itens: '72 latas + 6 refri 2 L + 3 gelos 5 kg + caixa térmica', preco: 549, imagem: 'assets/delivery.jpg' },
    { id: 'kit-fds', ocasiao: 'Fim de semana', titulo: 'Kit Drinks em Casa', itens: 'Vodka + 4 energéticos + gelo de coco + copos', preco: 99, imagem: 'assets/whisky.jpg' }
  ],

  // Espaços para marcas parceiras (vendidos/negociados pelo cliente)
  patrocinados: [
    { tag: 'Marca parceira', titulo: 'Sua cerveja em destaque aqui', texto: 'Banner fixo no catálogo + post semanal no Instagram da Drinx.' },
    { tag: 'Marca parceira', titulo: 'Lançamento de energético', texto: 'Degustação, geladeira e vitrine no site no mesmo pacote.' },
    { tag: 'Marca parceira', titulo: 'Espaço disponível', texto: 'Distribuidor ou fornecedor? Anuncie para quem compra bebida em Brasília.' }
  ],

  // Regiões de entrega (taxa em reais; 0 = grátis; null = combinar).
  regioes: [
    { nome: 'Grande Colorado e condomínios', taxa: 0, prazo: '30–50 min' },
    { nome: 'Sobradinho / Sobradinho II', taxa: 8, prazo: '40–60 min' },
    { nome: 'Lago Norte / Varjão / Taquari', taxa: 12, prazo: '40–70 min' },
    { nome: 'Plano Piloto / Asa Norte / Asa Sul', taxa: 18, prazo: '60–90 min' },
    { nome: 'Planaltina / Itapoã / Paranoá', taxa: 15, prazo: '60–90 min' },
    { nome: 'Outra região do DF', taxa: null, prazo: 'combinamos no WhatsApp' }
  ],
  pedidoMinimo: 40,
  freteGratisAcima: 250,

  diferenciais: [
    { icone: '⏰', titulo: 'Entrega no prazo combinado', texto: 'Você não fica esperando a tarde toda. A gente cumpre o horário.' },
    { icone: '🤝', titulo: 'Atendimento humano', texto: 'Falou com a gente, foi resolvido. Sem robô, sem enrolação.' },
    { icone: '🏆', titulo: '18 anos em Brasília', texto: 'Tradição que você confia pra não furar no dia da festa.' },
    { icone: '✅', titulo: 'Procedência garantida', texto: 'Só produto original, de fornecedor oficial, com nota fiscal. Nada de bebida sem selo.' }
  ],

  galeria: [
    { imagem: 'assets/geladeiras.webp', legenda: 'Geladeiras sempre cheias' },
    { imagem: 'assets/latas.webp', legenda: 'Sabores geladinhos' },
    { imagem: 'assets/drink.webp', legenda: 'Drinks na hora' }
  ],

  avaliacoes: [
    { texto: 'Pedi e chegou tudo certinho no horário. Atendimento nota 10.', nome: 'Rafael Andrade', local: 'Brasília, DF' },
    { texto: 'Sempre que tem jogo eu peço aqui. Nunca me deixaram na mão.', nome: 'Juliana Martins', local: 'Brasília, DF' },
    { texto: 'Preço justo e entrega rápida. Virei cliente fixo.', nome: 'Bruno Oliveira', local: 'Brasília, DF' }
  ],
  notaGoogle: { nota: '5,0', total: '50+ avaliações' },

  // Ordem: domingo (0) ... sábado (6). Fechamento depois da meia-noite: '02:00'.
  horarios: [
    { dia: 'Domingo', abre: '12:00', fecha: '24:00' },
    { dia: 'Segunda', abre: '', fecha: '' },
    { dia: 'Terça', abre: '12:00', fecha: '24:00' },
    { dia: 'Quarta', abre: '12:00', fecha: '24:00' },
    { dia: 'Quinta', abre: '12:00', fecha: '24:00' },
    { dia: 'Sexta', abre: '12:00', fecha: '02:00' },
    { dia: 'Sábado', abre: '12:00', fecha: '02:00' }
  ],

  aviso: 'Beba com moderação. Venda proibida para menores de 18 anos. Se beber, não dirija.',

  rodape: {
    credito: 'Site por Raw AI',
    creditoLink: 'https://rawdre.github.io/ai-consulting/'
  }
};
