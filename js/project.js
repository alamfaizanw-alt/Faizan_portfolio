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

    // Media
    let mediaHTML = '';
    if (p.video) mediaHTML += `<div class="project-media"><iframe src="${p.video}" height="420" frameborder="0" allowfullscreen></iframe></div>`;
    const imgs = p.media?.length ? p.media : (p.thumbnail ? [p.thumbnail] : []);
    if (imgs.length) mediaHTML += `<div class="project-media">${imgs.map(u=>`<img src="${u}" alt="${p.title}" loading="lazy">`).join('')}</div>`;

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
        ${mediaHTML}
      </div>` : mediaHTML}

      ${p.outcome ? `<div class="cs-block">
        <div class="cs-label">Outcome</div>
        <div class="cs-outcome-text">${p.outcome.replace(/\n/g,'<br>')}</div>
      </div>` : ''}

      ${links.length ? `<div class="project-links">${links.join('')}</div>` : ''}
    `;
  } catch(e) {
    document.getElementById('project-content').innerHTML = '<div class="empty-state"><p>Failed to load.</p><a href="work.html">Back</a></div>';
  }
})();
