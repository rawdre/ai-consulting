/* =====================================================================
   CONFIGURAÇÃO DO SITE — edite SÓ este arquivo para cada cliente.
   Textos aceitam {nome}, {bairro} e {cidade} (preenchidos automaticamente).
   Fotos: troque os arquivos em assets/ pelas fotos reais (mesmo nome)
   ou aponte os caminhos abaixo para os novos arquivos.
   ===================================================================== */
window.SITE = {
  negocio: {
    nome: 'Sua Barbearia',
    slogan: 'Tradição & estilo',
    bairro: 'seu bairro',
    cidade: 'Brasília - DF'
  },

  contato: {
    whatsapp: '5561998229223',            // só números, com 55 + DDD (padrão = Raw AI para as demos; trocar pelo do cliente)
    telefone: '(61) 99822-9223',
    endereco: 'Endereço completo, {bairro} — {cidade}',
    mapa: '',                               // opcional: texto de busca do Google Maps
    instagram: '',                          // ex: 'https://instagram.com/suabarbearia'
    instagramUser: '@suabarbearia',
    agendamento: ''                         // opcional: link de app de agenda (Trinks, Booksy...)
  },

  seo: {
    titulo: '{nome} | Barbearia em {bairro} — {cidade}',
    descricao: 'Corte, barba e tratamento masculino em {bairro}. Agende seu horário pelo WhatsApp.'
  },

  tema: { cor: '#C8813F' },

  hero: {
    selo: 'Barbearia clássica · {bairro}',
    titulo: '{nome}',
    subtitulo: 'Precisão em cada corte',
    texto: 'Corte, barba e cuidado masculino feitos por quem leva o ofício a sério. Ambiente de barbearia de verdade, hora marcada e atendimento sem pressa.',
    imagem: 'assets/hero.jpg'
  },

  sobre: {
    titulo: 'Mais que um corte. Uma experiência.',
    texto1: 'Aqui cada cliente senta na cadeira com tempo. Conversa boa, toalha quente, navalha afiada e um acabamento que dura a semana inteira.',
    texto2: 'Unimos o clássico da barbearia tradicional com técnicas modernas de degradê e visagismo — para o homem que se cuida sem complicar.',
    imagem: 'assets/cadeira.jpg',
    numeros: [
      { valor: '+2.000', rotulo: 'cortes por ano' },
      { valor: '5★', rotulo: 'no Google' },
      { valor: '+8', rotulo: 'anos de ofício' }
    ]
  },

  servicos: [
    { titulo: 'Corte masculino', preco: 'R$ 45', texto: 'Degradê, social, navalhado ou na tesoura.' },
    { titulo: 'Barba completa', preco: 'R$ 35', texto: 'Toalha quente, navalha e hidratação.' },
    { titulo: 'Corte + barba', preco: 'R$ 70', texto: 'O combo mais pedido da casa.' },
    { titulo: 'Sobrancelha', preco: 'R$ 15', texto: 'Alinhamento na navalha ou pinça.' },
    { titulo: 'Pigmentação', preco: 'R$ 30', texto: 'Disfarce de falhas com acabamento natural.' },
    { titulo: 'Pacote VIP', preco: 'R$ 110', texto: 'Corte, barba, sobrancelha, hidratação e bebida.' }
  ],

  galeria: [
    { imagem: 'assets/degrade.jpg', legenda: 'Degradê' },
    { imagem: 'assets/barba.jpg', legenda: 'Barba na navalha' },
    { imagem: 'assets/ferramentas.jpg', legenda: 'Ferramentas' },
    { imagem: 'assets/hero.jpg', legenda: 'O espaço' }
  ],

  // SUBSTITUA por avaliações reais do Google do cliente antes de publicar.
  avaliacoes: {
    nota: '5.0',
    total: 'avaliações no Google',
    lista: [
      { texto: 'Melhor barbearia da região. Corte perfeito toda vez e ambiente muito bom.', nome: 'Cliente Google' },
      { texto: 'Barba impecável com toalha quente. Atendimento pontual, sem enrolação.', nome: 'Cliente Google' },
      { texto: 'Fui indicado por um amigo e virei cliente fixo. Recomendo demais.', nome: 'Cliente Google' }
    ]
  },

  horarios: [
    { dia: 'Segunda', hora: 'Fechado' },
    { dia: 'Terça a sexta', hora: '09:00 — 20:00' },
    { dia: 'Sábado', hora: '08:00 — 18:00' },
    { dia: 'Domingo', hora: 'Fechado' }
  ],

  cta: {
    titulo: 'Seu horário te espera.',
    texto: 'Agende agora pelo WhatsApp e garanta seu lugar na cadeira.',
    imagem: 'assets/fachada.jpg'
  },

  rodape: {
    credito: 'Site por Raw AI',
    creditoLink: 'https://rawdre.github.io/ai-consulting/'
  }
};
