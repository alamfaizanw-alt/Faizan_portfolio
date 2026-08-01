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

    // Normalize any YouTube URL format (share, watch, embed, typos) to a working embed URL
    function normalizeVideo(url) {
      if (!url) return '';
      const u = url.trim();
      // Try to find an 11-char YouTube video ID in any common format
      const m = u.match(/(?:youtu\.be\/|watch\?v=|embed\/?|shorts\/)([A-Za-z0-9_-]{11})/) ||
                u.match(/([A-Za-z0-9_-]{11})(?:\?|&|$)/);
      return m ? `https://www.youtube.com/embed/${m[1]}?enablejsapi=1&playsinline=1&rel=0` : u;
    }

    // Build media carousel — combine all videos and images
    const videos  = (p.videos?.length ? p.videos : (p.video ? [p.video] : [])).map(normalizeVideo).filter(Boolean);
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
      const s0 = slides[0];
      carouselHTML = `<div class="media-rail-wrap"><div class="media-rail single">
        <div class="media-slide">${
          s0.type === 'video'
            ? `<iframe src="${s0.src}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen></iframe>`
            : `<img src="${s0.src}" alt="${p.title}">`
        }</div>
      </div></div>`;
    } else if (slides.length > 1) {
      const slideHTML = slides.map(sl =>
        `<div class="media-slide">${
          sl.type === 'video'
            ? `<iframe src="${sl.src}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen></iframe>`
            : `<img src="${sl.src}" alt="${p.title}" loading="lazy">`
        }</div>`
      ).join('');
      carouselHTML = `<div class="media-rail-wrap" id="media-wrap">
        <div class="media-rail" id="media-rail">${slideHTML}</div>
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

    // ── Media rail — same interaction model as the project rails ──
    if (slides.length > 1) {
      const rail  = document.getElementById('media-rail');
      const wrap  = document.getElementById('media-wrap');
      const items = [...rail.querySelectorAll('.media-slide')];

      const AL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>`;
      const AR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>`;
      wrap.insertAdjacentHTML('beforeend',
        `<button class="rail-btn" data-dir="-1" aria-label="Previous">${AL}</button>` +
        `<button class="rail-btn" data-dir="1" aria-label="Next">${AR}</button>`);

      const nav = document.createElement('div');
      nav.className = 'rail-nav';
      nav.innerHTML =
        `<div class="rail-dots">` +
        items.map((_, i) => `<button class="rail-dot${i===0?' active':''}" data-i="${i}" aria-label="Item ${i+1}"></button>`).join('') +
        `</div><span class="rail-count"><span class="rail-cur">1</span> / ${items.length}</span>`;
      wrap.insertAdjacentElement('afterend', nav);

      const dots = [...nav.querySelectorAll('.rail-dot')];
      const btns = [...wrap.querySelectorAll('.rail-btn')];
      const cur  = nav.querySelector('.rail-cur');
      let last = 0, autoTimer = null, resumeTimer = null;

      function sizeArrows() {
        const h = items[0].getBoundingClientRect().height;
        btns.forEach(b => { b.style.height = h + 'px'; });
      }
      function activeIndex() {
        const l = rail.scrollLeft;
        let best = 0, bestD = Infinity;
        items.forEach((c, i) => {
          const d = Math.abs((c.offsetLeft - rail.offsetLeft) - l);
          if (d < bestD) { bestD = d; best = i; }
        });
        return best;
      }
      function goTo(i) {
        const c = items[Math.max(0, Math.min(items.length - 1, i))];
        rail.scrollTo({ left: c.offsetLeft - rail.offsetLeft, behavior: 'smooth' });
      }
      // Kill audio/video on any slide we leave
      function stopMedia(el) {
        const f = el && el.querySelector('iframe');
        if (!f) return;
        try { f.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*'); } catch (err) {}
        const src = f.src; f.src = src;
      }
      function sync() {
        const i = activeIndex();
        if (i !== last) { stopMedia(items[last]); last = i; }
        dots.forEach((d, n) => d.classList.toggle('active', n === i));
        cur.textContent = i + 1;
        btns[0].disabled = rail.scrollLeft <= 2;
        btns[1].disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
      }
      function startAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => {
          const i = activeIndex();
          goTo(i >= items.length - 1 ? 0 : i + 1);
        }, 4000);
      }
      function pauseAndResume() {
        clearInterval(autoTimer); clearTimeout(resumeTimer);
        resumeTimer = setTimeout(startAuto, 10000);
      }

      btns.forEach(b => b.addEventListener('click', () => { goTo(activeIndex() + Number(b.dataset.dir)); pauseAndResume(); }));
      dots.forEach(d => d.addEventListener('click', () => { goTo(Number(d.dataset.i)); pauseAndResume(); }));

      let raf;
      rail.addEventListener('scroll', () => {
        if (raf) return;
        raf = requestAnimationFrame(() => { raf = null; sync(); });
      }, { passive: true });

      let down = false, sx = 0, ss = 0;
      rail.addEventListener('pointerdown', ev => {
        if (ev.pointerType === 'touch') return;
        down = true; sx = ev.clientX; ss = rail.scrollLeft;
        rail.classList.add('dragging');
      });
      rail.addEventListener('pointermove', ev => {
        if (!down) return;
        rail.scrollLeft = ss - (ev.clientX - sx);
      });
      function endDrag() {
        if (!down) return;
        down = false; rail.classList.remove('dragging');
        goTo(activeIndex()); pauseAndResume();
      }
      rail.addEventListener('pointerup', endDrag);
      rail.addEventListener('pointercancel', endDrag);
      rail.addEventListener('pointerleave', endDrag);

      wrap.addEventListener('mouseenter', () => { clearInterval(autoTimer); clearTimeout(resumeTimer); });
      wrap.addEventListener('mouseleave', () => { resumeTimer = setTimeout(startAuto, 10000); });


      // ── Hide rail controls while a video is playing ──
      // YouTube posts state changes when enablejsapi=1. State 1 = playing.
      function setPlaying(on) { wrap.classList.toggle('playing', on); }

      // Ask each player to report state changes to us
      function subscribe() {
        wrap.querySelectorAll('iframe').forEach(f => {
          try {
            f.contentWindow.postMessage(JSON.stringify({
              event: 'listening', id: 1, channel: 'widget'
            }), '*');
            f.contentWindow.postMessage(JSON.stringify({
              event: 'command', func: 'addEventListener',
              args: ['onStateChange'], id: 1, channel: 'widget'
            }), '*');
          } catch (err) {}
        });
      }
      window.addEventListener('message', ev => {
        if (!/youtube\.com$/.test(new URL(ev.origin).hostname.replace(/^www\./,''))) return;
        let d; try { d = JSON.parse(ev.data); } catch (err) { return; }
        const state = d && (d.info && typeof d.info.playerState === 'number'
                      ? d.info.playerState
                      : (typeof d.info === 'number' ? d.info : null));
        if (state === null) return;
        if (state === 1) { setPlaying(true); clearInterval(autoTimer); clearTimeout(resumeTimer); }
        if (state === 2 || state === 0) { setPlaying(false); pauseAndResume(); }
      });
      // Re-subscribe whenever iframes are (re)loaded
      wrap.querySelectorAll('iframe').forEach(f => f.addEventListener('load', subscribe));
      setTimeout(subscribe, 900);
      // Leaving a slide always clears the playing state
      rail.addEventListener('scroll', () => setPlaying(false), { passive: true });

      sizeArrows(); sync(); startAuto();
      window.addEventListener('resize', () => { sizeArrows(); sync(); });
      if (window.ResizeObserver) new ResizeObserver(sizeArrows).observe(items[0]);
    }
  } catch(e) {
    document.getElementById('project-content').innerHTML = '<div class="empty-state"><p>Failed to load.</p><a href="work.html">Back</a></div>';
  }
})();
