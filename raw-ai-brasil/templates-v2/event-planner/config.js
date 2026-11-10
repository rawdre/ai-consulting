/* =====================================================================
   CONFIGURAÇÃO DO SITE — edite SÓ este arquivo para cada cliente.
   Site em INGLÊS (público: clientes nos EUA). Textos aceitam {nome},
   {bairro} e {cidade} (preenchidos automaticamente).
   Fotos: troque os arquivos em assets/ (mesmo nome) ou aponte os caminhos.
   ===================================================================== */
window.SITE = {
  negocio: {
    nome: 'Your Event Co.',
    slogan: 'Event planning & design',
    bairro: 'Greater Boston',
    cidade: 'Massachusetts'
  },

  contato: {
    whatsapp: '5561998229223',            // só números, com código do país (padrão = Raw AI para as demos; trocar pelo do cliente)
    telefone: '+1 (000) 000-0000',
    email: 'hello@youreventco.com',
    instagram: '',                          // ex: 'https://instagram.com/youreventco'
    instagramUser: '@youreventco',
    idiomas: 'English · Português · Español'
  },

  seo: {
    titulo: '{nome} | Wedding & Event Planner in {bairro}, {cidade}',
    descricao: 'Full planning, partial planning and day-of coordination for weddings, Sweet 15 & 16, baby showers and corporate events in {bairro}. Message us on WhatsApp.'
  },

  tema: { cor: '#1F3D2B' },

  hero: {
    selo: 'Weddings · Sweet 15 & 16 · Showers · Corporate',
    titulo1: 'Your day,',
    titulo2: 'beautifully handled.',
    texto: 'From the first mood board to the last dance, we plan, design and run events in {bairro} so you can actually enjoy yours.',
    imagem: 'assets/hero.jpg',
    destaques: ['Bilingual team', 'Trusted vendor network', 'Day-of coordination']
  },

  faixa: ['Weddings', 'Sweet 15 & 16', 'Baby showers', 'Birthdays', 'Corporate events', 'Engagement parties'],

  servicos: [
    { numero: '01', titulo: 'Full planning', preco: 'Custom quote', texto: 'Budget, venue, vendors, design, timeline and the day itself. We carry everything from yes to send-off.', whatsapp: 'Hi {nome}! I would like to talk about full planning for my event.' },
    { numero: '02', titulo: 'Partial planning', preco: 'From $1,800', texto: 'You already booked the venue or a few vendors. We fill the gaps, tighten the design and run the timeline.', whatsapp: 'Hi {nome}! I would like to talk about partial planning for my event.' },
    { numero: '03', titulo: 'Day-of coordination', preco: 'From $950', texto: 'You planned it, we run it. Vendor confirmations, setup, timeline, cues and breakdown while you celebrate.', whatsapp: 'Hi {nome}! I would like a day-of coordinator for my event.' },
    { numero: '04', titulo: 'Sweet 15 & 16', preco: 'From $1,200', texto: 'Ballroom, court, dress change, surprise dance and a party her friends will still talk about in college.', whatsapp: 'Hi {nome}! I am planning a Sweet 15 / 16 and would like a quote.' },
    { numero: '05', titulo: 'Showers & birthdays', preco: 'From $600', texto: 'Baby showers, gender reveals, milestone birthdays. Styled tables, balloons, dessert bar and flow.', whatsapp: 'Hi {nome}! I would like help with a shower or birthday party.' },
    { numero: '06', titulo: 'Corporate & church', preco: 'Custom quote', texto: 'Galas, holiday parties, conferences and church celebrations with AV, catering and registration handled.', whatsapp: 'Hi {nome}! I would like a quote for a corporate or church event.' }
  ],
  servicosImagem: 'assets/planner.jpg',

  // Pacote em destaque. Deixe titulo: '' para esconder a seção.
  pacote: {
    selo: 'Most booked',
    titulo: 'Design + Day-of',
    preco: 'From $1,650',
    texto: 'Two design meetings, a vendor shortlist, a full timeline and a lead coordinator plus assistant on the day. Ideal for couples who planned most of it and want it to run itself.'
  },

  galeria: [
    { imagem: 'assets/ceremony.jpg', legenda: 'Seaside ceremony' },
    { imagem: 'assets/sweet16.jpg', legenda: 'Sweet 16 ballroom' },
    { imagem: 'assets/babyshower.jpg', legenda: 'Garden baby shower' },
    { imagem: 'assets/party.jpg', legenda: 'Reception dance floor' },
    { imagem: 'assets/birthday.jpg', legenda: 'Milestone birthday' },
    { imagem: 'assets/corporate.jpg', legenda: 'Corporate gala' }
  ],

  processo: [
    { titulo: 'Discovery call', texto: 'Twenty minutes on WhatsApp or Zoom: date, guest count, budget and the feeling you want in the room.' },
    { titulo: 'Proposal & design', texto: 'A clear scope, a mood board and a vendor shortlist with real prices, usually within 72 hours.' },
    { titulo: 'Planning sprints', texto: 'Short check-ins, a shared timeline and a budget tracker so nothing slips.' },
    { titulo: 'The day', texto: 'We arrive first, leave last and handle every cue. You just show up and celebrate.' }
  ],

  sobre: {
    titulo: 'Planned like family, run like a pro.',
    texto1: 'We started planning parties for our own community and never stopped. Today we design and run events across {bairro} for couples and families who want it done right, in their language.',
    texto2: 'Every event gets a lead planner, a written timeline and vendors we have actually worked with. No surprises on the invoice, no surprises on the day.',
    assinatura: 'Your planning team in {bairro}',
    imagem: 'assets/planner.jpg',
    numeros: [
      { valor: '+120', rotulo: 'events delivered' },
      { valor: '+40', rotulo: 'trusted vendors' },
      { valor: '5★', rotulo: 'on Google' }
    ]
  },

  // SUBSTITUA por avaliações reais do Google do cliente antes de publicar.
  avaliacoes: {
    nota: '5.0',
    total: 'Google reviews',
    lista: [
      { texto: 'They handled our wedding timeline, the vendors and even my mother-in-law. We did not touch a single thing that day.', nome: 'Google review' },
      { texto: 'My daughter’s Sweet 15 looked like a magazine. Everything on time, everything beautiful.', nome: 'Google review' },
      { texto: 'Bilingual, organized and calm under pressure. Our company holiday party ran itself.', nome: 'Google review' }
    ]
  },

  inquiry: {
    titulo: 'Tell us about your event',
    texto: 'Thirty seconds. The message goes straight to our WhatsApp and a planner replies the same day.',
    fields: [
      { key: 'type', label: 'What are you planning?', type: 'chips', options: ['a wedding', 'a Sweet 15 / 16', 'a baby shower', 'a birthday', 'a corporate event', 'something else'] },
      { key: 'date', label: 'Event date (or month)', type: 'text', placeholder: 'e.g. June 2027' },
      { key: 'guests', label: 'Guest count', type: 'chips', options: ['under 50', '50 to 100', '100 to 200', '200+'] },
      { key: 'help', label: 'How much help do you want?', type: 'chips', options: ['full planning', 'partial planning', 'day-of coordination', 'not sure yet'] }
    ],
    message: 'Hi {nome}! My name is {name}. I found you through your website.\nI am planning {type} around {date} for {guests} guests and I am looking for {help}.\nCould you tell me how it works and what it would cost?'
  },

  area: {
    titulo: 'Where we work',
    texto: 'Based in {bairro}, serving all of {cidade}, Rhode Island, New Hampshire and Connecticut. Destination events on request.',
    lista: ['Boston & Cambridge', 'Framingham & MetroWest', 'Worcester', 'Lowell & Merrimack Valley', 'Cape Cod', 'Providence, RI']
  },

  cta: {
    titulo: 'Let’s plan it together.',
    texto: 'Message us on WhatsApp with your date and we will tell you honestly what is possible.',
    imagem: 'assets/party.jpg'
  },

  rodape: {
    credito: 'Site by Raw AI',
    creditoLink: 'https://rawdre.github.io/ai-consulting/'
  }
};
