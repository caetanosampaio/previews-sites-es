/*
 * LP Kit — runtime compartilhado dos previews.
 * Requer (carregados antes): react, react-dom, htm, gsap, ScrollTrigger, Lenis.
 * Uso:  LP.mount(Page, { empresa, whatsapp, mensagem, intro:{title, sub}, letterbox })
 *
 * Animação declarativa por atributos data-*:
 *   data-reveal="up|down|left|right|zoom|mask|maskx"  data-delay="0.2"
 *   data-stagger            -> filhos diretos entram em cascata
 *   data-split [data-hero]  -> título palavra a palavra (máscara)
 *   data-parallax="0.1"     -> parallax (use com .lp-px dentro de container overflow:hidden)
 *   data-kb                 -> Ken Burns lento
 *   data-count="1200" data-prefix="" data-suffix="+"
 *   data-magnetic | data-tilt | data-spot
 *   data-hscroll > [data-track]  -> galeria horizontal fixada
 *   data-draw               -> SVG path que se desenha no scroll
 *   data-sky                -> container cujo --p (0..1) acompanha o scroll da página
 */
(function () {
  var React = window.React, ReactDOM = window.ReactDOM;
  var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef;
  var html = window.htm.bind(React.createElement);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  var LP = { html: html, React: React, cfg: {}, lenis: null };

  LP.wa = function (msg) {
    var c = LP.cfg;
    return 'https://wa.me/' + c.whatsapp + '?text=' + encodeURIComponent(msg || c.mensagem || '');
  };

  /* ---------- Ícones (stroke 24x24) ---------- */
  var ICONS = {
    arrow: 'M5 12h14M12 5l7 7-7 7',
    up: 'M7 17L17 7M7 7h10v10',
    check: 'M20 6L9 17l-5-5',
    phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    bolt: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    spark: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16z',
    scale: 'M12 3v18M5 7h14M5 7l-3 8a4 4 0 0 0 6 0L5 7zM19 7l-3 8a4 4 0 0 0 6 0l-3-8z',
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10zM2 21c0-3 1.85-5.36 5.08-6',
    users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    chart: 'M3 3v18h18M7 14l4-4 4 3 5-6',
    file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8',
    dumbbell: 'M6.5 6.5l11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7',
    car: 'M5 17h14M3 13l2-6h14l2 6v4a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1v-4zM3 13h18',
    paw: 'M8 8.5a1.7 2.2 0 1 0 0-.01zM16 8.5a1.7 2.2 0 1 0 0-.01zM4.5 13a1.6 2 0 1 0 0-.01zM19.5 13a1.6 2 0 1 0 0-.01zM12 12c-3 0-5.5 3-5.5 5.5 0 1.8 1.5 2.5 3 2.5 1 0 1.6-.5 2.5-.5s1.5.5 2.5.5c1.5 0 3-.7 3-2.5C17.5 15 15 12 12 12z',
    scissors: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12',
    drop: 'M12 2.7l5.7 5.7a8 8 0 1 1-11.4 0L12 2.7z',
    fish: 'M2 12c3-5 8-7 13-5l5 5-5 5c-5 2-10 0-13-5zM17 12h.01',
    glass: 'M8 22h8M12 15v7M5 3h14l-1 7a6 6 0 0 1-12 0L5 3z',
    sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
    smile: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
    calendar: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18',
    chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6'
  };
  var WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

  LP.Ico = function (p) {
    var size = p.size || 22;
    if (p.name === 'wa') {
      return html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className=${p.className}><path d=${WA_PATH}/></svg>`;
    }
    return html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth=${p.sw || 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className=${p.className}><path d=${ICONS[p.name] || ICONS.star}/></svg>`;
  };

  /* ---------- Componentes ---------- */
  LP.Img = function (p) {
    return html`<img src=${p.src} alt=${p.alt || ''} loading=${p.eager ? 'eager' : 'lazy'} decoding="async"
      className=${p.className || ''} style=${p.style} data-parallax=${p.parallax} data-kb=${p.kb}
      onError=${function (ev) { ev.target.classList.add('img-fail'); }} />`;
  };

  LP.Marquee = function (p) {
    var items = p.items || [];
    var row = items.concat(items);
    return html`<div className=${'lp-marquee ' + (p.className || '')} style=${{ '--dur': (p.speed || 30) + 's' }} aria-hidden="true">
      <div className="lp-marquee-track">
        ${[0, 1].map(function (k) {
          return html`<div className="lp-marquee-row" key=${k}>
            ${row.map(function (t, i) { return html`<span key=${i} className="lp-marquee-item">${t}<i className="lp-marquee-dot"></i></span>`; })}
          </div>`;
        })}
      </div>
    </div>`;
  };

  LP.WaButton = function (p) {
    return html`<a className=${'lp-btn ' + (p.className || '')} href=${LP.wa(p.msg)} target="_blank" rel="noopener" data-magnetic=${p.magnetic === false ? undefined : ''}>
      <${LP.Ico} name="wa" size=${p.size || 20} /> <span>${p.children || 'Chamar no WhatsApp'}</span>
    </a>`;
  };

  function Intro(p) {
    var cfg = p.cfg, st = useState('in'), phase = st[0], setPhase = st[1];
    useEffect(function () {
      document.documentElement.classList.add('lp-lock');
      var t1 = setTimeout(function () { setPhase('out'); p.onReveal(); }, cfg.introMs || 1900);
      var t2 = setTimeout(function () { document.documentElement.classList.remove('lp-lock'); p.onDone(); }, (cfg.introMs || 1900) + 1000);
      return function () { clearTimeout(t1); clearTimeout(t2); };
    }, []);
    var letters = Array.from(cfg.intro.title);
    return html`<div className=${'lp-intro ' + (phase === 'out' ? 'out' : '')} aria-hidden="true">
      ${cfg.letterbox ? html`<span className="lp-lb lp-lb-t"></span><span className="lp-lb lp-lb-b"></span>` : null}
      <div className="lp-intro-inner">
        <div className="lp-intro-title">
          ${letters.map(function (ch, i) { return html`<span key=${i} style=${{ '--i': i }}>${ch === ' ' ? ' ' : ch}</span>`; })}
        </div>
        ${cfg.intro.sub ? html`<div className="lp-intro-sub">${cfg.intro.sub}</div>` : null}
        <div className="lp-intro-line"><i></i></div>
      </div>
    </div>`;
  }

  /* ---------- Motor de animação ---------- */
  function splitWords(el) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var i = document.createElement('span'); i.className = 'wi'; i.textContent = tok;
            w.appendChild(i); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { walk(n); }
      });
    };
    walk(el);
    return el.querySelectorAll('.wi');
  }

  function bootMotion() {
    var $ = function (s) { return gsap.utils.toArray(s); };

    // Lenis (rolagem suave)
    if (!LP.lenis && window.Lenis) {
      LP.lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
      LP.lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { LP.lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      document.addEventListener('click', function (ev) {
        var a = ev.target.closest && ev.target.closest('a[href^="#"]');
        if (!a) return;
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        ev.preventDefault();
        LP.lenis.scrollTo(t, { offset: -64, duration: 1.4 });
      });
    }

    // Barra de progresso
    var bar = document.querySelector('.lp-progress i');
    if (bar) gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });

    // Navbar
    var nav = document.querySelector('.nav');
    if (nav) ScrollTrigger.create({ start: 40, end: 'max', onUpdate: function (s) { nav.classList.toggle('scrolled', s.scroll() > 40); } });

    // Reveal
    $('[data-reveal]').forEach(function (el) {
      var t = el.getAttribute('data-reveal') || 'up';
      var d = parseFloat(el.getAttribute('data-delay') || 0);
      var st = { trigger: el, start: 'top 90%', once: true };
      if (t === 'mask' || t === 'maskx') {
        var from = t === 'mask' ? 'inset(0 0 100% 0)' : 'inset(0 100% 0 0)';
        var to = 'inset(0 0 0% 0)'; if (t === 'maskx') to = 'inset(0 0% 0 0)';
        gsap.fromTo(el, { clipPath: from }, { clipPath: to, duration: 1.4, ease: 'power4.inOut', delay: d, scrollTrigger: st });
        return;
      }
      var f = { opacity: 0, duration: 1.1, ease: 'power3.out', delay: d, scrollTrigger: st };
      if (t === 'up') f.y = 56; if (t === 'down') f.y = -56; if (t === 'left') f.x = -80; if (t === 'right') f.x = 80;
      if (t === 'zoom') f.scale = 0.9;
      gsap.from(el, f);
    });
    $('[data-stagger]').forEach(function (el) {
      gsap.from(el.children, { opacity: 0, y: 48, duration: 1, ease: 'power3.out', stagger: 0.11, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });

    // Split de títulos
    $('[data-split]').forEach(function (el) {
      var words = splitWords(el);
      var d = parseFloat(el.getAttribute('data-delay') || 0);
      var cfg = { yPercent: 120, rotate: 3, duration: 1.2, ease: 'power4.out', stagger: 0.06, delay: d };
      if (!el.hasAttribute('data-hero')) cfg.scrollTrigger = { trigger: el, start: 'top 88%', once: true };
      gsap.from(words, cfg);
    });

    // Elementos "hero" extras (entram logo após a cortina)
    $('[data-hero-in]').forEach(function (el, i) {
      gsap.from(el, { opacity: 0, y: 30, duration: 1.1, ease: 'power3.out', delay: 0.5 + i * 0.12 });
    });

    // Parallax / Ken Burns
    $('[data-parallax]').forEach(function (el) {
      var s = parseFloat(el.getAttribute('data-parallax')) || 0.08;
      gsap.fromTo(el, { yPercent: -s * 100 }, { yPercent: s * 100, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $('[data-kb]').forEach(function (el) {
      gsap.fromTo(el, { scale: 1.02 }, { scale: 1.16, duration: 24, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });

    // Contadores
    $('[data-count]').forEach(function (el) {
      var raw = el.getAttribute('data-count'); var end = parseFloat(raw);
      var dec = (raw.split('.')[1] || '').length; var o = { v: 0 };
      var pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '';
      el.textContent = pre + (0).toFixed(dec) + suf;
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () {
        gsap.to(o, { v: end, duration: 2.2, ease: 'power2.out', onUpdate: function () { el.textContent = pre + o.v.toFixed(dec).replace('.', ',') + suf; } });
      } });
    });

    // Desenho de SVG no scroll
    $('[data-draw]').forEach(function (p) {
      var len = p.getTotalLength ? p.getTotalLength() : 1000;
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(p, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: p.closest('[data-draw-wrap]') || p, start: 'top 75%', end: 'bottom 40%', scrub: 0.6 } });
    });

    // Céu / progresso global via CSS var
    $('[data-sky]').forEach(function (el) {
      ScrollTrigger.create({ trigger: document.body, start: 0, end: 'max', onUpdate: function (s) { el.style.setProperty('--p', s.progress.toFixed(4)); } });
    });

    // Galeria horizontal
    $('[data-hscroll]').forEach(function (el) {
      var track = el.querySelector('[data-track]'); if (!track) return;
      var dist = function () { return Math.max(0, track.scrollWidth - el.clientWidth); };
      gsap.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: el, pin: true, scrub: 0.6, start: 'top top', end: function () { return '+=' + dist(); }, invalidateOnRefresh: true } });
    });

    // Interações de ponteiro
    if (fine) {
      $('[data-magnetic]').forEach(function (el) {
        var xt = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' }), yt = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
        el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); xt((e.clientX - r.left - r.width / 2) * 0.28); yt((e.clientY - r.top - r.height / 2) * 0.28); });
        el.addEventListener('pointerleave', function () { xt(0); yt(0); });
      });
      $('[data-tilt]').forEach(function (el) {
        var rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' }), ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
        gsap.set(el, { transformPerspective: 900, transformOrigin: 'center' });
        el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 12); rx(-((e.clientY - r.top) / r.height - 0.5) * 12); });
        el.addEventListener('pointerleave', function () { rx(0); ry(0); });
      });
      $('[data-spot]').forEach(function (el) {
        el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
      });
    }

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    setTimeout(function () { ScrollTrigger.refresh(); }, 600);
  }

  /* ---------- Shell ---------- */
  function Shell(p) {
    var cfg = p.cfg;
    var useIntro = !reduce && cfg.intro !== false;
    var st = useState(useIntro), showIntro = st[0], setShowIntro = st[1];
    var bdg = useState(true), showBadge = bdg[0], setBadge = bdg[1];
    useEffect(function () {
      if (reduce) { return; }
      if (!useIntro) bootMotion();
    }, []);
    var reveal = function () { if (!reduce) bootMotion(); };
    return html`<${React.Fragment}>
      <div className="lp-progress" aria-hidden="true"><i></i></div>
      ${p.children}
      <a className="lp-wa" href=${LP.wa()} target="_blank" rel="noopener" aria-label="Falar no WhatsApp">
        <span className="lp-wa-ring"></span>
        <${LP.Ico} name="wa" size=${28} />
        <span className="lp-wa-tip">Fale conosco no WhatsApp</span>
      </a>
      ${showBadge ? html`<div className="lp-badge" role="note">
        <span><b>Prévia de demonstração</b> · criada para ${cfg.empresa}. Textos e depoimentos ilustrativos.</span>
        <button onClick=${function () { setBadge(false); }} aria-label="Fechar aviso">×</button>
      </div>` : null}
      ${showIntro ? html`<${Intro} cfg=${cfg} onReveal=${reveal} onDone=${function () { setShowIntro(false); }} />` : null}
    <//>`;
  }

  LP.mount = function (Page, cfg) {
    LP.cfg = cfg;
    var root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(html`<${Shell} cfg=${cfg}><${Page} /><//>`);
  };

  window.LP = LP;
})();
