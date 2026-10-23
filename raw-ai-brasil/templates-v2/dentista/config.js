/* =====================================================================
   CONFIGURAÇÃO DO SITE — edite SÓ este arquivo para cada cliente.
   Textos aceitam {nome}, {bairro} e {cidade} (preenchidos automaticamente).
   "Clínica Sorriso Prime" é um nome fictício de demonstração.
   Fotos: troque os arquivos em assets/ pelas fotos reais (mesmo nome).
   ===================================================================== */
window.SITE = {
  negocio: {
    nome: 'Clínica Sorriso Prime',
    slogan: 'Odontologia humanizada',
    bairro: 'Águas Claras',
    cidade: 'Brasília - DF',
    responsavel: 'Dra. Nome Sobrenome',
    cro: 'CRO-DF 00000'
  },

  contato: {
    whatsapp: '5561998229223',            // só números, com 55 + DDD (padrão = Raw AI para as demos; trocar pelo do cliente)
    telefone: '(61) 99822-9223',
    endereco: 'Endereço completo, {bairro} — {cidade}',
    mapa: '',
    instagram: '',
    instagramUser: '@sorrisoprime'
  },

  seo: {
    titulo: '{nome} | Dentista em {bairro} — {cidade}',
    descricao: 'Clareamento, ortodontia, implantes e urgência em {bairro}. Avaliação individualizada e agendamento pelo WhatsApp.'
  },

  tema: { cor: '#18A58D' },

  hero: {
    selo: 'Consultas com hora marcada',
    titulo1: 'Seu sorriso,',
    titulo2: 'com plano claro',
    titulo3: 'e cuidado humano.',
    texto: 'Avaliação completa, explicação sem termos difíceis e um plano de tratamento que cabe na sua rotina. Atendimento em {bairro}.',
    imagem: 'assets/hero.jpg',
    retrato: 'assets/sorriso.jpg',
    notas: [
      { valor: '4.9', rotulo: 'no Google' },
      { valor: '+12', rotulo: 'anos de clínica' },
      { valor: '24h', rotulo: 'resposta no WhatsApp' }
    ]
  },

  servicos: [
    { icone: '✦', titulo: 'Clareamento', texto: 'Resultado natural e seguro, com expectativa real e acompanhamento.' },
    { icone: '◎', titulo: 'Ortodontia & alinhadores', texto: 'Aparelho tradicional ou alinhadores transparentes, planejados digitalmente.' },
    { icone: '◆', titulo: 'Implantes', texto: 'Reabilitação oral com planejamento, segurança e retorno à mastigação.' },
    { icone: '❖', titulo: 'Lentes & facetas', texto: 'Estética do sorriso com harmonia e naturalidade.' },
    { icone: '◌', titulo: 'Limpeza & prevenção', texto: 'Profilaxia, check-up e orientação para manter o sorriso saudável.' },
    { icone: '✚', titulo: 'Urgência', texto: 'Dor, restauração quebrada ou canal: encaixe rápido pelo WhatsApp.' }
  ],

  clinica: {
    titulo: 'Um ambiente que acalma antes mesmo da consulta.',
    texto: 'Estrutura moderna, biossegurança rigorosa e uma equipe que explica cada etapa. Você sai sabendo exatamente o que vai ser feito, quanto tempo leva e quanto custa.',
    imagem: 'assets/recepcao.jpg',
    imagem2: 'assets/consulta.jpg',
    pontos: [
      { titulo: 'Avaliação individualizada', texto: 'Exame completo e fotos para planejar com você.' },
      { titulo: 'Orçamento transparente', texto: 'Plano por etapas, com opções de pagamento.' },
      { titulo: 'Biossegurança', texto: 'Material esterilizado e protocolos certificados.' }
    ]
  },

  passos: [
    { numero: '01', titulo: 'Fale no WhatsApp', texto: 'Conte o que te incomoda e escolha um horário.' },
    { numero: '02', titulo: 'Avaliação', texto: 'Exame clínico, fotos e conversa sem pressa.' },
    { numero: '03', titulo: 'Plano de tratamento', texto: 'Etapas, prazos e valores claros por escrito.' },
    { numero: '04', titulo: 'Sorriso em dia', texto: 'Tratamento e acompanhamento contínuo.' }
  ],

  // SUBSTITUA por avaliações reais do Google do cliente antes de publicar.
  avaliacoes: {
    nota: '4.9',
    total: 'Mais de 120 avaliações no Google',
    destaque: 'Atendimento pontual, ambiente impecável e explicação clara do tratamento. Me senti segura do início ao fim.',
    lista: [
      { texto: 'Eu tinha receio de implante, mas a consulta foi muito didática. Recomendo de olhos fechados.', nome: 'Paciente Google' },
      { texto: 'Consegui marcar pelo WhatsApp em poucos minutos. Equipe educada e atendimento excelente.', nome: 'Paciente Google' }
    ]
  },

  horarios: [
    { dia: 'Segunda a sexta', hora: '08:00 — 19:00' },
    { dia: 'Sábado', hora: '08:00 — 13:00' },
    { dia: 'Domingo', hora: 'Fechado' }
  ],

  rodape: {
    credito: 'Site por Raw AI',
    creditoLink: 'https://rawdre.github.io/ai-consulting/'
  }
};
