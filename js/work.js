let allProjects = [];
let activeFilter = 'All';

(async () => {
  try {
    const data = await readContent();
    allProjects = (data.projects || []).sort((a, b) => (a.order || 99) - (b.order || 99));

    const init = (data.bio?.name || 'FA').split(' ').map(n => n[0]).join('');
    document.getElementById('nav-logo').textContent    = init;
    document.getElementById('footer-name').textContent = data.bio?.name || '';

    const cats = ['All', ...new Set(allProjects.map(p => p.category).filter(Boolean))];
    document.getElementById('filter-bar').innerHTML = cats.map(c =>
      `<button class="filter-pill${c === 'All' ? ' active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');

    document.getElementById('filter-bar').addEventListener('click', e => {
      const btn = e.target.closest('.filter-pill');
      if (!btn) return;
      activeFilter = btn.dataset.cat;
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      render();
    });

    render();
  } catch (e) {
    document.getElementById('projects-grid').innerHTML = '<div class="empty-state"><p>Failed to load projects.</p></div>';
  }
})();

function render() {
  const filtered = activeFilter === 'All'
    ? allProjects
    : allProjects.filter(p => p.category === activeFilter);
  document.getElementById('projects-grid').innerHTML = filtered.length
    ? filtered.map(renderCard).join('')
    : '<div class="empty-state"><h3>Nothing here yet.</h3></div>';
}
