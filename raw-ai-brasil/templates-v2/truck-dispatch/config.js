/* =====================================================================
   CONFIGURAÇÃO DO SITE — edite SÓ este arquivo para cada cliente.
   Site em INGLÊS (o público são carriers/owner-operators nos EUA).
   Textos aceitam {nome}, {bairro} e {cidade} (preenchidos automaticamente).
   Fotos: troque os arquivos em assets/ (mesmo nome) ou aponte os caminhos.
   ===================================================================== */
window.SITE = {
  negocio: {
    nome: 'Your Dispatch Co.',
    slogan: 'Truck Dispatch Service',
    bairro: 'nationwide',
    cidade: 'Atlanta, GA'
  },

  contato: {
    whatsapp: '5561998229223',            // só números, com código do país (padrão = Raw AI para as demos; trocar pelo do cliente)
    telefone: '+1 (000) 000-0000',
    telefoneLink: '',                       // ex: 'tel:+14045551234' (vazio = esconde o botão de ligar)
    email: 'dispatch@yourcompany.com',
    idiomas: 'English · Español · Português'
  },

  seo: {
    titulo: '{nome} | Truck Dispatch for Owner-Operators & Small Fleets',
    descricao: 'We book your loads, negotiate the rate and handle the paperwork. Priced by your equipment, no setup fee, cancel anytime.'
  },

  tema: { cor: '#FF7A1A' },

  hero: {
    selo: 'For owner-operators & small fleets · {cidade}',
    titulo1: 'Loaded miles.',
    titulo2: 'Honest rates.',
    titulo3: 'Zero guesswork.',
    texto: 'We find the loads, negotiate the rate, handle the broker paperwork and send you every number. Priced by your equipment — no setup fee, no long contract.',
    imagem: 'assets/hero.jpg',
    confianca: [
      { texto: 'No setup fee' },
      { texto: 'Month-to-month' },
      { texto: 'Bilingual dispatch' }
    ]
  },

  pilares: [
    { numero: '01', titulo: 'Load booking', texto: 'DAT, Truckstop, Amazon Relay and direct broker relationships — we hunt the lanes that pay, not just the first load on the board.' },
    { numero: '02', titulo: 'Rate negotiation', texto: 'Every load is negotiated before you see it. We know the lane averages and we walk away from cheap freight.' },
    { numero: '03', titulo: 'Paperwork & reporting', texto: 'Rate cons, broker packets, POD, invoicing and a weekly report with gross, RPM and deadhead — all in one place.' }
  ],

  // Faixas de mercado (% do bruto por equipamento). AJUSTE para a tabela do cliente.
  faixas: [
    { equipamento: 'Power Only', min: '4%', ideal: '5%', max: '6%' },
    { equipamento: 'Dry Van', min: '5%', ideal: '6%', max: '7%' },
    { equipamento: 'Reefer', min: '6%', ideal: '7%', max: '8%' },
    { equipamento: 'Flatbed', min: '7%', ideal: '8%', max: '9%' },
    { equipamento: 'Step Deck', min: '7%', ideal: '8.5%', max: '10%' },
    { equipamento: 'Hot Shot', min: '7%', ideal: '8%', max: '10%' },
    { equipamento: 'Conestoga', min: '8%', ideal: '9%', max: '10%' }
  ],

  planos: [
    { nome: 'Load Finding', destaque: '', texto: 'We find loads and send you the rate cons. For veterans who negotiate on their own.', itens: 'Load search · Rate cons · Broker setup' },
    { nome: 'Standard Dispatch', destaque: 'Most popular', texto: 'Search, negotiation, paperwork, POD and a weekly report. What most carriers want.', itens: 'Everything in Load Finding · Negotiation · Invoicing · Weekly report' },
    { nome: 'Full Service', destaque: '', texto: '24/7 dispatch, monthly lane review and a performance guarantee on your previous RPM.', itens: 'Everything in Standard · 24/7 line · Monthly review · RPM guarantee' }
  ],

  incluso: [
    { texto: 'Load boards + direct broker relationships' },
    { texto: 'Broker packets, rate cons and POD handled' },
    { texto: 'Weekly report: gross, RPM, deadhead' },
    { texto: 'Bilingual dispatch team' }
  ],
  naoCobramos: [
    { texto: 'Setup fee' },
    { texto: 'Long-term contracts' },
    { texto: 'Hidden percentages' },
    { texto: 'Kickbacks from factoring' }
  ],

  atendemos: [
    { titulo: 'Dry Van', nota: "53' standard, up to 45,000 lb", imagem: 'assets/doca.jpg' },
    { titulo: 'Reefer', nota: '-20°F to +80°F, produce season ready', imagem: 'assets/reefer.jpg' },
    { titulo: 'Flatbed & Step Deck', nota: "48' / 53', oversized with permits", imagem: 'assets/flatbed.jpg' }
  ],
  outrosEquipamentos: 'Also: Power Only · Hot Shot · Conestoga · Cargo Van (expedite)',
  naoAtendemos: [
    { titulo: 'HazMat tankers', motivo: 'Specialized — we refer you to a partner.' },
    { titulo: 'Authorities under 90 days', motivo: 'Most brokers reject them; we help you get ready first.' }
  ],

  passosImagem: 'assets/dispatch.jpg',
  passos: [
    { numero: '1', titulo: 'Free call', texto: 'Tell us your equipment, home base and preferred lanes. We quote your exact percentage.' },
    { numero: '2', titulo: 'Send your packet', texto: 'MC authority, COI, W-9 and a signed dispatch agreement. Takes about 15 minutes.' },
    { numero: '3', titulo: 'First load this week', texto: 'We set up your broker packets and start booking. You drive, we handle the rest.' }
  ],

  // Valores iniciais da calculadora de lucro por carga.
  calculadora: { frete: 2800, milhas: 950, deadhead: 120, mpg: 6.5, diesel: 3.85, taxa: 7 },

  faq: [
    { pergunta: 'How does pricing work?', resposta: 'A percentage of the gross on each load we book and you accept, based on your equipment (roughly 5% to 10%). No setup fee, no monthly minimum. We invoice weekly with every load itemized.' },
    { pergunta: 'Do I have to sign a long contract?', resposta: 'No. Month-to-month, cancel anytime with 7 days written notice. Carriers stay because the numbers are visible, not because they are locked in.' },
    { pergunta: 'What do you need from me to start?', resposta: 'MC authority letter, certificate of insurance (cargo + auto liability), W-9, the signed dispatch agreement and a limited power of attorney so we can sign rate cons on your behalf.' },
    { pergunta: 'Are you a freight broker?', resposta: 'No. We are a dispatch service acting as your agent. We never take possession of the freight or the freight money — the broker pays you (or your factoring company) directly.' },
    { pergunta: 'Which load boards do you use?', resposta: 'DAT and Truckstop as the main boards, plus Amazon Relay, broker carrier portals and direct relationships with brokers on the lanes you run.' }
  ],

  onboarding: {
    titulo: 'Get a free quote with your numbers.',
    texto: 'Answer 5 quick questions. The message goes straight to our dispatch WhatsApp and we reply within the hour during business hours.',
    equipamentos: ['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Power Only', 'Hot Shot', 'Cargo Van'],
    vagas: 'Taking 3 new carriers this month'
  },

  rodape: {
    aviso: '{nome} is a truck dispatch service, not a freight broker or carrier.',
    credito: 'Site por Raw AI',
    creditoLink: 'https://rawdre.github.io/ai-consulting/'
  }
};
