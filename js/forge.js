const MAX_ATTEMPTS = 5;
let content = null, cfg = null, pendingMedia = [];

// ── AUTH ──────────────────────────────────────────────────────────────
document.getElementById('key-input').addEventListener('keydown', e => { if(e.key==='Enter') login(); });
document.getElementById('token-input').addEventListener('keydown', e => { if(e.key==='Enter') submitToken(); });
document.getElementById('login-btn').addEventListener('click', login);
document.getElementById('token-btn').addEventListener('click', submitToken);
document.getElementById('logout-btn').addEventListener('click', () => { sessionStorage.clear(); location.reload(); });

async function login() {
  if (sessionStorage.getItem('locked')) { showErr('login-error','Too many attempts. Close this tab to reset.'); return; }
  const key = document.getElementById('key-input').value;
  if (!key) return;
  try {
    cfg = await readConfig();
    const hash = await sha256(key);
    if (hash === cfg.keyHash) {
      sessionStorage.setItem('authed','1'); sessionStorage.removeItem('attempts');
      sessionStorage.getItem('gh_token') ? revealPanel() : revealTokenGate();
    } else {
      const n = parseInt(sessionStorage.getItem('attempts')||'0') + 1;
      sessionStorage.setItem('attempts', n);
      if (n >= MAX_ATTEMPTS) sessionStorage.setItem('locked','1');
      showErr('login-error', `Incorrect key. ${MAX_ATTEMPTS-n} attempt(s) left.`);
    }
  } catch(e) { showErr('login-error','Could not verify. Check REPO settings in api.js.'); }
}

function submitToken() {
  const t = document.getElementById('token-input').value.trim();
  if (!t) { showErr('token-error','Token required.'); return; }
  sessionStorage.setItem('gh_token', t); revealPanel();
}
function revealTokenGate() {
  document.getElementById('login-gate').style.display='none';
  document.getElementById('token-gate').style.display='flex';
}
async function revealPanel() {
  document.getElementById('login-gate').style.display='none';
  document.getElementById('token-gate').style.display='none';
  document.getElementById('admin-panel').style.display='block';
  await loadAll();
}
window.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('authed') && sessionStorage.getItem('gh_token')) revealPanel();
});

// ── TABS ──────────────────────────────────────────────────────────────
document.querySelectorAll('.forge-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.forge-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.forge-section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-'+tab.dataset.tab).classList.add('active');
  });
});

// ── LOAD ──────────────────────────────────────────────────────────────
async function loadAll() {
  try {
    content = await readContent();
    populateBio(); populateStats(); renderProjList(); renderTlList(); populateSkills();
  } catch(e) { toast('Failed to load: '+e.message,'error'); }
}

// ── BIO ───────────────────────────────────────────────────────────────
function populateBio() {
  const b = content.bio||{};
  document.getElementById('bio-name').value     = b.name||'';
  document.getElementById('bio-tagline').value  = b.tagline||'';
  document.getElementById('bio-intro').value    = b.intro||'';
  document.getElementById('bio-photo').value    = b.photo||'';
  document.getElementById('bio-linkedin').value = b.links?.linkedin||'';
  document.getElementById('bio-github').value   = b.links?.github||'';
  document.getElementById('bio-email').value    = b.links?.email||'';
  document.getElementById('bio-resume').value   = b.links?.resume||'';
}

function statRow(s) {
  const row = document.createElement('div');
  row.className = 'stat-row';
  row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 2fr auto;gap:0.75rem;margin-bottom:0.5rem;align-items:end;';
  row.innerHTML = `
    <div class="field" style="margin:0;"><label>Value</label><input type="number" class="stat-val" value="${s.value ?? 0}"></div>
    <div class="field" style="margin:0;"><label>Suffix</label><input type="text" class="stat-suf" value="${s.suffix||''}" placeholder="+"></div>
    <div class="field" style="margin:0;"><label>Label</label><input type="text" class="stat-lbl" value="${s.label||''}"></div>
    <button class="btn-sm danger" style="height:34px;">✕</button>`;
  row.querySelector('button').addEventListener('click', () => row.remove());
  return row;
}

