/* Motor de render compartido por la vista previa del editor y la página exportada.
   Todo vive dentro de LPFactory para poder incrustarlo en el HTML exportado con LPFactory.toString(),
   así que no puede depender de nada externo. */
function LPFactory() {
  var SINGLE_WEIGHT = { 'Bebas Neue': 1, 'Pacifico': 1 };
  var QR_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';

  var ICONS = {
    whatsapp: '<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>',
    tiktok: '<path d="M9 12a4 4 0 1 0 4 4V3c.5 2.5 2.5 4.5 5 4.5"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    youtube: '<path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
    x: '<path d="M4 4l11.7 16H20L8.3 4z"/><path d="M4 20l6.8-6.8m2.4-2.4L20 4"/>',
    threads: '<path d="M19 7.5C17.7 4.5 15.3 3 12 3 7 3 4 5.5 4 12s3.5 9 8 9 7-3 7-5-1-5-7-5c-2.5 0-3 1.25-3 2.5 0 1.5 1 2.5 2.5 2.5 2.5 0 3.5-1.5 3.5-5s-2-4-3-4-1.8.3-2.5 1"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    spotify: '<circle cx="12" cy="12" r="10"/><path d="M7.5 9.2c3.3-1.1 7.2-.8 10 .9M8 12.4c2.7-.8 5.8-.6 8 .8M8.6 15.5c2-.5 4.2-.4 5.9.6"/>',
    email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    web: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    more: '<circle cx="12" cy="5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="19" r="1.3" fill="currentColor"/>',
    pdf: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>'
  };

  var SOCIALS = {
    whatsapp: 'WhatsApp', instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook',
    youtube: 'YouTube', x: 'X (Twitter)', threads: 'Threads', linkedin: 'LinkedIn',
    spotify: 'Spotify', email: 'Email', web: 'Sitio web'
  };

  var RADIUS = { square: [4, 6, 2], rounded: [14, 20, 10], pill: [999, 26, 999] };

  var CSS = [
    '*,*::before,*::after{box-sizing:border-box}',
    'html,body{margin:0}',
    '[hidden]{display:none!important}',
    '.lp-page{min-height:100vh;min-height:100dvh;background:var(--lp-bg);color:var(--lp-text);font-family:var(--lp-font-body),system-ui,sans-serif;position:relative;overflow-x:hidden;-webkit-font-smoothing:antialiased}',
    '.lp-col{position:relative;max-width:580px;margin:0 auto;min-height:100vh;min-height:100dvh;padding-bottom:56px;overflow:hidden}',
    '@media (min-width:640px){.lp-page::before{content:"";position:fixed;inset:0;background:rgba(0,0,0,.28);pointer-events:none}.lp-col{background:var(--lp-bg);margin-top:18px;border-radius:24px 24px 0 0;min-height:calc(100vh - 18px);box-shadow:0 10px 40px rgba(0,0,0,.25)}}',
    '.lp-topbar{position:absolute;top:14px;right:14px;z-index:3}',
    '.lp-iconbtn{width:34px;height:34px;border-radius:50%;border:0;background:rgba(0,0,0,.35);color:#fff;display:grid;place-items:center;cursor:pointer;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}',
    '.lp-iconbtn svg{width:16px;height:16px}',
    'svg.lp-i{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
    '.lp-cover{position:relative;width:100%;aspect-ratio:1/1;max-height:560px}',
    '.lp-cover img{width:100%;height:100%;object-fit:cover;display:block;-webkit-mask-image:linear-gradient(to bottom,#000 50%,transparent 97%);mask-image:linear-gradient(to bottom,#000 50%,transparent 97%)}',
    '.lp-head{position:relative;text-align:center;padding:56px 24px 0}',
    '.lp-head.on-cover{margin-top:-84px;padding-top:0}',
    '.lp-avatar{width:96px;height:96px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 14px}',
    '.lp-initials{width:96px;height:96px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center;background:var(--lp-btn);color:var(--lp-btn-text);font-family:var(--lp-font-title),serif;font-size:36px;font-weight:700}',
    '.lp-name{font-family:var(--lp-font-title),serif;font-size:clamp(24px,6.5vw,30px);font-weight:700;line-height:1.15;margin:0 0 8px;overflow-wrap:anywhere}',
    '.lp-bio{font-size:14px;line-height:1.45;margin:0 auto;max-width:420px;white-space:pre-line;overflow-wrap:anywhere}',
    '.lp-socials{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:14px}',
    '.lp-social{width:34px;height:34px;display:grid;place-items:center;color:inherit;transition:transform .15s}',
    '.lp-social:hover{transform:scale(1.12)}',
    '.lp-social svg{width:24px;height:24px}',
    '.lp-blocks{display:flex;flex-direction:column;gap:14px;padding:30px 16px 0}',
    '.lp-item{position:relative}',
    '.lp-btn{position:relative;display:flex;align-items:center;justify-content:center;min-height:58px;padding:8px 54px;border:2px solid transparent;border-radius:var(--lp-r);background:var(--lp-btn);color:var(--lp-btn-text);text-decoration:none;text-align:center;font-weight:600;font-size:15px;line-height:1.3;cursor:pointer;transition:transform .15s,box-shadow .15s;overflow-wrap:anywhere}',
    '.lp-btn:hover{transform:scale(1.02)}',
    '[data-btn=outline] .lp-btn{background:transparent;border-color:var(--lp-btn)}',
    '[data-btn=outline] .lp-btn:hover{background:rgba(255,255,255,.12)}',
    '[data-btn=hard] .lp-btn{border-color:var(--lp-text);box-shadow:4px 4px 0 var(--lp-text)}',
    '[data-btn=hard] .lp-btn:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--lp-text)}',
    '[data-btn=soft] .lp-btn{box-shadow:0 6px 18px rgba(0,0,0,.16)}',
    '.lp-thumb{position:absolute;left:6px;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:var(--lp-rt);overflow:hidden;display:grid;place-items:center}',
    '.lp-thumb img{width:100%;height:100%;object-fit:cover;display:block}',
    '.lp-thumb svg{width:24px;height:24px}',
    '.lp-more{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:36px;height:36px;border:0;border-radius:50%;background:transparent;color:var(--lp-btn-text);opacity:.75;display:grid;place-items:center;cursor:pointer}',
    '.lp-more:hover{opacity:1;background:rgba(127,127,127,.18)}',
    '.lp-more svg{width:18px;height:18px}',
    '.lp-btn.lp-feat{flex-direction:column;padding:8px 8px 16px;border-radius:var(--lp-rf)}',
    '.lp-feat-img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;border-radius:calc(var(--lp-rf) - 6px);margin-bottom:14px}',
    '.lp-item.feat .lp-more{top:auto;bottom:10px;transform:none}',
    '.lp-header{font-family:var(--lp-font-title),serif;text-align:center;font-size:17px;font-weight:700;margin:12px 0 0}',
    '.lp-qr{position:fixed;right:16px;bottom:16px;z-index:5;text-align:center;font:600 11px system-ui,sans-serif;color:#fff;display:none}',
    '@media (min-width:900px){.lp-qr.on{display:block}}',
    '.lp-qr-box{background:#fff;padding:6px;border-radius:8px;margin-top:5px;line-height:0}',
    '.lp-qr-box img,.lp-qr-box canvas{width:84px;height:84px}',
    '.lp-modal{position:fixed;inset:0;z-index:10;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px}',
    '.lp-modal-box{width:100%;max-width:860px;height:min(88vh,920px);background:#fff;color:#111;border-radius:16px;overflow:hidden;display:flex;flex-direction:column}',
    '.lp-modal-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #eee}',
    '.lp-modal-title{flex:1 1 160px;min-width:0;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.lp-pill{border:1px solid #ddd;background:#fff;color:#111;border-radius:999px;padding:7px 14px;font:600 13px system-ui,sans-serif;text-decoration:none;cursor:pointer}',
    '.lp-pill.dark{background:#111;color:#fff;border-color:#111}',
    '.lp-modal iframe{flex:1;border:0;width:100%;background:#f3f3f3}',
    '.lp-modal-note{flex:1;display:grid;place-items:center;padding:24px;text-align:center;color:#555}',
    '.lp-toast{position:fixed;left:50%;bottom:24px;z-index:20;transform:translate(-50%,16px);background:#111;color:#fff;padding:10px 18px;border-radius:999px;font:500 14px system-ui,sans-serif;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s}',
    '.lp-toast.on{opacity:1;transform:translate(-50%,0)}'
  ].join('\n');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function icon(name, cls) {
    return '<svg class="lp-i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.web) + '</svg>';
  }

  function normalizeUrl(type, url) {
    url = String(url || '').trim();
    if (!url) return '';
    if (type === 'email' && !/^mailto:/i.test(url)) return 'mailto:' + url;
    if (type === 'whatsapp' && /^\+?[\d\s()-]{6,}$/.test(url)) return 'https://wa.me/' + url.replace(/\D/g, '');
    if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return '';
    return 'https://' + url.replace(/^\/+/, '');
  }

  function bgCss(bg) {
    bg = bg || {};
    var color = bg.color || '#ffffff';
    if (bg.type === 'gradient') return 'linear-gradient(' + (bg.angle || 180) + 'deg,' + color + ',' + (bg.color2 || color) + ')';
    if (bg.type === 'image' && bg.image) {
      var d = (bg.dim || 0) / 100;
      return 'linear-gradient(rgba(0,0,0,' + d + '),rgba(0,0,0,' + d + ')),url("' + bg.image + '") center/cover no-repeat,' + color;
    }
    return color;
  }

  function fontsHref(t) {
    var fams = [t.fontTitle, t.fontBody].filter(function (f, i, a) { return f && a.indexOf(f) === i; });
    if (!fams.length) return '';
    return 'https://fonts.googleapis.com/css2?' + fams.map(function (f) {
      return 'family=' + f.replace(/ /g, '+') + (SINGLE_WEIGHT[f] ? '' : ':wght@400;500;600;700');
    }).join('&') + '&display=swap';
  }

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase() || '?';
  }

  function blockHtml(b) {
    var more = function (url) {
      return url ? '<button class="lp-more" type="button" data-act="copy" data-url="' + esc(url) + '" aria-label="Copiar enlace">' + icon('more') + '</button>' : '';
    };
    if (b.type === 'header') {
      return b.text ? '<h2 class="lp-header">' + esc(b.text) + '</h2>' : '';
    }
    if (b.type === 'pdf') {
      var thumb = b.thumb ? '<img src="' + esc(b.thumb) + '" alt="">' : icon('pdf');
      return '<div class="lp-item"><a class="lp-btn" href="#" data-act="pdf" data-id="' + esc(b.id) + '">' +
        '<span class="lp-thumb">' + thumb + '</span><span class="lp-label">' + esc(b.title || 'Documento PDF') + '</span></a></div>';
    }
    if (!b.title && !b.url) return '';
    var href = normalizeUrl('link', b.url);
    var attrs = 'class="lp-btn' + (b.featured && b.thumb ? ' lp-feat' : '') + '" href="' + esc(href || '#') + '" target="_blank" rel="noopener"';
    if (b.featured && b.thumb) {
      return '<div class="lp-item feat"><a ' + attrs + '><img class="lp-feat-img" src="' + esc(b.thumb) + '" alt="">' +
        '<span class="lp-label">' + esc(b.title || href) + '</span></a>' + more(href) + '</div>';
    }
    return '<div class="lp-item"><a ' + attrs + '>' +
      (b.thumb ? '<span class="lp-thumb"><img src="' + esc(b.thumb) + '" alt=""></span>' : '') +
      '<span class="lp-label">' + esc(b.title || href) + '</span></a>' + more(href) + '</div>';
  }

  function pageHtml(cfg) {
    var p = cfg.profile || {}, t = cfg.theme || {};
    var r = RADIUS[t.shape] || RADIUS.rounded;
    var vars = [
      '--lp-bg:' + bgCss(t.bg),
      '--lp-text:' + (t.text || '#111'),
      '--lp-btn:' + (t.btnBg || '#111'),
      '--lp-btn-text:' + (t.btnText || '#fff'),
      "--lp-font-title:'" + (t.fontTitle || 'DM Sans') + "'",
      "--lp-font-body:'" + (t.fontBody || 'DM Sans') + "'",
      '--lp-r:' + r[0] + 'px', '--lp-rf:' + r[1] + 'px', '--lp-rt:' + (r[2] === 999 ? '50%' : r[2] + 'px')
    ].join(';');
    var cover = p.photo && p.photoMode !== 'avatar';

    var socials = (cfg.socials || []).map(function (s) {
      var href = normalizeUrl(s.type, s.url);
      return href ? '<a class="lp-social" href="' + esc(href) + '" target="_blank" rel="noopener" aria-label="' + esc(SOCIALS[s.type] || s.type) + '">' + icon(s.type) + '</a>' : '';
    }).join('');

    var blocks = (cfg.blocks || []).filter(function (b) { return b.active !== false; }).map(blockHtml).join('');

    return '<div class="lp-page" data-btn="' + esc(t.style || 'fill') + '" style="' + esc(vars) + '"><main class="lp-col">' +
      '<div class="lp-topbar"><button class="lp-iconbtn" type="button" data-act="share" aria-label="Compartir">' + icon('share') + '</button></div>' +
      (cover ? '<div class="lp-cover"><img src="' + esc(p.photo) + '" alt="' + esc(p.name) + '"></div>' : '') +
      '<header class="lp-head' + (cover ? ' on-cover' : '') + '">' +
      (cover ? '' : p.photo ? '<img class="lp-avatar" src="' + esc(p.photo) + '" alt="' + esc(p.name) + '">' : '<div class="lp-initials">' + esc(initials(p.name)) + '</div>') +
      '<h1 class="lp-name">' + esc(p.name) + '</h1>' +
      (p.bio ? '<p class="lp-bio">' + esc(p.bio) + '</p>' : '') +
      (socials ? '<nav class="lp-socials">' + socials + '</nav>' : '') +
      '</header><section class="lp-blocks">' + blocks + '</section></main>' +
      '<div class="lp-modal" hidden><div class="lp-modal-box" role="dialog" aria-modal="true"><div class="lp-modal-bar">' +
      '<span class="lp-modal-title"></span><a class="lp-pill" data-role="open" target="_blank" rel="noopener">Abrir</a>' +
      '<a class="lp-pill dark" data-role="download">Descargar</a>' +
      '<button class="lp-iconbtn" type="button" data-act="close" aria-label="Cerrar" style="background:#111">' + icon('close') + '</button></div>' +
      '<iframe title="Documento PDF"></iframe><div class="lp-modal-note" hidden>Tu navegador no muestra PDFs aquí. Usa “Abrir” o “Descargar”.</div></div></div>' +
      '<div class="lp-toast" role="status"></div></div>';
  }

  function dataUrlToBlob(d) {
    var parts = d.split(','), mime = (parts[0].match(/:(.*?);/) || [])[1] || 'application/pdf';
    var bin = atob(parts[1]), n = bin.length, u = new Uint8Array(n);
    while (n--) u[n] = bin.charCodeAt(n);
    return new Blob([u], { type: mime });
  }

  function mount(root, config, opts) {
    opts = opts || {};
    var cfg = config, blobs = {}, toastTimer;

    if (!document.getElementById('lp-style')) {
      var st = document.createElement('style');
      st.id = 'lp-style';
      st.textContent = CSS;
      document.head.appendChild(st);
    }

    function ensureFonts(t) {
      var href = fontsHref(t || {});
      var link = document.getElementById('lp-fonts');
      if (!link) {
        link = document.createElement('link');
        link.id = 'lp-fonts';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      if (link.getAttribute('href') !== href) link.setAttribute('href', href);
    }

    function toast(msg) {
      var el = root.querySelector('.lp-toast');
      if (!el) return;
      el.textContent = msg;
      el.classList.add('on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { el.classList.remove('on'); }, 1800);
    }

    function copy(text) {
      var done = function () { toast('Enlace copiado'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    }

    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* sin portapapeles */ }
      ta.remove();
    }

    function pdfUrl(b) {
      var c = blobs[b.id];
      if (c && c.src === b.file) return c.url;
      if (c) URL.revokeObjectURL(c.url);
      var url = URL.createObjectURL(dataUrlToBlob(b.file));
      blobs[b.id] = { src: b.file, url: url };
      return url;
    }

    function openPdf(b) {
      if (!b.file) return toast('Este botón aún no tiene un PDF');
      var url = pdfUrl(b), name = b.fileName || 'documento.pdf';
      if (b.mode === 'download') {
        var a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      var m = root.querySelector('.lp-modal');
      var frame = m.querySelector('iframe'), note = m.querySelector('.lp-modal-note');
      m.querySelector('.lp-modal-title').textContent = b.title || name;
      m.querySelector('[data-role=open]').href = url;
      var dl = m.querySelector('[data-role=download]');
      dl.href = url;
      dl.download = name;
      var inline = navigator.pdfViewerEnabled !== false;
      frame.hidden = !inline;
      note.hidden = inline;
      if (inline) frame.src = url;
      m.hidden = false;
    }

    function closeModal() {
      var m = root.querySelector('.lp-modal');
      if (!m || m.hidden) return;
      m.hidden = true;
      m.querySelector('iframe').src = 'about:blank';
    }

    root.addEventListener('click', function (e) {
      if (e.target.classList && e.target.classList.contains('lp-modal')) return closeModal();
      var el = e.target.closest('[data-act]');
      if (!el) return;
      var act = el.getAttribute('data-act');
      if (act === 'copy') { e.preventDefault(); copy(el.getAttribute('data-url')); }
      if (act === 'close') closeModal();
      if (act === 'share') {
        var data = { title: (cfg.profile || {}).name || document.title, url: location.href };
        if (navigator.share && /^https?:/.test(location.protocol)) navigator.share(data).catch(function () {});
        else copy(location.href);
      }
      if (act === 'pdf') {
        e.preventDefault();
        var id = el.getAttribute('data-id');
        var b = (cfg.blocks || []).filter(function (x) { return x.id === id; })[0];
        if (b) openPdf(b);
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

    function update(next) {
      cfg = next;
      var t = cfg.theme || {};
      ensureFonts(t);
      root.innerHTML = pageHtml(cfg);
      document.body.style.background = (t.bg && t.bg.color) || '#fff';
    }

    function setupQr() {
      if (!/^https?:/.test(location.protocol)) return;
      var wrap = document.createElement('div');
      wrap.className = 'lp-qr';
      wrap.innerHTML = 'Ver en el móvil<div class="lp-qr-box"></div>';
      document.body.appendChild(wrap);
      var s = document.createElement('script');
      s.src = QR_SRC;
      s.async = true;
      s.onload = function () {
        try {
          new window.QRCode(wrap.querySelector('.lp-qr-box'), { text: location.href, width: 168, height: 168 });
          wrap.classList.add('on');
        } catch (e) { /* sin QR */ }
      };
      document.head.appendChild(s);
    }

    update(cfg);
    if (!opts.preview) setupQr();
    return { update: update };
  }

  return { mount: mount, icon: icon, socials: SOCIALS, initials: initials, bgCss: bgCss };
}
