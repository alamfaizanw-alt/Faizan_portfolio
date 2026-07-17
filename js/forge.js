const MAX_ATTEMPTS = 5;
let content  = null;
let cfg      = null;
let pendingMedia = []; // { url } for newly uploaded images

// ── AUTH ──────────────────────────────────────────────────────────────
document.getElementById('key-input').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
document.getElementById('token-input').addEventListener('keydown', e => { if (e.key === 'Enter') submitToken(); });
document.getElementById('login-btn').addEventListener('click', login);
document.getElementById('token-btn').addEventListener('click', submitToken);
document.getElementById('logout-btn').addEventListener('click', logout);

async function login() {
  if (sessionStorage.getItem('locked')) {
    showErr('login-error', 'Too many failed attempts. Close this tab to reset.');
    return;
  }
  const key = document.getElementById('key-input').value;
  if (!key) return;
  try {
    cfg = await readConfig();
    const hash = await sha256(key);
    if (hash === cfg.keyHash) {
      sessionStorage.setItem('authed', '1');
      sessionStorage.removeItem('attempts');
      sessionStorage.getItem('gh_token') ? revealPanel() : revealTokenGate();
    } else {
      const n = parseInt(sessionStorage.getItem('attempts') || '0') + 1;
      sessionStorage.setItem('attempts', n);
      if (n >= MAX_ATTEMPTS) sessionStorage.setItem('locked', '1');
      showErr('login-error', `Incorrect key. ${MAX_ATTEMPTS - n} attempt(s) left.`);
    }
  } catch(e) {
    showErr('login-error', 'Could not verify — check REPO settings in api.js.');
  }
}

function submitToken() {
  const t = document.getElementById('token-input').value.trim();
  if (!t) { showErr('token-error', 'Token required.'); return; }
  sessionStorage.setItem('gh_token', t);
  revealPanel();
}

function revealTokenGate() {
  document.getElementById('login-gate').style.display = 'none';
  document.getElementById('token-gate').style.display = 'flex';
}

async function revealPanel() {
  document.getElementById('login-gate').style.display = 'none';
  document.getElementById('token-gate').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'block';
  await loadContent();
}

function logout() { sessionStorage.clear(); location.reload(); }

// Auto-resume session
window.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('authed') && sessionStorage.getItem('gh_token')) revealPanel();
});

// ── TABS ──────────────────────────────────────────────────────────────
document.querySelectorAll('.forge-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.forge-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.forge-section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'projects') renderProjList();
  });
});

// ── LOAD ──────────────────────────────────────────────────────────────
async function loadContent() {
  try {
    content = await readContent();
    populateBio();
    renderProjList();
  } catch(e) { toast('Failed to load content: ' + e.message, 'error'); }
}

// ── BIO ───────────────────────────────────────────────────────────────
function populateBio() {
  const b = content.bio || {};
  document.getElementById('bio-name').value     = b.name || '';
  document.getElementById('bio-tagline').value  = b.tagline || '';
  document.getElementById('bio-intro').value    = b.intro || '';
  document.getElementById('bio-linkedin').value = b.links?.linkedin || '';
  document.getElementById('bio-github').value   = b.links?.github || '';
  document.getElementById('bio-email').value    = b.links?.email || '';
  document.getElementById('bio-resume').value   = b.links?.resume || '';
}

document.getElementById('save-bio-btn').addEventListener('click', async () => {
  content.bio = {
    name:    document.getElementById('bio-name').value,
    tagline: document.getElementById('bio-tagline').value,
    intro:   document.getElementById('bio-intro').value,
    links: {
      linkedin: document.getElementById('bio-linkedin').value,
      github:   document.getElementById('bio-github').value,
      email:    document.getElementById('bio-email').value,
      resume:   document.getElementById('bio-resume').value
    }
  };
  await save('Bio updated');
});

// ── PROJECTS LIST ─────────────────────────────────────────────────────
function renderProjList() {
  const projs = (content?.projects || []).sort((a,b) => (a.order||99)-(b.order||99));
  const el = document.getElementById('project-list');
  el.innerHTML = projs.length
    ? projs.map(p => `
        <div class="proj-list-item">
          <div>
            <div class="proj-list-name">${p.title}</div>
            <div class="proj-list-meta">${p.category || '—'} &middot; Order: ${p.order ?? 99}${p.featured ? ' &middot; &#9733; Featured' : ''}</div>
          </div>
          <div class="proj-list-actions">
            <button class="btn-sm" data-edit="${p.id}">Edit</button>
          </div>
        </div>`).join('')
    : '<div class="empty-state"><p>No projects yet. Add your first one!</p></div>';

  el.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openEditor(btn.dataset.edit));
  });
}

document.getElementById('add-proj-btn').addEventListener('click', () => openEditor(null));
document.getElementById('back-to-list-btn').addEventListener('click', closeEditor);

