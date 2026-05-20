(function () {
  if (window.__toolSchoolInteractiveLoaded) {
    return;
  }

  window.__toolSchoolInteractiveLoaded = true;

  var APP_KEY = "tool-school-interactive-v2";
  var DB_NAME = "tool-school-browser";
  var STORE_NAME = "state";
  var DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
  var LEGACY_PROGRESS_KEY = "toolschool-progress-v1";
  var LEGACY_FILTER_KEY = "toolschool-filter-v1";
  var LEGACY_LANG_KEY = "toolschool-lang-v1";

  var LESSONS = {
    "first-build": {
      slug: "first-build",
      title: "First Build",
      href: "first-build.html",
      track: "Foundation",
      hero: "Get one visible win and learn the build rhythm: ask, review, improve, verify.",
      tasks: [
        "Pick one visible outcome you can show another person today.",
        "Choose one main builder before you start: Codex, Claude Code, or OpenClaw.",
        "Do one improvement pass, verify the result, and stop when the first version is demo-ready."
      ],
      prompts: [
        "What should I build first on this site?",
        "Turn my idea into one bounded first project.",
        "Which builder should I use for this first result?"
      ]
    },
    "ai-teacher": {
      slug: "ai-teacher",
      title: "AI Teacher Setup",
      href: "ai-teacher-setup.html",
      track: "Product Setup",
      hero: "Configure the teacher like a real product, not a demo chatbox.",
      tasks: [
        "Keep API keys, model choice, and provider inside the Settings drawer.",
        "Store settings and progress in IndexedDB so the site stays local-first.",
        "Make the teacher guide users forward instead of only answering questions."
      ],
      prompts: [
        "Explain BYOK and limited mode simply.",
        "How should IndexedDB be used here?",
        "What should the AI Teacher do on every page?"
      ]
    },
    codex: {
      slug: "codex",
      title: "Codex",
      href: "codex-best-practices.html",
      track: "Coding",
      hero: "Use Codex as the beginner builder for local pages, edits, and visible results with verification.",
      tasks: [
        "Write one prompt with a clear goal, scope, constraints, and what not to touch.",
        "Ask Codex for one small implementation or one local fix instead of a giant rewrite.",
        "Review and verify the result before moving to the next task."
      ],
      prompts: [
        "Show me a better Codex prompt for this task.",
        "How do I debug a Codex run step by step?",
        "Help me turn this idea into one safe Codex task."
      ]
    },
    notion: {
      slug: "notion",
      title: "Notion",
      href: "notion-complete-guide.html",
      track: "Support",
      hero: "Use Notion after the build starts, so your notes, tasks, and systems do not become chaotic.",
      tasks: [
        "Decide what should be saved as a page, a database, or a template.",
        "Capture the first build, prompts, and lessons learned in one clean place.",
        "Keep Notion as support for the build instead of turning setup into the main project."
      ],
      prompts: [
        "What should be a page and what should be a database?",
        "Help me organize my first AI build notes in Notion.",
        "What is the smallest useful Notion system for this project?"
      ]
    },
    warp: {
      slug: "warp",
      title: "Warp",
      href: "warp-complete-guide.html",
      track: "Support",
      hero: "Understand Warp as a cleaner terminal layer, not the main builder itself.",
      tasks: [
        "Learn blocks first so command history is easier to read and reuse.",
        "Use Warp to make repo work easier to read after Codex or Claude already gave you a task.",
        "Save a workflow or notebook only after you understand what command it is repeating."
      ],
      prompts: [
        "What is Warp actually for in a beginner workflow?",
        "How should I read Warp errors and logs?",
        "What should I save in Warp only after it works?"
      ]
    },
    openclaw: {
      slug: "openclaw",
      title: "OpenClaw",
      href: "openclaw-complete-guide.html",
      track: "Agents",
      hero: "Use OpenClaw as a narrow, private assistant system with clear review points and safe boundaries.",
      tasks: [
        "Pick one assistant job and one channel instead of automating everything at once.",
        "Keep the flow narrow, private, and reviewable before the assistant acts.",
        "Document what the assistant should do, what it should not do, and where a human must review."
      ],
      prompts: [
        "How should I use OpenClaw safely?",
        "What is a good first OpenClaw workflow?",
        "Help me design one narrow assistant job with review."
      ]
    },
    "claude-code": {
      slug: "claude-code",
      title: "Claude Code",
      href: "claude-code-complete-guide.html",
      track: "Coding",
      hero: "Use Claude Code as the repo builder: understand the codebase first, then make one bounded change at a time.",
      tasks: [
        "Start by understanding the repo and identifying the exact files that matter.",
        "Ask one bounded repo question or make one code change at a time.",
        "Review the output and verify behavior before accepting the next task."
      ],
      prompts: [
        "How should I prompt Claude Code better?",
        "What is the safer workflow for repo edits?",
        "Help me turn this repo problem into one bounded Claude Code task."
      ]
    }
  };

  var PAGE_TO_LESSON = {
    "first-build.html": "first-build",
    "ai-teacher-setup.html": "ai-teacher",
    "codex-best-practices.html": "codex",
    "notion-complete-guide.html": "notion",
    "warp-complete-guide.html": "warp",
    "openclaw-complete-guide.html": "openclaw",
    "claude-code-complete-guide.html": "claude-code"
  };

  var DEFAULT_SETTINGS = {
    provider: "openrouter",
    model: DEFAULT_MODEL,
    apiKey: "",
    limitedMode: true,
    language: document.body.getAttribute("data-lang") || "en"
  };

  var LESSON_TITLES_PT = {
    "first-build": "Primeira Construção",
    "ai-teacher": "Configuração do AI Teacher",
    codex: "Codex",
    notion: "Notion",
    warp: "Warp",
    openclaw: "OpenClaw",
    "claude-code": "Claude Code"
  };

  var GUIDE_RESEARCH_PROMPTS = {
    "first-build": {
      en: [
        "What is the smallest project I can finish today?",
        "What should I not try on my first build?",
        "How do I know the first version is good enough to show?"
      ],
      pt: [
        "Qual é o menor projeto que eu consigo terminar hoje?",
        "O que eu não devo tentar na minha primeira construção?",
        "Como eu sei que a primeira versão já está boa o suficiente para mostrar?"
      ]
    },
    codex: {
      en: [
        "What is the safest prompt pattern for code edits?",
        "How do I ask Codex to verify its own work?",
        "What should I tell Codex not to touch?"
      ],
      pt: [
        "Qual é o padrão de prompt mais seguro para editar código?",
        "Como eu peço para o Codex verificar o próprio trabalho?",
        "O que eu devo dizer para o Codex não tocar?"
      ]
    },
    "claude-code": {
      en: [
        "How do I start Claude Code in a repo the right way?",
        "What is one safe first repo task for a beginner?",
        "How do I review Claude Code output before trusting it?"
      ],
      pt: [
        "Como eu começo o Claude Code em um repositório do jeito certo?",
        "Qual é uma primeira tarefa segura de repositório para um iniciante?",
        "Como eu reviso a saída do Claude Code antes de confiar nela?"
      ]
    },
    notion: {
      en: [
        "How should I organize what I learned from my first build?",
        "What should be a page and what should be a database?",
        "How do I avoid messy workspace growth?"
      ],
      pt: [
        "Como eu organizo o que aprendi na minha primeira construção?",
        "O que deve ser página e o que deve ser banco de dados?",
        "Como eu evito que o workspace cresça bagunçado?"
      ]
    },
    warp: {
      en: [
        "What is Warp actually doing for me in this workflow?",
        "How do I turn command-line mistakes into reusable notes?",
        "When should I save a notebook instead of just rerunning a command?"
      ],
      pt: [
        "O que o Warp realmente está fazendo por mim neste workflow?",
        "Como eu transformo erros de terminal em notas reutilizáveis?",
        "Quando eu devo salvar um notebook em vez de só repetir um comando?"
      ]
    },
    openclaw: {
      en: [
        "What is one low-risk OpenClaw workflow to start with?",
        "How do I keep a local assistant narrow and reviewable?",
        "Which channels should I not automate yet?"
      ],
      pt: [
        "Qual é um workflow de baixo risco para começar no OpenClaw?",
        "Como eu mantenho um assistente local limitado e revisável?",
        "Quais canais eu ainda não devo automatizar?"
      ]
    },
    "ai-teacher": {
      en: [
        "How should an AI Teacher guide a student step by step?",
        "What settings should stay hidden from the main page?",
        "How should BYOK be explained to a beginner?"
      ],
      pt: [
        "Como um AI Teacher deve guiar um aluno passo a passo?",
        "Quais configurações devem ficar escondidas da página principal?",
        "Como o BYOK deve ser explicado para um iniciante?"
      ]
    }
  };

  var GUIDE_FIRST_BUILD = {
    "first-build": {
      en: "Pick one tiny project and finish it before you optimize anything.",
      pt: "Escolha um projeto pequeno e termine antes de otimizar qualquer coisa."
    },
    codex: {
      en: "Use Codex to build one small HTML page, one section, or one local fix with verification.",
      pt: "Use o Codex para construir uma página HTML pequena, uma seção ou corrigir um problema local com verificação."
    },
    "claude-code": {
      en: "Use Claude Code to map a repo, understand the key files, and make one safe code change.",
      pt: "Use o Claude Code para mapear um repositório, entender os arquivos principais e aplicar uma mudança segura."
    },
    notion: {
      en: "Document your first build in one clean dashboard page with tasks, prompts, and lessons learned.",
      pt: "Documente sua primeira construção em uma página limpa com tarefas, prompts e lições aprendidas."
    },
    warp: {
      en: "Use Warp to understand one terminal workflow better, then save it only after it becomes repeatable.",
      pt: "Use o Warp para entender melhor um workflow de terminal e só depois salve quando ele virar algo repetível."
    },
    openclaw: {
      en: "Start with one channel and one assistant job that can be reviewed before it acts.",
      pt: "Comece com um canal e uma tarefa do assistente que possa ser revisada antes de agir."
    },
    "ai-teacher": {
      en: "Configure the teacher so a student can ask one question, get one next step, and keep moving.",
      pt: "Configure o teacher para que um aluno faça uma pergunta, receba um próximo passo e continue avançando."
    }
  };

  var LESSON_TASKS_PT = {
    "first-build": [
      "Escolha um resultado visível que você consiga mostrar para outra pessoa hoje.",
      "Escolha uma ferramenta principal antes de começar: Codex, Claude Code ou OpenClaw.",
      "Faça uma passada de melhoria, verifique o resultado e pare quando a primeira versão estiver pronta para demonstração."
    ],
    "ai-teacher": [
      "Mantenha chaves de API, modelo e provedor dentro do painel de Configurações.",
      "Guarde configurações e progresso em IndexedDB para o site continuar local-first.",
      "Faça o teacher empurrar o usuário para frente em vez de apenas responder."
    ],
    codex: [
      "Escreva um prompt com objetivo claro, escopo, restrições e o que não deve ser tocado.",
      "Peça uma implementação pequena ou uma correção local em vez de uma reescrita gigante.",
      "Revise e verifique o resultado antes de partir para a próxima tarefa."
    ],
    notion: [
      "Decida o que deve ser salvo como página, banco de dados ou template.",
      "Capture a primeira construção, os prompts e as lições aprendidas em um lugar limpo.",
      "Mantenha o Notion como apoio da construção em vez de transformar setup no projeto principal."
    ],
    warp: [
      "Aprenda blocos primeiro para deixar o histórico mais legível e reutilizável.",
      "Use o Warp para deixar o trabalho de terminal mais legível depois que Codex ou Claude já te deram uma tarefa.",
      "Salve um workflow ou notebook só depois de entender que comando ele está repetindo."
    ],
    openclaw: [
      "Escolha uma tarefa do assistente e um canal em vez de automatizar tudo de uma vez.",
      "Mantenha o fluxo privado, limitado e revisável antes do assistente agir.",
      "Documente claramente o que o assistente deve fazer, o que não deve fazer e onde um humano precisa revisar."
    ],
    "claude-code": [
      "Comece entendendo o repositório e identificando os arquivos exatos que importam.",
      "Faça uma pergunta limitada sobre o repositório ou uma mudança por vez.",
      "Revise a saída e verifique o comportamento antes de aceitar a próxima tarefa."
    ]
  };

  var LESSON_PROMPTS_PT = {
    "first-build": [
      "O que eu devo construir primeiro neste site?",
      "Transforme minha ideia em um primeiro projeto limitado.",
      "Qual ferramenta principal eu devo usar para esse primeiro resultado?"
    ],
    "ai-teacher": [
      "Explique BYOK e modo limitado de forma simples.",
      "Como o IndexedDB deve ser usado aqui?",
      "O que o AI Teacher deve fazer em cada página?"
    ],
    codex: [
      "Me mostre um prompt melhor de Codex para esta tarefa.",
      "Como eu depuro uma execução do Codex passo a passo?",
      "O que eu devo dizer para o Codex não tocar?"
    ],
    notion: [
      "O que deve ser página e o que deve ser banco de dados?",
      "Me ajude a organizar minhas anotações da primeira construção no Notion.",
      "Qual é o menor sistema útil de Notion para este projeto?"
    ],
    warp: [
      "Para que o Warp realmente serve em um fluxo de iniciante?",
      "Como eu devo ler erros e logs no Warp?",
      "O que eu só devo salvar no Warp depois que funcionar?"
    ],
    openclaw: [
      "Como eu devo usar o OpenClaw com segurança?",
      "Qual é um bom primeiro workflow de OpenClaw?",
      "Me ajude a desenhar uma tarefa estreita de assistente com revisão."
    ],
    "claude-code": [
      "Como eu devo orientar melhor o Claude Code?",
      "Qual é o fluxo mais seguro para editar repositórios?",
      "Me ajude a transformar este problema de repositório em uma tarefa limitada para Claude Code."
    ]
  };

  var UI_TEXT = {
    en: {
      settings: "Settings",
      teacher: "AI Teacher",
      closePanels: "Close panels",
      settingsTitle: "BYOK + local progress",
      settingsIntroTitle: "Professional setup",
      settingsIntroBody: "API keys, provider, model, and local mode stay here. The main screens stay clean and focused on learning.",
      provider: "Provider",
      providerHelp: "Default provider is OpenRouter. The site still works without a key in limited mode.",
      localProvider: "Local Teacher Only",
      model: "Model",
      modelPlaceholder: DEFAULT_MODEL,
      modelHelp: "Free models can change or disappear. If the teacher stops responding, switch models here.",
      apiKey: "API key",
      apiKeyPlaceholder: "Paste your OpenRouter key",
      apiKeyHelp: "Your key is stored in the browser using IndexedDB. No hardcoded keys.",
      limitedMode: "Use limited mode unless I turn it off",
      storageIndexedDb: "Stored locally via IndexedDB",
      storageLocal: "Stored locally via localStorage fallback",
      language: "Language",
      languageHelp: "Syncs the site language and teacher tone.",
      saveSettings: "Save settings",
      clearKey: "Clear key",
      resetProgress: "Reset progress",
      teacherDoTitle: "What the teacher should do",
      teacherDoBody: "Guide the student step by step, explain why something works, suggest smaller actions, and keep the pace controlled. It should teach, not just chat.",
      currentFocus: "Current focus",
      askNextMove: "Ask for the next move",
      send: "Get guidance",
      nextQuestion: "What should I do next?",
      clearHistory: "Clear history",
      teacherPlaceholder: "Ask what to do next, how to use a tool better, or how to fix the current step.",
      dashboardKicker: "Student Dashboard",
      dashboardTitle: "Progress with direction",
      dashboardOpenNext: "Open next lesson",
      dayComplete: "Day complete",
      completedSuffix: "completed",
      lessonTracker: "Lesson Tracker",
      lessonTrackerTitle: "Keep this lesson moving",
      lessonTrackerBody: "Mark the lesson stage, rate confidence, and define the next action so progress stays visible.",
      status: "Status",
      notStarted: "Not started",
      inProgress: "In progress",
      completed: "Completed",
      confidence: "Confidence",
      low: "Low",
      medium: "Medium",
      high: "High",
      lessonChecklist: "Lesson checklist",
      nextStep: "Next step",
      nextStepHelp: "Saved locally. Keep it specific enough that you can do it without rethinking the whole lesson.",
      nextStepPlaceholder: "Write the next small action you want to take.",
      saveLesson: "Save lesson",
      guideStatusCompleted: "completed",
      guideStatusInProgress: "in progress",
      guideStatusNotStarted: "not started",
      dashboardScore: "Score",
      dashboardCompletedWord: "completed",
      dashboardActiveWord: "active",
      dashboardChecklistWord: "checklist",
      dashboardSummary: "Score {score}/100 with {completed} completed lesson{suffix} and {inProgress} in progress.",
      dashboardNext: "Recommended next lesson: {title}",
      dashboardOpen: "Open {title}",
      dockLabel: "Language",
      primerKicker: "Student Guide",
      primerTitle: "Use this page like a teacher-led lesson",
      primerBody: "Do not just read the long guide. Use the sequence below so this page can take you from zero to one clear build step.",
      primerWhatFor: "What this tool is for",
      primerFirstThirty: "Your first 30 minutes",
      primerFirstBuild: "Best first build with this tool",
      primerUseAi: "Ask the AI these exact questions now",
      primerResearch: "Research mission after this page",
      primerOpenDocs: "Open official docs",
      primerAskTeacher: "Ask AI Teacher",
      primerHome: "Back to home",
      translationNote: "Use the bilingual study panel on this page for the guided path. Ask the AI Teacher before jumping into the long reference body below.",
      roleYou: "You",
      roleTeacher: "Teacher"
    },
    pt: {
      settings: "Configurações",
      teacher: "AI Teacher",
      closePanels: "Fechar painéis",
      settingsTitle: "BYOK + progresso local",
      settingsIntroTitle: "Configuração profissional",
      settingsIntroBody: "Chaves de API, provedor, modelo e modo local ficam aqui. As telas principais continuam limpas e focadas no aprendizado.",
      provider: "Provedor",
      providerHelp: "O provedor padrão é OpenRouter. O site continua funcionando sem chave no modo limitado.",
      localProvider: "Somente teacher local",
      model: "Modelo",
      modelPlaceholder: DEFAULT_MODEL,
      modelHelp: "Modelos gratuitos podem mudar ou desaparecer. Se o teacher parar de responder, troque o modelo aqui.",
      apiKey: "Chave de API",
      apiKeyPlaceholder: "Cole sua chave do OpenRouter",
      apiKeyHelp: "Sua chave é armazenada no navegador usando IndexedDB. Sem chaves fixas no código.",
      limitedMode: "Usar modo limitado até eu desligar",
      storageIndexedDb: "Armazenado localmente via IndexedDB",
      storageLocal: "Armazenado localmente via fallback de localStorage",
      language: "Idioma",
      languageHelp: "Sincroniza o idioma do site e o tom do teacher.",
      saveSettings: "Salvar configurações",
      clearKey: "Limpar chave",
      resetProgress: "Resetar progresso",
      teacherDoTitle: "O que o teacher deve fazer",
      teacherDoBody: "Guiar o aluno passo a passo, explicar por que algo funciona, sugerir ações menores e manter um ritmo controlado. Ele deve ensinar, não só conversar.",
      currentFocus: "Foco atual",
      askNextMove: "Peça o próximo movimento",
      send: "Receber orientação",
      nextQuestion: "O que eu devo fazer agora?",
      clearHistory: "Limpar histórico",
      teacherPlaceholder: "Pergunte o que fazer a seguir, como usar melhor uma ferramenta ou como corrigir o passo atual.",
      dashboardKicker: "Painel do aluno",
      dashboardTitle: "Progresso com direção",
      dashboardOpenNext: "Abrir próxima lição",
      dayComplete: "Dia concluído",
      completedSuffix: "concluído",
      lessonTracker: "Rastreador da lição",
      lessonTrackerTitle: "Mantenha esta lição andando",
      lessonTrackerBody: "Marque a etapa da lição, sua confiança e a próxima ação para que o progresso fique visível.",
      status: "Status",
      notStarted: "Não iniciado",
      inProgress: "Em andamento",
      completed: "Concluído",
      confidence: "Confiança",
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      lessonChecklist: "Checklist da lição",
      nextStep: "Próximo passo",
      nextStepHelp: "Salvo localmente. Deixe específico o bastante para você executar sem repensar a lição inteira.",
      nextStepPlaceholder: "Escreva a próxima pequena ação que você quer fazer.",
      saveLesson: "Salvar lição",
      guideStatusCompleted: "concluído",
      guideStatusInProgress: "em andamento",
      guideStatusNotStarted: "não iniciado",
      dashboardScore: "Pontuação",
      dashboardCompletedWord: "concluídas",
      dashboardActiveWord: "ativas",
      dashboardChecklistWord: "checklist",
      dashboardSummary: "Pontuação {score}/100 com {completed} liç{suffix} concluídas e {inProgress} em andamento.",
      dashboardNext: "Próxima lição recomendada: {title}",
      dashboardOpen: "Abrir {title}",
      dockLabel: "Idioma",
      primerKicker: "Guia do aluno",
      primerTitle: "Use esta página como uma lição guiada",
      primerBody: "Não leia só o guia longo. Use a sequência abaixo para esta página te levar do zero até um passo de construção claro.",
      primerWhatFor: "Para que esta ferramenta serve",
      primerFirstThirty: "Seus primeiros 30 minutos",
      primerFirstBuild: "Melhor primeira construção com esta ferramenta",
      primerUseAi: "Pergunte exatamente isto para a IA agora",
      primerResearch: "Missão de pesquisa depois desta página",
      primerOpenDocs: "Abrir docs oficiais",
      primerAskTeacher: "Perguntar ao AI Teacher",
      primerHome: "Voltar para a home",
      translationNote: "Use o painel bilíngue desta página para a trilha guiada. Pergunte ao AI Teacher antes de mergulhar no corpo longo de referência abaixo.",
      roleYou: "Você",
      roleTeacher: "Teacher"
    }
  };

  var state = {
    settings: null,
    lessonStates: {},
    checklistStates: {},
    ui: {},
    teacherHistory: [],
    currentPage: getCurrentPage(),
    currentLessonKey: null,
    storageMode: "indexeddb",
    drawerOpen: false,
    panelOpen: false,
    nodes: {}
  };

  state.currentLessonKey = PAGE_TO_LESSON[state.currentPage] || null;

  init().catch(function (error) {
    console.error("Tool School init failed", error);
  });

  async function init() {
    ensureSharedTheme();
    await migrateLegacyState();
    state.settings = await getSettings();
    state.ui.filter = await getUiState("filter", "all");
    state.ui.tab = await getUiState("tab", "business");
    applyLanguage(state.settings.language || "en");
    buildShell();
    bindSearchAndFilters();
    bindTabs();
    bindLanguageSwitches();
    await hydrateChecklistState();
    await hydrateLessonStates();
    if (state.currentLessonKey) {
      await registerLessonVisit(state.currentLessonKey);
      renderLessonPanel();
    }
    renderTeacherMessages();
    renderTeacherIntro();
    renderDashboard();
    renderGuideBadges();
    renderGuidePrimer();
    renderSettingsForm();
    renderTeacherMode();
    renderShellLanguage();
  }

  function getCurrentPage() {
    var page = (window.location.pathname || "").split("/").pop();
    if (!page) {
      return "index.html";
    }
    return page.split("?")[0] || "index.html";
  }

  function currentLang() {
    return document.body.getAttribute("data-lang") === "pt" ? "pt" : "en";
  }

  function t(key) {
    var lang = currentLang();
    return (UI_TEXT[lang] && UI_TEXT[lang][key]) || (UI_TEXT.en && UI_TEXT.en[key]) || key;
  }

  function formatText(key, replacements) {
    var value = t(key);
    Object.keys(replacements || {}).forEach(function (replacementKey) {
      value = value.replace("{" + replacementKey + "}", replacements[replacementKey]);
    });
    return value;
  }

  function getLessonTitle(lesson) {
    if (!lesson) {
      return "";
    }
    if (currentLang() === "pt") {
      return LESSON_TITLES_PT[lesson.slug] || lesson.title;
    }
    return lesson.title;
  }

  function getLessonTasks(lesson) {
    if (!lesson) {
      return [];
    }
    if (currentLang() === "pt" && LESSON_TASKS_PT[lesson.slug]) {
      return LESSON_TASKS_PT[lesson.slug];
    }
    return lesson.tasks || [];
  }

  function getLessonPrompts(lesson) {
    if (!lesson) {
      return [];
    }
    if (currentLang() === "pt" && LESSON_PROMPTS_PT[lesson.slug]) {
      return LESSON_PROMPTS_PT[lesson.slug];
    }
    return lesson.prompts || [];
  }

  function getResearchPrompts(lessonKey) {
    var promptSet = GUIDE_RESEARCH_PROMPTS[lessonKey] || GUIDE_RESEARCH_PROMPTS["first-build"];
    return promptSet[currentLang()] || promptSet.en;
  }

  function getFirstBuildLine(lessonKey) {
    var promptSet = GUIDE_FIRST_BUILD[lessonKey] || GUIDE_FIRST_BUILD["first-build"];
    return promptSet[currentLang()] || promptSet.en;
  }

  function storageKey(key) {
    return APP_KEY + ":" + key;
  }

  function openDatabase() {
    if (!("indexedDB" in window)) {
      state.storageMode = "localStorage";
      return Promise.reject(new Error("IndexedDB unavailable"));
    }

    return new Promise(function (resolve, reject) {
      var request = window.indexedDB.open(DB_NAME, 1);
      request.onerror = function () {
        reject(request.error || new Error("IndexedDB open failed"));
      };
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = function () {
        resolve(request.result);
      };
    });
  }

  async function readStore(key, fallback) {
    try {
      var db = await openDatabase();
      return await new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, "readonly");
        var store = tx.objectStore(STORE_NAME);
        var request = store.get(key);
        request.onerror = function () {
          reject(request.error || new Error("IndexedDB read failed"));
        };
        request.onsuccess = function () {
          resolve(typeof request.result === "undefined" ? fallback : request.result);
        };
      });
    } catch (error) {
      state.storageMode = "localStorage";
      try {
        var raw = window.localStorage.getItem(storageKey(key));
        return raw ? JSON.parse(raw) : fallback;
      } catch (parseError) {
        return fallback;
      }
    }
  }

  async function writeStore(key, value) {
    try {
      var db = await openDatabase();
      return await new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, "readwrite");
        var store = tx.objectStore(STORE_NAME);
        var request = store.put(value, key);
        request.onerror = function () {
          reject(request.error || new Error("IndexedDB write failed"));
        };
        tx.oncomplete = function () {
          resolve(value);
        };
      });
    } catch (error) {
      state.storageMode = "localStorage";
      window.localStorage.setItem(storageKey(key), JSON.stringify(value));
      return value;
    }
  }

  async function deleteStore(key) {
    try {
      var db = await openDatabase();
      return await new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, "readwrite");
        var store = tx.objectStore(STORE_NAME);
        var request = store.delete(key);
        request.onerror = function () {
          reject(request.error || new Error("IndexedDB delete failed"));
        };
        tx.oncomplete = function () {
          resolve();
        };
      });
    } catch (error) {
      state.storageMode = "localStorage";
      window.localStorage.removeItem(storageKey(key));
    }
  }

  async function getSettings() {
    var saved = await readStore("settings", null);
    return Object.assign({}, DEFAULT_SETTINGS, saved || {});
  }

  async function saveSettings(partial) {
    state.settings = Object.assign({}, state.settings || DEFAULT_SETTINGS, partial || {});
    await writeStore("settings", state.settings);
    renderTeacherMode();
    renderSettingsForm();
    renderTeacherIntro();
    return state.settings;
  }

  function getDefaultLessonState(key) {
    return {
      status: "not-started",
      confidence: "low",
      nextStep: "",
      tasks: [false, false, false],
      lastVisitedAt: "",
      updatedAt: ""
    };
  }

  async function getLessonState(key) {
    var saved = await readStore("lesson:" + key, null);
    var base = getDefaultLessonState(key);
    return Object.assign({}, base, saved || {});
  }

  async function saveLessonState(key, partial) {
    var current = await getLessonState(key);
    var next = Object.assign({}, current, partial || {}, {
      updatedAt: new Date().toISOString()
    });
    state.lessonStates[key] = next;
    await writeStore("lesson:" + key, next);
    renderLessonPanel();
    renderDashboard();
    renderGuideBadges();
    return next;
  }

  async function registerLessonVisit(key) {
    var current = await getLessonState(key);
    if (!current.lastVisitedAt) {
      current.lastVisitedAt = new Date().toISOString();
    }
    state.lessonStates[key] = current;
    await writeStore("lesson:" + key, current);
  }

  async function getUiState(name, fallback) {
    return await readStore("ui:" + name, fallback);
  }

  async function saveUiState(name, value) {
    state.ui[name] = value;
    await writeStore("ui:" + name, value);
  }

  async function getTeacherHistory() {
    var key = state.currentLessonKey ? "teacher:" + state.currentLessonKey : "teacher:home";
    var saved = await readStore(key, []);
    state.teacherHistory = Array.isArray(saved) ? saved : [];
    return state.teacherHistory;
  }

  async function saveTeacherHistory(messages) {
    var key = state.currentLessonKey ? "teacher:" + state.currentLessonKey : "teacher:home";
    state.teacherHistory = messages.slice(-10);
    await writeStore(key, state.teacherHistory);
  }

  async function migrateLegacyState() {
    var migrated = await readStore("migration:legacy-v1", false);
    if (migrated) {
      return;
    }

    try {
      var legacyProgress = JSON.parse(window.localStorage.getItem(LEGACY_PROGRESS_KEY) || "{}");
      var legacyFilter = window.localStorage.getItem(LEGACY_FILTER_KEY);
      var legacyLang = window.localStorage.getItem(LEGACY_LANG_KEY);
      var ids = Object.keys(legacyProgress);
      var index = 0;

      while (index < ids.length) {
        await writeStore("check:" + ids[index], Boolean(legacyProgress[ids[index]]));
        index += 1;
      }

      if (legacyFilter) {
        await writeStore("ui:filter", legacyFilter);
      }

      if (legacyLang) {
        var currentSettings = await getSettings();
        currentSettings.language = legacyLang;
        await writeStore("settings", currentSettings);
      }
    } catch (error) {
      console.warn("Legacy migration skipped", error);
    }

    await writeStore("migration:legacy-v1", true);
  }

  function ensureSharedTheme() {
    if (!document.querySelector('link[href$="site.css"]')) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "site.css";
      document.head.appendChild(link);
    }

    if (document.querySelector(".wrap") && !document.querySelector("#tool-school-guide-override")) {
      var override = document.createElement("style");
      override.id = "tool-school-guide-override";
      override.textContent = [
        "body {",
        "  color: var(--ink);",
        "  font-family: \"Manrope\", \"Segoe UI\", sans-serif;",
        "  background: radial-gradient(circle at top left, rgba(111, 209, 255, 0.13), transparent 28%), radial-gradient(circle at top right, rgba(142, 242, 195, 0.08), transparent 24%), linear-gradient(180deg, #05070d 0%, #0b1018 100%) !important;",
        "}",
        ".wrap { max-width: 1260px; padding: 24px 20px 90px; }",
        ".topbar { position: sticky; top: 0; z-index: 30; padding: 14px 18px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.08); background: rgba(11, 14, 22, 0.82); backdrop-filter: blur(16px); box-shadow: 0 10px 26px rgba(0,0,0,0.2); color: var(--muted) !important; }",
        ".topbar a { color: var(--muted) !important; }",
        ".topbar a:hover { color: var(--ink) !important; border-color: rgba(111, 209, 255, 0.28) !important; }",
        ".hero { background: linear-gradient(135deg, rgba(17, 21, 31, 0.98), rgba(20, 26, 40, 0.92)) !important; border-color: rgba(255,255,255,0.08) !important; }",
        ".hero::after { background: radial-gradient(circle, rgba(111, 209, 255, 0.18), transparent 70%) !important; }",
        ".hero h1, .hero h2, .hero h3, .section h2, .section h3, .footer h2, .footer h3 { color: var(--ink) !important; font-family: \"Cormorant Garamond\", Georgia, serif; }",
        ".eyebrow, .section-kicker, .quick-card span, .workflow-item small, .badge.good, .badge.warn { color: var(--accent) !important; }",
        ".panel, .card, .quick-card, .workflow-item, .prompt, .resource, .note, .section { background: rgba(18, 22, 32, 0.82) !important; color: var(--ink) !important; border-color: rgba(255,255,255,0.08) !important; box-shadow: 0 28px 70px rgba(0,0,0,0.34) !important; }",
        ".section { background: rgba(14, 18, 28, 0.84) !important; }",
        ".panel p, .card p, .quick-card, .workflow-item, .resource, .section p, .section li, .footer p, .note p, p, li { color: var(--muted) !important; }",
        ".button { background: rgba(255,255,255,0.04) !important; color: var(--ink) !important; border-color: rgba(255,255,255,0.08) !important; }",
        ".button.primary { background: linear-gradient(135deg, var(--accent), var(--accent-2)) !important; color: #071017 !important; border-color: transparent !important; }",
        ".button:hover { border-color: rgba(111, 209, 255, 0.28) !important; }",
        ".good { background: rgba(76, 195, 148, 0.09) !important; }",
        ".warn { background: rgba(201, 167, 111, 0.08) !important; }",
        ".example { background: #0a1117 !important; color: #eff7ff !important; border-color: rgba(255,255,255,0.08) !important; }",
        ".footer, .note { background: linear-gradient(135deg, #131927, #182233) !important; color: var(--ink) !important; }",
        ".footer p, .note p { color: rgba(244, 240, 232, 0.78) !important; }",
        "@media (max-width: 760px) { .topbar { border-radius: 24px; } }"
      ].join("\n");
      document.head.appendChild(override);
    }
  }

  function buildShell() {
    buildFloatingButtons();
    buildOverlay();
    buildSettingsDrawer();
    buildTeacherPanel();
    buildTeacherDashboard();
    buildLanguageDock();
  }

  function buildFloatingButtons() {
    if (document.querySelector(".ts-fab-group")) {
      return;
    }

    var group = document.createElement("div");
    group.className = "ts-fab-group";
    group.innerHTML = [
      '<button type="button" class="ts-fab" data-ts-open="settings">Settings</button>',
      '<button type="button" class="ts-fab primary" data-ts-open="teacher">AI Teacher</button>'
    ].join("");

    group.addEventListener("click", function (event) {
      var target = event.target.closest("[data-ts-open]");
      if (!target) {
        return;
      }
      openSurface(target.getAttribute("data-ts-open"));
    });

    document.body.appendChild(group);
  }

  function buildLanguageDock() {
    if (document.querySelector(".lang-dock")) {
      return;
    }

    var dock = document.createElement("div");
    dock.className = "lang-dock";
    dock.innerHTML = [
      '<span class="dock-label" data-lang-dock-label>' + escapeHtml(t("dockLabel")) + "</span>",
      '<button type="button" class="button small active" data-lang-switch="en">EN</button>',
      '<button type="button" class="button small" data-lang-switch="pt">PT-BR</button>'
    ].join("");
    document.body.appendChild(dock);
  }

  function buildOverlay() {
    if (document.querySelector(".ts-overlay")) {
      return;
    }

    var overlay = document.createElement("button");
    overlay.type = "button";
    overlay.className = "ts-overlay";
    overlay.setAttribute("aria-label", "Close panels");
    overlay.addEventListener("click", closeSurfaces);
    document.body.appendChild(overlay);
    state.nodes.overlay = overlay;
  }

  function buildSettingsDrawer() {
    if (document.querySelector(".ts-drawer")) {
      return;
    }

    var drawer = document.createElement("aside");
    drawer.className = "ts-drawer";
    drawer.setAttribute("aria-label", "Tool School settings");
    drawer.innerHTML = [
      '<div class="ts-head">',
      '  <div>',
      '    <div class="section-kicker">Settings</div>',
      '    <h3>BYOK + local progress</h3>',
      '  </div>',
      '  <button type="button" class="ts-close" data-ts-close="settings" aria-label="Close settings">x</button>',
      '</div>',
      '<div class="ts-body">',
      '  <div class="ts-card">',
      '    <h4>Professional setup</h4>',
      '    <p>API keys, provider, model, and local mode stay here. The main screens stay clean and focused on learning.</p>',
      '  </div>',
      '  <div class="ts-grid">',
      '    <div class="ts-field">',
      '      <label for="ts-provider">Provider</label>',
      '      <select id="ts-provider" data-setting="provider">',
      '        <option value="openrouter">OpenRouter</option>',
      '        <option value="local">Local Teacher Only</option>',
      '      </select>',
      '      <small>Default provider is OpenRouter. The site still works without a key in limited mode.</small>',
      '    </div>',
      '    <div class="ts-field">',
      '      <label for="ts-model">Model</label>',
      '      <input id="ts-model" type="text" data-setting="model" placeholder="' + DEFAULT_MODEL + '">',
      '      <small>Free models can change or disappear. If the teacher stops responding, switch models here.</small>',
      '    </div>',
      '    <div class="ts-field">',
      '      <label for="ts-api-key">API key</label>',
      '      <input id="ts-api-key" type="password" data-setting="apiKey" placeholder="Paste your OpenRouter key">',
      '      <small>Your key is stored in the browser using IndexedDB. No hardcoded keys.</small>',
      '    </div>',
      '    <div class="ts-kv">',
      '      <label class="ts-toggle" for="ts-limited-mode">',
      '        <input id="ts-limited-mode" type="checkbox" data-setting="limitedMode">',
      '        <span>Use limited mode unless I turn it off</span>',
      '      </label>',
      '      <div class="muted" data-storage-note></div>',
      '    </div>',
      '    <div class="ts-kv">',
      '      <div>',
      '        <strong>Language</strong>',
      '        <div class="muted">Syncs the site language and teacher tone.</div>',
      '      </div>',
      '      <div class="ts-chip-row">',
      '        <button type="button" class="ts-chip" data-setting-lang="en">EN</button>',
      '        <button type="button" class="ts-chip" data-setting-lang="pt">PT-BR</button>',
      '      </div>',
      '    </div>',
      '    <div class="ts-actions">',
      '      <button type="button" class="button primary small" data-settings-save>Save settings</button>',
      '      <button type="button" class="button small" data-settings-clear-key>Clear key</button>',
      '      <button type="button" class="button small" data-settings-reset-progress>Reset progress</button>',
      '    </div>',
      '    <div class="ts-card">',
      '      <h4>What the teacher should do</h4>',
      '      <p>Guide the student step by step, explain why something works, suggest smaller actions, and keep the pace controlled. It should teach, not just chat.</p>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join("");

    drawer.addEventListener("click", function (event) {
      if (event.target.matches("[data-ts-close]")) {
        closeSurfaces();
      }
      if (event.target.matches("[data-setting-lang]")) {
        applyLanguage(event.target.getAttribute("data-setting-lang"));
      }
      if (event.target.matches("[data-settings-save]")) {
        handleSettingsSave();
      }
      if (event.target.matches("[data-settings-clear-key]")) {
        clearApiKey();
      }
      if (event.target.matches("[data-settings-reset-progress]")) {
        resetAllProgress();
      }
    });

    document.body.appendChild(drawer);
    state.nodes.drawer = drawer;
  }

  function buildTeacherPanel() {
    if (document.querySelector(".ts-panel")) {
      return;
    }

    var lesson = state.currentLessonKey ? LESSONS[state.currentLessonKey] : null;
    var title = lesson ? lesson.title : "Tool School";
    var panel = document.createElement("aside");
    panel.className = "ts-panel";
    panel.setAttribute("aria-label", "AI Teacher");
    panel.innerHTML = [
      '<div class="ts-head">',
      '  <div>',
      '    <div class="section-kicker">AI Teacher</div>',
      '    <h3 data-teacher-title>' + escapeHtml(title) + "</h3>",
      '  </div>',
      '  <button type="button" class="ts-close" data-ts-close="teacher" aria-label="Close AI Teacher">x</button>',
      "</div>",
      '<div class="ts-body">',
      '  <div class="ts-card">',
      '    <h4>Current focus</h4>',
      '    <p data-teacher-intro></p>',
      '  </div>',
      '  <div class="ts-card">',
      '    <h4>Ask for the next move</h4>',
      '    <div class="ts-chip-row" data-teacher-suggestions></div>',
      '    <p class="muted" data-teacher-mode></p>',
      '  </div>',
      '  <div class="ts-messages" data-teacher-messages></div>',
      '  <div class="ts-input-area">',
      '    <textarea data-teacher-input placeholder="Ask what to do next, how to use a tool better, or how to fix the current step."></textarea>',
      '    <div class="ts-actions">',
      '      <button type="button" class="button primary small" data-teacher-send>Get guidance</button>',
      '      <button type="button" class="button small" data-teacher-next>What should I do next?</button>',
      '      <button type="button" class="button small" data-teacher-clear>Clear history</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join("");

    panel.addEventListener("click", function (event) {
      if (event.target.matches("[data-ts-close]")) {
        closeSurfaces();
      }
      if (event.target.matches("[data-teacher-send]")) {
        handleTeacherSend();
      }
      if (event.target.matches("[data-teacher-next]")) {
        handleTeacherQuickPrompt(getNextQuestion());
      }
      if (event.target.matches("[data-teacher-clear]")) {
        clearTeacherHistory();
      }
      if (event.target.matches("[data-teacher-suggestion]")) {
        handleTeacherQuickPrompt(event.target.getAttribute("data-teacher-suggestion"));
      }
    });

    panel.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeSurfaces();
      }
    });

    document.body.appendChild(panel);
    state.nodes.panel = panel;
    state.nodes.teacherInput = panel.querySelector("[data-teacher-input]");
    state.nodes.teacherMessages = panel.querySelector("[data-teacher-messages]");
    state.nodes.teacherIntro = panel.querySelector("[data-teacher-intro]");
    state.nodes.teacherSuggestions = panel.querySelector("[data-teacher-suggestions]");
    state.nodes.teacherMode = panel.querySelector("[data-teacher-mode]");
    state.nodes.teacherInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        handleTeacherSend();
      }
    });
  }

  function buildTeacherDashboard() {
    if (document.querySelector("[data-teacher-dashboard]")) {
      return;
    }

    var host = document.querySelector(".hero-side");
    if (!host) {
      return;
    }

    var card = document.createElement("div");
    card.className = "teacher-progress-card";
    card.setAttribute("data-teacher-dashboard", "true");
    card.innerHTML = [
      '<div class="section-kicker">Student Dashboard</div>',
      '<h3>Progress with direction</h3>',
      '<p data-dashboard-summary></p>',
      '<div class="ts-chip-row" data-dashboard-chips></div>',
      '<div class="lesson-status-line">',
      '  <span data-dashboard-next></span>',
      '  <a class="button primary small" data-dashboard-link href="first-build.html">Open next lesson</a>',
      '</div>'
    ].join("");

    host.insertBefore(card, host.firstChild);
    state.nodes.dashboard = card;
  }

  function bindSearchAndFilters() {
    var searchInput = document.querySelector("[data-guide-search]");
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var guideCards = Array.prototype.slice.call(document.querySelectorAll("[data-guide-card]"));

    function normalize(value) {
      return String(value || "").toLowerCase().trim();
    }

    function getActiveFilter() {
      var active = filterButtons.find(function (button) {
        return button.classList.contains("active");
      });
      return active ? active.getAttribute("data-filter") : "all";
    }

    function applyFilters() {
      var term = normalize(searchInput ? searchInput.value : "");
      var activeFilter = getActiveFilter();
      guideCards.forEach(function (card) {
        var haystack = normalize(card.getAttribute("data-search"));
        var tags = normalize(card.getAttribute("data-tags"));
        var matchesTerm = !term || haystack.indexOf(term) !== -1;
        var matchesFilter = activeFilter === "all" || tags.indexOf(activeFilter) !== -1;
        card.classList.toggle("hidden", !(matchesTerm && matchesFilter));
      });
    }

    function setFilter(filter) {
      filterButtons.forEach(function (button) {
        button.classList.toggle("active", button.getAttribute("data-filter") === filter);
      });
      applyFilters();
      saveUiState("filter", filter);
    }

    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);
    }

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setFilter(button.getAttribute("data-filter"));
      });
    });

    if (filterButtons.length) {
      setFilter(state.ui.filter || "all");
    }
  }

  function bindTabs() {
    var tabButtons = Array.prototype.slice.call(document.querySelectorAll("[data-tab-button]"));
    var tabPanels = Array.prototype.slice.call(document.querySelectorAll("[data-tab-panel]"));

    function setActiveTab(tabName) {
      tabButtons.forEach(function (button) {
        button.classList.toggle("active", button.getAttribute("data-tab-button") === tabName);
      });

      tabPanels.forEach(function (panel) {
        panel.classList.toggle("active", panel.getAttribute("data-tab-panel") === tabName);
      });

      saveUiState("tab", tabName);
    }

    tabButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setActiveTab(button.getAttribute("data-tab-button"));
      });
    });

    if (tabButtons.length) {
      setActiveTab(state.ui.tab || "business");
    }
  }

  function bindLanguageSwitches() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-lang-switch]"));
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        applyLanguage(button.getAttribute("data-lang-switch"));
      });
    });
  }

  async function hydrateChecklistState() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-progress-item]"));
    var progressFill = document.querySelector("[data-progress-fill]");
    var progressLabel = document.querySelector("[data-progress-label]");
    var progressPercent = document.querySelector("[data-progress-percent]");
    var resetButton = document.querySelector("[data-progress-reset]");

    if (!items.length) {
      return;
    }

    var index = 0;
    while (index < items.length) {
      var input = items[index];
      var checked = await readStore("check:" + input.id, false);
      state.checklistStates[input.id] = Boolean(checked);
      input.checked = Boolean(checked);
      input.addEventListener("change", handleChecklistChange);
      index += 1;
    }

    if (resetButton) {
      resetButton.addEventListener("click", resetChecklistProgress);
    }

    renderChecklistProgress(items, progressFill, progressLabel, progressPercent);
  }

  function renderChecklistProgress(items, progressFill, progressLabel, progressPercent) {
    var completed = items.filter(function (item) {
      return item.checked;
    }).length;
    var total = items.length || 1;
    var percent = Math.round((completed / total) * 100);

    if (progressFill) {
      progressFill.style.width = percent + "%";
    }
    if (progressLabel) {
      progressLabel.textContent = completed === total
        ? t("dayComplete")
        : completed + " / " + total + " " + t("completedSuffix");
    }
    if (progressPercent) {
      progressPercent.textContent = percent + "%";
    }
  }

  async function handleChecklistChange(event) {
    var input = event.currentTarget;
    state.checklistStates[input.id] = input.checked;
    await writeStore("check:" + input.id, input.checked);
    renderChecklistProgress(
      Array.prototype.slice.call(document.querySelectorAll("[data-progress-item]")),
      document.querySelector("[data-progress-fill]"),
      document.querySelector("[data-progress-label]"),
      document.querySelector("[data-progress-percent]")
    );
    renderDashboard();
  }

  async function resetChecklistProgress() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-progress-item]"));
    var index = 0;
    while (index < items.length) {
      items[index].checked = false;
      state.checklistStates[items[index].id] = false;
      await deleteStore("check:" + items[index].id);
      index += 1;
    }
    renderChecklistProgress(
      items,
      document.querySelector("[data-progress-fill]"),
      document.querySelector("[data-progress-label]"),
      document.querySelector("[data-progress-percent]")
    );
    renderDashboard();
  }

  async function hydrateLessonStates() {
    var lessonKeys = Object.keys(LESSONS);
    var index = 0;
    while (index < lessonKeys.length) {
      state.lessonStates[lessonKeys[index]] = await getLessonState(lessonKeys[index]);
      index += 1;
    }
  }

  function applyLanguage(lang) {
    var nextLang = lang === "pt" ? "pt" : "en";
    document.body.setAttribute("data-lang", nextLang);
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-lang-switch]"));
    buttons.forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-lang-switch") === nextLang);
    });

    var drawerLangButtons = Array.prototype.slice.call(document.querySelectorAll("[data-setting-lang]"));
    drawerLangButtons.forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-setting-lang") === nextLang);
    });

    if (!state.settings) {
      state.settings = Object.assign({}, DEFAULT_SETTINGS, { language: nextLang });
    } else {
      state.settings.language = nextLang;
    }

    saveSettings({ language: nextLang });
    renderSettingsForm();
    renderTeacherMode();
    renderTeacherIntro();
    renderLessonPanel();
    renderDashboard();
    renderGuideBadges();
    renderGuidePrimer();
    renderShellLanguage();
  }

  function renderSettingsForm() {
    if (!state.nodes.drawer) {
      return;
    }

    var settings = state.settings || DEFAULT_SETTINGS;
    var provider = state.nodes.drawer.querySelector('[data-setting="provider"]');
    var model = state.nodes.drawer.querySelector('[data-setting="model"]');
    var apiKey = state.nodes.drawer.querySelector('[data-setting="apiKey"]');
    var limitedMode = state.nodes.drawer.querySelector('[data-setting="limitedMode"]');
    var storageNote = state.nodes.drawer.querySelector("[data-storage-note]");

    if (provider) {
      provider.value = settings.provider || "openrouter";
    }
    if (model) {
      model.value = settings.model || DEFAULT_MODEL;
    }
    if (apiKey) {
      apiKey.value = settings.apiKey || "";
    }
    if (limitedMode) {
      limitedMode.checked = Boolean(settings.limitedMode);
    }
    if (storageNote) {
      storageNote.textContent = state.storageMode === "indexeddb" ? t("storageIndexedDb") : t("storageLocal");
    }

    var drawerLangButtons = Array.prototype.slice.call(document.querySelectorAll("[data-setting-lang]"));
    drawerLangButtons.forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-setting-lang") === settings.language);
    });

    var drawer = state.nodes.drawer;
    var headKicker = drawer.querySelector(".section-kicker");
    var headTitle = drawer.querySelector(".ts-head h3");
    var introTitle = drawer.querySelector(".ts-card h4");
    var introBody = drawer.querySelector(".ts-card p");
    var labels = drawer.querySelectorAll("label");
    var hints = drawer.querySelectorAll("small");
    var strongs = drawer.querySelectorAll(".ts-kv strong");
    var mutedBlocks = drawer.querySelectorAll(".ts-kv .muted");
    var actionButtons = drawer.querySelectorAll(".ts-actions .button");
    var teacherTitle = drawer.querySelectorAll(".ts-card h4")[1];
    var teacherBody = drawer.querySelectorAll(".ts-card p")[1];

    if (headKicker) {
      headKicker.textContent = t("settings");
    }
    if (headTitle) {
      headTitle.textContent = t("settingsTitle");
    }
    if (introTitle) {
      introTitle.textContent = t("settingsIntroTitle");
    }
    if (introBody) {
      introBody.textContent = t("settingsIntroBody");
    }
    if (labels[0]) labels[0].textContent = t("provider");
    if (labels[1]) labels[1].textContent = t("model");
    if (labels[2]) labels[2].textContent = t("apiKey");
    if (hints[0]) hints[0].textContent = t("providerHelp");
    if (hints[1]) hints[1].textContent = t("modelHelp");
    if (hints[2]) hints[2].textContent = t("apiKeyHelp");
    if (apiKey) {
      apiKey.placeholder = t("apiKeyPlaceholder");
    }
    if (model) {
      model.placeholder = t("modelPlaceholder");
    }
    if (strongs[0]) strongs[0].textContent = t("language");
    if (mutedBlocks[0]) mutedBlocks[0].textContent = t("languageHelp");
    var limitedText = drawer.querySelector(".ts-toggle span");
    if (limitedText) {
      limitedText.textContent = t("limitedMode");
    }
    if (actionButtons[0]) actionButtons[0].textContent = t("saveSettings");
    if (actionButtons[1]) actionButtons[1].textContent = t("clearKey");
    if (actionButtons[2]) actionButtons[2].textContent = t("resetProgress");
    if (teacherTitle) {
      teacherTitle.textContent = t("teacherDoTitle");
    }
    if (teacherBody) {
      teacherBody.textContent = t("teacherDoBody");
    }
  }

  async function handleSettingsSave() {
    if (!state.nodes.drawer) {
      return;
    }

    var next = {
      provider: state.nodes.drawer.querySelector('[data-setting="provider"]').value,
      model: state.nodes.drawer.querySelector('[data-setting="model"]').value.trim() || DEFAULT_MODEL,
      apiKey: state.nodes.drawer.querySelector('[data-setting="apiKey"]').value.trim(),
      limitedMode: state.nodes.drawer.querySelector('[data-setting="limitedMode"]').checked,
      language: document.body.getAttribute("data-lang") || "en"
    };

    await saveSettings(next);
    renderTeacherMode();
    renderTeacherIntro();
  }

  async function clearApiKey() {
    await saveSettings({ apiKey: "", limitedMode: true, provider: "openrouter" });
    renderSettingsForm();
    renderTeacherMode();
  }

  async function resetAllProgress() {
    var lessonKeys = Object.keys(LESSONS);
    var index = 0;
    while (index < lessonKeys.length) {
      await deleteStore("lesson:" + lessonKeys[index]);
      await deleteStore("teacher:" + lessonKeys[index]);
      state.lessonStates[lessonKeys[index]] = getDefaultLessonState(lessonKeys[index]);
      index += 1;
    }

    var checkItems = Array.prototype.slice.call(document.querySelectorAll("[data-progress-item]"));
    var checkIndex = 0;
    while (checkIndex < checkItems.length) {
      checkItems[checkIndex].checked = false;
      state.checklistStates[checkItems[checkIndex].id] = false;
      await deleteStore("check:" + checkItems[checkIndex].id);
      checkIndex += 1;
    }

    await deleteStore("teacher:home");
    state.teacherHistory = [];
    renderChecklistProgress(
      checkItems,
      document.querySelector("[data-progress-fill]"),
      document.querySelector("[data-progress-label]"),
      document.querySelector("[data-progress-percent]")
    );
    renderTeacherMessages();
    renderLessonPanel();
    renderDashboard();
    renderGuideBadges();
  }

  function openSurface(name) {
    if (name === "settings") {
      state.drawerOpen = true;
      state.panelOpen = false;
    }
    if (name === "teacher") {
      state.panelOpen = true;
      state.drawerOpen = false;
    }
    syncSurfaceState();
  }

  function closeSurfaces() {
    state.drawerOpen = false;
    state.panelOpen = false;
    syncSurfaceState();
  }

  function syncSurfaceState() {
    if (state.nodes.overlay) {
      state.nodes.overlay.classList.toggle("active", state.drawerOpen || state.panelOpen);
    }
    if (state.nodes.drawer) {
      state.nodes.drawer.classList.toggle("active", state.drawerOpen);
    }
    if (state.nodes.panel) {
      state.nodes.panel.classList.toggle("active", state.panelOpen);
    }
  }

  function renderTeacherIntro() {
    if (!state.nodes.teacherIntro || !state.nodes.teacherSuggestions) {
      return;
    }

    var lesson = state.currentLessonKey ? LESSONS[state.currentLessonKey] : null;
    var modeText = getTeacherModeText();
    state.nodes.teacherIntro.textContent = lesson
      ? lesson.hero + " " + modeText
      : (currentLang() === "pt"
        ? "Use o teacher para decidir o que abrir a seguir, como melhorar prompts e como avançar pela escola sem se perder. "
        : "Use the teacher to decide what to open next, how to improve prompts, and how to move through the school without getting lost. ") + modeText;

    var prompts = lesson ? getLessonPrompts(lesson) : [
      "What guide should I start with?",
      "Teach me BYOK and local storage simply.",
      "How should I move through Tool School?"
    ];

    state.nodes.teacherSuggestions.innerHTML = prompts.map(function (prompt) {
      return '<button type="button" class="ts-chip" data-teacher-suggestion="' + escapeAttribute(prompt) + '">' + escapeHtml(prompt) + "</button>";
    }).join("");
  }

  function renderTeacherMode() {
    if (!state.nodes.teacherMode) {
      return;
    }
    state.nodes.teacherMode.textContent = getTeacherModeText();
  }

  function getTeacherModeText() {
    var settings = state.settings || DEFAULT_SETTINGS;
    if (settings.provider === "local" || settings.limitedMode || !settings.apiKey) {
      return currentLang() === "pt"
        ? "Modo teacher: orientação local. Adicione uma chave do OpenRouter em Configurações se quiser respostas de IA ao vivo."
        : "Teacher mode: local guidance. Add an OpenRouter key in Settings if you want live AI responses.";
    }
    return currentLang() === "pt"
      ? "Modo teacher: OpenRouter ativo com " + (settings.model || DEFAULT_MODEL) + "."
      : "Teacher mode: OpenRouter enabled with " + (settings.model || DEFAULT_MODEL) + ".";
  }

  async function renderTeacherMessages() {
    if (!state.nodes.teacherMessages) {
      return;
    }

    await getTeacherHistory();

    if (!state.teacherHistory.length) {
      state.teacherHistory = [buildGreetingMessage()];
      await saveTeacherHistory(state.teacherHistory);
    }

    state.nodes.teacherMessages.innerHTML = state.teacherHistory.map(function (message) {
      var roleLabel = message.role === "user" ? t("roleYou") : t("roleTeacher");
      var content = escapeHtml(message.content).replace(/\n/g, "<br>");
      return [
        '<div class="ts-message ' + (message.role === "user" ? "user" : "assistant") + '">',
        "  <strong>" + roleLabel + "</strong>",
        "  <p>" + content + "</p>",
        "</div>"
      ].join("");
    }).join("");
    state.nodes.teacherMessages.scrollTop = state.nodes.teacherMessages.scrollHeight;
  }

  function buildGreetingMessage() {
    var lesson = state.currentLessonKey ? LESSONS[state.currentLessonKey] : null;
    var content = lesson
      ? (currentLang() === "pt"
        ? "Estamos em " + getLessonTitle(lesson) + ". Comece com um passo pequeno: " + getLessonTasks(lesson)[0] + " Pode me pedir o próximo movimento a qualquer momento."
        : "We are on " + lesson.title + ". Start with one small step: " + getLessonTasks(lesson)[0] + " Ask for the next move any time.")
      : (currentLang() === "pt"
        ? "Comece com um guia, um resultado visível e um próximo passo. Pergunte qual lição abrir ou o que fazer agora."
        : "Start with one guide, one visible outcome, and one next step. Ask me which lesson to open or what to do next.");
    return {
      role: "assistant",
      content: content
    };
  }

  async function handleTeacherQuickPrompt(prompt) {
    if (state.nodes.teacherInput) {
      state.nodes.teacherInput.value = prompt;
    }
    await handleTeacherSend();
  }

  async function handleTeacherSend() {
    if (!state.nodes.teacherInput) {
      return;
    }

    var message = state.nodes.teacherInput.value.trim();
    if (!message) {
      return;
    }

    state.nodes.teacherInput.value = "";
    await getTeacherHistory();
    state.teacherHistory.push({ role: "user", content: message });
    await saveTeacherHistory(state.teacherHistory);
    await renderTeacherMessages();

    if (state.currentLessonKey) {
      var currentLessonState = await getLessonState(state.currentLessonKey);
      if (currentLessonState.status === "not-started") {
        await saveLessonState(state.currentLessonKey, { status: "in-progress" });
      }
    }

    var reply = await getTeacherReply(message);
    state.teacherHistory.push({ role: "assistant", content: reply });
    await saveTeacherHistory(state.teacherHistory);
    await renderTeacherMessages();
  }

  async function clearTeacherHistory() {
    state.teacherHistory = [buildGreetingMessage()];
    await saveTeacherHistory(state.teacherHistory);
    renderTeacherMessages();
  }

  async function getTeacherReply(message) {
    var settings = state.settings || DEFAULT_SETTINGS;
    if (settings.provider === "openrouter" && !settings.limitedMode && settings.apiKey) {
      try {
        return await fetchOpenRouterReply(message);
      } catch (error) {
        console.warn("OpenRouter request failed, falling back locally", error);
        return localTeacherReply(message, error);
      }
    }
    return localTeacherReply(message);
  }

  async function fetchOpenRouterReply(message) {
    var lesson = state.currentLessonKey ? LESSONS[state.currentLessonKey] : null;
    var payload = {
      model: state.settings.model || DEFAULT_MODEL,
      temperature: 0.4,
      messages: buildTeacherMessages(message, lesson)
    };
    var headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + state.settings.apiKey,
      "X-Title": "AI Tool School"
    };

    if (window.location.protocol.indexOf("http") === 0) {
      headers["HTTP-Referer"] = window.location.href.split("#")[0];
    }

    var response = await window.fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      var errorText = await response.text();
      throw new Error(errorText || "OpenRouter request failed");
    }

    var data = await response.json();
    var content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) {
      throw new Error("No response content");
    }
    return String(content).trim();
  }

  function buildTeacherMessages(message, lesson) {
    var systemPrompt = [
      "You are an AI Teacher inside a website designed to help users learn AI tools the correct way.",
      "Act as a teacher, guide, coach, and technical instructor.",
      "Explain things clearly, step by step, with simple but correct language.",
      "Always guide progress instead of just answering.",
      "This school focuses on helping beginners build with Codex, Claude Code, and OpenClaw first.",
      "Treat Notion and Warp as support tools, not the main builders.",
      "Push the student toward one visible project, one clear prompt, one safe task, and one verification step at a time.",
      "Prefer exact next actions, exact prompts to type, and short beginner-safe sequences.",
      "The site uses BYOK. The user provides their own API key, it is stored locally, there are no hardcoded keys, and the site must still work without a key in limited mode.",
      "The site stores API key, model, provider, progress, and settings in IndexedDB for a local-first workflow.",
      "Default provider is OpenRouter and the default model may be " + DEFAULT_MODEL + ". Explain that free models can change or disappear and users can switch models in Settings.",
      "Never expose API configuration on the main page. Keep it in Settings.",
      "When the user's instructions are messy, rewrite and improve them before acting.",
      "If the user sounds lost, choose the builder for them and explain why in plain language.",
      "Your tone is calm, smart, technical, friendly, confident, and clear.",
      lesson ? "Current page focus: " + lesson.title + ". Primary objective: " + lesson.hero : "Current page focus: Tool School home.",
      "Prefer short sections, concrete next steps, and practical workflows."
    ].join(" ");

    var recent = state.teacherHistory.slice(-6).map(function (item) {
      return { role: item.role, content: item.content };
    });
    return [{ role: "system", content: systemPrompt }].concat(recent);
  }

  function localTeacherReply(message, error) {
    var lower = String(message || "").toLowerCase();
    var lesson = state.currentLessonKey ? LESSONS[state.currentLessonKey] : null;
    var suggestions = [];
    var pt = currentLang() === "pt";

    suggestions.push(rewriteInstruction(message));

    if (matchesAny(lower, ["start", "first", "begin", "começo", "comeco", "primeiro", "where do i start"])) {
      suggestions.push(pt ? [
        "Ordem recomendada para começar:",
        "1. Escolha um resultado visível pequeno.",
        "2. Decida a ferramenta principal: Codex para arquivos locais, Claude Code para repositório, OpenClaw para assistente por canal.",
        "3. Faça uma tarefa limitada.",
        "4. Revise e verifique antes de ampliar."
      ].join("\n") : [
        "Recommended starting order:",
        "1. Choose one small visible result.",
        "2. Pick the main builder: Codex for local files, Claude Code for repos, OpenClaw for channel-based assistant work.",
        "3. Do one bounded task.",
        "4. Review and verify before expanding."
      ].join("\n"));
    }

    if (lower.indexOf("next") !== -1 || lower.indexOf("what should i do") !== -1 || lower.indexOf("onde comeco") !== -1) {
      suggestions.push(buildNextStepResponse(lesson));
    }

    if (matchesAny(lower, ["key", "api", "byok", "openrouter", "model", "provider", "settings"])) {
      suggestions.push(pt ? [
        "Configuração BYOK:",
        "1. Abra Configurações.",
        "2. Mantenha o provedor em OpenRouter.",
        "3. Cole sua própria chave de API.",
        "4. Comece pelo modelo gratuito e troque ali se ele parar de funcionar.",
        "5. Deixe o modo limitado ligado até querer respostas ao vivo."
      ].join("\n") : [
        "BYOK setup:",
        "1. Open Settings.",
        "2. Keep provider on OpenRouter.",
        "3. Paste your own API key.",
        "4. Start with the free model and switch models there if it stops working.",
        "5. Leave limited mode on until you want live responses."
      ].join("\n"));
    }

    if (matchesAny(lower, ["codex", "prompt", "agent", "debug", "claude", "codigo", "código"])) {
      suggestions.push(pt ? [
        "Fluxo melhor para Codex ou Claude Code:",
        "1. Declare o objetivo com clareza.",
        "2. Limite o escopo a uma mudança, uma pasta ou uma pergunta.",
        "3. Diga o que não deve ser tocado.",
        "4. Peça verificação.",
        "5. Revise o resultado antes da próxima tarefa."
      ].join("\n") : [
        "Better Codex or Claude Code workflow:",
        "1. State the goal clearly.",
        "2. Bound the scope to one change, one folder, or one question.",
        "3. Say what not to touch.",
        "4. Ask for verification.",
        "5. Review the result before the next task."
      ].join("\n"));
    }

    if (matchesAny(lower, ["openclaw", "assistant", "automation", "agente local", "local agent"])) {
      suggestions.push(pt ? [
        "Fluxo melhor para OpenClaw:",
        "1. Escolha uma tarefa do assistente, não um sistema inteiro.",
        "2. Defina o canal exato.",
        "3. Decida onde a revisão humana entra.",
        "4. Escreva claramente o que o assistente não pode fazer.",
        "5. Teste com uma versão estreita antes de expandir."
      ].join("\n") : [
        "Better OpenClaw workflow:",
        "1. Choose one assistant job, not a whole system.",
        "2. Define the exact channel.",
        "3. Decide where human review happens.",
        "4. State clearly what the assistant must not do.",
        "5. Test a narrow version before expanding."
      ].join("\n"));
    }

    if (matchesAny(lower, ["cursor"])) {
      suggestions.push([
        "Better Cursor workflow:",
        "- Request small edits, not broad rewrites.",
        "- Keep one file or one feature in focus.",
        "- Review diffs before accepting changes.",
        "- Ask the AI to explain risky changes before applying them."
      ].join("\n"));
    }

    if (matchesAny(lower, ["warp", "terminal", "command", "log"])) {
      suggestions.push(pt ? [
        "Como usar Warp do jeito certo aqui:",
        "1. Leia primeiro a linha do erro.",
        "2. Isole o comando que falhou.",
        "3. Tente uma correção por vez.",
        "4. Salve como workflow só depois que funcionar limpo.",
        "5. Use Warp como apoio para Codex ou Claude, não como builder principal."
      ].join("\n") : [
        "How to use Warp correctly here:",
        "1. Read the error line first.",
        "2. Isolate the failing command.",
        "3. Retry one fix at a time.",
        "4. Save the command as a workflow only after it works cleanly.",
        "5. Use Warp as support for Codex or Claude, not as the main builder."
      ].join("\n"));
    }

    if (matchesAny(lower, ["notion", "notes", "organize", "organizar"])) {
      suggestions.push(pt ? [
        "Como usar Notion do jeito certo aqui:",
        "1. Não comece pelo Notion se você ainda não construiu nada.",
        "2. Use o Notion para salvar prompts, resultados e próximos passos.",
        "3. Crie páginas e bancos só quando houver informação real para organizar."
      ].join("\n") : [
        "How to use Notion correctly here:",
        "1. Do not start with Notion if you have not built anything yet.",
        "2. Use Notion to store prompts, results, and next steps.",
        "3. Create pages and databases only when there is real information to organize."
      ].join("\n"));
    }

    if (matchesAny(lower, ["score", "progress", "complete", "completion"])) {
      suggestions.push(pt
        ? "Use o rastreador de lição em cada página para marcar status, confiança e próximo passo. O dashboard da home transforma isso em uma pontuação simples e recomenda a próxima lição."
        : "Use the lesson tracker on each page to mark status, confidence, and the next step. The homepage dashboard then turns that into a simple progress score and recommends the next lesson.");
    }

    if (lesson && suggestions.length < 3) {
      suggestions.push([
        lesson.title + " focus:",
        "- " + getLessonTasks(lesson)[0],
        "- " + getLessonTasks(lesson)[1],
        "- " + getLessonTasks(lesson)[2]
      ].join("\n"));
    }

    if (error) {
      suggestions.push(pt
        ? "A IA ao vivo não estava disponível, então o teacher ficou no modo de orientação local. Se quiser respostas ao vivo, confira sua chave e modelo do OpenRouter em Configurações."
        : "Live AI was not available, so the teacher stayed in local guidance mode. If you want live responses, check your OpenRouter key and model in Settings.");
    }

    return suggestions.slice(0, 4).join("\n\n");
  }

  function rewriteInstruction(message) {
    var cleaned = String(message || "").trim();
    if (!cleaned) {
      return currentLang() === "pt"
        ? "Tarefa refinada: escolha uma lição, defina um resultado visível e avance um passo de cada vez."
        : "Refined task: pick one lesson, define one visible outcome, and move one step forward.";
    }
    return currentLang() === "pt"
      ? "Tarefa refinada: " + cleaned.replace(/\s+/g, " ").replace(/[.?!]*$/, ".") + " Vou manter o escopo limitado e avançar um passo por vez."
      : "Refined task: " + cleaned.replace(/\s+/g, " ").replace(/[.?!]*$/, ".") + " I will keep the scope tight and move one step at a time.";
  }

  function buildNextStepResponse(lesson) {
    if (!lesson) {
      var nextLesson = getNextLesson();
      return currentLang() === "pt"
        ? [
          "Próximo passo:",
          "1. Abra " + getLessonTitle(nextLesson) + ".",
          "2. Termine apenas a primeira tarefa.",
          "3. Marque a lição como em andamento quando começar.",
          "4. Escreva um próximo passo antes de sair da página."
        ].join("\n")
        : [
          "Next step:",
          "1. Open " + nextLesson.title + ".",
          "2. Finish the first task only.",
          "3. Mark the lesson as in progress when you start.",
          "4. Write one next step before leaving the page."
        ].join("\n");
    }

    return currentLang() === "pt"
      ? [
        "Próximo passo para " + getLessonTitle(lesson) + ":",
        "1. " + getLessonTasks(lesson)[0],
        "2. " + getLessonTasks(lesson)[1],
        "3. Use o rastreador da lição para marcar seu status.",
        "4. Peça o próximo movimento de novo depois disso."
      ].join("\n")
      : [
        "Next step for " + lesson.title + ":",
        "1. " + getLessonTasks(lesson)[0],
        "2. " + getLessonTasks(lesson)[1],
        "3. Use the lesson tracker to mark your status.",
        "4. Ask for the next move again after that."
      ].join("\n");
  }

  function matchesAny(text, fragments) {
    return fragments.some(function (fragment) {
      return text.indexOf(fragment) !== -1;
    });
  }

  function getNextQuestion() {
    if (state.currentLessonKey && LESSONS[state.currentLessonKey]) {
      return currentLang() === "pt"
        ? "O que eu devo fazer agora em " + getLessonTitle(LESSONS[state.currentLessonKey]) + "?"
        : "What should I do next on " + LESSONS[state.currentLessonKey].title + "?";
    }
    return currentLang() === "pt" ? "Qual guia eu devo abrir agora e por quê?" : "What guide should I open next and why?";
  }

  function getLessonPanelHost() {
    if (!state.currentLessonKey) {
      return null;
    }

    return document.querySelector(".hero") || document.querySelector(".section");
  }

  function renderLessonPanel() {
    if (!state.currentLessonKey) {
      return;
    }

    var lesson = LESSONS[state.currentLessonKey];
    var lessonState = state.lessonStates[state.currentLessonKey] || getDefaultLessonState(state.currentLessonKey);
    var host = getLessonPanelHost();
    if (!host) {
      return;
    }

    var panel = document.querySelector("[data-lesson-panel]");
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "lesson-panel";
      panel.setAttribute("data-lesson-panel", "true");
      host.insertAdjacentElement("afterend", panel);
      panel.addEventListener("click", handleLessonPanelClick);
      panel.addEventListener("change", handleLessonPanelChange);
    }

    panel.innerHTML = [
      '<div class="section-kicker">' + escapeHtml(t("lessonTracker")) + "</div>",
      "<h3>" + escapeHtml(t("lessonTrackerTitle")) + "</h3>",
      "<p>" + escapeHtml(t("lessonTrackerBody")) + "</p>",
      '<div class="ts-card">',
      '  <h4>' + escapeHtml(t("status")) + "</h4>",
      '  <div class="ts-chip-row">',
      buildChip("status", "not-started", t("notStarted"), lessonState.status),
      buildChip("status", "in-progress", t("inProgress"), lessonState.status),
      buildChip("status", "completed", t("completed"), lessonState.status),
      '  </div>',
      '</div>',
      '<div class="ts-card">',
      '  <h4>' + escapeHtml(t("confidence")) + "</h4>",
      '  <div class="ts-chip-row">',
      buildChip("confidence", "low", t("low"), lessonState.confidence),
      buildChip("confidence", "medium", t("medium"), lessonState.confidence),
      buildChip("confidence", "high", t("high"), lessonState.confidence),
      '  </div>',
      '</div>',
      '<div class="ts-card">',
      '  <h4>' + escapeHtml(t("lessonChecklist")) + "</h4>",
      '  <ul class="ts-task-list">',
      getLessonTasks(lesson).map(function (task, index) {
        var checked = lessonState.tasks[index] ? " checked" : "";
        return '<li><label class="ts-toggle"><input type="checkbox" data-lesson-task="' + index + '"' + checked + '> <span>' + escapeHtml(task) + '</span></label></li>';
      }).join(""),
      '  </ul>',
      '</div>',
      '<div class="ts-field">',
      '  <label for="lesson-next-step">' + escapeHtml(t("nextStep")) + '</label>',
      '  <textarea id="lesson-next-step" data-lesson-next-step placeholder="' + escapeAttribute(t("nextStepPlaceholder")) + '">' + escapeHtml(lessonState.nextStep || "") + '</textarea>',
      '  <small>' + escapeHtml(t("nextStepHelp")) + '</small>',
      '</div>',
      '<div class="lesson-status-line">',
      '  <span data-lesson-summary>' + escapeHtml(buildLessonSummary(lessonState, lesson)) + '</span>',
      '  <button type="button" class="button small" data-lesson-save>' + escapeHtml(t("saveLesson")) + '</button>',
      '</div>'
    ].join("");
  }

  function buildChip(group, value, label, activeValue) {
    var active = value === activeValue ? " active" : "";
    return '<button type="button" class="ts-chip' + active + '" data-lesson-choice="' + group + '" data-value="' + value + '">' + label + "</button>";
  }

  function buildLessonSummary(lessonState, lesson) {
    var completedTasks = (lessonState.tasks || []).filter(Boolean).length;
    if (currentLang() === "pt") {
      return getLessonTitle(lesson) + ": " + completedTasks + "/" + getLessonTasks(lesson).length + " tarefas completas, status " + t(lessonState.status === "completed" ? "completed" : lessonState.status === "in-progress" ? "inProgress" : "notStarted") + ", confiança " + t(lessonState.confidence) + ".";
    }
    return lesson.title + ": " + completedTasks + "/" + getLessonTasks(lesson).length + " tasks complete, status " + lessonState.status + ", confidence " + lessonState.confidence + ".";
  }

  async function handleLessonPanelClick(event) {
    var choice = event.target.closest("[data-lesson-choice]");
    if (choice) {
      var group = choice.getAttribute("data-lesson-choice");
      var value = choice.getAttribute("data-value");
      var update = {};
      update[group] = value;
      await saveLessonState(state.currentLessonKey, update);
      return;
    }

    if (event.target.matches("[data-lesson-save]")) {
      await persistLessonTextarea();
    }
  }

  async function handleLessonPanelChange(event) {
    if (event.target.matches("[data-lesson-next-step]")) {
      await persistLessonTextarea();
      return;
    }

    if (event.target.matches("[data-lesson-task]")) {
      var lessonState = Object.assign({}, state.lessonStates[state.currentLessonKey] || getDefaultLessonState(state.currentLessonKey));
      var tasks = Array.isArray(lessonState.tasks) ? lessonState.tasks.slice() : [false, false, false];
      var taskIndex = Number(event.target.getAttribute("data-lesson-task"));
      tasks[taskIndex] = event.target.checked;
      lessonState.tasks = tasks;

      if (lessonState.status === "not-started") {
        lessonState.status = "in-progress";
      }

      if (tasks.every(Boolean)) {
        lessonState.status = "completed";
      }

      await saveLessonState(state.currentLessonKey, lessonState);
    }
  }

  async function persistLessonTextarea() {
    var textarea = document.querySelector("[data-lesson-next-step]");
    if (!textarea) {
      return;
    }

    var nextStep = textarea.value.trim();
    var lessonState = Object.assign({}, state.lessonStates[state.currentLessonKey] || getDefaultLessonState(state.currentLessonKey));
    lessonState.nextStep = nextStep;
    if (nextStep && lessonState.status === "not-started") {
      lessonState.status = "in-progress";
    }
    await saveLessonState(state.currentLessonKey, lessonState);
  }

  function renderGuideBadges() {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-guide-card]"));
    if (!cards.length) {
      return;
    }

    cards.forEach(function (card) {
      var link = card.querySelector("a[href]");
      if (!link) {
        return;
      }

      var href = link.getAttribute("href");
      var lessonKey = PAGE_TO_LESSON[href];
      if (!lessonKey) {
        return;
      }

      var lessonState = state.lessonStates[lessonKey] || getDefaultLessonState(lessonKey);
      var guideActions = card.querySelector(".guide-actions");
      if (!guideActions) {
        return;
      }

      var badge = guideActions.querySelector(".guide-status-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "guide-status-badge";
        guideActions.appendChild(badge);
      }
      badge.setAttribute("data-status", lessonState.status);
      if (lessonState.status === "completed") {
        badge.textContent = t("guideStatusCompleted");
      } else if (lessonState.status === "in-progress") {
        badge.textContent = t("guideStatusInProgress");
      } else {
        badge.textContent = t("guideStatusNotStarted");
      }
    });
  }

  function getGuideResourceLinks() {
    return Array.prototype.slice.call(document.querySelectorAll('#resources a[href^="http"], .resource a[href^="http"]')).slice(0, 3);
  }

  function renderGuidePrimer() {
    if (!state.currentLessonKey) {
      return;
    }

    var lesson = LESSONS[state.currentLessonKey];
    var host = document.querySelector("[data-lesson-panel]") || getLessonPanelHost();
    if (!host || !lesson) {
      return;
    }

    var panel = document.querySelector("[data-student-primer]");
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "student-primer";
      panel.setAttribute("data-student-primer", "true");
      host.insertAdjacentElement("afterend", panel);
    }

    var prompts = getResearchPrompts(state.currentLessonKey);
    var docsLink = getGuideResourceLinks()[0];
    var docsHref = docsLink ? docsLink.getAttribute("href") : lesson.href;
    var docsLabel = docsLink ? docsLink.textContent.trim() : t("primerOpenDocs");

    panel.innerHTML = [
      '<div class="section-kicker">' + escapeHtml(t("primerKicker")) + "</div>",
      "<h3>" + escapeHtml(t("primerTitle")) + "</h3>",
      '<p class="student-note">' + escapeHtml(t("primerBody")) + "</p>",
      '<p class="guide-translation-note">' + escapeHtml(t("translationNote")) + "</p>",
      '<div class="student-primer-grid">',
      '  <article class="student-primer-card">',
      "    <h4>" + escapeHtml(t("primerWhatFor")) + "</h4>",
      "    <p>" + escapeHtml(lesson.hero) + "</p>",
      "  </article>",
      '  <article class="student-primer-card">',
      "    <h4>" + escapeHtml(t("primerFirstThirty")) + "</h4>",
      "    <ol>" + getLessonTasks(lesson).map(function (task) { return "<li>" + escapeHtml(task) + "</li>"; }).join("") + "</ol>",
      "  </article>",
      '  <article class="student-primer-card">',
      "    <h4>" + escapeHtml(t("primerFirstBuild")) + "</h4>",
      "    <p>" + escapeHtml(getFirstBuildLine(state.currentLessonKey)) + "</p>",
      "  </article>",
      '  <article class="student-primer-card">',
      "    <h4>" + escapeHtml(t("primerUseAi")) + "</h4>",
      "    <ul>" + getLessonPrompts(lesson).map(function (prompt) { return "<li>" + escapeHtml(prompt) + "</li>"; }).join("") + "</ul>",
      "  </article>",
      '  <article class="student-primer-card">',
      "    <h4>" + escapeHtml(t("primerResearch")) + "</h4>",
      "    <ul>" + prompts.map(function (prompt) { return "<li>" + escapeHtml(prompt) + "</li>"; }).join("") + "</ul>",
      "  </article>",
      "</div>",
      '<div class="student-primer-actions">',
      '  <a class="button primary small" href="' + escapeAttribute(docsHref) + '" target="_blank" rel="noreferrer">' + escapeHtml(docsLabel) + "</a>",
      '  <button type="button" class="button small" data-primer-ask-teacher>' + escapeHtml(t("primerAskTeacher")) + "</button>",
      '  <a class="button small" href="index.html">' + escapeHtml(t("primerHome")) + "</a>",
      "</div>"
    ].join("");

    panel.addEventListener("click", function (event) {
      if (event.target.matches("[data-primer-ask-teacher]")) {
        openSurface("teacher");
        handleTeacherQuickPrompt(getNextQuestion());
      }
    }, { once: true });
  }

  function renderShellLanguage() {
    var guideSearch = document.querySelector("[data-guide-search]");
    if (guideSearch) {
      guideSearch.setAttribute("placeholder", currentLang() === "pt" ? "Pesquisar por ferramenta, tópico, workflow ou skill" : "Search by tool, topic, workflow, or skill");
    }

    var dockLabel = document.querySelector("[data-lang-dock-label]");
    if (dockLabel) {
      dockLabel.textContent = t("dockLabel");
    }

    var fabs = Array.prototype.slice.call(document.querySelectorAll(".ts-fab-group .ts-fab"));
    if (fabs[0]) {
      fabs[0].textContent = t("settings");
    }
    if (fabs[1]) {
      fabs[1].textContent = t("teacher");
    }

    if (state.nodes.overlay) {
      state.nodes.overlay.setAttribute("aria-label", t("closePanels"));
    }

    if (state.nodes.dashboard) {
      var kicker = state.nodes.dashboard.querySelector(".section-kicker");
      var title = state.nodes.dashboard.querySelector("h3");
      if (kicker) {
        kicker.textContent = t("dashboardKicker");
      }
      if (title) {
        title.textContent = t("dashboardTitle");
      }
    }

    if (state.nodes.panel) {
      var teacherKicker = state.nodes.panel.querySelector(".section-kicker");
      var teacherTitle = state.nodes.panel.querySelector("[data-teacher-title]");
      var teacherHead = state.nodes.panel.querySelector(".ts-card h4");
      var teacherAsk = state.nodes.panel.querySelectorAll(".ts-card h4")[1];
      var teacherButtons = state.nodes.panel.querySelectorAll(".ts-actions .button");
      var teacherTextarea = state.nodes.panel.querySelector("[data-teacher-input]");
      if (teacherKicker) {
        teacherKicker.textContent = t("teacher");
      }
      if (teacherTitle) {
        teacherTitle.textContent = state.currentLessonKey && LESSONS[state.currentLessonKey]
          ? getLessonTitle(LESSONS[state.currentLessonKey])
          : "Tool School";
      }
      if (teacherHead) {
        teacherHead.textContent = t("currentFocus");
      }
      if (teacherAsk) {
        teacherAsk.textContent = t("askNextMove");
      }
      if (teacherButtons[0]) teacherButtons[0].textContent = t("send");
      if (teacherButtons[1]) teacherButtons[1].textContent = t("nextQuestion");
      if (teacherButtons[2]) teacherButtons[2].textContent = t("clearHistory");
      if (teacherTextarea) teacherTextarea.placeholder = t("teacherPlaceholder");
    }
  }

  function renderDashboard() {
    if (!state.nodes.dashboard) {
      return;
    }

    var lessonKeys = Object.keys(LESSONS);
    var completed = 0;
    var inProgress = 0;

    lessonKeys.forEach(function (key) {
      var lessonState = state.lessonStates[key] || getDefaultLessonState(key);
      if (lessonState.status === "completed") {
        completed += 1;
      } else if (lessonState.status === "in-progress") {
        inProgress += 1;
      }
    });

    var checks = Object.keys(state.checklistStates);
    var checkTotal = checks.length;
    var checkDone = checks.filter(function (key) {
      return state.checklistStates[key];
    }).length;
    var scoreBase = lessonKeys.length * 10 + Math.max(checkTotal, 1) * 2;
    var score = Math.round(((completed * 10) + (inProgress * 5) + (checkDone * 2)) / scoreBase * 100);
    var nextLesson = getNextLesson();

    var summary = state.nodes.dashboard.querySelector("[data-dashboard-summary]");
    var chips = state.nodes.dashboard.querySelector("[data-dashboard-chips]");
    var next = state.nodes.dashboard.querySelector("[data-dashboard-next]");
    var link = state.nodes.dashboard.querySelector("[data-dashboard-link]");

    if (summary) {
      summary.textContent = formatText("dashboardSummary", {
        score: score,
        completed: completed,
        inProgress: inProgress,
        suffix: currentLang() === "pt" ? (completed === 1 ? "ão" : "ões") : (completed === 1 ? "" : "s")
      });
    }

    if (chips) {
      chips.innerHTML = [
        '<span class="guide-status-badge" data-status="completed">' + completed + " " + escapeHtml(t("dashboardCompletedWord")) + "</span>",
        '<span class="guide-status-badge" data-status="in-progress">' + inProgress + " " + escapeHtml(t("dashboardActiveWord")) + "</span>",
        '<span class="guide-status-badge" data-status="not-started">' + checkDone + '/' + Math.max(checkTotal, 0) + " " + escapeHtml(t("dashboardChecklistWord")) + "</span>"
      ].join("");
    }

    if (next) {
      next.textContent = formatText("dashboardNext", { title: getLessonTitle(nextLesson) });
    }

    if (link) {
      link.href = nextLesson.href;
      link.textContent = formatText("dashboardOpen", { title: getLessonTitle(nextLesson) });
    }
  }

  function getNextLesson() {
    var order = ["first-build", "codex", "claude-code", "openclaw", "notion", "warp", "ai-teacher"];
    var nextKey = order.find(function (key) {
      var lessonState = state.lessonStates[key] || getDefaultLessonState(key);
      return lessonState.status !== "completed";
    }) || "first-build";
    return LESSONS[nextKey];
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }
})();
