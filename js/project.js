// Mobile nav
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});
document.querySelectorAll('#year').forEach(el => el.textContent = new Date().getFullYear());

(async () => {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.href = 'work.html'; return; }

  try {
    const data = await readContent();
    const p    = (data.projects || []).find(x => x.id === id);
    const init = (data.bio?.name || 'FA').split(' ').map(n => n[0]).join('');
    document.getElementById('nav-logo').textContent    = init;
    document.getElementById('footer-name').textContent = data.bio?.name || '';

    if (!p) {
      document.getElementById('project-content').innerHTML =
        '<div class="empty-state"><h3>Project not found.</h3><a href="work.html" class="btn" style="margin-top:1.5rem;">Back to Work</a></div>';
      return;
    }

    document.title = `${p.title} — Portfolio`;

    // Build media carousel — combine all videos and images
    const videos  = p.videos?.length ? p.videos : (p.video ? [p.video] : []);
    const uploaded = p.media || [];
    const urlImgs  = p.imageUrls || [];
    const allImgs  = [...uploaded, ...urlImgs].filter(Boolean);
    const fallback = allImgs.length ? allImgs : (p.thumbnail ? [p.thumbnail] : []);

    // Build slides array: videos first, then images
    const slides = [
      ...videos.map(v => ({ type: 'video', src: v })),
      ...fallback.map(u => ({ type: 'image', src: u }))
    ];

    let carouselHTML = '';
    if (slides.length === 1) {
      const s = slides[0];
      carouselHTML = `<div class="carousel"><div class="carousel-frame">
        <div class="carousel-slide active">${
          s.type === 'video'
            ? `<iframe src="${s.src}" frameborder="0" allowfullscreen></iframe>`
            : `<img src="${s.src}" alt="${p.title}">`
        }</div>
      </div></div>`;
    } else if (slides.length > 1) {
      const PREV_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>`;
      const NEXT_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>`;
      const slideHTML = slides.map((s,i) =>
        `<div class="carousel-slide${i===0?' active':''}">${
          s.type === 'video'
            ? `<iframe src="${s.src}" frameborder="0" allowfullscreen></iframe>`
            : `<img src="${s.src}" alt="${p.title}" loading="lazy">`
        }</div>`
      ).join('');
      const dotsHTML = slides.map((_,i) =>
        `<button class="carousel-dot${i===0?' active':''}" data-i="${i}" aria-label="Slide ${i+1}"></button>`
      ).join('');
      carouselHTML = `<div class="carousel" id="proj-carousel">
        <div class="carousel-frame">
          ${slideHTML}
          <button class="c-prev" id="c-prev" aria-label="Previous">${PREV_SVG}</button>
          <button class="c-next" id="c-next" aria-label="Next">${NEXT_SVG}</button>
          <div class="carousel-dots" id="carousel-dots">${dotsHTML}</div>
        </div>
      </div>`;
    }

    // Links
    const links = [];
    if (p.links?.github) links.push(`<a href="${p.links.github}" class="btn" target="_blank">GitHub &rarr;</a>`);
    if (p.links?.live)   links.push(`<a href="${p.links.live}" class="btn btn-ghost" target="_blank">Live Demo &rarr;</a>`);

    document.getElementById('project-content').innerHTML = `
      <a href="work.html" class="back-btn">Back to Work</a>
      <div class="pd-cat">${p.category||''}</div>
      <h1 class="pd-title">${p.title}</h1>
      <div class="pd-tags">${(p.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div>

      ${p.summary ? `<div class="cs-block">
        <div class="cs-label">Overview</div>
        <p class="cs-text">${p.summary}</p>
      </div>` : ''}

      ${p.challenge ? `<div class="cs-block">
        <div class="cs-label">The Challenge</div>
        <p class="cs-text">${p.challenge.replace(/\n/g,'<br>')}</p>
      </div>` : ''}

      ${p.approach ? `<div class="cs-block">
        <div class="cs-label">My Approach</div>
        <p class="cs-text">${p.approach.replace(/\n/g,'<br>')}</p>
        ${carouselHTML}
      </div>` : carouselHTML}

      ${p.outcome ? `<div class="cs-block">
        <div class="cs-label">Outcome</div>
        <div class="cs-outcome-text">${p.outcome.replace(/\n/g,'<br>')}</div>
      </div>` : ''}

      ${links.length ? `<div class="project-links">${links.join('')}</div>` : ''}
    `;

    // Init carousel
    if (slides.length > 1) {
      let current     = 0;
      let autoTimer   = null;
      let resumeTimer = null;
      const slideEls  = document.querySelectorAll('.carousel-slide');
      const dots      = document.querySelectorAll('.carousel-dot');

      function goTo(n) {
        const prev = slideEls[current];
        current = (n + slides.length) % slides.length;
        const next = slideEls[current];

        // Exit current
        prev.classList.remove('active');
        prev.classList.add('exit');
        prev.addEventListener('animationend', () => prev.classList.remove('exit'), { once: true });

        // Enter next
        next.classList.add('active');

        // Dots
        dots.forEach((d,i) => d.classList.toggle('active', i === current));
      }

      function startAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => goTo(current + 1), 4000);
      }

      function pauseAndResume() {
        clearInterval(autoTimer);
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(startAuto, 10000);
      }

      document.getElementById('c-prev').addEventListener('click', () => { goTo(current - 1); pauseAndResume(); });
      document.getElementById('c-next').addEventListener('click', () => { goTo(current + 1); pauseAndResume(); });
      dots.forEach(d => d.addEventListener('click', () => { goTo(parseInt(d.dataset.i)); pauseAndResume(); }));

      const frame = document.querySelector('#proj-carousel .carousel-frame');
      frame.addEventListener('mouseenter', () => { clearInterval(autoTimer); clearTimeout(resumeTimer); });
      frame.addEventListener('mouseleave', () => { resumeTimer = setTimeout(startAuto, 10000); });

      startAuto();
    }
  } catch(e) {
    document.getElementById('project-content').innerHTML = '<div class="empty-state"><p>Failed to load.</p><a href="work.html">Back</a></div>';
  }
})();
