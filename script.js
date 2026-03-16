(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Dust particles ──────────────────────────────────
  // Hardcoded from Astro site's seeded PRNG (seed 42)
  const particleData = [
    { top: '12.9%', left: '57.0%', size: '2.8px', duration: '10.2s', delay: '4s' },
    { top: '45.3%', left: '15.7%', size: '2.1px', duration: '16.7s', delay: '10s' },
    { top: '50.0%', left: '62.8%', size: '4.6px', duration: '16.6s', delay: '6s' },
    { top: '17.6%', left: '90.5%', size: '2.3px', duration: '17.2s', delay: '9s' },
    { top: '21.2%', left: '54.5%', size: '3.7px', duration: '10.6s', delay: '9s' },
    { top: '19.0%', left: '79.6%', size: '4.5px', duration: '12.7s', delay: '1s' },
    { top: '53.4%', left: '79.7%', size: '2.1px', duration: '16.5s', delay: '7s' },
    { top: '57.7%', left: '67.7%', size: '3.1px', duration: '15.1s', delay: '7s' },
    { top: '45.5%', left: '13.8%', size: '5.0px', duration: '9.9s', delay: '4s' },
    { top: '74.2%', left: '58.4%', size: '2.4px', duration: '16.0s', delay: '4s' },
    { top: '29.5%', left: '6.7%', size: '2.6px', duration: '10.8s', delay: '3s' },
    { top: '91.0%', left: '22.3%', size: '4.6px', duration: '16.7s', delay: '6s' },
    { top: '33.3%', left: '16.6%', size: '3.0px', duration: '17.8s', delay: '1s' },
    { top: '77.5%', left: '44.0%', size: '4.8px', duration: '15.1s', delay: '3s' },
  ];

  // ── Mist instances ──────────────────────────────────
  const mistData = [
    { top: '45.4%', left: '54.8%', size: '386px', opacity: 0.78, animation: 'mist-drift-a 15.6s ease-in-out 3.7s infinite' },
    { top: '73.2%', left: '66.7%', size: '497px', opacity: 0.67, animation: 'mist-drift-b 17.2s ease-in-out 10.4s infinite' },
    { top: '-2.4%', left: '39.0%', size: '559px', opacity: 0.89, animation: 'mist-drift-c 19.6s ease-in-out 2.3s infinite' },
    { top: '28.0%', left: '-10.4%', size: '546px', opacity: 0.95, animation: 'mist-drift-a 20.0s ease-in-out 11.2s infinite' },
    { top: '1.9%', left: '23.7%', size: '373px', opacity: 0.89, animation: 'mist-drift-b 27.7s ease-in-out 12.0s infinite' },
    { top: '4.8%', left: '16.6%', size: '435px', opacity: 0.77, animation: 'mist-drift-c 25.8s ease-in-out 13.7s infinite' },
    { top: '49.8%', left: '21.7%', size: '509px', opacity: 0.69, animation: 'mist-drift-a 19.7s ease-in-out 0.2s infinite' },
    { top: '40.3%', left: '45.4%', size: '492px', opacity: 0.69, animation: 'mist-drift-b 22.3s ease-in-out 10.5s infinite' },
    { top: '8.5%', left: '77.1%', size: '420px', opacity: 0.73, animation: 'mist-drift-c 19.9s ease-in-out 14.0s infinite' },
    { top: '10.5%', left: '39.1%', size: '635px', opacity: 0.80, animation: 'mist-drift-a 26.9s ease-in-out 0.4s infinite' },
  ];

  if (!reducedMotion) {
    // Generate particles
    const particlesEl = document.getElementById('particles');
    if (particlesEl) {
      particleData.forEach((p) => {
        const span = document.createElement('span');
        span.style.cssText = `top:${p.top};left:${p.left};width:${p.size};height:${p.size};box-shadow:0 0 8px rgba(255,255,255,0.7);animation:dust-float ${p.duration} ease-in-out ${p.delay} infinite;`;
        particlesEl.appendChild(span);
      });
    }

    // Generate mist
    const mistEl = document.getElementById('mist');
    if (mistEl) {
      mistData.forEach((m) => {
        const img = document.createElement('img');
        img.src = 'assets/mist.webp';
        img.alt = '';
        img.width = 256;
        img.height = 256;
        img.decoding = 'async';
        img.style.cssText = `top:${m.top};left:${m.left};width:${m.size};height:${m.size};opacity:${m.opacity};animation:${m.animation};`;
        mistEl.appendChild(img);
      });
    }
  }

  // ── Cursor glow ───────────────────────────────────
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const glowEl = document.getElementById('cursor-glow');

  if (!isTouch && !reducedMotion && glowEl) {
    let rafId = null;
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!glowEl.classList.contains('active')) {
        glowEl.classList.add('active');
      }

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          glowEl.style.left = mouseX + 'px';
          glowEl.style.top = mouseY + 'px';
          rafId = null;
        });
      }
    });

    document.addEventListener('mouseleave', () => {
      glowEl.classList.remove('active');
    });
  }
})();
