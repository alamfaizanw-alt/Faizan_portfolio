(async () => {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.href = 'work.html'; return; }

  try {
    const data = await readContent();
    const p = (data.projects || []).find(x => x.id === id);

    const init = (data.bio?.name || 'FA').split(' ').map(n => n[0]).join('');
    document.getElementById('nav-logo').textContent    = init;
    document.getElementById('footer-name').textContent = data.bio?.name || '';

    if (!p) {
      document.getElementById('project-content').innerHTML =
        '<div class="empty-state"><h3>Project not found.</h3><a href="work.html" class="btn" style="margin-top:1.5rem;">Back to Work</a></div>';
      return;
    }

    document.title = `${p.title} — Portfolio`;

    let mediaHTML = '';
    if (p.video) {
      mediaHTML += `<div class="project-media"><iframe src="${p.video}" height="400" frameborder="0" allowfullscreen></iframe></div>`;
    }
    const imgs = p.media?.length ? p.media : (p.thumbnail ? [p.thumbnail] : []);
    if (imgs.length) {
      mediaHTML += `<div class="project-media">${imgs.map(u => `<img src="${u}" alt="${p.title}" loading="lazy">`).join('')}</div>`;
    }

    const links = [];
    if (p.links?.github) links.push(`<a href="${p.links.github}" class="btn" target="_blank">GitHub &rarr;</a>`);
    if (p.links?.live)   links.push(`<a href="${p.links.live}" class="btn btn-ghost" target="_blank">Live Demo &rarr;</a>`);

    document.getElementById('project-content').innerHTML = `
      <a href="work.html" class="back-btn">Back to Work</a>
      <div class="project-detail-category">${p.category || ''}</div>
      <h1 class="project-detail-title">${p.title}</h1>
      <div class="project-detail-tags">${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
      ${mediaHTML}
      <div class="project-detail-description">${(p.description || p.summary || '').replace(/\n/g, '<br>')}</div>
      ${links.length ? `<div class="project-links">${links.join('')}</div>` : ''}
    `;
  } catch (e) {
    document.getElementById('project-content').innerHTML =
      '<div class="empty-state"><p>Failed to load project.</p><a href="work.html">Back</a></div>';
  }
})();
