/* ==========================================================================
   VESTIDA PARA ADORAR — Micro-interações (não altera lógica do negócio)
   ========================================================================== */
'use strict';

(function () {
  // ---------- Ripple em botões ----------
  const rippleTargets = '.btn, .icon-btn, .pagination__btn, .sidebar__link, .bottom-nav__item';
  document.addEventListener('click', (e) => {
    const el = e.target.closest(rippleTargets);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const r = document.createElement('span');
    r.className = 'ripple';
    r.style.width = r.style.height = size + 'px';
    r.style.left = (e.clientX - rect.left - size / 2) + 'px';
    r.style.top = (e.clientY - rect.top - size / 2) + 'px';
    const prevPos = getComputedStyle(el).position;
    if (prevPos === 'static') el.style.position = 'relative';
    el.appendChild(r);
    setTimeout(() => r.remove(), 620);
  });

  // ---------- Reveal on scroll ----------
  const applyReveal = () => {
    const selectors = [
      '.stat-card', '.info-panel', '.panel', '.product-card',
      '.page-header', '.overview-grid > *', '.stock-grid > *',
    ];
    const nodes = document.querySelectorAll(selectors.join(','));
    nodes.forEach((n, i) => {
      if (n.hasAttribute('data-reveal')) return;
      n.setAttribute('data-reveal', '');
      n.style.setProperty('--reveal-delay', Math.min(i * 40, 400) + 'ms');
    });

    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });
    nodes.forEach((n) => io.observe(n));
  };

  // ---------- Count-up para stat values ----------
  const animateCount = (el) => {
    const raw = (el.textContent || '').trim();
    const match = raw.match(/^([R$\s]*)([\d.,]+)(.*)$/);
    if (!match) return;
    const prefix = match[1];
    const suffix = match[3];
    const isCurrency = /R\$/.test(prefix);
    const numeric = parseFloat(match[2].replace(/\./g, '').replace(',', '.'));
    if (!isFinite(numeric)) return;

    const duration = 900;
    const start = performance.now();
    const format = (n) => {
      if (isCurrency) {
        return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      if (raw.includes(',')) return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return Math.round(n).toString();
    };
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = format(numeric * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = (isCurrency ? '' : prefix) + format(numeric) + suffix;
    };
    requestAnimationFrame(step);
  };

  const bootCountUps = () => {
    const targets = document.querySelectorAll(
      '.stat-card__value, .value-panel__amount, #totalStockValue'
    );
    targets.forEach((el) => {
      if (el.dataset.counted === '1') return;
      el.dataset.counted = '1';
      animateCount(el);
    });
  };

  // ---------- Init ----------
  const init = () => {
    applyReveal();
    // pequeno delay para permitir que a página monte os valores
    setTimeout(bootCountUps, 120);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Reobserva quando conteúdo dinâmico é injetado (tabelas, cards)
  const mo = new MutationObserver(() => {
    applyReveal();
  });
  mo.observe(document.body, { childList: true, subtree: true });
})();
