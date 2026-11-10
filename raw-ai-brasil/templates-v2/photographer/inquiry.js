/* =====================================================================
   RAW AI — Inquiry form (shared by the USA templates: event-planner,
   photographer, dj). Reads SITE.inquiry (config.js) and builds a form
   whose answers become a ready-to-send WhatsApp message.

   SITE.inquiry = {
     fields: [ { key, label, type: 'chips' | 'text' | 'date', options: [...], placeholder } ],
     message: 'Hi {nome}! ... {name} ... {key} ...'   // {name} = visitor, {key} = field answers
   }
   Markup: <form id="leadForm"> with #leadName, #leadNameError, #leadFields, #leadPreview, #leadSend.
   You do NOT need to edit this file: edit config.js.
   ===================================================================== */
(function () {
  'use strict';
  var T = window.TEMPLATE;
  var form = document.getElementById('leadForm');
  var cfg = T && T.site && T.site.inquiry;
  if (!form || !cfg) return;

  var nameInput = document.getElementById('leadName');
  var error = document.getElementById('leadNameError');
  var holder = document.getElementById('leadFields');
  var preview = document.getElementById('leadPreview');
  var send = document.getElementById('leadSend');
  var answers = {};

  function chips(field) {
    var fieldset = document.createElement('fieldset');
    fieldset.className = 'chips';
    var legend = document.createElement('legend');
    legend.textContent = field.label;
    var box = document.createElement('div');
    var options = (field.options || []).map(function (o) { return T.fill(o); });
    answers[field.key] = options[0] || '';
    options.forEach(function (option, index) {
      var label = document.createElement('label');
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = field.key;
      input.value = option;
      input.checked = index === 0;
      input.addEventListener('change', function () { answers[field.key] = option; update(); });
      var span = document.createElement('span');
      span.textContent = option;
      label.appendChild(input);
      label.appendChild(span);
      box.appendChild(label);
    });
    fieldset.appendChild(legend);
    fieldset.appendChild(box);
    return fieldset;
  }

  function text(field) {
    var label = document.createElement('label');
    label.className = 'field';
    label.textContent = field.label;
    var input = document.createElement('input');
    input.type = field.type === 'date' ? 'date' : 'text';
    input.maxLength = 80;
    if (field.placeholder) input.placeholder = field.placeholder;
    answers[field.key] = '';
    input.addEventListener('input', function () { answers[field.key] = input.value.trim(); update(); });
    label.appendChild(input);
    return label;
  }

  (cfg.fields || []).forEach(function (field) {
    holder.appendChild(field.type === 'chips' ? chips(field) : text(field));
  });

  function message() {
    var raw = String(cfg.message || 'Hi {nome}! My name is {name}.');
    return raw.replace(/\{(\w+)\}/g, function (match, key) {
      if (key === 'name') return nameInput.value.trim() || '...';
      if (Object.prototype.hasOwnProperty.call(answers, key)) return answers[key] || '(not sure yet)';
      return match; // {nome}, {cidade}... are filled by the engine
    });
  }

  function update() {
    var body = message();
    preview.textContent = T.fill(body);
    send.href = T.waLink(body);
  }

  form.addEventListener('submit', function (event) { event.preventDefault(); });
  nameInput.addEventListener('input', function () {
    if (nameInput.value.trim()) { error.hidden = true; nameInput.removeAttribute('aria-invalid'); }
    update();
  });
  // Real link (not window.open) so it works inside the Instagram / Facebook browser.
  send.addEventListener('click', function (event) {
    if (nameInput.value.trim()) return;
    event.preventDefault();
    error.hidden = false;
    nameInput.setAttribute('aria-invalid', 'true');
    nameInput.focus();
  });
  update();
})();
