(async () => {
  try {
    const data = await readContent();
    const bio  = data.bio || {};
    const init = (bio.name || 'FA').split(' ').map(n => n[0]).join('');

    document.getElementById('nav-logo').textContent   = init;
    document.getElementById('footer-name').textContent = bio.name || '';
    document.getElementById('hero-name').textContent   = bio.name || 'Your Name';
    document.getElementById('hero-tagline').textContent = bio.tagline || '';
    document.getElementById('about-text').textContent  = bio.intro || '';

    renderSocialLinks(bio.links, document.getElementById('social-links'));
    renderSocialLinks(bio.links, document.getElementById('contact-links'));

    const featured = (data.projects || [])
      .filter(p => p.featured)
      .sort((a, b) => (a.order || 99) - (b.order || 99));

    const grid = document.getElementById('featured-grid');
    grid.innerHTML = featured.length
      ? featured.map(renderCard).join('')
      : '<div class="empty-state"><p>No featured projects yet.</p></div>';
  } catch (e) {
    console.error('Load error:', e);
  }
})();
