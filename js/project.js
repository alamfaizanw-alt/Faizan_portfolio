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
      // Single item — no carousel chrome needed
      const s = slides[0];
      carouselHTML = `<div class="project-media">${
        s.type === 'video'
          ? `<iframe src="${s.src}" height="420" frameborder="0" allowfullscreen></iframe>`
          : `<img src="${s.src}" alt="${p.title}">`
      }</div>`;
    } else if (slides.length > 1) {
      const slideHTML = slides.map(s =>
        `<div class="carousel-slide">${
          s.type === 'video'
            ? `<iframe src="${s.src}" frameborder="0" allowfullscreen></iframe>`
            : `<img src="${s.src}" alt="${p.title}" loading="lazy">`
        }</div>`
      ).join('');
      const dotsHTML = slides.map((_,i) =>
        `<div class="carousel-dot${i===0?' active':''}" data-i="${i}"></div>`
      ).join('');
      carouselHTML = `<div class="carousel" id="proj-carousel">
        <div class="carousel-track" id="carousel-track">${slideHTML}</div>
        <button class="carousel-btn carousel-prev" id="c-prev">&#8592;</button>
        <button class="carousel-btn carousel-next" id="c-next">&#8594;</button>
        <div class="carousel-count" id="c-count">1 / ${slides.length}</div>
      </div>
      <div class="carousel-dots" id="carousel-dots">${dotsHTML}</div>`;
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
      let current    = 0;
      let autoTimer  = null;
      let resumeTimer = null;
      const track = document.getElementById('carousel-track');
      const dots  = document.querySelectorAll('.carousel-dot');
      const count = document.getElementById('c-count');

      // Just moves the carousel — no timer logic here
      function goTo(n) {
        current = (n + slides.length) % slides.length;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((d,i) => d.classList.toggle('active', i === current));
        count.textContent = `${current + 1} / ${slides.length}`;
      }

      // Starts indefinite 4s cycle from current position
      function startAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => goTo(current + 1), 4000);
      }

      // Stops auto-cycle and schedules resume after 10s
      function pauseAndResume() {
        clearInterval(autoTimer);
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(startAuto, 10000);
      }

      // Manual controls — move then schedule resume
      document.getElementById('c-prev').addEventListener('click', () => { goTo(current - 1); pauseAndResume(); });
      document.getElementById('c-next').addEventListener('click', () => { goTo(current + 1); pauseAndResume(); });
      dots.forEach(d => d.addEventListener('click', () => { goTo(parseInt(d.dataset.i)); pauseAndResume(); }));

      // Hover — pause immediately, resume 10s after mouse leaves
      const carousel = document.getElementById('proj-carousel');
      carousel.addEventListener('mouseenter', () => {
        clearInterval(autoTimer);
        clearTimeout(resumeTimer);
      });
      carousel.addEventListener('mouseleave', () => {
        resumeTimer = setTimeout(startAuto, 10000);
      });

      startAuto();
    }
  } catch(e) {
    document.getElementById('project-content').innerHTML = '<div class="empty-state"><p>Failed to load.</p><a href="work.html">Back</a></div>';
  }
})();
