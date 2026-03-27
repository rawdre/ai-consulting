(function () {
  const artistConfig = {
    name: "Luizastabs",
    whatsappNumber: "17724048588",
    instagramHandle: "rawstabs",
    instagramDmUrl: "https://ig.me/m/rawstabs",
    instagramProfileUrl: "https://www.instagram.com/rawstabs/",
    bookingLink: "https://linktr.ee/rawstabs"
  };

  const accordionItems = Array.from(document.querySelectorAll(".faq-item"));
  const templateButtons = Array.from(document.querySelectorAll(".template-copy"));
  const templateTexts = Array.from(document.querySelectorAll("[data-template-text]"));
  const form = document.querySelector("[data-intake-form]");
  const resultBox = document.querySelector("[data-result-box]");
  const whatsappLink = document.querySelector("[data-whatsapp-link]");
  const copySummaryButton = document.querySelector("[data-copy-summary]");
  const whatsappEntryLinks = Array.from(document.querySelectorAll("[data-whatsapp-entry]"));
  const bookingLinks = Array.from(document.querySelectorAll("[data-booking-link]"));
  const instagramProfileLinks = Array.from(document.querySelectorAll("[data-instagram-profile]"));
  const instagramDmLinks = Array.from(document.querySelectorAll("[data-instagram-dm]"));
  const workCarousel = document.querySelector("[data-work-carousel]");
  const workTrack = document.querySelector("[data-work-track]");
  const workPrev = document.querySelector("[data-work-prev]");
  const workNext = document.querySelector("[data-work-next]");
  const workDots = Array.from(document.querySelectorAll("[data-work-dot]"));
  let latestSummary = "";
  let activeWorkIndex = 0;

  function renderWorkCarousel(index) {
    if (!workTrack) {
      return;
    }

    const slideCount = workDots.length || 1;
    activeWorkIndex = (index + slideCount) % slideCount;
    workTrack.style.transform = "translateX(-" + (activeWorkIndex * 100) + "%)";

    workDots.forEach(function (dot, dotIndex) {
      dot.classList.toggle("is-active", dotIndex === activeWorkIndex);
    });
  }

  function initializeLinks() {
    const defaultWhatsappMessage = "Hi " + artistConfig.name + "! I want to book a tattoo.";
    const whatsappUrl = "https://wa.me/" + artistConfig.whatsappNumber + "?text=" + encodeURIComponent(defaultWhatsappMessage);

    whatsappEntryLinks.forEach(function (link) {
      link.href = whatsappUrl;
    });

    bookingLinks.forEach(function (link) {
      link.href = artistConfig.bookingLink;
    });

    instagramProfileLinks.forEach(function (link) {
      link.href = artistConfig.instagramProfileUrl;
    });

    instagramDmLinks.forEach(function (link) {
      link.href = artistConfig.instagramDmUrl;
    });
  }

  function setResult(summary) {
    latestSummary = summary;
    resultBox.textContent = summary;

    const url = "https://wa.me/" + artistConfig.whatsappNumber + "?text=" + encodeURIComponent(summary);
    whatsappLink.href = url;
    whatsappLink.classList.remove("disabled");
    whatsappLink.setAttribute("aria-disabled", "false");
  }

  function buildSummary(formData) {
    const lines = [
      "Hi " + artistConfig.name + ", I want to book a tattoo.",
      "",
      "Name: " + (formData.get("clientName") || "Not provided"),
      "Placement: " + (formData.get("placement") || "Not provided"),
      "Approx size: " + (formData.get("size") || "Not provided"),
      "Style: " + (formData.get("style") || "Not provided"),
      "Color / black ink: " + (formData.get("palette") || "Not provided"),
      "Budget comfort zone: " + (formData.get("budget") || "Not provided"),
      "Timing: " + (formData.get("timing") || "Not provided"),
      "",
      "Idea / vibe:",
      formData.get("idea") || "Not provided",
      "",
      "I can also send reference images."
    ];

    return lines.join("\n");
  }

  function showCopiedState(button) {
    const previousText = button.textContent;
    button.textContent = "Copied";
    button.classList.add("is-copied");

    window.setTimeout(function () {
      button.textContent = previousText;
      button.classList.remove("is-copied");
    }, 1400);
  }

  function copyWithFallback(text) {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "true");
    helper.style.position = "absolute";
    helper.style.left = "-9999px";
    document.body.appendChild(helper);
    helper.select();

    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(helper);
    }
  }

  function copyText(text, button) {
    if (!text) {
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        showCopiedState(button);
      });
      return;
    }

    copyWithFallback(text);
    showCopiedState(button);
  }

  accordionItems.forEach(function (item) {
    const trigger = item.querySelector(".faq-trigger");
    const panel = item.querySelector(".faq-panel");

    trigger.addEventListener("click", function () {
      const isOpen = item.classList.contains("open");

      accordionItems.forEach(function (otherItem) {
        otherItem.classList.remove("open");
        otherItem.querySelector(".faq-trigger").setAttribute("aria-expanded", "false");
        otherItem.querySelector(".faq-panel").style.maxHeight = "";
      });

      if (!isOpen) {
        item.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });
  });

  templateButtons.forEach(function (button, index) {
    button.addEventListener("click", function () {
      const text = templateTexts[index] ? templateTexts[index].textContent.trim() : "";
      copyText(text, button);
    });
  });

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(form);
      const summary = buildSummary(formData);
      setResult(summary);
    });
  }

  if (copySummaryButton) {
    copySummaryButton.addEventListener("click", function () {
      copyText(latestSummary || resultBox.textContent.trim(), copySummaryButton);
    });
  }

  if (workPrev && workNext && workTrack) {
    workPrev.addEventListener("click", function () {
      renderWorkCarousel(activeWorkIndex - 1);
    });

    workNext.addEventListener("click", function () {
      renderWorkCarousel(activeWorkIndex + 1);
    });

    workDots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        renderWorkCarousel(Number(dot.dataset.workDot));
      });
    });

    let touchStartX = 0;
    let touchEndX = 0;

    workCarousel.addEventListener("touchstart", function (event) {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });

    workCarousel.addEventListener("touchend", function (event) {
      touchEndX = event.changedTouches[0].clientX;
      const delta = touchEndX - touchStartX;

      if (Math.abs(delta) < 35) {
        return;
      }

      if (delta < 0) {
        renderWorkCarousel(activeWorkIndex + 1);
      } else {
        renderWorkCarousel(activeWorkIndex - 1);
      }
    }, { passive: true });

    renderWorkCarousel(0);
  }

  initializeLinks();
})();
