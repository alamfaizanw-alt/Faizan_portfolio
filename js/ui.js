/**
 * ui.js — Premium UI layer
 * Custom cursor, scroll progress, page reveal
 * Loaded on all pages
 */
(function () {

  // ── Scroll progress bar ────────────────────────────────────────────
  const bar = document.getElementById('scroll-progress');
  if (bar) {
    const tick = () => {
      const pct = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
      bar.style.transform = `scaleX(${Math.min(pct, 1)})`;
    };
    window.addEventListener('scroll', tick, { passive: true });
    tick();
  }

  // ── Custom cursor — desktop only ──────────────────────────────────
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

  const dot  = document.createElement('div'); dot.id  = 'c-dot';
  const rect = document.createElement('div'); rect.id = 'c-rect';
  document.body.append(dot, rect);

  let mx = -200, my = -200, rx = -200, ry = -200, raf;

  // Dot follows exactly
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.cssText = `left:${mx}px;top:${my}px;opacity:1`;
    if (!raf) raf = requestAnimationFrame(lerpRect);
  }, { passive: true });

  // Square reticle lags behind — the precision engineering touch
  function lerpRect() {
    raf = null;
    rx += (mx - rx) * 0.1;
    ry += (my - ry) * 0.1;
    rect.style.cssText = `left:${rx}px;top:${ry}px;opacity:1`;
    if (Math.abs(mx - rx) > 0.2 || Math.abs(my - ry) > 0.2) {
      raf = requestAnimationFrame(lerpRect);
    }
  }

  // Expand reticle on interactive elements
  const HOVER_SEL = 'a,button,.project-card,.filter-pill,.skill-tag,.social-link,.btn,.carousel-btn,.forge-tab,.proj-list-item,.tl-admin-item';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(HOVER_SEL)) {
      dot.classList.add('on-hover');
      rect.classList.add('on-hover');
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(HOVER_SEL)) {
      dot.classList.remove('on-hover');
      rect.classList.remove('on-hover');
    }
  });

  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; rect.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; rect.style.opacity = '1'; });

})();