function populateStats() {
  const stats = content.stats || [];
  const el = document.getElementById('stats-editor');
  el.innerHTML = '';
  stats.forEach(s => el.appendChild(statRow(s)));
}

document.getElementById('add-stat-btn').addEventListener('click', () => {
  document.getElementById('stats-editor').appendChild(statRow({value:0,suffix:'+',label:''}));
});

document.getElementById('save-bio-btn').addEventListener('click', async () => {
  content.bio = {
    name:    document.getElementById('bio-name').value,
    tagline: document.getElementById('bio-tagline').value,
    intro:   document.getElementById('bio-intro').value,
    photo:   document.getElementById('bio-photo').value,
    links: {
      linkedin: document.getElementById('bio-linkedin').value,
      github:   document.getElementById('bio-github').value,
      email:    document.getElementById('bio-email').value,
      resume:   document.getElementById('bio-resume').value
    }
  };
  content.stats = [...document.querySelectorAll('#stats-editor .stat-row')].map(row => ({
    value:  parseInt(row.querySelector('.stat-val').value) || 0,
    suffix: row.querySelector('.stat-suf').value,
    label:  row.querySelector('.stat-lbl').value
  })).filter(s => s.label);
  await save('Bio & stats updated');
});

// ── PROJECTS ──────────────────────────────────────────────────────────
function renderProjList() {
  const projs = (content?.projects||[]).sort((a,b)=>(a.order||99)-(b.order||99));
  const el = document.getElementById('project-list');
  el.innerHTML = projs.length
    ? projs.map(p=>`<div class="proj-list-item">
        <div><div class="proj-list-name">${p.title}</div>
        <div class="proj-list-meta">${p.category||'—'} · Order: ${p.order??99}${p.featured?' · ★':''}</div></div>
        <div class="proj-list-actions"><button class="btn-sm" data-edit="${p.id}">Edit</button></div>
      </div>`).join('')
    : '<div class="empty-state"><p>No projects yet.</p></div>';
  el.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click',()=>openProjEditor(btn.dataset.edit)));
}

document.getElementById('add-proj-btn').addEventListener('click',()=>openProjEditor(null));
document.getElementById('back-to-list-btn').addEventListener('click',closeProjEditor);

// ── Dynamic row helper ────────────────────────────────────────────────
function makeUrlRow(value, placeholder) {
  const wrap = document.createElement('div');
  wrap.style.cssText='display:flex;gap:0.5rem;margin-bottom:0.4rem;align-items:center;';
  const inp = document.createElement('input');
  inp.type='url'; inp.placeholder=placeholder; inp.value=value||'';
  inp.style.cssText='flex:1;background:var(--bg-card);border:1px solid var(--border);color:var(--text);padding:0.5rem 0.75rem;font-size:14px;outline:none;';
  const btn = document.createElement('button');
  btn.className='btn-sm danger'; btn.textContent='✕';
  btn.addEventListener('click',()=>wrap.remove());
  wrap.appendChild(inp); wrap.appendChild(btn);
  return wrap;
}

function addVideoRow(value='') {
  document.getElementById('video-url-list').appendChild(makeUrlRow(value,'https://www.youtube.com/embed/...'));
}
function addImgUrlRow(value='') {
  document.getElementById('img-url-list').appendChild(makeUrlRow(value,'https://... image URL'));
}

