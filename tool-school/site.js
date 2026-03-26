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
      hero: "Get one visible win and prove the workflow works.",
      tasks: [
        "Pick one visible outcome you can show another person today.",
        "Use one builder for the first pass instead of mixing five tools.",
        "Do one improvement pass and stop when the result is demo-ready."
      ],
      prompts: [
        "What should I build first on this site?",
        "Turn my idea into one bounded first project.",
        "What is the fastest visible win here?"
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
      hero: "Teach clear prompts, bounded scope, and verification.",
      tasks: [
        "Write one prompt with a clear goal, scope, and what not to touch.",
        "Ask Codex for one small implementation instead of a giant rewrite.",
        "Verify the result before moving to the next task."
      ],
      prompts: [
        "Show me a better Codex prompt for this task.",
        "How do I debug a Codex run step by step?",
        "What should I tell Codex not to touch?"
      ]
    },
    notion: {
      slug: "notion",
      title: "Notion",
      href: "notion-complete-guide.html",
      track: "Knowledge",
      hero: "Structure pages, databases, and relations before the workspace gets messy.",
      tasks: [
        "Define one dashboard, one task database, and one project database.",
        "Decide what belongs in pages versus databases.",
        "Connect one relation so the system starts to feel useful."
      ],
      prompts: [
        "What should be a page and what should be a database?",
        "Help me design a clean beginner Notion setup.",
        "What is the smallest useful Notion system?"
      ]
    },
    warp: {
      slug: "warp",
      title: "Warp",
      href: "warp-complete-guide.html",
      track: "Terminal",
      hero: "Turn terminal work into repeatable workflows instead of one-off commands.",
      tasks: [
        "Learn blocks first so command history is easier to read and reuse.",
        "Save one workflow or notebook worth repeating later.",
        "Use the teacher to translate terminal errors into clear next actions."
      ],
      prompts: [
        "How should I read Warp errors and logs?",
        "What Warp workflow should a beginner save first?",
        "Teach me the safer way to use AI in Warp."
      ]
    },
    openclaw: {
      slug: "openclaw",
      title: "OpenClaw",
      href: "openclaw-complete-guide.html",
      track: "Agents",
      hero: "Use local assistants safely and intentionally.",
      tasks: [
        "Decide which channels really need automation.",
        "Keep private assistant flows narrow and reviewable at first.",
        "Document what the assistant should and should not do."
      ],
      prompts: [
        "How should I use local agents safely?",
        "What is a good first OpenClaw workflow?",
        "How do I avoid giving an agent too much freedom?"
      ]
    },
    "claude-code": {
      slug: "claude-code",
      title: "Claude Code",
      href: "claude-code-complete-guide.html",
      track: "Coding",
      hero: "Use terminal-first AI coding with better prompting discipline.",
      tasks: [
        "Break the work into one repo question or one code change at a time.",
        "Review the output instead of accepting every suggestion blindly.",
        "Keep permissions and scope clear when the agent acts in the repo."
      ],
      prompts: [
        "How should I prompt Claude Code better?",
        "What is the safer workflow for repo edits?",
        "How do I review AI code without missing problems?"
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
    renderSettingsForm();
    renderTeacherMode();
  }

  function getCurrentPage() {
    var page = (window.location.pathname || "").split("/").pop();
    if (!page) {
      return "index.html";
    }
    return page.split("?")[0] || "index.html";
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
      progressLabel.textContent = completed === total ? "Day complete" : completed + " of " + total + " completed";
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
      storageNote.textContent = "Stored locally via " + (state.storageMode === "indexeddb" ? "IndexedDB" : "localStorage fallback");
    }

    var drawerLangButtons = Array.prototype.slice.call(document.querySelectorAll("[data-setting-lang]"));
    drawerLangButtons.forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-setting-lang") === settings.language);
    });
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
      : "Use the teacher to decide what to open next, how to improve prompts, and how to move through the school without getting lost. " + modeText;

    var prompts = lesson ? lesson.prompts : [
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
      return "Teacher mode: local guidance. Add an OpenRouter key in Settings if you want live AI responses.";
    }
    return "Teacher mode: OpenRouter enabled with " + (settings.model || DEFAULT_MODEL) + ".";
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
      var roleLabel = message.role === "user" ? "You" : "Teacher";
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
      ? "We are on " + lesson.title + ". Start with one small step: " + lesson.tasks[0] + " Ask for the next move any time."
      : "Start with one guide, one visible outcome, and one next step. Ask me which lesson to open or what to do next.";
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
      "Teach best practices for Codex, Cursor, Warp, ChatGPT, OpenRouter, local agents, prompt engineering, AI workflows, debugging, and safe AI coding.",
      "The site uses BYOK. The user provides their own API key, it is stored locally, there are no hardcoded keys, and the site must still work without a key in limited mode.",
      "The site stores API key, model, provider, progress, and settings in IndexedDB for a local-first workflow.",
      "Default provider is OpenRouter and the default model may be " + DEFAULT_MODEL + ". Explain that free models can change or disappear and users can switch models in Settings.",
      "Never expose API configuration on the main page. Keep it in Settings.",
      "When the user's instructions are messy, rewrite and improve them before acting.",
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

    suggestions.push(rewriteInstruction(message));

    if (lower.indexOf("next") !== -1 || lower.indexOf("what should i do") !== -1 || lower.indexOf("onde comeco") !== -1) {
      suggestions.push(buildNextStepResponse(lesson));
    }

    if (matchesAny(lower, ["key", "api", "byok", "openrouter", "model", "provider", "settings"])) {
      suggestions.push([
        "BYOK setup:",
        "1. Open Settings.",
        "2. Keep provider on OpenRouter.",
        "3. Paste your own API key.",
        "4. Start with the free model and switch models there if it stops working.",
        "5. Leave limited mode on until you want live responses."
      ].join("\n"));
    }

    if (matchesAny(lower, ["codex", "prompt", "agent", "debug"])) {
      suggestions.push([
        "Better Codex workflow:",
        "- State the goal clearly.",
        "- Bound the scope to one change or one folder.",
        "- Say what not to touch.",
        "- Ask for verification.",
        "- Review the result before the next task."
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
      suggestions.push([
        "Better Warp workflow:",
        "- Read the error line first.",
        "- Isolate the failing command.",
        "- Retry one fix at a time.",
        "- Save the command as a workflow only after it works cleanly."
      ].join("\n"));
    }

    if (matchesAny(lower, ["score", "progress", "complete", "completion"])) {
      suggestions.push("Use the lesson tracker on each page to mark status, confidence, and the next step. The homepage dashboard then turns that into a simple progress score and recommends the next lesson.");
    }

    if (lesson && suggestions.length < 3) {
      suggestions.push([
        lesson.title + " focus:",
        "- " + lesson.tasks[0],
        "- " + lesson.tasks[1],
        "- " + lesson.tasks[2]
      ].join("\n"));
    }

    if (error) {
      suggestions.push("Live AI was not available, so the teacher stayed in local guidance mode. If you want live responses, check your OpenRouter key and model in Settings.");
    }

    return suggestions.slice(0, 4).join("\n\n");
  }

  function rewriteInstruction(message) {
    var cleaned = String(message || "").trim();
    if (!cleaned) {
      return "Refined task: pick one lesson, define one visible outcome, and move one step forward.";
    }
    return "Refined task: " + cleaned.replace(/\s+/g, " ").replace(/[.?!]*$/, ".") + " I will keep the scope tight and move one step at a time.";
  }

  function buildNextStepResponse(lesson) {
    if (!lesson) {
      var nextLesson = getNextLesson();
      return [
        "Next step:",
        "1. Open " + nextLesson.title + ".",
        "2. Finish the first task only.",
        "3. Mark the lesson as in progress when you start.",
        "4. Write one next step before leaving the page."
      ].join("\n");
    }

    return [
      "Next step for " + lesson.title + ":",
      "1. " + lesson.tasks[0],
      "2. " + lesson.tasks[1],
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
      return "What should I do next on " + LESSONS[state.currentLessonKey].title + "?";
    }
    return "What guide should I open next and why?";
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
      '<div class="section-kicker">Lesson Tracker</div>',
      '<h3>Keep this lesson moving</h3>',
      '<p>Mark the lesson stage, rate confidence, and define the next action so progress stays visible.</p>',
      '<div class="ts-card">',
      '  <h4>Status</h4>',
      '  <div class="ts-chip-row">',
      buildChip("status", "not-started", "Not started", lessonState.status),
      buildChip("status", "in-progress", "In progress", lessonState.status),
      buildChip("status", "completed", "Completed", lessonState.status),
      '  </div>',
      '</div>',
      '<div class="ts-card">',
      '  <h4>Confidence</h4>',
      '  <div class="ts-chip-row">',
      buildChip("confidence", "low", "Low", lessonState.confidence),
      buildChip("confidence", "medium", "Medium", lessonState.confidence),
      buildChip("confidence", "high", "High", lessonState.confidence),
      '  </div>',
      '</div>',
      '<div class="ts-card">',
      '  <h4>Lesson checklist</h4>',
      '  <ul class="ts-task-list">',
      lesson.tasks.map(function (task, index) {
        var checked = lessonState.tasks[index] ? " checked" : "";
        return '<li><label class="ts-toggle"><input type="checkbox" data-lesson-task="' + index + '"' + checked + '> <span>' + escapeHtml(task) + '</span></label></li>';
      }).join(""),
      '  </ul>',
      '</div>',
      '<div class="ts-field">',
      '  <label for="lesson-next-step">Next step</label>',
      '  <textarea id="lesson-next-step" data-lesson-next-step placeholder="Write the next small action you want to take.">' + escapeHtml(lessonState.nextStep || "") + '</textarea>',
      '  <small>Saved locally. Keep it specific enough that you can do it without rethinking the whole lesson.</small>',
      '</div>',
      '<div class="lesson-status-line">',
      '  <span data-lesson-summary>' + escapeHtml(buildLessonSummary(lessonState, lesson)) + '</span>',
      '  <button type="button" class="button small" data-lesson-save>Save lesson</button>',
      '</div>'
    ].join("");
  }

  function buildChip(group, value, label, activeValue) {
    var active = value === activeValue ? " active" : "";
    return '<button type="button" class="ts-chip' + active + '" data-lesson-choice="' + group + '" data-value="' + value + '">' + label + "</button>";
  }

  function buildLessonSummary(lessonState, lesson) {
    var completedTasks = (lessonState.tasks || []).filter(Boolean).length;
    return lesson.title + ": " + completedTasks + "/" + lesson.tasks.length + " tasks complete, status " + lessonState.status + ", confidence " + lessonState.confidence + ".";
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
      badge.textContent = lessonState.status.replace("-", " ");
    });
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
      summary.textContent = "Score " + score + "/100 with " + completed + " completed lesson" + (completed === 1 ? "" : "s") + " and " + inProgress + " in progress.";
    }

    if (chips) {
      chips.innerHTML = [
        '<span class="guide-status-badge" data-status="completed">' + completed + ' completed</span>',
        '<span class="guide-status-badge" data-status="in-progress">' + inProgress + ' active</span>',
        '<span class="guide-status-badge" data-status="not-started">' + checkDone + '/' + Math.max(checkTotal, 0) + ' checklist</span>'
      ].join("");
    }

    if (next) {
      next.textContent = "Recommended next lesson: " + nextLesson.title;
    }

    if (link) {
      link.href = nextLesson.href;
      link.textContent = "Open " + nextLesson.title;
    }
  }

  function getNextLesson() {
    var order = ["first-build", "codex", "warp", "notion", "openclaw", "claude-code", "ai-teacher"];
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
