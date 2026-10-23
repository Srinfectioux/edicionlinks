/* Editor: estado, formularios, vista previa en vivo, autoguardado y exportación. */
(function () {
  'use strict';

  const LPX = LPFactory();
  const THEMES = window.LP_THEMES;
  const FONTS = window.LP_FONTS;
  const PDF_WARN = 5 * 1024 * 1024;
  const PDF_MAX = 15 * 1024 * 1024;

  const $ = (s, r = document) => r.querySelector(s);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const svg = (inner) => `<svg class="ui" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;

  const UI = {
    handle: svg('<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>'),
    up: svg('<path d="m18 15-6-6-6 6"/>'),
    down: svg('<path d="m6 9 6 6 6-6"/>'),
    trash: svg('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    img: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>')
  };

  const PLACEHOLDERS = {
    whatsapp: 'Número con código de país, ej. 51987654321',
    instagram: 'https://instagram.com/usuario',
    tiktok: 'https://tiktok.com/@usuario',
    facebook: 'https://facebook.com/usuario',
    youtube: 'https://youtube.com/@canal',
    x: 'https://x.com/usuario',
    threads: 'https://threads.net/@usuario',
    linkedin: 'https://linkedin.com/in/usuario',
    spotify: 'https://open.spotify.com/…',
    email: 'tu@correo.com',
    web: 'https://tusitio.com'
  };

  function defaults() {
    return {
      version: 1,
      profile: {
        name: 'Roxana Ypanaqué',
        bio: '🎨 Roxy loca por el arte 🎨 Cuadros, artesanías, talleres de pintura, círculos de arte.',
        photo: '',
        photoMode: 'cover'
      },
      socials: [
        { type: 'whatsapp', url: '' },
        { type: 'tiktok', url: 'https://www.tiktok.com/@' },
        { type: 'instagram', url: 'https://www.instagram.com/' }
      ],
      blocks: [
        { id: uid(), type: 'link', title: 'WhatsApp', url: 'https://wa.me/', thumb: '', featured: true, active: true },
        { id: uid(), type: 'link', title: 'TikTok', url: 'https://www.tiktok.com/@', thumb: '', featured: false, active: true },
        { id: uid(), type: 'link', title: 'Instagram', url: 'https://www.instagram.com/', thumb: '', featured: false, active: true },
        { id: uid(), type: 'link', title: 'Ver mi catálogo en WhatsApp', url: 'https://wa.me/c/', thumb: '', featured: false, active: true },
        { id: uid(), type: 'pdf', title: 'Catálogo de cuadros (PDF)', file: '', fileName: '', fileSize: 0, mode: 'view', thumb: '', active: true },
        { id: uid(), type: 'link', title: 'Threads', url: 'https://www.threads.net/@', thumb: '', featured: false, active: true }
      ],
      theme: clone(THEMES[0].theme)
    };
  }

  function newBlock(type) {
    if (type === 'pdf') return { id: uid(), type, title: '', file: '', fileName: '', fileSize: 0, mode: 'view', thumb: '', active: true };
    if (type === 'header') return { id: uid(), type, text: '', active: true };
    return { id: uid(), type: 'link', title: '', url: '', thumb: '', featured: false, active: true };
  }

  function migrate(raw) {
    const base = THEMES[0].theme;
    const rawTheme = raw.theme || {};
    const theme = Object.assign(clone(base), rawTheme);
    theme.bg = Object.assign(clone(base.bg), rawTheme.bg || {});
    return {
      version: 1,
      profile: Object.assign({ name: '', bio: '', photo: '', photoMode: 'cover' }, raw.profile || {}),
      socials: (Array.isArray(raw.socials) ? raw.socials : [])
        .filter((s) => s && s.type)
        .map((s) => ({ type: String(s.type), url: String(s.url || '') })),
      blocks: (Array.isArray(raw.blocks) ? raw.blocks : [])
        .filter((b) => b && ['link', 'pdf', 'header'].includes(b.type))
        .map((b) => Object.assign(newBlock(b.type), b, { id: b.id || uid() })),
      theme
    };
  }

  let state = defaults();

  function getPath(path) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), state);
  }
  function setPath(path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    keys.reduce((o, k) => o[k], state)[last] = value;
  }
  const findBlock = (id) => state.blocks.find((b) => b.id === id);

  /* ---------- Persistencia (IndexedDB, con localStorage como respaldo) ---------- */
  let dbPromise;
  function db() {
    dbPromise = dbPromise || new Promise((res, rej) => {
      const r = indexedDB.open('linkpage-editor', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbPromise;
  }
  function idb(mode, fn) {
    return db().then((d) => new Promise((res, rej) => {
      const tx = d.transaction('kv', mode);
      const q = fn(tx.objectStore('kv'));
      tx.oncomplete = () => res(q.result);
      tx.onerror = () => rej(tx.error);
    }));
  }
  async function loadDraft() {
    try { return await idb('readonly', (s) => s.get('draft')); } catch (e) {
      try { return JSON.parse(localStorage.getItem('linkpage-draft')); } catch (e2) { return null; }
    }
  }
  async function saveDraft() {
    try { await idb('readwrite', (s) => s.put(state, 'draft')); return true; } catch (e) {
      try { localStorage.setItem('linkpage-draft', JSON.stringify(state)); return true; } catch (e2) { return false; }
    }
  }

  /* ---------- Avisos ---------- */
  let toastTimer;
  function toast(msg, warn) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.toggle('warn', !!warn);
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), warn ? 4200 : 2200);
  }

  let previewTimer, saveTimer;
  function changed() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(postPreview, 100);
    $('#status').textContent = 'Guardando…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      $('#status').textContent = (await saveDraft()) ? 'Borrador guardado ✓' : 'No se pudo guardar el borrador';
    }, 500);
  }

  /* ---------- Piezas de formulario ---------- */
  function seg(path, options) {
    const cur = getPath(path);
    return `<div class="seg">${options.map(([v, label]) =>
      `<button type="button" class="${cur === v ? 'on' : ''}" data-act="seg" data-path="${path}" data-value="${v}">${label}</button>`).join('')}</div>`;
  }
  function colorField(path, label) {
    const v = esc(getPath(path));
    return `<div class="field"><span>${label}</span><div class="color">
      <input type="color" data-path="${path}" value="${v}" aria-label="${label}">
      <input type="text" data-path="${path}" value="${v}" maxlength="7" spellcheck="false" aria-label="${label} (hex)"></div></div>`;
  }
  function fontField(path, label) {
    const cur = getPath(path);
    return `<label class="field"><span>${label}</span><select data-path="${path}">${FONTS.map((f) =>
      `<option value="${f}" ${f === cur ? 'selected' : ''} style="font-family:'${f}'">${f}</option>`).join('')}</select></label>`;
  }
  function fileBtn(label, attrs, accept) {
    return `<label class="btn small file-btn">${label}<input type="file" accept="${accept}" ${attrs}></label>`;
  }
  function fmtSize(n) {
    return n > 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  }

  /* ---------- Pestaña Perfil ---------- */
  function renderProfile() {
    const p = state.profile;
    const socialRows = state.socials.map((s, i) => `
      <div class="social-row">
        <span class="social-ico">${LPX.icon(s.type)}</span>
        <select data-sidx="${i}" data-field="type" aria-label="Red social">${Object.keys(LPX.socials).map((k) =>
          `<option value="${k}" ${k === s.type ? 'selected' : ''}>${LPX.socials[k]}</option>`).join('')}</select>
        <button class="icon-btn del" type="button" data-act="social-del" data-idx="${i}" aria-label="Quitar red">${UI.trash}</button>
        <input type="text" data-sidx="${i}" data-field="url" value="${esc(s.url)}" placeholder="${esc(PLACEHOLDERS[s.type] || 'https://')}" aria-label="Enlace">
      </div>`).join('');

    $('#pane-profile').innerHTML = `
      <div class="card">
        <h3>Foto</h3>
        <div class="photo-row">
          <div class="photo-prev">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : esc(LPX.initials(p.name))}</div>
          <div class="row">
            <label class="btn primary file-btn">${p.photo ? 'Cambiar foto' : 'Subir foto'}<input type="file" accept="image/*" data-file="photo"></label>
            ${p.photo ? '<button class="btn danger" type="button" data-act="photo-del">Quitar</button>' : ''}
          </div>
        </div>
        <div class="field"><span>Cómo se muestra</span>${seg('profile.photoMode', [['cover', 'Portada grande'], ['avatar', 'Avatar redondo']])}</div>
        <p class="hint">La portada ocupa todo el ancho y se funde con el fondo. La foto se optimiza automáticamente.</p>
      </div>
      <div class="card">
        <h3>Información</h3>
        <label class="field"><span>Nombre</span><input type="text" data-path="profile.name" value="${esc(p.name)}" maxlength="60"></label>
        <label class="field"><span>Bio</span><textarea data-path="profile.bio" rows="3" maxlength="240">${esc(p.bio)}</textarea>
          <span class="counter" id="bio-count">${p.bio.length}/240</span></label>
      </div>
      <div class="card">
        <h3>Redes sociales <small>· iconos bajo tu nombre</small></h3>
        ${socialRows || '<p class="hint" style="margin-bottom:10px">Aún no has añadido redes.</p>'}
        <button class="btn small" type="button" data-act="social-add">${UI.plus} Añadir red</button>
      </div>`;
  }

  /* ---------- Pestaña Links ---------- */
  function thumbRow(b, withFeatured) {
    return `<div class="thumb-row">
      <div class="thumb">${b.thumb ? `<img src="${esc(b.thumb)}" alt="">` : UI.img}</div>
      ${fileBtn(b.thumb ? 'Cambiar imagen' : 'Añadir imagen', `data-file="thumb" data-bid="${b.id}"`, 'image/*')}
      ${b.thumb ? `<button class="btn small danger" type="button" data-act="thumb-del">Quitar</button>` : ''}
      ${withFeatured ? `<label class="check" title="${b.thumb ? '' : 'Primero añade una imagen'}"><input type="checkbox" data-bid="${b.id}" data-field="featured" ${b.featured ? 'checked' : ''} ${b.thumb ? '' : 'disabled'}> Destacado (imagen grande)</label>` : ''}
    </div>`;
  }

  function blockCard(b) {
    const label = { link: 'Link', pdf: 'PDF', header: 'Título' }[b.type];
    let body = '';
    if (b.type === 'link') {
      body = `<div class="grid2">
          <label class="field"><span>Título</span><input type="text" data-bid="${b.id}" data-field="title" value="${esc(b.title)}" placeholder="Ej. Mi tienda"></label>
          <label class="field"><span>URL</span><input type="text" inputmode="url" data-bid="${b.id}" data-field="url" value="${esc(b.url)}" placeholder="https://"></label>
        </div>${thumbRow(b, true)}`;
    } else if (b.type === 'pdf') {
      body = `<div class="grid2">
          <label class="field"><span>Título del botón</span><input type="text" data-bid="${b.id}" data-field="title" value="${esc(b.title)}" placeholder="Ej. Mi catálogo"></label>
          <label class="field"><span>Al hacer clic</span><select data-bid="${b.id}" data-field="mode">
            <option value="view" ${b.mode !== 'download' ? 'selected' : ''}>Ver en la página</option>
            <option value="download" ${b.mode === 'download' ? 'selected' : ''}>Descargar</option></select></label>
        </div>
        <div class="field"><span>Archivo</span><div class="thumb-row">
          <span class="pdf-name">${b.file ? `📄 ${esc(b.fileName)} · ${fmtSize(b.fileSize)}` : 'Ningún PDF elegido'}</span>
          ${fileBtn(b.file ? 'Cambiar PDF' : 'Elegir PDF', `data-file="pdf" data-bid="${b.id}"`, 'application/pdf,.pdf')}
        </div></div>
        <div class="field"><span>Miniatura (opcional)</span>${thumbRow(b, false)}</div>`;
    } else {
      body = `<label class="field"><span>Texto</span><input type="text" data-bid="${b.id}" data-field="text" value="${esc(b.text)}" placeholder="Ej. Mis talleres"></label>`;
    }
    return `<div class="card block ${b.active === false ? 'off' : ''}" data-bid="${b.id}">
      <div class="block-top">
        <span class="handle" title="Arrastra para reordenar">${UI.handle}</span>
        <span class="badge">${label}</span><span class="spacer"></span>
        <label class="switch" title="Mostrar / ocultar"><input type="checkbox" data-bid="${b.id}" data-field="active" ${b.active !== false ? 'checked' : ''} aria-label="Visible"><span></span></label>
        <button class="icon-btn" type="button" data-act="up" aria-label="Subir">${UI.up}</button>
        <button class="icon-btn" type="button" data-act="down" aria-label="Bajar">${UI.down}</button>
        <button class="icon-btn del" type="button" data-act="del" aria-label="Eliminar">${UI.trash}</button>
      </div>${body}</div>`;
  }

  function renderLinks() {
    $('#pane-links').innerHTML = `
      <div class="add-row">
        <button class="btn primary" type="button" data-act="add" data-type="link">${UI.plus} Link</button>
        <button class="btn" type="button" data-act="add" data-type="pdf">${UI.plus} PDF</button>
        <button class="btn" type="button" data-act="add" data-type="header">${UI.plus} Título de sección</button>
      </div>
      <div class="blocks" id="blocks">${state.blocks.map(blockCard).join('') ||
        '<div class="empty">Aún no hay links. Añade el primero con los botones de arriba.</div>'}</div>`;
  }

  /* ---------- Pestaña Apariencia ---------- */
  function themeCard(t) {
    const th = t.theme;
    const r = { square: '3px', rounded: '6px', pill: '999px' }[th.shape];
    const bar = th.style === 'outline'
      ? `border:2px solid ${th.btnBg};background:transparent`
      : `background:${th.btnBg}${th.style === 'hard' ? `;box-shadow:2px 2px 0 ${th.text}` : ''}`;
    const on = JSON.stringify(th) === JSON.stringify(state.theme);
    return `<button type="button" class="theme-card ${on ? 'on' : ''}" data-act="theme" data-theme="${t.id}">
      <span class="theme-mini" style="background:${esc(LPX.bgCss(th.bg))}">
        <b style="background:${th.text}"></b>
        <i style="${bar};border-radius:${r}"></i><i style="${bar};border-radius:${r}"></i><i style="${bar};border-radius:${r}"></i>
      </span><span class="theme-name">${t.name}</span></button>`;
  }

  function renderAppearance() {
    const t = state.theme, bg = t.bg;
    $('#pane-appearance').innerHTML = `
      <div class="card"><h3>Temas</h3><div class="themes">${THEMES.map(themeCard).join('')}</div></div>
      <div class="card">
        <h3>Fondo</h3>
        <div class="field"><span>Tipo</span>${seg('theme.bg.type', [['solid', 'Color'], ['gradient', 'Degradado'], ['image', 'Imagen']])}</div>
        <div class="grid2">
          ${colorField('theme.bg.color', bg.type === 'gradient' ? 'Color 1' : bg.type === 'image' ? 'Color de respaldo' : 'Color')}
          ${bg.type === 'gradient' ? colorField('theme.bg.color2', 'Color 2') : ''}
        </div>
        ${bg.type === 'gradient' ? `<label class="field"><span>Ángulo · <output id="angle-out">${bg.angle}°</output></span>
          <input type="range" min="0" max="360" step="5" data-path="theme.bg.angle" value="${bg.angle}"></label>` : ''}
        ${bg.type === 'image' ? `
          <div class="field"><span>Imagen</span><div class="thumb-row">
            <div class="thumb">${bg.image ? `<img src="${esc(bg.image)}" alt="">` : UI.img}</div>
            ${fileBtn(bg.image ? 'Cambiar imagen' : 'Subir imagen', 'data-file="bgimage"', 'image/*')}
            ${bg.image ? '<button class="btn small danger" type="button" data-act="bg-del">Quitar</button>' : ''}
          </div></div>
          <label class="field"><span>Oscurecer · <output id="dim-out">${bg.dim}%</output></span>
            <input type="range" min="0" max="70" step="5" data-path="theme.bg.dim" value="${bg.dim}"></label>` : ''}
      </div>
      <div class="card">
        <h3>Texto y fuentes</h3>
        <div class="grid2">
          ${colorField('theme.text', 'Color del texto')}<span></span>
          ${fontField('theme.fontTitle', 'Fuente del nombre')}
          ${fontField('theme.fontBody', 'Fuente del texto')}
        </div>
      </div>
      <div class="card">
        <h3>Botones</h3>
        <div class="grid2">${colorField('theme.btnBg', 'Color del botón')}${colorField('theme.btnText', 'Texto del botón')}</div>
        <div class="field"><span>Forma</span>${seg('theme.shape', [['square', 'Cuadrado'], ['rounded', 'Redondeado'], ['pill', 'Píldora']])}</div>
        <div class="field"><span>Estilo</span>${seg('theme.style', [['fill', 'Relleno'], ['outline', 'Contorno'], ['soft', 'Sombra suave'], ['hard', 'Sombra dura']])}</div>
      </div>`;
  }

  function renderAll() {
    renderProfile();
    renderLinks();
    renderAppearance();
  }

  /* ---------- Archivos ---------- */
  function readDataUrl(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.readAsDataURL(file);
    });
  }

  function resizeImage(file, max) {
    if (file.type === 'image/svg+xml') return readDataUrl(file);
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * s);
        c.height = Math.round(img.naturalHeight * s);
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        let out = c.toDataURL('image/webp', 0.85);
        if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/jpeg', 0.85);
        res(out);
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('imagen')); };
      img.src = url;
    });
  }

  async function handleFile(input) {
    const file = input.files[0];
    const kind = input.dataset.file;
    const b = input.dataset.bid ? findBlock(input.dataset.bid) : null;
    input.value = '';
    if (!file) return;
    try {
      if (kind === 'pdf') {
        if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) return toast('Elige un archivo PDF', true);
        if (file.size > PDF_MAX) return toast(`El PDF pesa ${fmtSize(file.size)}. El máximo es 15 MB; comprímelo primero.`, true);
        b.file = await readDataUrl(file);
        b.fileName = file.name;
        b.fileSize = file.size;
        if (!b.title) b.title = file.name.replace(/\.pdf$/i, '');
        if (file.size > PDF_WARN) toast(`PDF de ${fmtSize(file.size)}: tu página tardará más en cargar.`, true);
        renderLinks();
      } else {
        if (!file.type.startsWith('image/')) return toast('Elige una imagen', true);
        const max = kind === 'bgimage' ? 1600 : kind === 'photo' ? 1000 : 480;
        const data = await resizeImage(file, max);
        if (kind === 'photo') { state.profile.photo = data; renderProfile(); }
        if (kind === 'bgimage') { state.theme.bg.image = data; renderAppearance(); }
        if (kind === 'thumb') { b.thumb = data; renderLinks(); }
      }
      changed();
    } catch (e) {
      toast('No se pudo leer el archivo', true);
    }
  }

  /* ---------- Exportación ---------- */
  function buildDoc(cfg, preview) {
    const p = cfg.profile;
    const json = JSON.stringify(cfg).replace(/</g, '\\u003c');
    const src = LPFactory.toString().replace(/<\/script/gi, '<\\/script');
    const desc = p.bio || `Links de ${p.name}`;
    const favicon = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔗</text></svg>";
    const boot = preview
      ? "var app=LPFactory().mount(document.getElementById('app'),data,{preview:true});addEventListener('message',function(e){if(e.data&&e.data.type==='lp-update')app.update(e.data.config)});"
      : "LPFactory().mount(document.getElementById('app'),data);";
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.name || 'Mis links')}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(p.name)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="profile">
<meta name="theme-color" content="${esc(cfg.theme.bg.color)}">
<link rel="icon" href="${favicon}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
</head>
<body>
<div id="app"></div>
<script type="application/json" id="linkpage-data">${json}</script>
<script>
${src}
var data=JSON.parse(document.getElementById('linkpage-data').textContent);
${boot}
</script>
</body>
</html>`;
  }

  function download(text, name, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function importFile(file) {
    try {
      const text = await file.text();
      let data;
      if (/^\s*</.test(text)) {
        const node = new DOMParser().parseFromString(text, 'text/html').getElementById('linkpage-data');
        if (!node) throw new Error('sin datos');
        data = JSON.parse(node.textContent);
      } else {
        data = JSON.parse(text);
      }
      if (!data || typeof data !== 'object' || (!data.profile && !data.theme)) throw new Error('formato');
      state = migrate(data);
      renderAll();
      changed();
      toast('Proyecto importado');
    } catch (e) {
      toast('Ese archivo no es un proyecto de esta página', true);
    }
  }

  /* ---------- Vista previa ---------- */
  const frame = $('#preview');
  let frameReady = false;
  function postPreview() {
    if (frameReady) frame.contentWindow.postMessage({ type: 'lp-update', config: state }, '*');
  }
  function initPreview() {
    frame.addEventListener('load', () => { frameReady = true; postPreview(); });
    frame.srcdoc = buildDoc(state, true);
  }

  /* ---------- Pestañas ---------- */
  function setTab(name) {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    $('#layout').dataset.view = name;
    if (name === 'preview') return;
    ['profile', 'links', 'appearance'].forEach((n) => { $('#pane-' + n).hidden = n !== name; });
    $('#panel').scrollTop = 0;
  }

  /* ---------- Eventos ---------- */
  const panel = $('#panel');

  panel.addEventListener('input', (e) => {
    const el = e.target;
    if (el.type === 'file') return;
    if (el.dataset.path) {
      const path = el.dataset.path;
      let value = el.value;
      if (el.type === 'text' && el.closest('.color')) {
        if (!/^#[0-9a-f]{6}$/i.test(value)) return;
      }
      if (el.type === 'range') value = Number(value);
      setPath(path, value);
      const twin = el.closest('.color');
      if (twin) twin.querySelectorAll('input').forEach((i) => { if (i !== el) i.value = value.toLowerCase(); });
      if (path === 'profile.bio') $('#bio-count').textContent = `${value.length}/240`;
      if (path === 'theme.bg.angle') $('#angle-out').textContent = value + '°';
      if (path === 'theme.bg.dim') $('#dim-out').textContent = value + '%';
      if (path.startsWith('theme.')) document.querySelectorAll('.theme-card.on').forEach((c) => c.classList.remove('on'));
    } else if (el.dataset.bid) {
      const b = findBlock(el.dataset.bid);
      const field = el.dataset.field;
      b[field] = el.type === 'checkbox' ? el.checked : el.value;
      if (field === 'active') el.closest('.block').classList.toggle('off', !el.checked);
    } else if (el.dataset.sidx) {
      state.socials[+el.dataset.sidx][el.dataset.field] = el.value;
      if (el.dataset.field === 'type') renderProfile();
    } else {
      return;
    }
    changed();
  });

  panel.addEventListener('change', (e) => {
    if (e.target.type === 'file') handleFile(e.target);
  });

  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (tab) return setTab(tab.dataset.tab);
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const card = el.closest('.block');
    const b = card ? findBlock(card.dataset.bid) : null;
    const i = b ? state.blocks.indexOf(b) : -1;

    switch (el.dataset.act) {
      case 'seg':
        setPath(el.dataset.path, el.dataset.value);
        el.dataset.path.startsWith('profile.') ? renderProfile() : renderAppearance();
        break;
      case 'theme':
        state.theme = clone(THEMES.find((t) => t.id === el.dataset.theme).theme);
        renderAppearance();
        break;
      case 'photo-del':
        state.profile.photo = '';
        renderProfile();
        break;
      case 'social-add':
        state.socials.push({ type: 'instagram', url: '' });
        renderProfile();
        $('#pane-profile .social-row:last-of-type input').focus();
        break;
      case 'social-del':
        state.socials.splice(+el.dataset.idx, 1);
        renderProfile();
        break;
      case 'add': {
        const nb = newBlock(el.dataset.type);
        state.blocks.unshift(nb);
        renderLinks();
        const first = $(`#blocks [data-bid="${nb.id}"] input[type=text]`);
        if (first) first.focus();
        break;
      }
      case 'up':
      case 'down': {
        const j = el.dataset.act === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= state.blocks.length) return;
        [state.blocks[i], state.blocks[j]] = [state.blocks[j], state.blocks[i]];
        renderLinks();
        break;
      }
      case 'del':
        if (!confirm('¿Eliminar este bloque?')) return;
        state.blocks.splice(i, 1);
        renderLinks();
        break;
      case 'thumb-del':
        b.thumb = '';
        b.featured = false;
        renderLinks();
        break;
      case 'bg-del':
        state.theme.bg.image = '';
        renderAppearance();
        break;
      case 'import':
        $('#import-file').click();
        return;
      case 'export-json':
        download(JSON.stringify(state), 'mi-pagina-links.json', 'application/json');
        toast('Proyecto exportado: guárdalo para editarlo después');
        return;
      case 'reset':
        if (!confirm('¿Borrar todo y volver al ejemplo inicial?')) return;
        state = defaults();
        renderAll();
        break;
      case 'open-full': {
        const url = URL.createObjectURL(new Blob([buildDoc(state, false)], { type: 'text/html' }));
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        return;
      }
      case 'download': {
        const html = buildDoc(state, false);
        download(html, 'index.html', 'text/html');
        const size = new Blob([html]).size;
        toast(size > 8 * 1024 * 1024
          ? `index.html descargado (${fmtSize(size)}). Es pesado: considera comprimir el PDF o las imágenes.`
          : `index.html descargado (${fmtSize(size)}). Súbelo a Netlify, Vercel o GitHub Pages.`, size > 8 * 1024 * 1024);
        return;
      }
      default:
        return;
    }
    changed();
  });

  $('#import-file').addEventListener('change', (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) importFile(f);
  });

  /* Arrastrar y soltar bloques (solo desde el asa) */
  const linksPane = $('#pane-links');
  let dragId = null;
  const clearMarks = () => linksPane.querySelectorAll('.drop-before,.drop-after').forEach((c) => c.classList.remove('drop-before', 'drop-after'));
  function dropTarget(y) {
    const cards = [...linksPane.querySelectorAll('.block:not(.dragging)')];
    const before = cards.find((c) => { const r = c.getBoundingClientRect(); return y < r.top + r.height / 2; });
    return { before, last: cards[cards.length - 1] };
  }
  linksPane.addEventListener('pointerdown', (e) => {
    const h = e.target.closest('.handle');
    if (h) h.closest('.block').draggable = true;
  });
  linksPane.addEventListener('pointerup', () => {
    if (!dragId) linksPane.querySelectorAll('.block[draggable=true]').forEach((c) => { c.draggable = false; });
  });
  linksPane.addEventListener('dragstart', (e) => {
    const card = e.target.closest && e.target.closest('.block');
    if (!card || !card.draggable) return;
    dragId = card.dataset.bid;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragId);
  });
  linksPane.addEventListener('dragover', (e) => {
    if (!dragId) return;
    e.preventDefault();
    clearMarks();
    const { before, last } = dropTarget(e.clientY);
    if (before) before.classList.add('drop-before');
    else if (last) last.classList.add('drop-after');
  });
  linksPane.addEventListener('drop', (e) => {
    if (!dragId) return;
    e.preventDefault();
    const { before } = dropTarget(e.clientY);
    const moved = state.blocks.splice(state.blocks.findIndex((x) => x.id === dragId), 1)[0];
    const at = before ? state.blocks.findIndex((x) => x.id === before.dataset.bid) : state.blocks.length;
    state.blocks.splice(at, 0, moved);
    dragId = null;
    renderLinks();
    changed();
  });
  linksPane.addEventListener('dragend', () => {
    dragId = null;
    clearMarks();
    linksPane.querySelectorAll('.block').forEach((c) => { c.draggable = false; c.classList.remove('dragging'); });
  });

  /* ---------- Inicio ---------- */
  (async () => {
    const draft = await loadDraft();
    if (draft && draft.profile) {
      state = migrate(draft);
      $('#status').textContent = 'Borrador recuperado';
    }
    renderAll();
    initPreview();
  })();
})();
