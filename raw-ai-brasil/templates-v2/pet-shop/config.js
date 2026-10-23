/* =====================================================================
   CONFIGURAÇÃO DO SITE — edite SÓ este arquivo para cada cliente.
   Textos aceitam {nome}, {bairro} e {cidade} (preenchidos automaticamente).
   Fotos: troque os arquivos em assets/ pelas fotos reais (mesmo nome)
   ou aponte os caminhos abaixo para os novos arquivos.
   ===================================================================== */
window.SITE = {
  negocio: {
    nome: 'Seu Pet Shop',
    slogan: 'Banho, tosa & loja',
    bairro: 'seu bairro',
    cidade: 'Brasília - DF'
  },

  contato: {
    whatsapp: '5561900000000',            // só números, com 55 + DDD
    telefone: '(61) 90000-0000',
    endereco: 'Endereço completo, {bairro} — {cidade}',
    mapa: '',                               // opcional: texto de busca do Google Maps
    instagram: '',                          // ex: 'https://instagram.com/seupetshop'
    instagramUser: '@seupetshop'
  },

  seo: {
    titulo: '{nome} | Banho & Tosa em {bairro} — {cidade}',
    descricao: 'Banho, tosa, rações e acessórios em {bairro}. Agende pelo WhatsApp em menos de 1 minuto.'
  },

  tema: { cor: '#FF7A1A' },

  hero: {
    selo: 'Banho & tosa com hora marcada',
    titulo1: 'Seu pet merece',
    titulo2: 'o melhor cuidado.',
    texto: 'Banho, tosa, rações premium e acessórios em {bairro}. Profissionais pacientes, produtos de qualidade e agendamento direto pelo WhatsApp.',
    imagem: 'assets/hero.jpg',
    destaques: ['★ 5.0 no Google', 'Busca e entrega', 'Atendimento em {bairro}']
  },

  servicos: [
    { titulo: 'Banho completo', preco: 'A partir de R$ 45', texto: 'Produtos hipoalergênicos, secagem completa, perfume e laço ou bandana.', imagem: 'assets/banho.jpg', whatsapp: 'Olá! Quero agendar um banho no {nome}.' },
    { titulo: 'Tosa profissional', preco: 'A partir de R$ 55', texto: 'Higiênica, na máquina ou na tesoura — com paciência e carinho.', imagem: 'assets/tosa.jpg', whatsapp: 'Olá! Quero agendar uma tosa no {nome}.' },
    { titulo: 'Loja & rações', preco: 'Marcas premium', texto: 'Rações, petiscos, medicamentos, brinquedos, camas e acessórios.', imagem: 'assets/loja.jpg', whatsapp: 'Olá! Queria saber de rações e produtos no {nome}.' }
  ],

  combo: {
    selo: 'Mais pedido',
    titulo: 'Banho + Tosa completa',
    preco: 'A partir de R$ 85',
    texto: 'Inclui limpeza de ouvido, corte de unha, hidratação e perfume. Seu pet sai impecável.'
  },

  diferenciais: [
    { numero: '+10', titulo: 'anos de experiência', texto: 'Equipe treinada para todos os portes e temperamentos.' },
    { numero: '100%', titulo: 'produtos de qualidade', texto: 'Linha profissional, segura para pele sensível.' },
    { numero: '30min', titulo: 'resposta no WhatsApp', texto: 'Agendamento rápido, sem fila e sem ligação.' },
    { numero: '5.0', titulo: 'avaliação no Google', texto: 'Clientes que voltam e indicam.' }
  ],

  // SUBSTITUA por avaliações reais do Google do cliente antes de publicar.
  avaliacoes: {
    nota: '5.0',
    total: '+50 avaliações no Google',
    lista: [
      { inicial: 'M', nome: 'Cliente Google', texto: 'Minha cachorra voltou linda e cheirosa. Atendimento muito carinhoso, virei cliente.' },
      { inicial: 'C', nome: 'Cliente Google', texto: 'Preço justo e produtos de qualidade. O pessoal conhece os bichinhos pelo nome!' },
      { inicial: 'A', nome: 'Cliente Google', texto: 'Meu cachorro é nervoso e trataram ele com muita paciência. Recomendo demais.' }
    ]
  },

  galeria: [
    { imagem: 'assets/cao.jpg', legenda: 'Pós-tosa' },
    { imagem: 'assets/gato.jpg', legenda: 'Banho de gato' },
    { imagem: 'assets/banho.jpg', legenda: 'Hora do banho' },
    { imagem: 'assets/tosa.jpg', legenda: 'Tosa na tesoura' }
  ],

  horarios: [
    { dia: 'Segunda a sexta', hora: '08:00 — 18:00' },
    { dia: 'Sábado', hora: '08:00 — 14:00' },
    { dia: 'Domingo', hora: 'Fechado' }
  ],

  agendamento: {
    servicos: ['Banho completo', 'Tosa profissional', 'Banho + Tosa (combo)']
  },

  rodape: {
    credito: 'Site por Raw AI',
    creditoLink: 'https://rawdre.github.io/ai-consulting/'
  }
};
