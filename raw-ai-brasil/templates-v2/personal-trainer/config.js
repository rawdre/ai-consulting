/* =====================================================================
   CONFIGURAÇÃO DO SITE — edite SÓ este arquivo para cada cliente.
   Textos aceitam {nome}, {slogan}, {bairro} e {cidade} (preenchidos automaticamente).
   Fotos e vídeos: troque os arquivos em assets/ (mesmo nome)
   ou aponte os caminhos abaixo para os novos arquivos.
   ===================================================================== */
window.SITE = {
  negocio: {
    nome: 'Seu Nome',
    slogan: 'Personal Trainer',
    bairro: 'seu bairro',
    cidade: 'Brasília - DF'
  },

  contato: {
    whatsapp: '5561998229223',            // só números, com 55 + DDD (padrão = Raw AI para as demos; trocar pelo do cliente)
    telefone: '(61) 99822-9223',
    instagram: '',                          // ex: 'https://instagram.com/seuperfil'
    instagramUser: '@seuperfil'
  },

  seo: {
    titulo: '{nome} | Personal Trainer em {cidade}',
    descricao: 'Treino de força, luta e disciplina para pais em {cidade}. Sua família precisa de você forte. Fale comigo no WhatsApp.'
  },

  tema: { cor: '#F2C230' },

  mensagemPadrao: 'Olá, {nome}! Vim pelo seu site e quero saber como funcionam suas aulas.',

  // Filme que avança com a rolagem (4 cenas de um mesmo take contínuo).
  // "poster" = primeiro quadro do vídeo. Versões Mobile são mais leves.
  filme: [
    {
      id: 'inicio', rotulo: 'Início',
      selo: '{slogan} · {cidade}',
      titulo: 'Sua família precisa de você forte.',
      texto: 'Eu transformo pais em atletas da vida real. Treino de força, luta e disciplina para o homem que carrega a casa.',
      video: 'assets/filme/cena-01.mp4', poster: 'assets/filme/cena-01.jpg',
      videoMobile: 'assets/filme/cena-01-mobile.mp4', posterMobile: 'assets/filme/cena-01-mobile.jpg'
    },
    {
      id: 'forca', rotulo: 'Força', lado: 'direita',
      titulo: 'Força que aparece na vida.',
      texto: 'Agachar, levantar, carregar. Básico bem feito, com progressão de carga e um plano que cabe na sua semana.',
      tags: ['Treino de força', 'Progressão de carga'],
      video: 'assets/filme/cena-02.mp4', poster: 'assets/filme/cena-02.jpg',
      videoMobile: 'assets/filme/cena-02-mobile.mp4', posterMobile: 'assets/filme/cena-02-mobile.jpg'
    },
    {
      id: 'disciplina', rotulo: 'Disciplina',
      titulo: 'Constância vence motivação.',
      texto: 'Você não vai depender de vontade para aparecer. Rotina pensada na agenda de pai, com acompanhamento de perto.',
      tags: ['Acompanhamento', 'Rotina real'],
      video: 'assets/filme/cena-03.mp4', poster: 'assets/filme/cena-03.jpg',
      videoMobile: 'assets/filme/cena-03-mobile.mp4', posterMobile: 'assets/filme/cena-03-mobile.jpg'
    },
    {
      id: 'familia', rotulo: 'Família', lado: 'direita', pausa: 0.25,
      titulo: 'Pronto para quem depende de você.',
      texto: 'Treinar não é sobre vaidade. É estar pronto para o segundo em que eles mais precisarem de você.',
      botao: 'Quero começar',
      video: 'assets/filme/cena-04.mp4', poster: 'assets/filme/cena-04.jpg',
      videoMobile: 'assets/filme/cena-04-mobile.mp4', posterMobile: 'assets/filme/cena-04-mobile.jpg'
    }
  ],

  publico: {
    titulo: 'Para o pai que cansou de adiar',
    imagem: 'assets/publico.jpg',
    lista: [
      { titulo: 'Pouco tempo', texto: 'Trabalho, filhos, casa. O treino é montado em cima da sua agenda real.' },
      { titulo: 'Dor no joelho', texto: 'Se o joelho dói, você precisa parar de treinar? Não necessariamente. O treino se ajusta a você.' },
      { titulo: 'Quer lutar', texto: 'Kickboxing, MMA, jiu-jitsu. Preparo físico para quem já luta ou quer começar.' },
      { titulo: 'Quer ser exemplo', texto: 'Menos palavras, mais atitudes. Seus filhos copiam o que você faz.' }
    ]
  },

  metodo: {
    nome: 'FORTE',
    definicao: 'Conversa, força e constância. Nessa ordem.',
    imagem: 'assets/metodo.jpg',
    passos: [
      { titulo: 'Conversa antes do treino', texto: 'Eu não monto um treino antes de saber da sua rotina, das suas dores e do seu objetivo.' },
      { titulo: 'Treino de força sob medida', texto: 'Exercícios básicos, bem executados, com progressão de carga semana a semana.' },
      { titulo: 'Acompanhamento de perto', texto: 'Ajustes, cobrança e constância. Você não treina sozinho.' }
    ]
  },

  frase: {
    texto: '“Seus filhos não fazem o que você fala. Fazem o que você faz.”',
    autor: '{nome}, personal trainer',
    imagem: 'assets/frase.jpg'
  },

  // SUBSTITUA pela história real do cliente antes de publicar.
  sobre: {
    titulo: 'O treino mudou a minha história',
    texto1: 'Eu sei o que é começar do zero. O treino me deu força, disciplina e direção. Hoje eu ajudo homens a assumirem a responsabilidade pelo corpo, pela família e pelo exemplo que deixam.',
    texto2: 'Força, para mim, é servir quem depende de você.',
    fatos: [
      { texto: 'Educação Física' },
      { texto: 'Treino de força' },
      { texto: 'Preparação para luta' },
      { texto: 'Presencial e online' }
    ]
  },

  formulario: {
    titulo: 'Me conta onde você está',
    texto: 'Responda em 20 segundos. A mensagem vai pronta para o meu WhatsApp e eu respondo pessoalmente.',
    objetivos: ['ganhar força e disposição', 'perder peso', 'treinar mesmo com dor', 'me preparar para lutar'],
    horarios: ['manhã', 'almoço', 'noite'],
    formatos: ['presencial em {cidade}', 'online']
  },

  rodape: {
    credito: 'Site por Raw AI',
    creditoLink: 'https://rawdre.github.io/ai-consulting/'
  }
};
