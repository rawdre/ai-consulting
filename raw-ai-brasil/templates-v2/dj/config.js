/* =====================================================================
   CONFIGURAÇÃO DO SITE — edite SÓ este arquivo para cada cliente.
   Site em INGLÊS (público: clientes nos EUA). Textos aceitam {nome},
   {bairro} e {cidade} (preenchidos automaticamente).
   Fotos: troque os arquivos em assets/ (mesmo nome) ou aponte os caminhos.
   ===================================================================== */
window.SITE = {
  negocio: {
    nome: 'DJ Your Name',
    slogan: 'DJ · MC · Lighting',
    bairro: 'Greater Boston',
    cidade: 'Massachusetts'
  },

  contato: {
    whatsapp: '5561998229223',            // só números, com código do país (padrão = Raw AI para as demos; trocar pelo do cliente)
    telefone: '+1 (000) 000-0000',
    email: 'bookings@djyourname.com',
    instagram: '',                          // ex: 'https://instagram.com/djyourname'
    instagramUser: '@djyourname',
    idiomas: 'English · Português · Español'
  },

  seo: {
    titulo: '{nome} | Wedding & Party DJ in {bairro}, {cidade}',
    descricao: 'DJ, MC, uplighting, cold sparks and photo booth for weddings, Sweet 15 & 16, birthdays and corporate events in {bairro}. Brazilian, Latin and Top 40. Book on WhatsApp.'
  },

  tema: { cor: '#C2FF3D' },

  hero: {
    selo: 'DJ · MC · Lighting · Photo booth',
    titulo1: 'The party',
    titulo2: 'they will never forget.',
    texto: 'Open-format DJ and bilingual MC for weddings, Sweet 15 & 16 and corporate nights across {bairro}. Brazilian, Latin, Top 40 and whatever your crowd needs at 11 pm.',
    imagem: 'assets/hero.jpg',
    destaques: ['Bilingual MC', 'Pro sound + backup gear', 'Fully insured']
  },

  faixa: ['Weddings', 'Sweet 15 & 16', 'Birthdays', 'Corporate', 'Church events', 'Baby showers', 'Graduations'],

  // Estilos musicais (chips na seção "Your soundtrack")
  estilos: ['Sertanejo & Pagode', 'Funk & Brazilian pop', 'Reggaeton & Bachata', 'Top 40 & Hip-hop', 'House & Afrobeats', '80s · 90s · 2000s', 'Forró & Axé', 'Worship & gospel'],

  pacotes: [
    { nome: 'Essentials', preco: 'From $650', tempo: 'Up to 4 hours', inclui: ['DJ + MC', 'Pro sound system', 'Dance floor lighting', 'Playlist planning'], whatsapp: 'Hi {nome}! I would like a quote for the Essentials package.' },
    { nome: 'Signature', preco: 'From $1,200', tempo: 'Up to 5 hours', inclui: ['Everything in Essentials', 'Ceremony or cocktail sound', '10 uplights in your colors', 'Wireless mics for toasts'], whatsapp: 'Hi {nome}! I would like a quote for the Signature package.', destaque: true },
    { nome: 'Full Show', preco: 'From $2,000', tempo: 'Up to 6 hours', inclui: ['Everything in Signature', 'Cold spark fountains', 'Open-air photo booth', 'Dancing on the clouds'] , whatsapp: 'Hi {nome}! I would like a quote for the Full Show package.' }
  ],

  extras: [
    { titulo: 'Cold sparks', texto: 'Indoor-safe spark fountains for the first dance or grand entrance.' },
    { titulo: 'Photo booth', texto: 'Open-air booth with props, instant prints and a digital gallery.' },
    { titulo: 'Uplighting', texto: 'Wireless LED uplights in your colors, 10 to 30 units.' },
    { titulo: 'Dancing on the clouds', texto: 'Dry-ice low fog for the first dance.' },
    { titulo: 'Monogram & screens', texto: 'Your names in light on the floor or a slideshow on screens.' },
    { titulo: 'Live percussion', texto: 'Add a percussionist or sax player on top of the DJ set.' }
  ],

  galeria: [
    { imagem: 'assets/firstdance.jpg', legenda: 'First dance · cold sparks' },
    { imagem: 'assets/sweet16.jpg', legenda: 'Sweet 16 confetti drop' },
    { imagem: 'assets/booth.jpg', legenda: 'Open format' },
    { imagem: 'assets/corporate.jpg', legenda: 'Corporate night' },
    { imagem: 'assets/photobooth.jpg', legenda: 'Photo booth' },
    { imagem: 'assets/lighting.jpg', legenda: 'Uplighting' }
  ],

  processo: [
    { titulo: 'Check the date', texto: 'Message on WhatsApp with the date and venue. If it is open, we hold it for 48 hours.' },
    { titulo: 'Plan the night', texto: 'A simple online form: must-plays, do-not-plays, announcements and the timeline. Plus a call two weeks out.' },
    { titulo: 'Show up early', texto: 'We arrive two hours before, sound-check, and run every cue with the planner, photographer and venue.' }
  ],

  sobre: {
    titulo: 'Reading the room is the whole job.',
    texto1: '{nome} has been behind the booth at weddings, Sweet 15s, church celebrations and corporate parties across {cidade} for over a decade. Brazilian roots, American crowds, and a library for both.',
    texto2: 'Pro gear with backups for everything, a bilingual MC voice that keeps the night moving, and no awkward silence between songs. Ever.',
    assinatura: 'Based in {bairro} · traveling across New England',
    imagem: 'assets/dj.jpg',
    numeros: [
      { valor: '+400', rotulo: 'events' },
      { valor: '10+', rotulo: 'years' },
      { valor: '5★', rotulo: 'on Google' }
    ]
  },

  // SUBSTITUA por avaliações reais do Google do cliente antes de publicar.
  avaliacoes: {
    nota: '5.0',
    total: 'Google reviews',
    lista: [
      { texto: 'He played sertanejo for my family, reggaeton for my husband’s, and Top 40 for our friends. Nobody sat down.', nome: 'Google review' },
      { texto: 'The cold sparks at the first dance made the whole room gasp. Worth every dollar.', nome: 'Google review' },
      { texto: 'Professional, on time, great MC in both languages. Our corporate party finally had energy.', nome: 'Google review' }
    ]
  },

  inquiry: {
    titulo: 'Check my date',
    texto: 'Thirty seconds. The message lands on our WhatsApp and you get an answer today.',
    fields: [
      { key: 'type', label: 'Event', type: 'chips', options: ['a wedding', 'a Sweet 15 / 16', 'a birthday', 'a corporate event', 'a church event', 'something else'] },
      { key: 'date', label: 'Date', type: 'text', placeholder: 'e.g. Sat, Aug 14, 2027' },
      { key: 'venue', label: 'Venue or city', type: 'text', placeholder: 'e.g. Lakeview Pavilion, Foxborough' },
      { key: 'guests', label: 'Guests', type: 'chips', options: ['under 80', '80 to 150', '150 to 250', '250+'] }
    ],
    message: 'Hi {nome}! My name is {name}. I found you through your website.\nI am looking for a DJ for {type} on {date} at {venue}, around {guests} guests.\nIs the date open, and what would it cost?'
  },

  cta: {
    titulo: 'Saturdays go first.',
    texto: 'Peak season weekends book six to nine months out. Send the date and we will tell you right away.',
    imagem: 'assets/sweet16.jpg'
  },

  rodape: {
    credito: 'Site by Raw AI',
    creditoLink: 'https://rawdre.github.io/ai-consulting/'
  }
};
