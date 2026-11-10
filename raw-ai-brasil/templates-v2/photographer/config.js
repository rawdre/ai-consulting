/* =====================================================================
   CONFIGURAÇÃO DO SITE — edite SÓ este arquivo para cada cliente.
   Site em INGLÊS (público: clientes nos EUA). Textos aceitam {nome},
   {bairro} e {cidade} (preenchidos automaticamente).
   Fotos: troque os arquivos em assets/ pelas fotos REAIS do fotógrafo
   (mesmo nome) — num site de fotografia isso é obrigatório antes de publicar.
   ===================================================================== */
window.SITE = {
  negocio: {
    nome: 'Your Name Photography',
    slogan: 'Weddings · Families · Events',
    bairro: 'South Shore',
    cidade: 'Massachusetts'
  },

  contato: {
    whatsapp: '5561998229223',            // só números, com código do país (padrão = Raw AI para as demos; trocar pelo do cliente)
    telefone: '+1 (000) 000-0000',
    email: 'hello@yourname.photo',
    instagram: '',                          // ex: 'https://instagram.com/yourname.photo'
    instagramUser: '@yourname.photo',
    idiomas: 'English · Português · Español'
  },

  seo: {
    titulo: '{nome} | Wedding, Family & Event Photographer in {bairro}, {cidade}',
    descricao: 'Wedding, engagement, family, newborn, quinceañera and event photography in {bairro}. Natural, candid and delivered fast. Book on WhatsApp.'
  },

  tema: { cor: '#C8793A' },

  hero: {
    selo: 'Photographer · {bairro}, {cidade}',
    titulo1: 'Real moments,',
    titulo2: 'kept forever.',
    texto: 'Candid, warm photography for weddings, families and the parties in between. Sneak peeks in 48 hours, full gallery in three weeks.',
    imagem: 'assets/hero.jpg',
    destaques: ['Sneak peeks in 48h', 'Online gallery + prints', 'Bilingual sessions']
  },

  faixa: ['Weddings', 'Engagements', 'Families', 'Newborns', 'Quinceañeras', 'Headshots', 'Events'],

  galeria: [
    { imagem: 'assets/hero.jpg', legenda: 'Wedding · Coast' },
    { imagem: 'assets/family.jpg', legenda: 'Family · Beach' },
    { imagem: 'assets/quince.jpg', legenda: 'Quinceañera' },
    { imagem: 'assets/engagement.jpg', legenda: 'Engagement · Fall' },
    { imagem: 'assets/newborn.jpg', legenda: 'Newborn' },
    { imagem: 'assets/event.jpg', legenda: 'Reception' },
    { imagem: 'assets/headshot.jpg', legenda: 'Headshots' }
  ],

  // Pacotes. Valores de referência — ajuste para o cliente.
  pacotes: [
    { nome: 'Mini session', preco: '$250', tempo: '30 min · 1 location', inclui: ['20 edited photos', 'Online gallery', 'Print release'], whatsapp: 'Hi {nome}! I would like to book a mini session.' },
    { nome: 'Family or couple', preco: '$450', tempo: '60 min · 1 to 2 locations', inclui: ['50+ edited photos', 'Outfit guidance', 'Online gallery + prints'], whatsapp: 'Hi {nome}! I would like to book a family or couple session.', destaque: true },
    { nome: 'Wedding', preco: 'From $2,400', tempo: '8 hours · 1 photographer', inclui: ['500+ edited photos', 'Sneak peek in 48h', 'Engagement session included'], whatsapp: 'Hi {nome}! I would like a quote for my wedding.' },
    { nome: 'Events & parties', preco: 'From $600', tempo: '3 hours', inclui: ['Sweet 15 & 16, showers, corporate', '150+ edited photos', 'Same-week delivery'], whatsapp: 'Hi {nome}! I would like a quote for an event.' }
  ],

  processo: [
    { titulo: 'Say hi', texto: 'Message on WhatsApp with the date and what you have in mind. You get a reply the same day.' },
    { titulo: 'Plan the session', texto: 'Location, light, outfits and timing, so you walk in relaxed and we get the real smiles.' },
    { titulo: 'Shoot & deliver', texto: 'Sneak peeks within 48 hours, the full edited gallery in three weeks, prints and albums on request.' }
  ],

  sobre: {
    titulo: 'I photograph people the way their families see them.',
    texto1: 'Hi, I am the photographer behind {nome}. I have shot weddings, quinceañeras, newborns and church events across {cidade} for Brazilian, Latino and American families, often all in the same weekend.',
    texto2: 'My style is warm and candid. I direct gently, I speak your language and I will make your parents laugh in the photos too.',
    assinatura: 'Based in {bairro} · travel across New England',
    imagem: 'assets/photographer.jpg',
    numeros: [
      { valor: '+300', rotulo: 'sessions' },
      { valor: '+80', rotulo: 'weddings' },
      { valor: '48h', rotulo: 'sneak peeks' }
    ]
  },

  // SUBSTITUA por avaliações reais do Google do cliente antes de publicar.
  avaliacoes: {
    nota: '5.0',
    total: 'Google reviews',
    lista: [
      { texto: 'We got the sneak peeks two days after the wedding and cried in the car. Every photo feels like the day felt.', nome: 'Google review' },
      { texto: 'Our kids hate photos. Somehow we have 60 pictures of them laughing on the beach.', nome: 'Google review' },
      { texto: 'Professional, on time, and the gallery was delivered before we even asked.', nome: 'Google review' }
    ]
  },

  inquiry: {
    titulo: 'Check my availability',
    texto: 'Tell me what you are planning and I will reply on WhatsApp with options and pricing.',
    fields: [
      { key: 'type', label: 'Session type', type: 'chips', options: ['a wedding', 'a family session', 'an engagement session', 'a newborn session', 'a quinceañera', 'an event', 'headshots'] },
      { key: 'date', label: 'Date (or month)', type: 'text', placeholder: 'e.g. Oct 12 or Spring 2027' },
      { key: 'where', label: 'Location', type: 'text', placeholder: 'e.g. Plymouth, MA' }
    ],
    message: 'Hi {nome}! My name is {name}. I found you through your website.\nI am looking for {type} around {date} in {where}.\nAre you available, and what are the options?'
  },

  cta: {
    titulo: 'Your date fills fast.',
    texto: 'Weekends in May through October book months ahead. Message now and lock yours in.',
    imagem: 'assets/engagement.jpg'
  },

  rodape: {
    credito: 'Site by Raw AI',
    creditoLink: 'https://rawdre.github.io/ai-consulting/'
  }
};
