/* =====================================================================
   CONFIGURAÇÃO DO SITE — edite SÓ este arquivo para cada cliente.
   Textos aceitam {nome}, {bairro} e {cidade} (preenchidos automaticamente).
   Fotos: troque os arquivos em assets/ pelas fotos reais (mesmo nome)
   ou aponte os caminhos abaixo para os novos arquivos.
   ===================================================================== */
window.SITE = {
  negocio: {
    nome: 'Seu Studio de Beleza',
    slogan: 'Manicure & pedicure',
    bairro: 'seu bairro',
    cidade: 'Brasília - DF'
  },

  contato: {
    whatsapp: '5561998229223',            // só números, com 55 + DDD (padrão = Raw AI para as demos; trocar pelo do cliente)
    telefone: '(61) 99822-9223',
    endereco: 'Endereço completo, {bairro} — {cidade}',
    mapa: '',                               // opcional: texto de busca do Google Maps
    instagram: '',                          // ex: 'https://instagram.com/seustudio'
    instagramUser: '@seustudio',
    agendamento: ''                         // opcional: link de app de agenda (Trinks, Booksy...)
  },

  seo: {
    titulo: '{nome} | Manicure & Pedicure em {bairro} — {cidade}',
    descricao: 'Manicure, pedicure, esmaltação em gel, alongamento e nail art em {bairro}. Agende seu horário pelo WhatsApp.'
  },

  tema: { cor: '#8E5664' },

  hero: {
    selo: 'Studio de unhas · {bairro}',
    titulo1: 'A arte de cuidar',
    titulo2: 'das suas mãos.',
    texto: 'Manicure, pedicure e nail art com acabamento impecável, materiais esterilizados e um atendimento sem pressa — num espaço pensado para você desacelerar.',
    imagem: 'assets/hero.jpg',
    destaques: ['★ 5.0 no Google', 'Material esterilizado', 'Hora marcada']
  },

  // Faixa animada entre seções (palavras curtas).
  faixa: ['Manicure', 'Pedicure', 'Esmaltação em gel', 'Alongamento', 'Spa dos pés', 'Nail art'],

  servicos: [
    { numero: '01', titulo: 'Manicure', preco: 'A partir de R$ 35', texto: 'Cutilagem cuidadosa, lixamento no formato ideal e esmaltação clássica.', whatsapp: 'Olá! Quero agendar uma manicure no {nome}.' },
    { numero: '02', titulo: 'Pedicure', preco: 'A partir de R$ 40', texto: 'Pés limpos, cutículas tratadas e esmaltação com acabamento perfeito.', whatsapp: 'Olá! Quero agendar uma pedicure no {nome}.' },
    { numero: '03', titulo: 'Esmaltação em gel', preco: 'A partir de R$ 70', texto: 'Brilho intenso e duração de até 3 semanas, sem lascar.', whatsapp: 'Olá! Quero agendar esmaltação em gel no {nome}.' },
    { numero: '04', titulo: 'Alongamento', preco: 'A partir de R$ 150', texto: 'Fibra de vidro ou gel moldado, com formato e comprimento sob medida.', whatsapp: 'Olá! Quero saber sobre alongamento de unhas no {nome}.' },
    { numero: '05', titulo: 'Spa dos pés', preco: 'A partir de R$ 80', texto: 'Escalda-pés, esfoliação, hidratação profunda e massagem relaxante.', whatsapp: 'Olá! Quero agendar um spa dos pés no {nome}.' },
    { numero: '06', titulo: 'Nail art', preco: 'A partir de R$ 10 / unha', texto: 'Francesinha, linhas finas, pedrarias e desenhos exclusivos.', whatsapp: 'Olá! Quero fazer nail art no {nome}.' }
  ],
  servicosImagem: 'assets/manicure.jpg',

  // Pacote em destaque. Deixe titulo: '' para esconder a seção.
  pacote: {
    selo: 'Ritual completo',
    titulo: 'Mãos & Pés + Spa',
    preco: 'A partir de R$ 140',
    texto: 'Manicure, pedicure e spa dos pés no mesmo horário. Uma pausa de verdade, com café e tempo só para você.'
  },

  galeria: [
    { imagem: 'assets/nail-art.jpg', legenda: 'Francesinha com filete' },
    { imagem: 'assets/manicure.jpg', legenda: 'Amendoada nude' },
    { imagem: 'assets/esmaltes.jpg', legenda: 'Cartela de cores' },
    { imagem: 'assets/cafe.jpg', legenda: 'Gel malva' },
    { imagem: 'assets/pedicure.jpg', legenda: 'Spa dos pés' },
    { imagem: 'assets/studio.jpg', legenda: 'O studio' }
  ],

  sobre: {
    titulo: 'Cuidado de verdade, unha por unha.',
    texto1: 'Cada atendimento começa com uma conversa: o formato que combina com suas mãos, a cor do momento, a rotina que você leva. Só depois vem a lixa.',
    texto2: 'Trabalho com materiais esterilizados em autoclave, lixas descartáveis e produtos de linha profissional — porque beleza e saúde andam juntas.',
    assinatura: 'Sua profissional de confiança em {bairro}',
    imagem: 'assets/studio.jpg',
    numeros: [
      { valor: '+8', rotulo: 'anos de experiência' },
      { valor: '+3.000', rotulo: 'atendimentos' },
      { valor: '5★', rotulo: 'no Google' }
    ]
  },

  // SUBSTITUA por avaliações reais do Google do cliente antes de publicar.
  avaliacoes: {
    nota: '5.0',
    total: 'avaliações no Google',
    lista: [
      { texto: 'Unhas perfeitas e um atendimento delicado do começo ao fim. O gel durou quase um mês!', nome: 'Cliente Google' },
      { texto: 'Ambiente lindo, tudo muito limpo e organizado. Saí relaxada e com as mãos impecáveis.', nome: 'Cliente Google' },
      { texto: 'Fiz o spa dos pés e virei cliente fixa. Pontual, caprichosa e super atenciosa.', nome: 'Cliente Google' }
    ]
  },

  horarios: [
    { dia: 'Segunda', hora: 'Fechado' },
    { dia: 'Terça a sexta', hora: '09:00 — 19:00' },
    { dia: 'Sábado', hora: '08:00 — 16:00' },
    { dia: 'Domingo', hora: 'Fechado' }
  ],

  cta: {
    titulo: 'Seu momento te espera.',
    texto: 'Agende agora pelo WhatsApp e escolha o melhor horário para você.',
    imagem: 'assets/cafe.jpg'
  },

  rodape: {
    credito: 'Site por Raw AI',
    creditoLink: 'https://rawdre.github.io/ai-consulting/'
  }
};
