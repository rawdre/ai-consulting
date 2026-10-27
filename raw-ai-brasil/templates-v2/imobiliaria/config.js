/* =====================================================================
   CONFIGURAÇÃO DO SITE — edite SÓ este arquivo para cada cliente.
   Textos aceitam {nome}, {bairro}, {cidade}, {creci} e {desde}
   (preenchidos automaticamente).
   Fotos: troque os arquivos em assets/ pelas fotos reais (mesmo nome)
   ou aponte os caminhos abaixo para os novos arquivos.
   ===================================================================== */
window.SITE = {
  negocio: {
    nome: 'Sua Imobiliária',
    slogan: 'Imóveis & Negócios',
    bairro: 'sua região',
    cidade: 'Brasília - DF',
    creci: 'CRECI 00000-J',
    desde: '2005'
  },

  contato: {
    whatsapp: '5561998229223',            // só números, com 55 + DDD (padrão = Raw AI para as demos; trocar pelo do cliente)
    telefone: '(61) 99822-9223',
    email: 'contato@suaimobiliaria.com.br',
    endereco: 'Endereço completo, {bairro} — {cidade}',
    mapa: '',                               // opcional: texto de busca do Google Maps
    instagram: '',                          // ex: 'https://instagram.com/suaimobiliaria'
    instagramUser: '@suaimobiliaria'
  },

  seo: {
    titulo: '{nome} | Imóveis à venda e para alugar em {bairro} — {cidade}',
    descricao: 'Compre, venda ou alugue com quem conhece {bairro}. Avaliação gratuita do seu imóvel e atendimento direto pelo WhatsApp.'
  },

  tema: { cor: '#C8A24A' },

  hero: {
    selo: 'Especialistas em imóveis desde {desde}',
    titulo: 'Seu próximo endereço em {bairro}',
    texto: 'Compre, venda ou alugue com quem conhece cada rua da região. Atendimento direto, sem enrolação, do primeiro contato à entrega das chaves.',
    imagem: 'assets/hero.jpg'
  },

  // Imóveis em destaque. finalidade: 'venda' ou 'aluguel'.
  // SUBSTITUA pelos imóveis reais do cliente (fotos em assets/).
  imoveis: [
    { codigo: 'AP-101', finalidade: 'venda', tipo: 'Apartamento', titulo: 'Apartamento 3 quartos com varanda', bairro: '{bairro}', preco: 'R$ 780.000', quartos: '3', vagas: '2', area: '98 m²', imagem: 'assets/sala.jpg' },
    { codigo: 'CA-204', finalidade: 'venda', tipo: 'Casa', titulo: 'Casa em condomínio fechado', bairro: '{bairro}', preco: 'R$ 1.450.000', quartos: '4', vagas: '3', area: '260 m²', imagem: 'assets/casa.jpg' },
    { codigo: 'CO-310', finalidade: 'venda', tipo: 'Cobertura', titulo: 'Cobertura com piscina privativa', bairro: '{bairro}', preco: 'R$ 2.100.000', quartos: '4', vagas: '3', area: '320 m²', imagem: 'assets/cobertura.jpg' },
    { codigo: 'ST-018', finalidade: 'aluguel', tipo: 'Studio', titulo: 'Studio mobiliado perto do metrô', bairro: '{bairro}', preco: 'R$ 2.300/mês', quartos: '1', vagas: '1', area: '34 m²', imagem: 'assets/studio.jpg' },
    { codigo: 'AP-122', finalidade: 'aluguel', tipo: 'Apartamento', titulo: 'Apartamento 2 quartos, cozinha gourmet', bairro: '{bairro}', preco: 'R$ 3.900/mês', quartos: '2', vagas: '1', area: '72 m²', imagem: 'assets/cozinha.jpg' },
    { codigo: 'SC-045', finalidade: 'aluguel', tipo: 'Sala comercial', titulo: 'Sala comercial com vista', bairro: '{bairro}', preco: 'R$ 5.500/mês', quartos: '—', vagas: '2', area: '110 m²', imagem: 'assets/comercial.jpg' }
  ],

  servicos: [
    { numero: '01', titulo: 'Venda de imóveis', texto: 'Avaliação, fotos profissionais, divulgação e negociação até a escritura.' },
    { numero: '02', titulo: 'Locação', texto: 'Inquilino com análise de crédito, contrato seguro e vistoria completa.' },
    { numero: '03', titulo: 'Administração', texto: 'Cobrança, repasse, manutenção e prestação de contas todo mês.' },
    { numero: '04', titulo: 'Avaliação gratuita', texto: 'Descubra quanto vale seu imóvel hoje, para vender ou para alugar.' },
    { numero: '05', titulo: 'Garantias locatícias', texto: 'Seguro-fiança, título de capitalização ou caução — sem precisar de fiador.' },
    { numero: '06', titulo: 'Financiamento e consórcio', texto: 'Simulação e acompanhamento do crédito com os principais bancos.' }
  ],

  numeros: [
    { valor: '+20', rotulo: 'anos de mercado' },
    { valor: '+1.500', rotulo: 'imóveis negociados' },
    { valor: '+300', rotulo: 'imóveis administrados' },
    { valor: '4,9★', rotulo: 'no Google' }
  ],

  // Estimativa inicial no formulário de avaliação (valor médio do m² na região).
  // AJUSTE para a realidade do bairro do cliente — é só uma faixa de referência.
  avaliacao: {
    titulo: 'Quanto vale o seu imóvel?',
    texto: 'Responda 4 perguntas e veja uma faixa inicial de valor. Um corretor confirma a avaliação gratuita pelo WhatsApp.',
    m2Venda: 9500,
    m2Aluguel: 45,
    tipos: ['Apartamento', 'Casa', 'Cobertura', 'Sala comercial', 'Lote']
  },

  proprietario: {
    titulo: 'É proprietário? Anuncie com a gente.',
    texto: 'Seu imóvel com fotos profissionais, nos principais portais e na mão de corretores que conhecem {bairro}. Você só paga quando fecha negócio.',
    imagem: 'assets/condominio.jpg',
    lista: [
      { texto: 'Avaliação gratuita e sem compromisso' },
      { texto: 'Fotos profissionais e anúncio nos portais' },
      { texto: 'Inquilinos e compradores com análise de crédito' },
      { texto: 'Contrato e documentação por nossa conta' }
    ]
  },

  sobre: {
    titulo: 'Gente que conhece {bairro} de perto',
    texto: 'Somos uma imobiliária local, com corretores que moram e trabalham na região. Isso faz diferença no preço certo, no tempo de venda e na segurança do negócio.',
    imagem: 'assets/chaves.jpg'
  },

  // SUBSTITUA por avaliações reais do Google do cliente antes de publicar.
  depoimentos: [
    { texto: 'Vendemos nosso apartamento em menos de 60 dias, pelo valor que esperávamos. Atendimento muito próximo.', nome: 'Cliente Google' },
    { texto: 'Alugaram meu imóvel rápido e cuidam de tudo. Recebo o repasse certinho todo mês.', nome: 'Cliente Google' },
    { texto: 'Encontraram a casa que a gente queria e ajudaram com o financiamento do começo ao fim.', nome: 'Cliente Google' }
  ],

  bairros: ['{bairro}', 'Águas Claras', 'Taguatinga', 'Guará', 'Sudoeste', 'Noroeste', 'Asa Norte', 'Asa Sul', 'Vicente Pires', 'Park Way', 'Lago Sul', 'Sobradinho'],

  horarios: [
    { dia: 'Segunda a sexta', hora: '08:00 — 18:00' },
    { dia: 'Sábado', hora: '09:00 — 13:00' },
    { dia: 'Domingo', hora: 'Plantão pelo WhatsApp' }
  ],

  rodape: {
    credito: 'Site por Raw AI',
    creditoLink: 'https://rawdre.github.io/ai-consulting/'
  }
};
