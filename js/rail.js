/**
 * rail.js — horizontal project rail controls
 * Arrows, dot indicators, drag-to-scroll. Native swipe handles touch.
 * Call initRail(gridEl) after cards are rendered.
 */
function initRail(grid) {
  if (!grid) return;
  const cards = [...grid.querySelectorAll('.project-card')];
  if (!cards.length) return;

  // Remove any previous controls (re-init on filter change)
  const wrap = grid.parentElement;
  wrap.querySelector('.rail-nav')?.remove();
  if (cards.length < 2) return;              // nothing to navigate

  const ARROW_L = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>`;
  const ARROW_R = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>`;

  const nav = document.createElement('div');
  nav.className = 'rail-nav';
  nav.innerHTML = `
    <button class="rail-btn" data-dir="-1" aria-label="Previous project">${ARROW_L}</button>
    <button class="rail-btn" data-dir="1" aria-label="Next project">${ARROW_R}</button>
    <div class="rail-dots">${cards.map((_, i) =>
      `<button class="rail-dot${i === 0 ? ' active' : ''}" data-i="${i}" aria-label="Project ${i + 1}"></button>`
    ).join('')}</div>
    <span class="rail-count"><span class="rail-cur">1</span> / ${cards.length}</span>`;
  grid.insertAdjacentElement('afterend', nav);

  const dots = [...nav.querySelectorAll('.rail-dot')];
  const btns = [...nav.querySelectorAll('.rail-btn')];
  const cur  = nav.querySelector('.rail-cur');

  // Which card is nearest the centre of the viewport
  function activeIndex() {
    const mid = grid.scrollLeft + grid.clientWidth / 2;
    let best = 0, bestD = Infinity;
    cards.forEach((c, i) => {
      const d = Math.abs((c.offsetLeft + c.offsetWidth / 2) - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  function scrollToCard(i) {
    const c = cards[Math.max(0, Math.min(cards.length - 1, i))];
    grid.scrollTo({
      left: c.offsetLeft - (grid.clientWidth - c.offsetWidth) / 2,
      behavior: 'smooth'
    });
  }

  function sync() {
    const i = activeIndex();
    dots.forEach((d, n) => d.classList.toggle('active', n === i));
    cur.textContent = i + 1;
    btns[0].disabled = grid.scrollLeft <= 2;
    btns[1].disabled = grid.scrollLeft >= grid.scrollWidth - grid.clientWidth - 2;
  }

  btns.forEach(b => b.addEventListener('click', () =>
    scrollToCard(activeIndex() + Number(b.dataset.dir))));
  dots.forEach(d => d.addEventListener('click', () =>
    scrollToCard(Number(d.dataset.i))));

  let raf;
  grid.addEventListener('scroll', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = null; sync(); });
  }, { passive: true });

  // ── Drag to scroll (desktop) ──
  let down = false, startX = 0, startScroll = 0, moved = 0;
  grid.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') return;      // let native touch scrolling work
    down = true; moved = 0;
    startX = e.clientX; startScroll = grid.scrollLeft;
    grid.classList.add('dragging');
  });
  grid.addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - startX;
    moved = Math.abs(dx);
    grid.scrollLeft = startScroll - dx;
  });
  function endDrag() {
    if (!down) return;
    down = false;
    grid.classList.remove('dragging');
    scrollToCard(activeIndex());                // snap to nearest
  }
  grid.addEventListener('pointerup', endDrag);
  grid.addEventListener('pointercancel', endDrag);
  grid.addEventListener('pointerleave', endDrag);
  // Suppress the click that follows a real drag
  grid.addEventListener('click', e => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);

  // Keyboard
  grid.setAttribute('tabindex', '0');
  grid.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollToCard(activeIndex() + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollToCard(activeIndex() - 1); }
  });

  sync();
  window.addEventListener('resize', sync);
}
