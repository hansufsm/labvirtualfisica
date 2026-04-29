/* ============================================
   UI.JS – Navegação, bottom sheets, toast, accordion
   ============================================ */

const UI = (() => {
  let _toastTimer = null;
  let _currentSection = 'experiment';

  /* ---- Seções mapeadas ---- */
  const ALL_SECTIONS = [
    'experiment', 'comparison', 'missions', 'journal',
    'achievements', 'calculator', 'applications', 'settings'
  ];

  /* ---- Navegação ---- */
  function navigateTo(sectionId) {
    _currentSection = sectionId;

    /* Esconder todas as seções */
    ALL_SECTIONS.forEach(id => {
      const el = document.getElementById(`section-${id}`);
      if (el) el.hidden = true;
    });

    /* Mostrar seção alvo */
    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
      target.hidden = false;
      target.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    /* Atualizar bottom-nav items */
    document.querySelectorAll('.bottom-nav-item[data-section]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === sectionId);
    });

    /* Atualizar desktop-nav buttons */
    document.querySelectorAll('.desktop-nav-btn[data-section]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === sectionId);
    });

    /* Atualizar gráficos quando seção fica visível */
    if (sectionId === 'comparison') {
      if (typeof Charts !== 'undefined') Charts.atualizarGraficoComparativo();
    }

    /* Scroll para o topo da página */
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---- Sheets ---- */
  function openSheet(sheetId) {
    const overlay = document.getElementById('sheetOverlay');
    const sheet   = document.getElementById(`sheet-${sheetId}`);
    if (!sheet) return;

    /* Fechar outras sheets primeiro */
    closeAllSheets(false);

    overlay.classList.add('visible');
    sheet.classList.add('open');
    document.body.style.overflow = 'hidden';

    /* Foco na sheet para acessibilidade */
    sheet.setAttribute('aria-hidden', 'false');
    const firstFocusable = sheet.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) setTimeout(() => firstFocusable.focus(), 350);
  }

  function closeAllSheets(restoreScroll = true) {
    document.querySelectorAll('.bottom-sheet').forEach(s => {
      s.classList.remove('open');
      s.setAttribute('aria-hidden', 'true');
    });
    const overlay = document.getElementById('sheetOverlay');
    if (overlay) overlay.classList.remove('visible');
    if (restoreScroll) document.body.style.overflow = '';
  }

  /* ---- Toast ---- */
  function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    if (_toastTimer) clearTimeout(_toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    _toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  /* ---- Accordion ---- */
  function toggleAccordion(btn) {
    const body      = btn.nextElementSibling;
    const isOpen    = body.classList.contains('open');
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';

    /* Para accordions de nível raiz, fechar outros do mesmo contêiner */
    const parentContainer = btn.closest('.accordion-wrap, .accordion-body');
    if (parentContainer) {
      parentContainer.querySelectorAll('.accordion-header, .sub-accordion-header').forEach(h => {
        if (h !== btn) {
          h.setAttribute('aria-expanded', 'false');
          const b = h.nextElementSibling;
          if (b) b.classList.remove('open');
        }
      });
    }

    if (isOpen || isExpanded) {
      body.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    } else {
      body.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      /* Marcar como explorada para conquista de Termologia */
      if (typeof APP !== 'undefined') {
        APP.explorouTermica = true;
        if (typeof _verificarConquistas === 'function') _verificarConquistas();
      }
    }
  }

  /* ---- Modo escuro ---- */
  function toggleDarkMode() {
    if (typeof APP !== 'undefined') {
      APP.darkMode = !APP.darkMode;
      document.body.classList.toggle('dark-mode', APP.darkMode);
      showToast(APP.darkMode ? '🌙 Modo escuro ativado' : '☀️ Modo claro ativado');
    }
  }

  /* ---- Fechar sheet ao pressionar Escape ---- */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllSheets();
  });

  return { navigateTo, openSheet, closeAllSheets, showToast, toggleAccordion, toggleDarkMode };
})();