// ── PROJECT EDITOR ────────────────────────────────────────────────────
function openEditor(id) {
  pendingMedia = [];
  document.getElementById('proj-list-view').style.display   = 'none';
  document.getElementById('proj-editor-view').style.display = 'block';
  document.getElementById('media-preview').innerHTML = '';

  const p = id ? content.projects.find(x => x.id === id) : null;
  document.getElementById('editor-heading').textContent = p ? 'Edit Project' : 'New Project';
  document.getElementById('proj-orig-id').value         = id || '';
  document.getElementById('delete-proj-btn').style.display = p ? 'inline-flex' : 'none';

  document.getElementById('proj-title').value       = p?.title || '';
  document.getElementById('proj-id').value          = p?.id || '';
  document.getElementById('proj-cat').value         = p?.category || '';
  document.getElementById('proj-order').value       = p?.order ?? 99;
  document.getElementById('proj-tags').value        = (p?.tags || []).join(', ');
  document.getElementById('proj-summary').value     = p?.summary || '';
  document.getElementById('proj-desc').value        = p?.description || '';
  document.getElementById('proj-thumb').value       = p?.thumbnail || '';
  document.getElementById('proj-video').value       = p?.video || '';
  document.getElementById('proj-github-link').value = p?.links?.github || '';
  document.getElementById('proj-live').value        = p?.links?.live || '';
  document.getElementById('proj-featured').checked  = !!p?.featured;

  // Show existing media
  if (p?.media?.length) {
    document.getElementById('media-preview').innerHTML = p.media.map((url, i) => `
      <div class="media-item" data-url="${url}">
        <img src="${url}" alt="">
        <button class="media-remove" data-idx="${i}">&times;</button>
      </div>`).join('');
    document.querySelectorAll('.media-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const origId = document.getElementById('proj-orig-id').value;
        const proj = content.projects.find(x => x.id === origId);
        if (proj) proj.media.splice(parseInt(btn.dataset.idx), 1);
        btn.closest('.media-item').remove();
      });
    });
  }
}

function closeEditor() {
  document.getElementById('proj-list-view').style.display   = 'block';
  document.getElementById('proj-editor-view').style.display = 'none';
  renderProjList();
}

// Image upload
document.getElementById('upload-area').addEventListener('click', () => document.getElementById('img-input').click());
document.getElementById('img-input').addEventListener('change', async function() {
  const projId = document.getElementById('proj-id').value || 'temp';
  for (const file of this.files) {
    const reader = new FileReader();
    reader.onload = async e => {
      const b64 = e.target.result.split(',')[1];
      const ext  = file.name.split('.').pop();
      const name = `${Date.now()}.${ext}`;
      try {
        const url = await uploadImage(projId, name, b64);
        pendingMedia.push({ url });
        const div = document.createElement('div');
        div.className = 'media-item';
        div.dataset.url = url;
        div.innerHTML = `<img src="${url}" alt=""><button class="media-remove">&times;</button>`;
        div.querySelector('.media-remove').addEventListener('click', () => {
          pendingMedia = pendingMedia.filter(m => m.url !== url);
          div.remove();
        });
        document.getElementById('media-preview').appendChild(div);
        toast('Image uploaded', 'success');
      } catch(e) { toast('Upload failed: ' + e.message, 'error'); }
    };
    reader.readAsDataURL(file);
  }
  this.value = '';
});

document.getElementById('save-proj-btn').addEventListener('click', async () => {
  const origId = document.getElementById('proj-orig-id').value;
  const newId  = document.getElementById('proj-id').value.trim().toLowerCase().replace(/\s+/g, '-');
  if (!newId) { toast('Project ID is required', 'error'); return; }

  const existingProj = origId ? content.projects.find(p => p.id === origId) : null;
  const existingMedia = existingProj?.media || [];
  const allMedia = [...existingMedia, ...pendingMedia.map(m => m.url)];

  const proj = {
    id:          newId,
    title:       document.getElementById('proj-title').value,
    category:    document.getElementById('proj-cat').value,
    order:       parseInt(document.getElementById('proj-order').value) || 99,
    tags:        document.getElementById('proj-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    summary:     document.getElementById('proj-summary').value,
    description: document.getElementById('proj-desc').value,
    thumbnail:   document.getElementById('proj-thumb').value,
    media:       allMedia,
    video:       document.getElementById('proj-video').value,
    links: {
      github: document.getElementById('proj-github-link').value,
      live:   document.getElementById('proj-live').value
    },
    featured: document.getElementById('proj-featured').checked
  };

  if (origId) {
    const idx = content.projects.findIndex(p => p.id === origId);
    content.projects[idx] = proj;
  } else {
    content.projects.push(proj);
  }
  await save('Project saved');
  closeEditor();
});

document.getElementById('delete-proj-btn').addEventListener('click', async () => {
  const origId = document.getElementById('proj-orig-id').value;
  if (!confirm(`Delete this project? This cannot be undone.`)) return;
  content.projects = content.projects.filter(p => p.id !== origId);
  await save('Project deleted');
  closeEditor();
});

// ── SETTINGS ──────────────────────────────────────────────────────────
document.getElementById('change-key-btn').addEventListener('click', async () => {
  const nk = document.getElementById('new-key').value;
  const ck = document.getElementById('confirm-key').value;
  if (!nk)       { toast('Key cannot be empty', 'error'); return; }
  if (nk !== ck) { toast('Keys do not match', 'error'); return; }
  if (nk.length < 8) { toast('Key must be at least 8 characters', 'error'); return; }
  try {
    if (!cfg) cfg = await readConfig();
    cfg.keyHash = await sha256(nk);
    await writeConfig(cfg);
    document.getElementById('new-key').value = '';
    document.getElementById('confirm-key').value = '';
    toast('Access key updated', 'success');
  } catch(e) { toast('Failed: ' + e.message, 'error'); }
});

document.getElementById('clear-token-btn').addEventListener('click', () => {
  sessionStorage.removeItem('gh_token');
  toast('Token cleared — reloading...', 'success');
  setTimeout(() => location.reload(), 1200);
});

// ── SAVE ──────────────────────────────────────────────────────────────
async function save(msg) {
  try { await writeContent(content); toast(msg || 'Saved', 'success'); }
  catch(e) { toast('Save failed: ' + e.message, 'error'); }
}

// ── UTIL ──────────────────────────────────────────────────────────────
function showErr(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg; el.style.display = 'block';
}

function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3200);
}
