/* =====================================================================
   CONFIGURAÇÃO DO SITE — edite SÓ este arquivo para cada cliente.
   Textos aceitam {nome}, {bairro} e {cidade} (preenchidos automaticamente).
   Fotos: troque os arquivos em assets/ pelas fotos reais (mesmo nome).
   ===================================================================== */
window.SITE = {
  negocio: {
    nome: 'Sua Adega',
    slogan: 'Gelada, vinho & destilados',
    bairro: 'seu bairro',
    cidade: 'Brasília - DF'
  },

  contato: {
    whatsapp: '5561900000000',            // só números, com 55 + DDD
    telefone: '(61) 90000-0000',
    endereco: 'Endereço completo, {bairro} — {cidade}',
    mapa: '',
    instagram: '',
    instagramUser: '@suaadega',
    ifood: ''                               // opcional: link do iFood / Zé Delivery
  },

  seo: {
    titulo: '{nome} | Adega e delivery de bebidas em {bairro} — {cidade}',
    descricao: 'Cerveja gelada, vinhos, whisky, gelo e combos com entrega rápida em {bairro}. Peça pelo WhatsApp.'
  },

  tema: { cor: '#FF9D2E' },

  hero: {
    selo: 'Delivery & retirada · {bairro}',
    titulo1: 'Gelada na porta',
    titulo2: 'em minutos.',
    texto: 'Cervejas trincando, vinhos, destilados, gelo e tudo pra resenha. Peça pelo WhatsApp e receba rápido em {bairro} e região.',
    imagem: 'assets/hero.jpg',
    destaques: [
      { valor: '30min', rotulo: 'entrega média' },
      { valor: '+150', rotulo: 'rótulos' },
      { valor: 'Pix', rotulo: 'cartão ou dinheiro' }
    ]
  },

  categorias: [
    { titulo: 'Cervejas', texto: 'Long neck, litrão, latão e premium sempre geladas.', imagem: 'assets/cerveja.jpg', whatsapp: 'Olá! Quero pedir cerveja na {nome}.' },
    { titulo: 'Whisky & destilados', texto: 'Whisky, gin, vodka, cachaça e energéticos.', imagem: 'assets/whisky.jpg', whatsapp: 'Olá! Quero ver os destilados da {nome}.' },
    { titulo: 'Vinhos', texto: 'Tintos, brancos e espumantes para todo momento.', imagem: 'assets/vinho.jpg', whatsapp: 'Olá! Quero uma indicação de vinho na {nome}.' }
  ],

  combos: [
    { titulo: 'Combo Resenha', itens: '12 long necks + gelo 5kg', preco: 'R$ 99', whatsapp: 'Olá! Quero o Combo Resenha da {nome}.' },
    { titulo: 'Combo Churrasco', itens: '24 latas + carvão + gelo + refri 2L', preco: 'R$ 169', whatsapp: 'Olá! Quero o Combo Churrasco da {nome}.', destaque: 'Mais pedido' },
    { titulo: 'Combo Premium', itens: 'Whisky 12 anos + 4 energéticos + gelo', preco: 'R$ 229', whatsapp: 'Olá! Quero o Combo Premium da {nome}.' }
  ],

  entrega: {
    titulo: 'Entrega rápida na sua região',
    texto: 'Atendemos {bairro} e bairros vizinhos. Pedido mínimo e taxa combinados no WhatsApp.',
    bairros: ['{bairro}', 'Bairro vizinho 1', 'Bairro vizinho 2', 'Bairro vizinho 3'],
    imagem: 'assets/delivery.jpg'
  },

  festa: {
    titulo: 'Vai ter festa? A gente monta o pedido.',
    texto: 'Aniversário, churrasco ou confraternização: diga quantas pessoas e a gente calcula bebida e gelo na medida.',
    imagem: 'assets/churrasco.jpg'
  },

  horarios: [
    { dia: 'Segunda a quinta', hora: '16:00 — 00:00' },
    { dia: 'Sexta e sábado', hora: '11:00 — 02:00' },
    { dia: 'Domingo', hora: '11:00 — 22:00' }
  ],

  aviso: 'Venda proibida para menores de 18 anos. Beba com moderação.',

  rodape: {
    credito: 'Site por Raw AI',
    creditoLink: 'https://rawdre.github.io/ai-consulting/'
  }
};
