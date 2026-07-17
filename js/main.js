// Mobile nav
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});
navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  hamburger.classList.remove('open');
  navLinks.classList.remove('open');
}));

// Year
document.querySelectorAll('#year').forEach(el => el.textContent = new Date().getFullYear());

// Scroll reveal
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// Stat counter
function animateCounter(el, target, suffix) {
  const dur = 1600, start = performance.now();
  const tick = now => {
    const p = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(ease * target) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const statObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('[data-count]').forEach(el => {
        animateCounter(el, parseInt(el.dataset.count), el.dataset.suffix || '');
      });
      statObs.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });

// Main init
(async () => {
  try {
    const data = await readContent();
    const bio  = data.bio || {};
    const init = (bio.name || 'FA').split(' ').map(n => n[0]).join('');

    // Nav / footer
    document.getElementById('nav-logo').textContent    = init;
    document.getElementById('footer-name').textContent = bio.name || '';
    document.getElementById('page-title').textContent  = `${bio.name || 'Portfolio'} — Engineer`;

    // Hero
    const nameEl = document.getElementById('hero-name');
    if (bio.name) {
      const parts = bio.name.trim().split(' ');
      nameEl.innerHTML = parts.map((p,i) => `<span${i===parts.length-1?' class="name-dim"':''}>${p}</span>`).join('');
    }
    const roleEl = document.getElementById('hero-role');
    if (bio.tagline) roleEl.textContent = bio.tagline;

    // Photo
    if (bio.photo) {
      const inner = document.getElementById('photo-inner');
      inner.innerHTML = `<img src="${bio.photo}" alt="${bio.name}">`;
    }

    // Social
    renderSocialLinks(bio.links, document.getElementById('social-links'));
    renderSocialLinks(bio.links, document.getElementById('contact-links'));

    // Contact email
    const emailEl = document.getElementById('contact-email');
    if (emailEl && bio.links?.email) {
      emailEl.href = `mailto:${bio.links.email}`;
      emailEl.textContent = bio.links.email;
    } else if (emailEl) {
      emailEl.style.display = 'none';
    }

    // About
    document.getElementById('about-text').textContent = bio.intro || '';

    // Marquee
    const skills = (data.skills || []).flatMap(s => s.items || []);
    const marqueeItems = [...skills, ...skills].map(s =>
      `<div class="marquee-item">${s}</div>`
    ).join('');
    const track = document.getElementById('marquee-track');
    if (track) track.innerHTML = marqueeItems + marqueeItems; // doubled for seamless loop

    // Stats
    const statsGrid = document.getElementById('stats-grid');
    if (statsGrid && data.stats?.length) {
      statsGrid.innerHTML = data.stats.map(s => `
        <div class="stat-item">
          <span class="stat-value" data-count="${s.value}" data-suffix="${s.suffix||''}">${s.value}${s.suffix||''}</span>
          <span class="stat-label">${s.label}</span>
        </div>`).join('');
      statObs.observe(statsGrid);
    }

    // Timeline
    const tlEl = document.getElementById('timeline');
    const entries = (data.timeline || []).sort((a,b) => (a.order||99)-(b.order||99));
    if (tlEl && entries.length) {
      tlEl.innerHTML = entries.map((e, i) => {
        const side = i % 2 === 0 ? 'left' : 'right';
        const bullets = (e.bullets || []).map(b => `<li>${b}</li>`).join('');
        const card = `<div class="timeline-content ${side}">
          <div class="tl-date">${e.date||''}</div>
          <div class="tl-title">${e.title||''}</div>
          <div class="tl-company">${e.company||''}</div>
          ${bullets ? `<ul class="tl-bullets">${bullets}</ul>` : ''}
        </div>`;
        return `<div class="timeline-item">
          ${side === 'left' ? card : '<span class="timeline-empty"></span>'}
          <div class="timeline-dot"></div>
          ${side === 'right' ? card : '<span class="timeline-empty"></span>'}
        </div>`;
      }).join('');
    } else if (tlEl) {
      tlEl.innerHTML = '<div class="empty-state"><p>No timeline entries yet. Add them via the admin panel.</p></div>';
    }

    // Skills
    const skillsGrid = document.getElementById('skills-grid');
    if (skillsGrid && data.skills?.length) {
      skillsGrid.innerHTML = data.skills.map(s => `
        <div class="skill-card">
          <div class="skill-card-label">${s.category}</div>
          <div class="skill-tags">${(s.items||[]).map(t=>`<span class="skill-tag">${t}</span>`).join('')}</div>
        </div>`).join('');
    }

    // Featured projects
    const featured = (data.projects || [])
      .filter(p => p.featured)
      .sort((a,b) => (a.order||99)-(b.order||99));
    const grid = document.getElementById('featured-grid');
    if (grid) {
      grid.innerHTML = featured.length
        ? featured.map((p,i) => renderCard(p,i)).join('')
        : '<div class="empty-state"><p>No featured projects yet.</p></div>';
    }

  } catch(e) {
    console.error('Load error:', e);
  }
})();