function openProjEditor(id) {
  pendingMedia=[];
  document.getElementById('proj-list-view').style.display='none';
  document.getElementById('proj-editor-view').style.display='block';
  document.getElementById('media-preview').innerHTML='';
  document.getElementById('video-url-list').innerHTML='';
  document.getElementById('img-url-list').innerHTML='';

  const p = id ? content.projects.find(x=>x.id===id) : null;
  document.getElementById('editor-heading').textContent = p ? 'Edit Project' : 'New Project';
  document.getElementById('proj-orig-id').value    = id||'';
  document.getElementById('delete-proj-btn').style.display = p?'inline-flex':'none';
  document.getElementById('proj-title').value      = p?.title||'';
  document.getElementById('proj-id').value         = p?.id||'';
  document.getElementById('proj-cat').value        = p?.category||'';
  document.getElementById('proj-order').value      = p?.order??99;
  document.getElementById('proj-tags').value       = (p?.tags||[]).join(', ');
  document.getElementById('proj-summary').value    = p?.summary||'';
  document.getElementById('proj-challenge').value  = p?.challenge||'';
  document.getElementById('proj-approach').value   = p?.approach||'';
  document.getElementById('proj-outcome').value    = p?.outcome||'';
  document.getElementById('proj-thumb').value      = p?.thumbnail||'';
  document.getElementById('proj-github-link').value= p?.links?.github||'';
  document.getElementById('proj-live').value       = p?.links?.live||'';
  document.getElementById('proj-featured').checked = !!p?.featured;

  // Uploaded images
  if (p?.media?.length) {
    document.getElementById('media-preview').innerHTML = p.media.map((url,i)=>`
      <div class="media-item" data-url="${url}">
        <img src="${url}" alt=""><button class="media-remove" data-idx="${i}">&times;</button>
      </div>`).join('');
    document.querySelectorAll('.media-remove').forEach(btn=>btn.addEventListener('click',()=>{
      const proj=content.projects.find(x=>x.id===document.getElementById('proj-orig-id').value);
      if(proj) proj.media.splice(parseInt(btn.dataset.idx),1);
      btn.closest('.media-item').remove();
    }));
  }

  // Image URLs
  (p?.imageUrls||[]).forEach(url=>addImgUrlRow(url));

  // Videos — support both old single `video` field and new `videos` array
  const vids = p?.videos?.length ? p.videos : (p?.video ? [p.video] : []);
  vids.forEach(url=>addVideoRow(url));
}

function closeProjEditor() {
  document.getElementById('proj-list-view').style.display='block';
  document.getElementById('proj-editor-view').style.display='none';
  renderProjList();
}

document.getElementById('add-video-btn').addEventListener('click',()=>addVideoRow());
document.getElementById('add-img-url-btn').addEventListener('click',()=>addImgUrlRow());

document.getElementById('upload-area').addEventListener('click',()=>document.getElementById('img-input').click());
document.getElementById('img-input').addEventListener('change', async function() {
  const projId = document.getElementById('proj-id').value||'temp';
  const files  = [...this.files];
  this.value   = '';
  if (!files.length) return;

  toast(`Uploading ${files.length} image${files.length>1?'s':''}...`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      // Read file as base64 — wrapped in a promise so we can await it
      const b64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = e => resolve(e.target.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const ext  = file.name.split('.').pop();
      const name = `${Date.now()}_${i}.${ext}`; // index prevents timestamp collision
      const url  = await uploadImage(projId, name, b64); // awaited — fully sequential

      pendingMedia.push({url});
      const div = document.createElement('div');
      div.className   = 'media-item';
      div.dataset.url = url;
      div.innerHTML   = `<img src="${url}" alt=""><button class="media-remove">&times;</button>`;
      div.querySelector('.media-remove').addEventListener('click', () => {
        pendingMedia = pendingMedia.filter(m => m.url !== url);
        div.remove();
      });
      document.getElementById('media-preview').appendChild(div);
      toast(`Uploaded ${i+1} of ${files.length}`, 'success');

    } catch(e) {
      toast(`Failed on ${file.name}: ${e.message}`, 'error');
    }
  }

  if (files.length > 1) toast(`All ${files.length} images uploaded`, 'success');
});

