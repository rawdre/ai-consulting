/* =====================================================================
   BARBEARIA DO IMPÉRIO — configuração do site (edite SÓ este arquivo).
   Textos aceitam {nome}, {bairro} e {cidade}.
   Fotos reais da barbearia estão em assets/ (troque mantendo o nome).
   CADEIRAS: renomeie cada cadeira com o nome do barbeiro em `cadeiras`.
   ===================================================================== */
window.SITE = {
  versao: 'v1.5.2',

  negocio: {
    nome: 'Barbearia do Império',
    slogan: 'Tradição & Estilo · desde 2019',
    bairro: 'Sobradinho',
    cidade: 'Brasília - DF',
    logo: 'assets/logo.jpg',
    desde: '2019'
  },

  contato: {
    whatsapp: '5561992281225',
    telefone: '(61) 99228-1225',
    endereco: 'SH Boa Vista, Cond. Império dos Nobres · Q 1, MC 02, Lote 36, Loja 01 · Sobradinho, Brasília - DF · 73252-110',
    mapa: 'Barbearia do Império, Sobradinho, Brasília - DF',
    google: 'https://www.google.com/maps/place/Barbearia+do+Imperio',
    instagram: 'https://instagram.com/barbeariadoimperio',
    instagramUser: '@barbeariadoimperio',
    fila: '../../../fila-barbearia-imperio.html',   // fila digital (página existente)
    agendamento: ''                                  // app de agenda (em breve: sistema de cadeiras)
  },

  seo: {
    titulo: 'Barbearia do Império | Corte, barba e curso de barbeiro em Sobradinho - DF',
    descricao: 'Desde 2019 em Sobradinho: corte, barba, sobrancelha, pigmentação, curso profissionalizante de barbeiro e Imperial Store. Agende pelo WhatsApp (61) 99228-1225.'
  },

  tema: { cor: '#C9A24A' },

  hero: {
    selo: 'Desde 2019 · Tradição & Estilo · {bairro}',
    titulo: '{nome}',
    subtitulo: 'Cliente é nossa prioridade',
    texto: 'Desde 2019, o melhor atendimento e conforto para você. Corte, barba, sobrancelha e produtos de cuidados pessoais no Império dos Nobres. Agende online com o seu barbeiro.',
    imagem: 'assets/hero.jpg',          // gerada no Higgsfield (sem marca). Alternativas: assets/hero-alt.jpg (salão amplo), assets/photo2.jpg (foto real)
    imagemMobile: 'assets/hero-mobile.jpg'
  },

  // Filme no scroll (seção logo abaixo do hero). Frames em assets/film/f_001.webp … f_060.webp.
  filme: {
    frames: 60, base: 'assets/film/', ext: 'webp', poster: 'assets/film/poster.jpg',
    selo: 'A transformação',
    titulo: 'Do cabelo grande ao corte limpo',
    texto: 'Role a página e veja o corte acontecer. É assim que você sai daqui: alinhado, na régua, pronto pra semana.'
  },

  curso: {
    selo: 'Matrículas abertas · apenas 5 vagas',
    titulo: 'Curso de Barbeiro Profissional',
    texto: 'Do básico ao avançado em 3 meses. Nosso aluno sai cortando de verdade, preparado para atuar em barbearias, casas de recuperação, UPAs e cidades diversas. Apoio VR e ICMA.',
    destaques: [
      { valor: '3', rotulo: 'meses de curso' },
      { valor: 'R$ 2.500', rotulo: 'investimento total' },
      { valor: '✓', rotulo: 'com certificação' }
    ],
    itens: [
      'Início imediato, turma com vagas limitadas',
      'Certificação ao fim do curso',
      'Prática real em ambiente profissional',
      'Do iniciante ao profissional cortando em 3 meses'
    ],
    pagamento: [
      { forma: 'Cartão', detalhe: 'parcele em até 5x sem juros' },
      { forma: 'PIX', detalhe: '2% de desconto à vista' },
      { forma: 'Boleto', detalhe: 'entrada de 60% + 2 parcelas até o fim do curso' }
    ],
    wa: 'Olá! Tenho interesse no curso de barbeiro profissional da Barbearia do Império. Pode me passar as informações?'
  },

  sobre: {
    titulo: 'Mais que um corte. Uma experiência.',
    texto1: 'Desde 2019, a Barbearia do Império é referência em atendimento e conforto. Cada corte é feito com a precisão de quem entende que estilo não é só aparência, é atitude.',
    texto2: 'Além dos melhores serviços de barbearia, oferecemos cursos profissionalizantes e uma linha completa de produtos para cuidados pessoais. Aqui, cliente é prioridade.',
    imagem: 'assets/photo3.jpg',
    numeros: [
      { valor: '+2.000', rotulo: 'clientes satisfeitos' },
      { valor: '5★', rotulo: '40 avaliações no Google' },
      { valor: '2019', rotulo: 'no Império dos Nobres' }
    ]
  },

  servicos: [
    { titulo: 'Corte masculino', preco: 'R$ 35', texto: 'Personalizado pro formato do seu rosto: degradê, navalhado, social ou moderno.' },
    { titulo: 'Barba completa', preco: 'R$ 35', texto: 'Modelagem, alinhamento e acabamento na navalha, com toalha quente e produtos premium.' },
    { titulo: 'Corte + barba', preco: 'R$ 70', texto: 'O combo completo. Corte na tesoura ou máquina + barba modelada. O mais pedido da casa.' },
    { titulo: 'Sobrancelha', preco: 'R$ 15', texto: 'Design e alinhamento masculino. O detalhe que faz diferença no visual.' },
    { titulo: 'Pigmentação', preco: 'R$ 25', texto: 'Camuflagem capilar para falhas e entradas, com resultado natural e discreto.' },
    { titulo: 'Tratamento VIP', preco: 'Consulte', texto: 'Corte, barba, sobrancelha, hidratação e massagem. O pacote do rei.' }
  ],

  // ===== CADEIRAS / BARBEIROS — renomeie aqui (nome, especialidade, dias) =====
  cadeiras: {
    titulo: 'Escolha seu barbeiro',
    texto: 'Cada cadeira tem um profissional. Toque na cadeira e agende direto com ele pelo WhatsApp.',
    lista: [
      { numero: '01', barbeiro: 'William', inicial: 'W', especialidade: 'Degradê & navalhado', dias: 'Seg a sáb · 08:30 às 20:00', wa: 'Olá! Quero agendar um horário na Cadeira 01 (William) da Barbearia do Império.' },
      { numero: '02', barbeiro: 'Adonai', inicial: 'A', especialidade: 'Barba & pigmentação', dias: 'Seg a sáb · 08:30 às 20:00', wa: 'Olá! Quero agendar um horário na Cadeira 02 (Adonai) da Barbearia do Império.' },
      { numero: '03', barbeiro: 'Mateus', inicial: 'M', especialidade: 'Corte social & moderno', dias: 'Seg a sáb · 08:30 às 20:00', wa: 'Olá! Quero agendar um horário na Cadeira 03 (Mateus) da Barbearia do Império.' },
      { numero: '04', barbeiro: 'Emanuel', inicial: 'E', especialidade: 'Corte + barba completo', dias: 'Seg a sáb · 08:30 às 20:00', wa: 'Olá! Quero agendar um horário na Cadeira 04 (Emanuel) da Barbearia do Império.' }
    ]
  },

  loja: {
    selo: 'Imperial Store',
    titulo: 'Nossa lojinha',
    texto: 'Produtos profissionais para cuidados pessoais. Tudo que você precisa para manter o visual em dia entre as visitas.',
    imagem: 'assets/photo1.jpg',
    itens: [
      { icone: '💈', titulo: 'Máquinas & clippers', texto: 'Wahl, Kemei e mais. Equipamentos profissionais para barbeiros e uso pessoal.' },
      { icone: '🧴', titulo: 'Pomadas & ceras', texto: 'Pomadas modeladoras, ceras e finalizadores para todos os estilos.' },
      { icone: '🧔', titulo: 'Óleos & barba', texto: 'Óleos, balms, shampoos especializados e kits completos de cuidado.' },
      { icone: '✨', titulo: 'Minoxidil & tratamentos', texto: 'Tratamentos capilares, Minoxidil, shampoos Fox e produtos de crescimento.' }
    ],
    wa: 'Olá! Quero saber sobre os produtos da Imperial Store (Barbearia do Império).'
  },

  // Instagram: troque as fotos em assets/ig/ e o link de cada post (botão abre o post ou o perfil)
  instagram: {
    texto: 'Cortes da semana, bastidores e a Imperial Store. Siga e marque a gente no seu corte.',
    posts: [
      { imagem: 'assets/ig/DRzdb5EEbTd.jpg', legenda: 'Na cadeira do Império', link: 'https://www.instagram.com/p/DRzdb5EEbTd/' },
      { imagem: 'assets/ig/CWyFJB3rHWl.jpg', legenda: 'Degradê com risco', link: 'https://www.instagram.com/p/CWyFJB3rHWl/' },
      { imagem: 'assets/ig/CXUitQdF35Y.jpg', legenda: 'Platinado', link: 'https://www.instagram.com/reel/CXUitQdF35Y/' },
      { imagem: 'assets/ig/CFTXzeCnNiG.jpg', legenda: 'Corte infantil com desenho', link: 'https://www.instagram.com/p/CFTXzeCnNiG/' },
      { imagem: 'assets/exterior.jpg', legenda: 'Cond. Império dos Nobres', link: 'https://instagram.com/barbeariadoimperio' }
    ]
  },

  galeria: [
    { imagem: 'assets/photo2.jpg', legenda: 'O salão' },
    { imagem: 'assets/photo3.jpg', legenda: 'Recepção & loja' },
    { imagem: 'assets/photo1.jpg', legenda: 'Imperial Store' },
    { imagem: 'assets/exterior.jpg', legenda: 'A fachada' }
  ],

  avaliacoes: {
    nota: '5.0',
    total: '40 avaliações no Google',
    lista: [
      { texto: 'Ótimos profissionais! Atendimento top, mandam demais no corte. Recomendo demais!', nome: 'Avaliação Google · cliente verificado' },
      { texto: 'Ambiente ótimo, profissionais super! Desde 2019 mantendo a qualidade. Sempre volto.', nome: 'Avaliação Google · cliente verificado' },
      { texto: 'Top demais, mano manda muito! Excelente trabalho. Recepção de milhões!', nome: 'Avaliação Google · cliente verificado' }
    ]
  },

  horarios: [
    { dia: 'Segunda a sexta', hora: '08:30 — 20:00' },
    { dia: 'Sábado', hora: '08:30 — 20:00' },
    { dia: 'Domingo', hora: 'Fechado' }
  ],

  cta: {
    titulo: 'Seu estilo te espera.',
    texto: 'Agende seu horário agora pelo WhatsApp e garanta o melhor corte da região.',
    imagem: 'assets/exterior.jpg'
  },

  // Agenda online (Supabase). A chave 'anon' é pública por natureza: o banco só libera o que as
  // políticas (RLS) permitem — ler cadeiras/serviços/horários ocupados e criar agendamento.
  backend: {
    url: 'https://yuovkylnxembouzkgwcw.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1b3ZreWxueGVtYm91emtnd2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMDYxODksImV4cCI6MjA5ODY4MjE4OX0.I7svvzkWbZmBKb9YPIk4EA1jZP1laEDYBWQQz-VxOPs'
  },

  rodape: {
    credito: 'Site por Raw AI',
    creditoLink: 'https://rawdre.github.io/ai-consulting/'
  }
};
