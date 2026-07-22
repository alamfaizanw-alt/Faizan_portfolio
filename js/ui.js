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

/* ── Scroll-driven hoist rig = the scrollbar ─────────────────────────
   Vertical belt & pulley on the right edge. Replaces the native
   scrollbar: the crate is the thumb — click the rail to jump,
   drag the crate to scroll. Pulleys peek in from the edges.
   Desktop only. */
(function () {
  if (window.matchMedia('(max-width:900px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const NS = 'http://www.w3.org/2000/svg';
  const rig = document.createElement('div');
  rig.id = 'scroll-rig';
  document.body.appendChild(rig);

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.1');
  svg.setAttribute('stroke-linecap', 'round');
  rig.appendChild(svg);

  const R = 20, CX = 28, BL = 8, BR = 48; // pulley radius, center x, belt left/right x
  let H = 0, topY = 2, botY = 0, loadTop = 0, loadBot = 0;

  const beltBand = mkPath(); beltBand.setAttribute('stroke-width', '3.4'); beltBand.setAttribute('opacity', '0.25');
  const beltLine = mkPath(); beltLine.setAttribute('stroke-width', '0.9');
  const beltDash = mkPath(); beltDash.setAttribute('stroke-width', '1.7'); beltDash.setAttribute('stroke-dasharray', '6 9'); beltDash.setAttribute('opacity', '0.6');
  const gTop = mkPulley(), gBot = mkPulley(), gLoad = mkLoad();
  svg.append(beltBand, beltLine, beltDash, gTop, gBot, gLoad);

  function mkPath() {
    const p = document.createElementNS(NS, 'path');
    svg.appendChild(p); return p;
  }
  function mkPulley() {
    const g = document.createElementNS(NS, 'g');
    const r4 = R - 4, d = r4 * 0.707;
    g.innerHTML = `
      <circle r="${R}"/><circle r="${r4}" stroke-width="0.7"/>
      <line x1="0" y1="${-r4}" x2="0" y2="${r4}" stroke-width="1.2"/>
      <line x1="${-r4}" y1="0" x2="${r4}" y2="0" stroke-width="1.2"/>
      <line x1="${-d}" y1="${-d}" x2="${d}" y2="${d}" stroke-width="1.2"/>
      <line x1="${-d}" y1="${d}" x2="${d}" y2="${-d}" stroke-width="1.2"/>
      <circle r="5"/><circle r="2" opacity="0.6"/>`;
    return g;
  }
  function mkLoad() {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'rig-load');
    g.innerHTML = `
      <line x1="0" y1="0" x2="0" y2="7" stroke-width="1"/>
      <path d="M -2.5 9 A 2.5 2.5 0 1 1 2.5 9 L 2.5 7 L -2.5 7 Z" stroke-width="0.9"/>
      <rect x="-10" y="12" width="20" height="17" rx="1"/>
      <line x1="-10" y1="18" x2="10" y2="18" stroke-width="0.7"/>
      <line x1="-6" y1="12" x2="-10" y2="18" stroke-width="0.6" opacity="0.7"/>
      <line x1="0" y1="12" x2="-5" y2="18" stroke-width="0.6" opacity="0.7"/>
      <line x1="6" y1="12" x2="1" y2="18" stroke-width="0.6" opacity="0.7"/>
      <line x1="-7" y1="22" x2="7" y2="22" stroke-width="0.6" opacity="0.5"/>
      <line x1="-7" y1="25" x2="7" y2="25" stroke-width="0.6" opacity="0.5"/>`;
    return g;
  }

  function layout() {
    H = rig.clientHeight;
    botY = H - 2;                       // pulleys peek from top & bottom edges
    loadTop = topY + R + 14;
    loadBot = botY - R - 46;
    svg.setAttribute('viewBox', `0 0 56 ${H}`);
    svg.setAttribute('width', '56');
    svg.setAttribute('height', H);
    const d = `M ${BL} ${topY} A ${R} ${R} 0 0 1 ${BR} ${topY} L ${BR} ${botY} A ${R} ${R} 0 0 1 ${BL} ${botY} Z`;
    beltBand.setAttribute('d', d);
    beltLine.setAttribute('d', d);
    beltDash.setAttribute('d', d);
    update();
  }

  function scrollMax() {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  function update() {
    const pct = Math.min(1, window.scrollY / scrollMax());
    const travel = window.scrollY * 0.55;
    const deg = -(travel / R) * (180 / Math.PI);
    gTop.setAttribute('transform', `translate(${CX},${topY}) rotate(${deg.toFixed(1)})`);
    gBot.setAttribute('transform', `translate(${CX},${botY}) rotate(${deg.toFixed(1)})`);
    beltDash.setAttribute('stroke-dashoffset', travel.toFixed(1));
    const y = loadBot - (loadBot - loadTop) * pct;
    gLoad.setAttribute('transform', `translate(${BL},${y.toFixed(1)})`);
  }

  // ── Scrollbar behaviour: click to jump, drag to scroll ─────────────
  function yToScroll(clientY) {
    const rectTop = rig.getBoundingClientRect().top;
    const y = clientY - rectTop;
    // Invert: load at BOTTOM = scroll 0 (top of page), load at TOP = scroll max
    const pct = 1 - (y - loadTop) / (loadBot - loadTop);
    return Math.min(1, Math.max(0, pct)) * scrollMax();
  }

  let dragging = false;
  rig.addEventListener('pointerdown', e => {
    dragging = true;
    rig.setPointerCapture(e.pointerId);
    window.scrollTo({ top: yToScroll(e.clientY), behavior: 'auto' });
    e.preventDefault();
  });
  rig.addEventListener('pointermove', e => {
    if (dragging) window.scrollTo({ top: yToScroll(e.clientY), behavior: 'auto' });
  });
  rig.addEventListener('pointerup', () => { dragging = false; });
  rig.addEventListener('pointercancel', () => { dragging = false; });

  window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', layout);
  new ResizeObserver(layout).observe(document.body);
  layout();
})();
