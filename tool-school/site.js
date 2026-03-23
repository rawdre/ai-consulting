(function () {
  const searchInput = document.querySelector("[data-guide-search]");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const guideCards = Array.from(document.querySelectorAll("[data-guide-card]"));
  const progressItems = Array.from(document.querySelectorAll("[data-progress-item]"));
  const progressFill = document.querySelector("[data-progress-fill]");
  const progressLabel = document.querySelector("[data-progress-label]");
  const tabButtons = Array.from(document.querySelectorAll("[data-tab-button]"));
  const tabPanels = Array.from(document.querySelectorAll("[data-tab-panel]"));
  const langButtons = Array.from(document.querySelectorAll("[data-lang-switch]"));
  const storageKey = "toolschool-progress-v1";
  const filterKey = "toolschool-filter-v1";
  const langKey = "toolschool-lang-v1";

  function normalize(value) {
    return (value || "").toLowerCase().trim();
  }

  function getActiveFilter() {
    const active = filterButtons.find((button) => button.classList.contains("active"));
    return active ? active.dataset.filter : "all";
  }

  function applyFilters() {
    const term = normalize(searchInput ? searchInput.value : "");
    const activeFilter = getActiveFilter();

    guideCards.forEach((card) => {
      const haystack = normalize(card.dataset.search);
      const tags = normalize(card.dataset.tags);
      const matchesTerm = !term || haystack.includes(term);
      const matchesFilter = activeFilter === "all" || tags.includes(activeFilter);
      card.classList.toggle("hidden", !(matchesTerm && matchesFilter));
    });
  }

  function setFilter(nextFilter) {
    filterButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.filter === nextFilter);
    });
    localStorage.setItem(filterKey, nextFilter);
    applyFilters();
  }

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch (error) {
      return {};
    }
  }

  function saveProgress(state) {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function renderProgress() {
    const saved = loadProgress();
    let completed = 0;

    progressItems.forEach((input) => {
      const checked = Boolean(saved[input.id]);
      input.checked = checked;
      if (checked) {
        completed += 1;
      }
    });

    const total = progressItems.length || 1;
    const percent = Math.round((completed / total) * 100);

    if (progressFill) {
      progressFill.style.width = percent + "%";
    }

    if (progressLabel) {
      progressLabel.textContent = completed + " of " + total + " completed";
    }
  }

  function setActiveTab(tabName) {
    tabButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.tabButton === tabName);
    });

    tabPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.tabPanel === tabName);
    });
  }

  function setLanguage(lang) {
    document.body.setAttribute("data-lang", lang);
    langButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.langSwitch === lang);
    });
    localStorage.setItem(langKey, lang);
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => setFilter(button.dataset.filter));
  });

  progressItems.forEach((input) => {
    input.addEventListener("change", () => {
      const saved = loadProgress();
      saved[input.id] = input.checked;
      saveProgress(saved);
      renderProgress();
    });
  });

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.tabButton));
  });

  langButtons.forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.langSwitch));
  });

  const savedFilter = localStorage.getItem(filterKey) || "all";
  const savedLang = localStorage.getItem(langKey) || "en";
  setFilter(savedFilter);
  renderProgress();
  setActiveTab("business");
  setLanguage(savedLang);
})();
