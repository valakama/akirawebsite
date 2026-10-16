/* 密林 — Un jour dans la jungle
   GSAP + ScrollTrigger + Lenis, aucune autre dépendance. */

(() => {
  const { gsap, ScrollTrigger, Lenis } = window;
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Sans librairies (CDN bloqué), le site reste lisible.
  if (!gsap || !ScrollTrigger) {
    root.classList.remove('is-loading', 'js');
    $$('img[data-srcset]').forEach((img) => (img.srcset = img.dataset.srcset));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  window.scrollTo(0, 0);

  /* ---------- Utilitaires ---------- */

  // Découpe un texte en caractères masqués : <span class="ch"><span>c</span></span>
  function splitChars(el) {
    const text = el.textContent;
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', text);
    el.innerHTML = [...text]
      .map((c) => (c === ' ' ? ' ' : `<span class="ch" aria-hidden="true"><span>${c}</span></span>`))
      .join('');
    return $$('.ch > span', el);
  }

  // Découpe en mots en conservant les balises inline (<em>)
  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.append(part);
            else {
              const s = document.createElement('span');
              s.className = 'w';
              s.textContent = part;
              frag.append(s);
            }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return $$('.w', el);
  }

  const imgReady = (img) =>
    img.complete && img.naturalWidth
      ? Promise.resolve()
      : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });

  /* ---------- Smooth scroll ---------- */

  let lenis = null;
  if (!reduce && Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  /* ---------- Éléments ---------- */

  const scenes = $$('.scene');
  const inners = scenes.map((s) => $('.scene__inner', s));
  const shades = scenes.map((s) => $('.scene__shade', s));
  const sceneImgs = scenes.map((s) => $('img', s));
  const chapters = $$('.chapter');
  const accents = ['#f4a6a0', '#ff4a2b', '#ff8a3d', '#5ff2d6'];
  const names = ['夜明け — Aube', '真昼 — Midi', '黄昏 — Crépuscule', '夜 — Nuit'];

  // Calques de premier plan : ordre haut, gauche, droite, bas
  const fxLayers = ['.fx__top', '.fx__left', '.fx__right', '.fx__bottom'].map((q) => $(q));
  const fxImgs = fxLayers.map((l) => $('img', l));
  const fxAway = [[0, -1], [-1, 0], [1, 0], [0, 1]]; // direction de sortie de chaque calque
  // Une seule série d'images, teintée pour chaque moment de la journée
  const fxTints = [
    'brightness(0.45) saturate(0.6) hue-rotate(15deg)',  // aube : sombre et brumeux
    'brightness(1) saturate(1.05) hue-rotate(0deg)',     // midi : naturel
    'brightness(0.16) saturate(0.6) hue-rotate(-30deg)', // crépuscule : silhouettes
    'brightness(0.34) saturate(1.3) hue-rotate(40deg)',  // nuit : bleu-vert
  ];

  const heroChars = splitChars($('.hero__title'));
  const heroBits = ['.hero__warn', '.hero__sub', '.hero__tag', '.hero__scroll'];
  const chapterParts = chapters.map((c) => ({
    jp: splitChars($('.chapter__jp', c)),
    fr: splitChars($('.chapter__fr-t', c)),
    band: $('.chapter__fr', c),
    rest: [$('.chapter__time', c), $('.chapter__txt', c)],
  }));

  /* ---------- Loader ---------- */

  const loader = $('.loader');
  const loaderChars = splitChars($('.loader__title', loader));
  const countEl = $('.loader__count', loader);
  const barEl = $('.loader__bar i', loader);

  gsap.set(heroChars, { yPercent: 130 });
  gsap.set([...heroBits, '.hud > *'], { autoAlpha: 0 });
  gsap.set(sceneImgs[0], { scale: 1.35 });
  gsap.set(fxImgs, { filter: fxTints[0] });
  gsap.set(fxLayers, { xPercent: (i) => fxAway[i][0] * 100, yPercent: (i) => fxAway[i][1] * 100 });

  const prog = { v: 0 };
  const renderProg = () => {
    countEl.textContent = String(Math.round(prog.v)).padStart(3, '0');
    barEl.style.transform = `scaleX(${prog.v / 100})`;
  };

  gsap.fromTo(loaderChars, { yPercent: 130 }, { yPercent: 0, stagger: 0.07, duration: reduce ? 0 : 1, ease: 'expo.out' });
  gsap.to(prog, { v: 88, duration: reduce ? 0.2 : 1.8, ease: 'power2.out', onUpdate: renderProg });

  const ready = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    imgReady(sceneImgs[0]).then(loadOtherScenes),
    ...fxImgs.map(imgReady),
    new Promise((r) => setTimeout(r, reduce ? 200 : 1900)),
  ]);
  const cap = new Promise((r) => setTimeout(r, 7000)); // jamais bloqué plus de 7 s

  Promise.race([ready, cap]).then(() => {
    gsap.to(prog, { v: 100, duration: 0.45, ease: 'power2.inOut', onUpdate: renderProg, onComplete: exitLoader });
  });

  function exitLoader() {
    const d = reduce ? 0 : 1;
    gsap.timeline({
      onComplete() {
        loader.remove();
        root.classList.remove('is-loading');
        lenis?.start();
        loadOtherScenes();
        ScrollTrigger.refresh();
      },
    })
      .to(loaderChars, { yPercent: -130, stagger: 0.04, duration: 0.6 * d, ease: 'expo.in' })
      .to(['.loader__meta', '.loader__warn'], { autoAlpha: 0, duration: 0.3 * d }, '<')
      .to('.loader__panel--top', { yPercent: -100, duration: 1.2 * d, ease: 'expo.inOut' })
      .to('.loader__panel--bottom', { yPercent: 100, duration: 1.2 * d, ease: 'expo.inOut' }, '<')
      .to(sceneImgs[0], { scale: 1.08, duration: 2.2 * d, ease: 'expo.out' }, '<0.25')
      .to(fxLayers, { xPercent: 0, yPercent: 0, duration: 2.4 * d, stagger: 0.08, ease: 'expo.out' }, '<0.1')
      .to(heroChars, { yPercent: 0, stagger: 0.06, duration: 1.3 * d, ease: 'expo.out' }, '<0.35')
      .to(heroBits, { autoAlpha: 1, duration: 0.8 * d, stagger: 0.08 }, '<0.4')
      .to('.hud > *', { autoAlpha: 1, duration: 0.8 * d, stagger: 0.05 }, '<');
  }

  // Les scènes 2-4 ne sont téléchargées qu'après l'intro.
  function loadOtherScenes() {
    $$('img[data-srcset]').forEach((img) => {
      img.decoding = 'async';
      img.srcset = img.dataset.srcset;
      img.removeAttribute('data-srcset');
      // Décodage anticipé : évite un à-coup quand la scène s'affiche pour la première fois
      img.decode?.().catch(() => {});
    });
    $$('img[data-src]').forEach((img) => {
      img.decoding = 'async';
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
    petals.load();
  }

  /* ---------- Journée : timeline scrubée ---------- */

  const chapterIn = (i) => {
    const p = chapterParts[i];
    return gsap.timeline()
      .set(p.band, { '--band-origin': 'left' }, 0)
      .fromTo(p.jp, { yPercent: 130 }, { yPercent: 0, stagger: 0.06, duration: 0.6, ease: 'power3.out' }, 0)
      .fromTo(p.band, { '--band': 0 }, { '--band': 1, duration: 0.45, ease: 'power3.inOut' }, 0.05)
      .fromTo(p.fr, { yPercent: 130 }, { yPercent: 0, stagger: 0.02, duration: 0.5, ease: 'power3.out' }, 0.25)
      .fromTo(p.rest, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.4, ease: 'power2.out' }, 0.3);
  };
  const chapterOut = (i) => {
    const p = chapterParts[i];
    return gsap.timeline()
      .to(p.jp, { yPercent: -130, stagger: 0.03, duration: 0.4, ease: 'power2.in' })
      .to(p.fr, { yPercent: -130, stagger: 0.01, duration: 0.35, ease: 'power2.in' }, '<')
      .set(p.band, { '--band-origin': 'right' }, 0.1)
      .to(p.band, { '--band': 0, duration: 0.35, ease: 'power3.in' }, 0.1)
      .to(p.rest, { autoAlpha: 0, y: -12, duration: 0.3 }, 0);
  };

  // Repères (unités de timeline) où chaque chapitre est installé → sert à l'horloge
  const HOLD = 3.2;            // distance entre deux transitions
  const CLOSE = 0.9;           // les murs se referment
  const OPEN_AT = 1.2;         // ils restent fermés un instant, puis s'ouvrent
  const OPEN = 1.1;
  const settled = [1];
  const day = gsap.timeline({ defaults: { ease: 'none' } });

  // Traversée du feuillage : deux murs de feuilles se referment, la scène change derrière, puis ils s'ouvrent
  const crossShade = $('.cross__shade');
  const wallL = $('.cross__wall--l');
  const wallR = $('.cross__wall--r');
  const walls = [wallL, wallR];
  const crossing = (from, to) => {
    const tl = gsap.timeline();
    tl.set(walls, { visibility: 'visible', filter: fxTints[from] }, 0)
      .fromTo(wallL, { xPercent: -125, scale: 1.15 }, { xPercent: 0, scale: 1, duration: CLOSE, ease: 'power2.inOut', immediateRender: false }, 0)
      .fromTo(wallR, { xPercent: 125, scale: 1.15 }, { xPercent: 0, scale: 1, duration: CLOSE, ease: 'power2.inOut', immediateRender: false }, 0)
      .fromTo(crossShade, { opacity: 0 }, { opacity: 0.9, duration: CLOSE * 0.9, immediateRender: false }, 0)
      .to(walls, { filter: fxTints[to], duration: OPEN_AT - CLOSE + 0.2 }, CLOSE - 0.1)
      .to(wallL, { xPercent: -135, scale: 1.3, duration: OPEN, ease: 'power2.inOut' }, OPEN_AT)
      .to(wallR, { xPercent: 135, scale: 1.3, duration: OPEN, ease: 'power2.inOut' }, OPEN_AT)
      .to(crossShade, { opacity: 0, duration: OPEN * 0.8 }, OPEN_AT)
      .set(walls, { visibility: 'hidden' }, OPEN_AT + OPEN);
    return tl;
  };


  // 0 → 1 : le titre s'efface, l'aube s'installe
  // Le scroll anime `y` (px) et le conteneur .hero__meta : l'intro (yPercent / autoAlpha) reste indépendante.
  day.to(heroChars, { y: (i, el) => -el.offsetHeight * 1.3, stagger: 0.03, duration: 0.5, ease: 'power2.in' }, 0)
    .to('.hero__meta', { opacity: 0, duration: 0.3 }, 0)
    .to(root, { '--accent': accents[0], duration: 0.6 }, 0.2)
    .to(inners[0], { scale: 1.06, duration: 2 }, 0)
    .add(chapterIn(0), 0.45);

  for (let i = 1; i < scenes.length; i++) {
    const s = 2 + (i - 1) * HOLD;
    day.add(chapterOut(i - 1), s)
      // Traversée du feuillage : la scène change quand les murs de feuilles se touchent
      .add(crossing(i - 1, i), s)
      .set(scenes[i], { visibility: 'visible' }, s + CLOSE)
      .set(scenes[i - 1], { visibility: 'hidden' }, s + CLOSE + 0.01)
      .fromTo(inners[i], { scale: 1.2, yPercent: 4 }, { scale: 1, yPercent: 0, duration: 1.8, ease: 'power2.out' }, s + CLOSE)
      .to(inners[i - 1], { scale: '+=0.06', duration: CLOSE, ease: 'power2.in' }, s)
      .to(shades[i - 1], { opacity: 0.7, duration: CLOSE, ease: 'power2.in' }, s)
      .to(root, { '--accent': accents[i], duration: 0.8 }, s + CLOSE)
      // Les calques de cadre s'écartent, changent de teinte hors champ, puis reviennent
      .to(fxImgs, { xPercent: (k) => fxAway[k][0] * 80, yPercent: (k) => fxAway[k][1] * 80, scale: 1.18, duration: CLOSE, ease: 'power2.in' }, s)
      .set(fxImgs, { filter: fxTints[i] }, s + CLOSE)
      .to(fxImgs, { xPercent: 0, yPercent: 0, scale: 1, duration: OPEN + 0.2, ease: 'power2.out' }, s + OPEN_AT)
      .add(chapterIn(i), s + OPEN_AT + 0.3);
    settled.push(s + OPEN_AT + 1);
  }
  day.to(inners[3], { scale: 1.05, duration: HOLD }, 2 + 2 * HOLD + CLOSE + 1.8);
  day.to({}, { duration: 0.3 }); // respiration finale

  const total = day.duration();

  // Horloge : 05:00 → 05:40 → 12:00 → 18:30 → 23:50 → 23:59
  const clockKeys = [
    [0, 300],
    ...settled.map((t, i) => [t / total, [340, 720, 1110, 1430][i]]),
    [1, 1439],
  ];
  const minutesAt = (p) => {
    for (let k = 1; k < clockKeys.length; k++) {
      const [p0, m0] = clockKeys[k - 1];
      const [p1, m1] = clockKeys[k];
      if (p <= p1) return m0 + ((p - p0) / (p1 - p0 || 1)) * (m1 - m0);
    }
    return 1439;
  };

  const timeEl = $('.hud__time');
  const chapEl = $('.hud__chapter');
  const numEl = $('.hud__num');
  const hand = $('.dial__hand');
  const tcEl = $('.hud__tc');
  const tempEl = $('.hud__temp');
  const humEl = $('.hud__hum');
  const statusEl = $('.hud__status');
  const rail = $('.hud__rail');
  const climate = [
    [24, 96, '状態 — 霧 Brume'],
    [33, 72, '状態 — 晴 Soleil'],
    [29, 80, '状態 — 夕焼 Contre-jour'],
    [22, 93, '状態 — 闇 Obscurité'],
  ];
  let lastChap = -2;

  function updateHud(p) {
    const m = minutesAt(p);
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(Math.floor(m % 60)).padStart(2, '0');
    timeEl.textContent = `${hh}:${mm}`;
    hand.style.transform = `rotate(${(m / 1440) * 360}deg)`;
    const ss = String(Math.floor((m * 60) % 60)).padStart(2, '0');
    const ff = String(Math.floor((m * 1440) % 24)).padStart(2, '0');
    tcEl.textContent = `TC ${hh}:${mm}:${ss}:${ff}`;
    rail.style.setProperty('--p', p.toFixed(3));

    const t = p * total;
    let c = -1;
    if (t > 0.6) c = 0;
    for (let i = 1; i < settled.length; i++) if (t > settled[i] - 0.7) c = i;
    if (c !== lastChap) {
      lastChap = c;
      numEl.textContent = String(c + 1).padStart(2, '0');
      chapEl.textContent = names[Math.max(c, 0)];
      const [temp, hum, status] = climate[Math.max(c, 0)];
      tempEl.textContent = temp; humEl.textContent = hum; statusEl.textContent = status;
    }
    fireflies.active = t > settled[3] - 1.2;
    // Pétales : montent pendant l'arrivée de midi, disparaissent avant le crépuscule
    const ramp = (a, b) => Math.min(Math.max((t - a) / (b - a), 0), 1);
    petals.level = ramp(2 + CLOSE, 2 + OPEN_AT + 0.6) * (1 - ramp(2 + HOLD - 0.2, 2 + HOLD + CLOSE));
  }

  /* ---------- Séparation RVB façon VHS, proportionnelle à la vitesse de scroll ---------- */

  if (lenis) {
    const targets = [$('.hero__title'), $('.outro__title'), ...$$('.chapter__jp')];
    let rgb = 0, shown = -1;
    lenis.on('scroll', ({ velocity }) => { rgb = Math.max(rgb, Math.min(Math.abs(velocity) * 0.3, 6)); });
    gsap.ticker.add(() => {
      rgb *= 0.86;
      const v = rgb < 0.4 ? 0 : Math.round(rgb * 2) / 2;
      if (v !== shown) { shown = v; targets.forEach((el) => el.style.setProperty('--rgb', v)); }
    });
  }

  /* ---------- Lucioles (canvas, seulement la nuit) ---------- */

  const fireflies = (() => {
    const cv = $('.fireflies');
    const ctx = cv.getContext('2d');
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const sc = sprite.getContext('2d');
    const g = sc.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(230,255,220,1)');
    g.addColorStop(0.25, 'rgba(170,255,200,.8)');
    g.addColorStop(1, 'rgba(90,240,200,0)');
    sc.fillStyle = g;
    sc.fillRect(0, 0, 32, 32);

    const count = innerWidth < 720 ? 26 : 48;
    const flies = Array.from({ length: count }, () => ({
      x: Math.random(), y: 0.3 + Math.random() * 0.65,
      r: 6 + Math.random() * 12, ph: Math.random() * 6.28,
      sp: 0.4 + Math.random() * 0.9,
      vx: (Math.random() - 0.5) * 0.00025, vy: (Math.random() - 0.5) * 0.0002,
    }));
    let W = 0, H = 0, raf = 0, on = false;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const frame = (t) => {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (const f of flies) {
        f.x += f.vx + Math.sin(t * 0.0004 + f.ph) * 0.00025;
        f.y += f.vy + Math.cos(t * 0.0003 + f.ph) * 0.0002;
        if (f.x < -0.05) f.x = 1.05; else if (f.x > 1.05) f.x = -0.05;
        if (f.y < 0.2) f.y = 0.98; else if (f.y > 1) f.y = 0.22;
        ctx.globalAlpha = 0.15 + 0.85 * Math.pow(Math.abs(Math.sin(t * 0.001 * f.sp + f.ph)), 3);
        ctx.drawImage(sprite, f.x * W - f.r / 2, f.y * H - f.r / 2, f.r, f.r);
      }
      raf = requestAnimationFrame(frame);
    };

    addEventListener('resize', resize);
    resize();
    return {
      set active(v) {
        if (reduce || v === on) return;
        on = v;
        cv.classList.toggle('is-on', on);
        if (on) { resize(); raf = requestAnimationFrame(frame); }
        else { cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); }
      },
    };
  })();

  /* ---------- Pétales de flamboyant (canvas, sprites découpés dans une planche) ---------- */

  const petals = (() => {
    const cv = $('.petals');
    const ctx = cv.getContext('2d');
    // [x, y, w, h] de chaque pétale dans assets/layers/petals-atlas.webp
    const RECTS = [[0,0,123,128],[127,0,128,110],[259,0,113,128],[376,0,87,128],[467,0,128,118],[599,0,128,113],[0,132,94,128],[98,132,105,128],[207,132,128,113],[339,132,117,128],[460,132,128,120],[592,132,119,128],[0,264,100,128],[104,264,127,128],[235,264,128,70],[367,264,128,127],[499,264,128,71],[631,264,105,128],[0,396,100,128],[104,396,85,128],[193,396,124,128],[321,396,115,128],[440,396,128,110]];
    const atlas = new Image();
    const count = innerWidth < 720 ? 18 : 36;
    const list = Array.from({ length: count }, () => ({}));
    let W = 0, H = 0, dpr = 1, raf = 0, last = 0, level = 0, push = 0, running = false;

    // z = profondeur : les pétales proches sont plus gros, plus rapides et plus opaques
    const spawn = (p, anywhere) => {
      p.z = 0.35 + Math.random() * 0.9;
      p.r = RECTS[(Math.random() * RECTS.length) | 0];
      p.size = (32 + Math.random() * 42) * p.z * (W < 720 ? 0.8 : 1);
      p.x = anywhere ? Math.random() * W : W * (0.15 + Math.random());
      p.y = anywhere ? Math.random() * H : -p.size - Math.random() * H * 0.4;
      p.vx = -(20 + Math.random() * 35) * p.z;
      p.vy = (45 + Math.random() * 45) * p.z;
      p.rot = Math.random() * 6.28; p.vr = (Math.random() - 0.5) * 2.2;
      p.flip = Math.random() * 6.28; p.vf = 1.2 + Math.random() * 2.4;
      p.sway = Math.random() * 6.28;
    };
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
    };
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const p of list) {
        p.sway += dt * 1.3; p.rot += p.vr * dt; p.flip += p.vf * dt;
        p.x += (p.vx + Math.sin(p.sway) * 24 * p.z) * dt;
        p.y += (p.vy + push * p.z) * dt;
        if (p.y > H + p.size || p.x < -p.size * 2 || p.y < -H) spawn(p, false);
        const [sx, sy, sw, sh] = p.r;
        const k = p.size / Math.max(sw, sh);
        const f = Math.cos(p.flip); // rotation 3D simulée : le pétale se retourne
        const fx = (f < 0 ? -1 : 1) * Math.max(Math.abs(f), 0.15) * k * dpr, fy = k * dpr;
        const c = Math.cos(p.rot), s = Math.sin(p.rot);
        ctx.setTransform(c * fx, s * fx, -s * fy, c * fy, p.x * dpr, p.y * dpr);
        ctx.globalAlpha = level * (0.5 + 0.5 * Math.min(p.z, 1));
        ctx.drawImage(atlas, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
      }
      push *= 0.9;
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running || !atlas.complete || !atlas.naturalWidth) return;
      running = true; cv.classList.add('is-on'); resize();
      list.forEach((p) => spawn(p, true));
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!running) return;
      running = false; cv.classList.remove('is-on'); cancelAnimationFrame(raf);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    };

    addEventListener('resize', () => running && resize());
    // Le scroll pousse les pétales (plus fort pour ceux du premier plan)
    lenis?.on('scroll', ({ velocity }) => { push = Math.max(-600, Math.min(600, push + velocity * 18)); });

    return {
      load() { if (!atlas.src && !reduce) { atlas.decoding = 'async'; atlas.src = 'assets/layers/petals-atlas.webp'; atlas.onload = () => level > 0 && start(); } },
      set level(v) {
        level = v;
        if (v > 0.001) start(); else stop();
      },
    };
  })();

  ScrollTrigger.create({
    trigger: '.stage',
    start: 'top top',
    end: 'bottom bottom',
    animation: day,
    scrub: reduce ? true : 0.35,
    onUpdate: (self) => updateHud(self.progress),
    onToggle: (self) => { if (!self.isActive) { fireflies.active = false; petals.level = 0; } },
  });

  /* ---------- Parallaxe souris ---------- */

  if (finePointer && !reduce) {
    const xs = sceneImgs.map((img) => gsap.quickTo(img, 'x', { duration: 1.2, ease: 'power3.out' }));
    const ys = sceneImgs.map((img) => gsap.quickTo(img, 'y', { duration: 1.2, ease: 'power3.out' }));
    // Premier plan : amplitude plus forte que le fond → profondeur
    const fxXs = fxLayers.map((l) => gsap.quickTo(l, 'x', { duration: 1.4, ease: 'power3.out' }));
    const fxYs = fxLayers.map((l) => gsap.quickTo(l, 'y', { duration: 1.4, ease: 'power3.out' }));
    addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      xs.forEach((q) => q(nx * -28));
      ys.forEach((q) => q(ny * -18));
      fxXs.forEach((q) => q(nx * -70));
      fxYs.forEach((q) => q(ny * -40));
    }, { passive: true });
  }

  /* ---------- Manifeste ---------- */

  const words = splitWords($('.manifesto__text'));
  gsap.fromTo(words, { opacity: 0.12 }, {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '.manifesto__text', start: 'top 80%', end: 'bottom 50%', scrub: true },
  });
  gsap.from('.manifesto .label', {
    autoAlpha: 0, y: 20, duration: 1, ease: 'expo.out',
    scrollTrigger: { trigger: '.manifesto', start: 'top 75%' },
  });

  /* ---------- Palette ---------- */

  const cols = $$('.col');
  gsap.fromTo(cols, { clipPath: 'inset(100% 0% 0% 0%)' }, {
    clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, stagger: 0.12, ease: 'expo.inOut',
    scrollTrigger: { trigger: '.cols', start: 'top 80%' },
  });
  gsap.from('.palette__head > *', {
    autoAlpha: 0, y: 24, duration: 1, stagger: 0.1, ease: 'expo.out',
    scrollTrigger: { trigger: '.palette__head', start: 'top 85%' },
  });
  if (!reduce) {
    $$('.col__media').forEach((m, i) => {
      gsap.fromTo(m, { yPercent: -4 - i * 1.5 }, {
        yPercent: 4 + i * 1.5, ease: 'none',
        scrollTrigger: { trigger: '.cols', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  /* ---------- Bandes défilantes : en pause quand elles ne sont pas visibles ---------- */

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('is-off', !e.isIntersecting)));
    $$('.ticker').forEach((t) => io.observe(t));
  }

  /* ---------- Fin ---------- */

  const outroChars = splitChars($('.outro__title'));
  gsap.timeline({ scrollTrigger: { trigger: '.outro', start: 'top 60%' } })
    .from('.outro .label', { autoAlpha: 0, y: 16, duration: 0.8, ease: 'expo.out' })
    .from(outroChars, { yPercent: 130, stagger: 0.08, duration: 1.4, ease: 'expo.out' }, '<0.1')
    .from(['.outro__sub', '.outro__again', '.outro__credits'], { autoAlpha: 0, y: 16, stagger: 0.1, duration: 0.8, ease: 'expo.out' }, '<0.5');

  $('.outro__again').addEventListener('click', () => {
    if (lenis) lenis.scrollTo(0, { duration: 3.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
  $('.hud__logo').addEventListener('click', (e) => {
    e.preventDefault();
    lenis ? lenis.scrollTo(0, { duration: 2.4 }) : window.scrollTo(0, 0);
  });
})();
