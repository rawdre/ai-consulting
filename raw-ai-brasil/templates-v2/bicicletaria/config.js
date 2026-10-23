/* =====================================================================
   CONFIGURAÇÃO DO SITE — edite SÓ este arquivo para cada cliente.
   Textos aceitam {nome}, {bairro} e {cidade} (preenchidos automaticamente).
   Fotos: troque os arquivos em assets/ pelas fotos reais (mesmo nome)
   ou aponte os caminhos abaixo para os novos arquivos.
   ===================================================================== */
window.SITE = {
  negocio: {
    nome: 'Sua Oficina de Bike',
    slogan: 'Bicicletaria & oficina',
    bairro: 'seu bairro',
    cidade: 'Brasília - DF'
  },

  contato: {
    whatsapp: '5561998229223',            // só números, com 55 + DDD (padrão = Raw AI para as demos; trocar pelo do cliente)
    telefone: '(61) 99822-9223',
    endereco: 'Endereço completo, {bairro} — {cidade}',
    mapa: '',                               // opcional: texto de busca do Google Maps
    instagram: '',                          // ex: 'https://instagram.com/suaoficina'
    instagramUser: '@suaoficina'
  },

  seo: {
    titulo: '{nome} | Oficina de bike em {bairro} — {cidade}',
    descricao: 'Revisão, regulagem, suspensão, montagem e bike fit em {bairro}. Orçamento rápido pelo WhatsApp.'
  },

  tema: { cor: '#FF5F1F' },

  hero: {
    selo: 'Oficina de bike · {bairro}',
    titulo1: 'Sua bike',
    titulo2: 'pronta pra trilha.',
    texto: 'Revisão, regulagem, suspensão e montagem feitas por mecânico que pedala. Diagnóstico honesto, orçamento no WhatsApp e bike devolvida rodando macio.',
    imagem: 'assets/hero.jpg',
    destaques: ['★ 5.0 no Google', 'Leva e busca', 'MTB · Speed · Urbana · E-bike']
  },

  // Faixa animada logo abaixo do hero (tipos de bike / especialidades).
  faixa: ['Mountain bike', 'Speed', 'Gravel', 'Urbana', 'E-bike', 'Infantil', 'Suspensão', 'Freio hidráulico'],

  servicos: [
    { numero: '01', titulo: 'Revisão completa', preco: 'A partir de R$ 120', texto: 'Desmontagem, limpeza, lubrificação, troca de cabos se preciso e regulagem geral. Sua bike sai como nova.', whatsapp: 'Olá! Quero orçar uma revisão completa na {nome}.' },
    { numero: '02', titulo: 'Câmbio & freio', preco: 'A partir de R$ 40', texto: 'Regulagem de câmbio dianteiro e traseiro, sangria de freio hidráulico e troca de pastilhas.', whatsapp: 'Olá! Preciso regular câmbio/freio na {nome}.' },
    { numero: '03', titulo: 'Suspensão', preco: 'A partir de R$ 180', texto: 'Manutenção de garfo e shock: retentores, óleo e ajuste de SAG para o seu peso e estilo.', whatsapp: 'Olá! Quero orçar manutenção de suspensão na {nome}.' },
    { numero: '04', titulo: 'Montagem', preco: 'A partir de R$ 150', texto: 'Montagem de bike nova ou do zero, peça por peça, com torque certo em cada parafuso.', whatsapp: 'Olá! Quero montar uma bike na {nome}.' },
    { numero: '05', titulo: 'Lavagem detalhada', preco: 'A partir de R$ 50', texto: 'Lavagem técnica com desengraxante na transmissão, secagem e lubrificação final.', whatsapp: 'Olá! Quero agendar uma lavagem na {nome}.' },
    { numero: '06', titulo: 'Bike fit', preco: 'A partir de R$ 200', texto: 'Ajuste de selim, guidão e taquinhos para pedalar com mais conforto, potência e sem dor.', whatsapp: 'Olá! Quero agendar um bike fit na {nome}.' }
  ],

  passos: [
    { numero: '01', titulo: 'Leva ou busca', texto: 'Traga sua bike até a oficina ou peça a busca em {bairro} e região.' },
    { numero: '02', titulo: 'Diagnóstico', texto: 'O mecânico revisa tudo e aponta o que precisa — e o que ainda aguenta.' },
    { numero: '03', titulo: 'Orçamento no WhatsApp', texto: 'Você recebe fotos e o valor antes de qualquer serviço. Sem surpresa.' },
    { numero: '04', titulo: 'Retira e pedala', texto: 'Bike testada, regulada e pronta. É só retirar (ou receber) e voltar pra trilha.' }
  ],

  numeros: [
    { valor: '+10', rotulo: 'anos de oficina' },
    { valor: '+3.000', rotulo: 'bikes atendidas' },
    { valor: '48h', rotulo: 'prazo médio de revisão' }
  ],

  galeria: [
    { imagem: 'assets/cambio.jpg', legenda: 'Regulagem de câmbio' },
    { imagem: 'assets/suspensao.jpg', legenda: 'Revisão de suspensão' },
    { imagem: 'assets/roda.jpg', legenda: 'Alinhamento de roda' },
    { imagem: 'assets/ferramentas.jpg', legenda: 'A oficina' },
    { imagem: 'assets/trilha.jpg', legenda: 'De volta à trilha' }
  ],

  // SUBSTITUA por avaliações reais do Google do cliente antes de publicar.
  avaliacoes: {
    nota: '5.0',
    total: 'avaliações no Google',
    lista: [
      { texto: 'Levei a bike com o câmbio pulando e voltou perfeita. Me mandaram foto de tudo antes de fazer.', nome: 'Cliente Google' },
      { texto: 'Revisaram a suspensão e a diferença na trilha foi absurda. Preço justo e prazo cumprido.', nome: 'Cliente Google' },
      { texto: 'Atendimento de quem entende de pedal. Viraram a oficina oficial do meu grupo.', nome: 'Cliente Google' }
    ]
  },

  horarios: [
    { dia: 'Segunda a sexta', hora: '08:30 — 18:30' },
    { dia: 'Sábado', hora: '08:30 — 14:00' },
    { dia: 'Domingo', hora: 'Fechado' }
  ],

  agendamento: {
    servicos: ['Revisão completa', 'Regulagem de câmbio / freio', 'Suspensão', 'Montagem', 'Lavagem detalhada', 'Bike fit', 'Outro']
  },

  cta: {
    titulo: 'A trilha não espera.',
    texto: 'Mande uma foto da sua bike no WhatsApp e receba o orçamento hoje.',
    imagem: 'assets/trilha.jpg'
  },

  rodape: {
    credito: 'Site por Raw AI',
    creditoLink: 'https://rawdre.github.io/ai-consulting/'
  }
};
