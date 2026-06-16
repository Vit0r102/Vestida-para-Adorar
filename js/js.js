  /* ─── Navbar Scroll ─── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  /* ─── Mobile Menu ─── */
  function toggleMenu() {
    document.getElementById('mobile-menu').classList.toggle('open');
    document.body.style.overflow =
      document.getElementById('mobile-menu').classList.contains('open') ? 'hidden' : '';
  }

  /* ─── Intersection Observer: Reveal ─── */
  const revealEls = document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => observer.observe(el));

 

  /* ─── Button Ripple ─── */
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const r = document.createElement('span');
      r.classList.add('ripple-el');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      r.style.cssText = `
        width:${size}px;height:${size}px;
        left:${e.clientX - rect.left - size/2}px;
        top:${e.clientY - rect.top - size/2}px;
      `;
      this.appendChild(r);
      setTimeout(() => r.remove(), 600);
    });
  });

  /* ─── Floating Petals ─── */
  const petalContainer = document.getElementById('petals');
  const petalEmojis = ['🌸', '✿', '❀', '🌼', '✦'];
  function spawnPetal() {
    const p = document.createElement('div');
    p.className = 'petal';
    p.textContent = petalEmojis[Math.floor(Math.random() * petalEmojis.length)];
    p.style.left = Math.random() * 100 + 'vw';
    const dur = 8 + Math.random() * 10;
    const delay = Math.random() * 5;
    p.style.animation = `petal ${dur}s ${delay}s linear infinite`;
    p.style.fontSize = (0.7 + Math.random() * 0.6) + 'rem';
    p.style.opacity = '0';
    petalContainer.appendChild(p);
    setTimeout(() => p.remove(), (dur + delay + 1) * 1000);
  }
  // Spawn a few petals every few seconds
  for (let i = 0; i < 3; i++) spawnPetal();
  setInterval(() => {
    if (document.querySelectorAll('.petal').length < 6) spawnPetal();
  }, 3000);

  /* ─── Smooth anchor offset for fixed navbar ─── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = target.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
  });


  /* ─── Scroll Progress Bar ─── */
  const scrollProgress = document.getElementById('scroll-progress');
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = pct + '%';
  }, { passive: true });

  /* ─── Top Bar Message Rotation ─── */
  const topBarMsgs = [
    '✦ Vista-se para Adorar',
    '✦ Frete para todo o Brasil',
    '✦ Tamanhos 42 ao 50 — Para Cada Corpo',
    '✦ Moda que Honra a Deus',
    '✦ 5% de Desconto no Pix ✦',
  ];
  let tbIdx = 0;
  const tbEl = document.getElementById('top-bar-msg');
  if (tbEl) {
    setInterval(() => {
      tbEl.style.transition = 'opacity 0.4s, transform 0.4s';
      tbEl.style.opacity = '0';
      tbEl.style.transform = 'translateY(-8px)';
      setTimeout(() => {
        tbIdx = (tbIdx + 1) % topBarMsgs.length;
        tbEl.textContent = topBarMsgs[tbIdx];
        tbEl.style.transform = 'translateY(8px)';
        requestAnimationFrame(() => {
          tbEl.style.opacity = '1';
          tbEl.style.transform = 'translateY(0)';
        });
      }, 420);
    }, 3500);
  }

  /* ─── Animated Gold Divider Lines ─── */
  const goldLineObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        goldLineObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.gold-line-animated').forEach(el => goldLineObserver.observe(el));

  /* ─── Counter Animation for Stats ─── */
  function animateCount(el, target, duration = 1800) {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        el.textContent = target.toLocaleString('pt-BR') + '+';
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(start).toLocaleString('pt-BR') + '+';
      }
    }, 16);
  }
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const target = parseInt(e.target.getAttribute('data-target'));
        if (target) animateCount(e.target, target);
        counterObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

  /* ─── Subtle parallax on hero ornaments ─── */
  const heroOrnaments = document.querySelectorAll('.hero-ornament');
  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    heroOrnaments.forEach((el, i) => {
      const factor = i % 2 === 0 ? 0.08 : 0.05;
      el.style.transform = `translateY(${sy * factor}px)`;
    });
  }, { passive: true });

  /* ─── Benefit icon micro-interaction ─── */
  document.querySelectorAll('.benefit-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const icon = card.querySelector('.benefit-icon');
      if (icon) {
        icon.style.transition = 'transform 0.35s cubic-bezier(.22,1,.36,1)';
        icon.style.transform = 'scale(1.15) rotate(8deg)';
      }
    });
    card.addEventListener('mouseleave', () => {
      const icon = card.querySelector('.benefit-icon');
      if (icon) {
        icon.style.transform = 'scale(1) rotate(0deg)';
      }
    });
  });

  /* ─── Testimonial card entrance stagger ─── */
  document.querySelectorAll('.testimonial-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.12}s`;
  });

  /* ─── Newsletter Form ─── */
  const newsletterBtn = document.querySelector('.btn-newsletter');
  if (newsletterBtn) newsletterBtn.addEventListener('click', function() {
    const input = document.querySelector('.newsletter-input');
    if (input.value && input.value.includes('@')) {
      this.textContent = 'Cadastrado ✓';
      this.style.background = '#f0fdf4';
      this.style.color = '#16a34a';
      input.value = '';
      input.placeholder = 'Obrigada! Fique de olho no seu e-mail 💌';
      setTimeout(() => {
        this.textContent = 'Quero Receber ♡';
        this.style.background = '';
        this.style.color = '';
        input.placeholder = 'Seu melhor e-mail';
      }, 4000);
    } else {
      input.style.borderColor = 'rgba(255,150,150,0.8)';
      input.placeholder = 'Digite um e-mail válido';
      setTimeout(() => {
        input.style.borderColor = '';
        input.placeholder = 'Seu melhor e-mail';
      }, 2500);
    }
  });