document.getElementById('save-proj-btn').addEventListener('click', async () => {
  const origId=document.getElementById('proj-orig-id').value;
  const newId=document.getElementById('proj-id').value.trim().toLowerCase().replace(/\s+/g,'-');
  if(!newId){toast('Project ID required','error');return;}

  const existing=origId?content.projects.find(p=>p.id===origId):null;
  const uploadedMedia=[...(existing?.media||[]),...pendingMedia.map(m=>m.url)];
  const imageUrls=[...document.getElementById('img-url-list').querySelectorAll('input')].map(i=>i.value.trim()).filter(Boolean);
  const videos=[...document.getElementById('video-url-list').querySelectorAll('input')].map(i=>i.value.trim()).filter(Boolean);

  const proj={
    id:newId,
    title:document.getElementById('proj-title').value,
    category:document.getElementById('proj-cat').value,
    order:parseInt(document.getElementById('proj-order').value)||99,
    tags:document.getElementById('proj-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
    summary:document.getElementById('proj-summary').value,
    challenge:document.getElementById('proj-challenge').value,
    approach:document.getElementById('proj-approach').value,
    outcome:document.getElementById('proj-outcome').value,
    thumbnail:document.getElementById('proj-thumb').value,
    media:uploadedMedia,
    imageUrls:imageUrls,
    videos:videos,
    links:{github:document.getElementById('proj-github-link').value,live:document.getElementById('proj-live').value},
    featured:document.getElementById('proj-featured').checked
  };
  if(origId){const idx=content.projects.findIndex(p=>p.id===origId);content.projects[idx]=proj;}
  else content.projects.push(proj);
  await save('Project saved'); closeProjEditor();
});
document.getElementById('delete-proj-btn').addEventListener('click', async()=>{
  if(!confirm('Delete this project?'))return;
  content.projects=content.projects.filter(p=>p.id!==document.getElementById('proj-orig-id').value);
  await save('Project deleted'); closeProjEditor();
});

// ── TIMELINE ──────────────────────────────────────────────────────────
function renderTlList() {
  const entries=(content?.timeline||[]).sort((a,b)=>(a.order||99)-(b.order||99));
  const el=document.getElementById('tl-list');
  el.innerHTML=entries.length
    ?entries.map(e=>`<div class="tl-admin-item">
        <div><div class="proj-list-name">${e.title} &mdash; ${e.company}</div>
        <div class="proj-list-meta">${e.date||''} · ${e.type||'work'}</div></div>
        <div><button class="btn-sm" data-tl="${e.id}">Edit</button></div>
      </div>`).join('')
    :'<div class="empty-state"><p>No entries yet.</p></div>';
  el.querySelectorAll('[data-tl]').forEach(btn=>btn.addEventListener('click',()=>openTlEditor(btn.dataset.tl)));
}
document.getElementById('add-tl-btn').addEventListener('click',()=>openTlEditor(null));
document.getElementById('back-tl-btn').addEventListener('click',closeTlEditor);

function openTlEditor(id) {
  document.getElementById('tl-list-view').style.display='none';
  document.getElementById('tl-editor-view').style.display='block';
  const e=id?(content.timeline||[]).find(x=>x.id===id):null;
  document.getElementById('tl-editor-heading').textContent=e?'Edit Entry':'New Entry';
  document.getElementById('tl-orig-id').value=id||'';
  document.getElementById('delete-tl-btn').style.display=e?'inline-flex':'none';
  document.getElementById('tl-title').value=e?.title||'';
  document.getElementById('tl-company').value=e?.company||'';
  document.getElementById('tl-date').value=e?.date||'';
  document.getElementById('tl-type').value=e?.type||'work';
  document.getElementById('tl-bullets').value=(e?.bullets||[]).join('\n');
  document.getElementById('tl-image').value=e?.image||'';
  document.getElementById('tl-order').value=e?.order??99;
}
function closeTlEditor(){
  document.getElementById('tl-list-view').style.display='block';
  document.getElementById('tl-editor-view').style.display='none';
  renderTlList();
}
document.getElementById('save-tl-btn').addEventListener('click',async()=>{
  const origId=document.getElementById('tl-orig-id').value;
  const newId=origId||(Date.now().toString(36));
  const entry={
    id:newId,
    title:document.getElementById('tl-title').value,
    company:document.getElementById('tl-company').value,
    date:document.getElementById('tl-date').value,
    type:document.getElementById('tl-type').value,
    bullets:document.getElementById('tl-bullets').value.split('\n').map(s=>s.trim()).filter(Boolean),
    image:document.getElementById('tl-image').value,
    order:parseInt(document.getElementById('tl-order').value)||99
  };
  if(!content.timeline)content.timeline=[];
  if(origId){const idx=content.timeline.findIndex(x=>x.id===origId);content.timeline[idx]=entry;}
  else content.timeline.push(entry);
  await save('Timeline updated'); closeTlEditor();
});
document.getElementById('delete-tl-btn').addEventListener('click',async()=>{
  if(!confirm('Delete this entry?'))return;
  content.timeline=content.timeline.filter(x=>x.id!==document.getElementById('tl-orig-id').value);
  await save('Entry deleted'); closeTlEditor();
});

// ── SKILLS ────────────────────────────────────────────────────────────
function skillRow(s) {
  const row = document.createElement('div');
  row.className = 'skill-row';
  row.style.cssText = 'display:grid;grid-template-columns:1fr 2fr auto;gap:0.75rem;margin-bottom:0.75rem;align-items:end;';
  row.innerHTML = `
    <div class="field" style="margin:0;"><label>Category</label><input type="text" class="skill-cat" value="${s.category||''}"></div>
    <div class="field" style="margin:0;"><label>Items (comma-separated)</label><input type="text" class="skill-items" value="${(s.items||[]).join(', ')}"></div>
    <button class="btn-sm danger" style="height:34px;">✕</button>`;
  row.querySelector('button').addEventListener('click', () => row.remove());
  return row;
}

function populateSkills() {
  const skills = content.skills || [];
  const el = document.getElementById('skills-editor');
  el.innerHTML = '';
  skills.forEach(s => el.appendChild(skillRow(s)));
}

document.getElementById('add-skill-btn').addEventListener('click', () => {
  document.getElementById('skills-editor').appendChild(skillRow({category:'',items:[]}));
});

document.getElementById('save-skills-btn').addEventListener('click',async()=>{
  content.skills = [...document.querySelectorAll('#skills-editor .skill-row')].map(row => ({
    category: row.querySelector('.skill-cat').value,
    items: row.querySelector('.skill-items').value.split(',').map(s=>s.trim()).filter(Boolean)
  })).filter(s => s.category);
  await save('Skills updated');
});

// ── SETTINGS ──────────────────────────────────────────────────────────
document.getElementById('change-key-btn').addEventListener('click',async()=>{
  const nk=document.getElementById('new-key').value, ck=document.getElementById('confirm-key').value;
  if(!nk){toast('Key required','error');return;}
  if(nk!==ck){toast('Keys do not match','error');return;}
  if(nk.length<8){toast('Min 8 characters','error');return;}
  try{
    if(!cfg)cfg=await readConfig();
    cfg.keyHash=await sha256(nk);
    await writeConfig(cfg);
    document.getElementById('new-key').value=''; document.getElementById('confirm-key').value='';
    toast('Key updated','success');
  }catch(e){toast('Failed: '+e.message,'error');}
});
document.getElementById('clear-token-btn').addEventListener('click',()=>{
  sessionStorage.removeItem('gh_token');
  toast('Token cleared — reloading...','success');
  setTimeout(()=>location.reload(),1200);
});

// ── SAVE ──────────────────────────────────────────────────────────────
async function save(msg){
  try{await writeContent(content);toast(msg||'Saved','success');}
  catch(e){toast('Save failed: '+e.message,'error');}
}
function showErr(id,msg){const el=document.getElementById(id);el.textContent=msg;el.style.display='block';}
function toast(msg,type=''){
  const el=document.getElementById('toast');
  el.textContent=msg; el.className=`toast ${type} show`;
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),3200);
}
