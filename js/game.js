/* ============================================================
   The Signal — 게임 엔진
   씬 순서는 맨 아래 ORDER 배열에서 정합니다.
   ============================================================ */
(() => {
  const IMG = 'assets/img/', VID = 'assets/video/';
  const T = DATA.timing;
  const stage = document.getElementById('stage');
  const FADE = 800;

  /* ---------- 유틸 ---------- */
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const el = (tag, cls, parent, style) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (style) Object.assign(e.style, style);
    if (parent) parent.appendChild(e);
    return e;
  };
  const img = (src, x, y, parent, cls) => {
    const i = el('img', cls, parent, { left: x + 'px', top: y + 'px' });
    i.src = IMG + src; i.alt = ''; i.draggable = false;
    return i;
  };
  const btn = (cls, parent, style, label) => {
    const b = el('button', cls, parent, style); b.type = 'button';
    if (label) b.setAttribute('aria-label', label);
    return b;
  };
  const ready = im => (im.complete && im.naturalWidth) ? Promise.resolve() : new Promise(r => { im.onload = im.onerror = r; });

  /* ---------- 화면 맞춤 ---------- */
  const fit = () => {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
  };
  addEventListener('resize', fit); fit();

  /* ---------- 일시정지 (설정 창·챕터·크레딧이 열려 있는 동안 타이머와 영상을 멈춤) ---------- */
  const Clock = {
    depth: 0, off: 0, at: 0, timers: new Set(), vids: [],
    now() { return (this.depth ? this.at : performance.now()) - this.off; },
    pause() {
      if (this.depth++) return;
      this.at = performance.now();
      this.timers.forEach(t => { clearTimeout(t.h); t.h = 0; t.left -= performance.now() - t.start; });
      this.vids = [...stage.querySelectorAll('video')].filter(v => !v.paused);
      this.vids.forEach(v => v.pause());
    },
    resume() {
      if (!this.depth || --this.depth) return;
      this.off += performance.now() - this.at;
      this.timers.forEach(t => t.arm());
      this.vids.forEach(v => { const p = v.play(); p && p.catch(() => {}); });
      this.vids = [];
    },
    reset() { if (this.depth) { this.depth = 1; this.resume(); } }
  };
  /* 일시정지 중에는 흐르지 않는 setTimeout */
  function later(fn, ms) {
    const t = { left: ms, start: 0, h: 0 };
    t.arm = () => { t.start = performance.now(); t.h = setTimeout(() => { Clock.timers.delete(t); fn(); }, Math.max(0, t.left)); };
    t.cancel = () => { clearTimeout(t.h); Clock.timers.delete(t); };
    Clock.timers.add(t);
    if (!Clock.depth) t.arm();
    return t;
  }
  const pwait = ms => new Promise(r => later(r, ms));
  const cancel = t => t && t.cancel();

  /* ---------- 상태 ---------- */
  const state = { owned: new Set(), doorOpen: false, panelSolved: false, bright: DATA.brightness.length - 1 };
  const resetState = () => { state.owned.clear(); state.doorOpen = false; state.panelSolved = false; };
  const SC = {};
  let cur = null, busy = false;

  /* ---------- HUD (설정 / 인벤토리 버튼) ---------- */
  const btnSetting = btn('hud', stage, null, '설정'); btnSetting.id = 'btnSetting';
  img('btn_setting.png', 0, 0, btnSetting);
  const btnInventory = btn('hud', stage, null, '인벤토리'); btnInventory.id = 'btnInventory';
  img('btn_inventory.png', 0, 0, btnInventory);
  btnSetting.addEventListener('click', e => { e.stopPropagation(); openSettings(); });
  btnInventory.addEventListener('click', e => { e.stopPropagation(); openInventory(); });
  const setHud = mode => {
    btnSetting.classList.toggle('on', mode === 'setting' || mode === 'both');
    btnInventory.classList.toggle('on', mode === 'both');
  };

  /* ---------- 사운드: 배경음악 2개(겹쳐 재생) + 효과음 ---------- */
  const Sound = (() => {
    const A = DATA.audio, AUD = 'assets/audio/';
    const lv = { bgm: A.bgmLevel, sfx: A.sfxLevel };
    try { ['bgm', 'sfx'].forEach(k => { const v = localStorage.getItem('signal.' + k); if (v !== null) lv[k] = Math.max(0, Math.min(A.levels.length - 1, +v)); }); } catch (e) { /* 저장 불가 환경 */ }
    const vol = k => A.levels[lv[k]];
    /* 배경음악 트랙: fade(0~1) 를 목표값 쪽으로 조금씩 움직임 */
    const tracks = {};
    Object.entries(A.bgm).forEach(([k, d]) => {
      const a = new Audio(AUD + d.file); a.loop = true; a.preload = 'auto'; a.volume = 0;
      tracks[k] = { a, gain: d.gain, fade: 0, to: 0, speed: 1 / A.fade };
    });
    const apply = t => { t.a.volume = Math.max(0, Math.min(1, t.gain * vol('bgm') * t.fade)); };
    let last = performance.now();
    setInterval(() => {
      const now = performance.now(), dt = now - last; last = now;
      Object.values(tracks).forEach(t => {
        if (t.fade !== t.to) {
          const d = t.speed * dt;
          t.fade = t.fade < t.to ? Math.min(t.to, t.fade + d) : Math.max(t.to, t.fade - d);
          apply(t);
        }
        if (t.to > 0 && t.a.paused && now >= (t.retry || 0)) { t.retry = now + 400; t.a.play().catch(() => { /* 첫 클릭 전에는 브라우저가 막음 → 0.4초마다 다시 시도 */ }); }
        if (t.to === 0 && t.fade === 0 && !t.a.paused) { t.a.pause(); if (t.rewind) t.a.currentTime = 0; }
      });
    }, 40);
    tracks.main1.rewind = true;   // main1 은 꺼질 때마다 처음으로 되감음
    const aim = (k, on, ms) => { const t = tracks[k]; t.to = on ? 1 : 0; t.speed = 1 / Math.max(1, ms); };
    /* 효과음 */
    const live = new Set();
    function play(name) {
      const d = A.sfx[name]; if (!d) return null;
      const a = new Audio(AUD + d.file); a.volume = d.gain * vol('sfx'); a._gain = d.gain;
      live.add(a); a.addEventListener('ended', () => live.delete(a));
      a.play().catch(() => live.delete(a));
      return a;
    }
    function stop(a, ms = 350) {     // 짧게 fade out 하고 멈춤
      if (!a || !live.has(a)) return;
      live.delete(a);
      const v0 = a.volume, t0 = performance.now();
      const h = setInterval(() => { const p = (performance.now() - t0) / ms; if (p >= 1) { clearInterval(h); a.pause(); } else a.volume = v0 * (1 - p); }, 30);
    }
    return {
      play, stop,
      /* 씬이 바뀔 때: 어떤 배경음악이 들릴지 정함 */
      scene(id) {
        const silent = A.silentScenes.test(id);
        aim('main2', !silent, A.fade);
        const on1 = !silent && A.main1Scenes.test(id);
        aim('main1', on1, !on1 && id === 'intro' ? A.main1ToIntro : A.fade);
      },
      level: k => lv[k], count: A.levels.length,
      setLevel(k, n) {
        lv[k] = Math.max(0, Math.min(A.levels.length - 1, n));
        Object.values(tracks).forEach(apply); live.forEach(a => { a.volume = a._gain * vol('sfx'); });
        try { localStorage.setItem('signal.' + k, lv[k]); } catch (e) { /* 저장 불가 환경 */ }
      },
      tracks
    };
  })();

  /* ---------- 씬 전환 ---------- */
  async function show(id, { cross = false } = {}) {
    const next = SC[id];
    if (!next || busy) return;
    busy = true;
    const prev = cur;
    hideCaption(); setHud(null);
    Sound.scene(id);
    const out = async () => {
      if (!prev) return;
      prev.el.classList.remove('on');
      await wait(FADE);
      prev.el.style.visibility = 'hidden';
      prev.leave && prev.leave();
    };
    const inn = async () => {
      next.el.style.visibility = 'visible';
      next.prepare && next.prepare();
      void next.el.offsetWidth;
      next.el.classList.add('on');
      setHud(next.hud);
      cur = next;
      await wait(FADE);
    };
    if (cross) await Promise.all([out(), inn()]); else { await out(); await inn(); }
    busy = false;
    next.enter && next.enter();
  }
  const advance = async () => {
    const from = cur;
    while (busy) await wait(40);
    if (cur !== from) return;
    const nextId = ORDER[ORDER.indexOf(cur.id) + 1];
    if (nextId) show(nextId, { cross: !!SC[nextId].cross });
  };
  /* 처음 화면으로 (실패·엔딩 뒤) */
  const toIntro = async () => { while (busy) await wait(40); resetState(); show('intro'); };
  const add = (id, scene) => { scene.id = id; SC[id] = scene; return scene; };

  /* ---------- intro ---------- */
  function mkIntro() {
    const e = el('div', 'scene intro', stage);
    img('intro_bg.jpg', 0, 0, e, 'bg');
    const v = el('video', null, e);
    v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', '');
    v.addEventListener('error', () => { v.style.display = 'none'; });
    img('title.webp', 89, 146, e);
    img('subtitle.webp', 201, 392, e);
    const menu = el('div', 'menu', e);
    const items = [
      { key: 'new',      top: 0,   w: 502, paint: 'paint_new.webp',      pw: 590, pt: -21, tx: 119, ty: 21 },
      { key: 'credits',  top: 125, w: 478, paint: 'paint_credits.webp',  pw: 500, pt: -19, tx: 120, ty: 21 },
      { key: 'chapters', top: 250, w: 524, paint: 'paint_chapters.webp', pw: 577, pt: -21, tx: 119, ty: 19 }
    ];
    items.forEach(m => {
      const it = el('div', 'menu-item', menu, { top: m.top + 'px', width: m.w + 'px' });
      it.dataset.menu = m.key;
      const url = `url("${IMG}${m.paint}")`;
      const p = el('div', 'paint', it, { top: m.pt + 'px', width: m.pw + 'px', backgroundImage: url });
      p.style.webkitMaskImage = url; p.style.maskImage = url;
      img(`m_${m.key}_idle.png`, m.tx, m.ty, it, 'idle');
      img(`m_${m.key}_fill.png`, m.tx, m.ty, it, 'fill');
      it.addEventListener('click', () => {
        if (busy || cur !== SC.intro) return;
        if (m.key === 'new') { resetState(); show('chapter_1'); }
        if (m.key === 'credits') pages.open('credit', 'intro');
        if (m.key === 'chapters') pages.open('chapter', 'intro');
      });
    });
    return {
      el: e, hud: null,
      prepare() { v.style.display = ''; v.src = VID + DATA.video.intro; const p = v.play(); p && p.catch(() => {}); },
      leave() { v.pause(); }
    };
  }

  /* ---------- 영상 씬 ---------- */
  function mkVideo(file, poster, opt = {}) {
    const e = el('div', 'scene video', stage);
    if (poster) img(poster, 0, 0, e, 'bg');
    const v = el('video', null, e); v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'none';
    const ph = el('div', 'vph', e); ph.textContent = file;
    if (opt.sub) img(opt.sub.img, opt.sub.x, opt.sub.y, e);
    let token = 0, done = true, dog = 0, snd = null;
    if (opt.skip) {
      const s = btn('skip', e); s.textContent = DATA.text.skip;
      s.addEventListener('click', ev => { ev.stopPropagation(); finish(token); });
    }
    const finish = t => { if (t !== token || done) return; done = true; advance(); };
    v.addEventListener('timeupdate', () => { if (v.duration > 3 && v.duration - v.currentTime <= T.videoFadeBefore) finish(token); });
    v.addEventListener('ended', () => finish(token));
    return {
      el: e, hud: null, cross: !!opt.cross,
      prepare() {
        const t = ++token; done = false; let missed = false; Sound.stop(snd); snd = null;
        e.classList.remove('missing');
        const miss = () => {
          if (t !== token || missed) return; missed = true;
          e.classList.add('missing');
          setTimeout(() => finish(t), FADE + (opt.hold || T.videoMissingHold));
        };
        v.onerror = miss;
        let lastT = -1, still = 0;
        clearInterval(dog);
        dog = setInterval(() => {
          if (t !== token || done) return clearInterval(dog);
          if (Clock.depth) return;
          if (v.currentTime === lastT) { if (++still >= T.videoStallLimit) { clearInterval(dog); missed ? finish(t) : miss(); } }
          else { still = 0; lastT = v.currentTime; }
        }, 1000);
        v.muted = !!opt.sound; v.src = VID + file;   // 따로 받은 음원이 있는 영상은 영상 자체 소리를 끔
        if (opt.sound) v.addEventListener('playing', () => { if (t === token && !snd) snd = Sound.play(opt.sound); }, { once: true });
        const p = v.play();
        if (p) p.catch(err => {
          if (err && err.name === 'NotAllowedError') { v.muted = true; v.play().catch(miss); } else miss();
        });
      },
      leave() { token++; done = true; clearInterval(dog); Sound.stop(snd); snd = null; v.onerror = null; v.pause(); v.removeAttribute('src'); v.load(); }
    };
  }

  /* ---------- 카드 씬: 일정 시간 뒤 다음 씬으로 (night / overnight / guide / ending 등) ---------- */
  function mkTimed(e, hold, hud = null, next = null) {
    let timer = null;
    return {
      el: e, hud,
      enter() { timer = later(() => next ? next() : advance(), hold); },
      leave() { cancel(timer); }
    };
  }
  function mkCard(image, hold) {
    const e = el('div', 'scene card', stage);
    img(image, 0, 0, e, 'bg');
    return mkTimed(e, hold);
  }

  /* ---------- 대화 씬 ---------- */
  function mkDialogue(def) {
    const e = el('div', 'scene dialogue', stage);
    const wrap = el('div', 'dwrap', e);
    img(def.bg, 0, 0, wrap, 'bg');
    const ch = el('img', 'char', wrap); ch.alt = ''; ch.draggable = false;
    const bub = el('img', null, wrap, { left: '186px', top: '434px' }); bub.alt = '';
    const tx = el('div', 'dtext', wrap);
    img('triangle.png', 923, 931, wrap, 'tri');
    let i = 0, lock = true, shakeRaf = 0;
    const set = l => {
      ch.src = IMG + l.ch; ch.style.left = l.x + 'px'; ch.style.top = l.y + 'px';
      bub.src = IMG + l.bub; tx.textContent = l.t; tx.classList.toggle('big', !!l.big);
    };
    const charIn = async () => {
      await ready(ch);
      ch.classList.remove('out'); ch.classList.add('in'); tx.classList.add('show');
      if (def.shake && i === 0) shake();
      await wait(480); lock = false;
    };
    /* 충격 효과: 상하좌우로 빠르게 흔들리며 잔상이 남고, 점점 약해짐 */
    const stopShake = () => {
      cancelAnimationFrame(shakeRaf);
      e.querySelectorAll('.ghost').forEach(g => g.remove());
      wrap.style.transform = '';
    };
    const shake = () => {
      stopShake();
      Sound.play('car');
      const S = def.shake;
      const ghosts = [0.38, 0.2].map(o => {
        const g = wrap.cloneNode(true); g.classList.add('ghost'); g.style.opacity = o;
        const gc = g.querySelector('.char'); gc.classList.remove('in', 'out'); gc.style.animation = 'none'; gc.style.opacity = 1; gc.style.transform = 'none';
        e.appendChild(g); return { g, o };   // 원본 위에 반투명으로 겹쳐 잔상처럼 보이게
      });
      const hist = [];
      const t0 = performance.now();
      const step = now => {
        const p = Math.min(1, (now - t0) / S.duration);
        const amp = S.amp * Math.pow(1 - p, 1.5);
        const x = (Math.random() * 2 - 1) * amp, y = (Math.random() * 2 - 1) * amp * 0.8;
        const r = (Math.random() * 2 - 1) * amp * 0.03;
        const sc = 1 + 0.08 * (1 - p);
        hist.unshift(`translate(${x}px,${y}px) rotate(${r}deg) scale(${sc})`);
        wrap.style.transform = hist[0];
        ghosts.forEach(({ g, o }, k) => {
          g.style.transform = hist[Math.min(hist.length - 1, (k + 1) * 3)];
          g.style.opacity = o * (1 - p);
        });
        if (p < 1) shakeRaf = requestAnimationFrame(step); else stopShake();
      };
      shakeRaf = requestAnimationFrame(step);
    };
    e.addEventListener('click', async () => {
      if (lock || busy) return;
      lock = true;
      ch.classList.remove('in'); ch.classList.add('out'); tx.classList.remove('show');
      await wait(320);
      if (i < def.lines.length - 1) { set(def.lines[++i]); charIn(); }
      else advance();
    });
    return {
      el: e, hud: 'setting',
      prepare() { i = 0; lock = true; ch.classList.remove('in', 'out'); tx.classList.remove('show'); set(def.lines[0]); setTimeout(charIn, def.shake ? def.shake.delay : 300); },
      leave() { stopShake(); }
    };
  }

  /* ---------- 미니게임 ---------- */
  const MOUSE_SVG = `<svg viewBox="0 0 36.6617 53.7395" width="36.66" height="53.74" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path opacity="0.4" fill="#fff" d="M36.6617 18.3317C36.6617 8.22333 28.4382 0 18.3309 0C8.2236 0 0 8.22333 0 18.3317V35.4078C0 45.5161 8.2236 53.7395 18.3309 53.7395C28.4382 53.7395 36.6617 45.5161 36.6617 35.4078V18.3317ZM20.5616 12.3207V15.8042C20.5616 17.0348 19.5603 18.035 18.3309 18.035C17.1015 18.035 16.1002 17.0342 16.1002 15.8042V12.3207C16.1002 11.0894 17.1015 10.0899 18.3309 10.0899C19.5603 10.0899 20.5616 11.0894 20.5616 12.3207ZM2.50959 18.3317C2.50959 10.0296 8.93711 3.20645 17.0758 2.56337V7.754C15.0703 8.30575 13.5907 10.1412 13.5907 12.3201V15.8036C13.5907 17.9824 15.0703 19.8185 17.0758 20.3703V25.614H2.50959V18.3317ZM34.1522 35.4078C34.1522 44.1321 27.0548 51.2304 18.3309 51.2304C9.60701 51.2304 2.50959 44.1321 2.50959 35.4078V28.1249H34.1522V35.4078ZM34.1522 25.6146H19.586V20.3709C21.5916 19.8185 23.0711 17.983 23.0711 15.8042V12.3207C23.0711 10.1418 21.5916 8.30575 19.586 7.7546V2.56337C27.7253 3.20645 34.1522 10.0296 34.1522 18.3317V25.6146Z"/>
    <path class="cursor" fill="#fff" d="M17.0695 20.32V25.7388H2.43868V16.7977C3.52243 6.23103 12.8248 2.52817 17.0695 2.43785V7.85667C14.4685 8.29018 13.8182 10.9274 13.8182 12.1917V17.0687C13.8182 18.1524 15.7148 20.049 17.0695 20.32Z"/></svg>`;
  function mkMinigame() {
    const M = DATA.minigame;
    const e = el('div', 'scene minigame', stage);
    img('mg_bg.jpg', 0, 0, e, 'bg');
    const vec = [M.dots[2], M.dots[1], M.dots[0]].map(d => img(d.vecna, d.vx, d.vy, e, 'vecna')).reverse();
    const gauge = el('div', 'gauge', e); const bar = el('i', null, gauge);
    const mouse = el('div', 'mouse', e); mouse.innerHTML = MOUSE_SVG;
    img('mg_text.png', 795, 955, e);
    const count = el('div', 'count', e); const num = el('b', null, count); const tot = el('span', null, count); tot.textContent = '/' + M.total;
    let hits = [], total = 0, live = false, raf = 0, t0 = 0;

    const tick = () => {
      if (!live) return;
      const left = Math.max(0, 1 - (Clock.now() - t0) / (M.time * 1000));
      bar.style.transform = `scaleX(${left})`;
      if (left <= 0) return timeUp();
      raf = requestAnimationFrame(tick);
    };
    const start = () => { live = true; t0 = Clock.now(); raf = requestAnimationFrame(tick); };
    const reset = () => {
      hits = M.dots.map(() => 0); total = 0;
      num.textContent = '0'; bar.style.transform = 'scaleX(1)';
      vec.forEach(v => v.classList.remove('gone')); dots.forEach(d => d.classList.remove('gone', 'hit'));
    };
    /* 시간 안에 18번을 채우지 못하면 실패 화면 → intro */
    const timeUp = () => { live = false; show('mg_fail'); };

    const dots = M.dots.map((d, k) => {
      const b = el('div', 'dot', e, { left: d.x + 'px', top: d.y + 'px' });
      img('mg_ellipse.png', 0, 0, b, 'ring r1');   // 겹쳐진 원 두 개: 시간 차를 두고 0 → 원래 크기로 반복
      img('mg_ellipse.png', 0, 0, b, 'ring r2');
      b.addEventListener('click', () => {
        if (!live || Clock.depth || hits[k] >= M.perDot) return;
        hits[k]++; total = Math.min(M.total, total + 1);
        num.textContent = total;
        b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit');
        if (hits[k] >= M.perDot) { vec[k].classList.add('gone'); b.classList.add('gone'); Sound.play('tangle'); }
        if (total >= M.total) { live = false; cancelAnimationFrame(raf); setTimeout(advance, 700); }
      });
      return b;
    });
    return {
      el: e, hud: 'setting',
      prepare() { live = false; reset(); },
      enter() { start(); },
      leave() { live = false; cancelAnimationFrame(raf); }
    };
  }
  function mkFail() {
    const e = el('div', 'scene fail', stage);
    img('fail.jpg', 0, 0, e, 'bg');
    return mkTimed(e, T.failHold, null, toIntro);
  }

  /* ---------- 하단 문구 ---------- */
  const cap = el('div', null, stage); cap.id = 'caption';
  let capTimer = null;
  function caption(text, ms = T.captionHold, size = 32) {
    cancel(capTimer); cap.textContent = text; cap.style.fontSize = size + 'px'; cap.classList.add('on');
    if (ms) capTimer = later(hideCaption, ms);
  }
  function hideCaption() { cancel(capTimer); cap.classList.remove('on'); }

  /* ---------- 오버레이 (아이템 / 판넬): 일정 시간 뒤 자동으로 원래 화면으로 ---------- */
  const ov = el('div', null, stage); ov.id = 'overlay';
  el('div', 'dim', ov);
  const ovC = el('div', 'content', ov);
  const ovTitle = el('div', 'otitle', ovC), ovBody = el('div', null, ovC), ovDesc = el('div', 'odesc', ovC);
  let ovClose = null, ovBusy = false, ovTimer = null;
  async function openOverlay({ title, desc = [], descTop = 855, body, onClose, hold = T.itemHold }) {
    if (locked()) return;
    hideCaption();
    ovTitle.textContent = title;
    ovDesc.innerHTML = ''; desc.forEach(l => el('div', null, ovDesc).textContent = l);
    ovDesc.style.top = descTop + 'px';
    ovBody.innerHTML = ''; ovBody.appendChild(body);
    ovClose = onClose || null;
    ovBusy = true; ov.classList.add('open'); void ov.offsetWidth; ov.classList.add('show');
    await wait(450); ovBusy = false;
    holdOverlay(hold);
  }
  function holdOverlay(ms) { cancel(ovTimer); if (ms) ovTimer = later(closeOverlay, ms); }
  async function closeOverlay() {
    if (ovBusy || !ov.classList.contains('open')) return;
    cancel(ovTimer);
    ovBusy = true; ov.classList.remove('show');
    await wait(450);
    ov.classList.remove('open'); ovBusy = false;
    const cb = ovClose; ovClose = null; cb && cb();
  }

  function showItem(key, after) {
    const it = DATA.items[key];
    const pic = img(it.img, it.x, it.y, null, 'oimg');
    openOverlay({
      title: it.title, desc: it.desc, descTop: it.descTop, body: pic,
      onClose: async () => {
        after && after();
        if (it.collect && !state.owned.has(key)) {
          state.owned.add(key);
          await showMini(key);
          /* 임시 규칙: 집에서 아이템 3개를 모두 얻으면 chapter_4 로 넘어갑니다 */
          if (cur && cur.id === 'house' && state.owned.size >= 3) {
            while (locked() || busy || Clock.depth) await wait(200);
            if (cur.id === 'house') advance();
          }
        }
      }
    });
  }

  /* 제어실 판넬: 버튼을 누르면 90% 로 눌리고 같은 번호의 beam 이 켜짐(맞든 틀리든).
     네 자리를 다 눌렀을 때 2134 면 4개가 함께 깜박이고, 아니면 beam 4개가 바로 꺼짐 */
  const panel = (() => {
    const P = DATA.panel;
    const p = el('div', 'panel'); img('btn_bg.webp', 0, 0, p);
    P.lamps.forEach(l => img(l.img, l.x, l.y, p));
    const lights = P.beams.map(l => { const i = img(l.img, l.x, l.y, p, 'light'); i.style.setProperty('--glow', l.glow); return i; });
    p.style.setProperty('--blinkN', P.blink.count); p.style.setProperty('--blinkT', P.blink.period + 'ms');
    let seq = [], lock = false;
    const off = () => { seq = []; lights.forEach(l => l.classList.remove('on')); };
    P.keys.forEach((k, n) => {
      const b = el('div', 'key', p, { left: k.x + 'px', top: k.y + 'px' }); img(k.img, 10, 10, b);   // 10px = 누르기 쉽게 넓힌 여백
      b.addEventListener('click', async () => {
        if (state.panelSolved || lock || ovBusy) return;
        b.classList.remove('press'); void b.offsetWidth; b.classList.add('press');
        holdOverlay(T.panelIdle);
        const digit = String(n + 1);
        seq.push(digit); lights[n].classList.add('on');          // 맞든 틀리든 누른 번호의 beam 은 일단 켜짐
        if (seq.length < P.answer.length) return;
        lock = true;
        if (seq.join('') !== P.answer) { await wait(P.wrongHold); off(); lock = false; return; }   // 네 자리가 2134 가 아니면 4개 모두 바로 0
        cancel(ovTimer);
        state.panelSolved = true; state.doorOpen = true;
        await wait(250); p.classList.add('blink'); await wait(P.blink.count * P.blink.period + 100);
        lock = false; await closeOverlay(); caption(DATA.text.doorOpened, 3200);
      });
    });
    return {
      open() {
        off(); p.classList.remove('blink');
        if (state.panelSolved) lights.forEach(l => l.classList.add('on'));
        openOverlay({ title: P.title, desc: P.desc, descTop: 854, body: p, hold: T.panelIdle });
      }
    };
  })();

  /* ---------- inventory_mini ---------- */
  const mini = el('div', null, stage); mini.id = 'mini';
  img('mini_bg.webp', 0, 0, mini);
  const miniImgs = {};
  let miniPick = null, miniRun = 0;
  Object.entries(DATA.items).filter(([, it]) => it.collect).forEach(([k, it]) => {
    const m = img(it.mini.img, it.mini.x, it.mini.y, mini, 'mi'); miniImgs[k] = m;
    m.addEventListener('click', e => { e.stopPropagation(); miniPick && miniPick(k); });
  });
  async function showMini(newKey, { persist = false, pick = null } = {}) {
    const run = ++miniRun;
    Object.entries(miniImgs).forEach(([k, m]) => m.classList.toggle('has', state.owned.has(k) && k !== newKey));
    miniPick = pick; mini.classList.toggle('pick', !!pick);
    mini.classList.add('up');
    await wait(550);
    if (newKey && run === miniRun) miniImgs[newKey].classList.add('has');
    if (persist) return;
    await pwait(T.miniHold);
    if (run === miniRun) { mini.classList.remove('up'); await wait(600); }
  }
  function hideMini() { miniRun++; miniPick = null; mini.classList.remove('up', 'pick'); }

  /* ---------- 밝기 슬라이더 (설정 창 / options 공용) ---------- */
  const sliders = [];
  function setBright(level) {
    state.bright = Math.max(0, Math.min(DATA.brightness.length - 1, level));
    const v = DATA.brightness[state.bright];
    stage.style.filter = v === 1 ? '' : `brightness(${v})`;
    sliders.forEach(s => s.render());
    try { localStorage.setItem('signal.bright', state.bright); } catch (e) { /* 저장 불가 환경 */ }
  }
  /* 슬라이더 종류: 밝기 / 배경음악 / 효과음 (모두 같은 모양, 눈금 5칸) */
  const KIND = {
    bright: { name: '밝기', n: DATA.brightness.length, get: () => state.bright, set: v => setBright(v) },
    bgm: { name: '배경음악', n: Sound.count, get: () => Sound.level('bgm'), set: v => { Sound.setLevel('bgm', v); sliders.forEach(s => s.render()); } },
    sfx: { name: '효과음', n: Sound.count, get: () => Sound.level('sfx'), set: v => { Sound.setLevel('sfx', v); sliders.forEach(s => s.render()); Sound.play('tangle'); } }   // 효과음은 바꿀 때 한 번 들려줌
  };
  function mkSlider(parent, x, y, kind = 'bright') {     // x, y = 왼쪽 화살표의 위치 (피그마 L_arrow)
    const K = KIND[kind];
    const s = el('div', 'slider', parent, { left: x + 'px', top: y + 'px' });
    const L = btn('sarrow l', s, null, K.name + ' 낮추기'), R = btn('sarrow r', s, null, K.name + ' 높이기');
    img('arrow_r.png', 0, 0, L); img('arrow_r.png', 0, 0, R);
    const track = el('div', 'strack', s);
    img('sl_line.svg', 36, 14, track); img('sl_ticks.svg', 65, 11, track);
    const knob = el('div', 'sknob', s);
    const N = K.n, tick0 = 66, step = 33;   // 눈금: 왼쪽 화살표 기준 x
    const clamp = v => Math.max(0, Math.min(N - 1, v));
    const put = v => { v = clamp(v); if (v !== K.get()) K.set(v); };
    const fromX = px => Math.round((px - tick0) / step);
    L.addEventListener('click', e => { e.stopPropagation(); put(K.get() - 1); });
    R.addEventListener('click', e => { e.stopPropagation(); put(K.get() + 1); });
    const local = ev => { const r = s.getBoundingClientRect(); return (ev.clientX - r.left) * (264 / r.width); };
    track.addEventListener('pointerdown', ev => {
      ev.preventDefault(); put(fromX(local(ev)));
      const mv = e2 => put(fromX(local(e2)));
      const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    });
    const api = { render() { const v = K.get(); knob.style.left = (tick0 + v * step - 4) + 'px'; L.disabled = v <= 0; R.disabled = v >= N - 1; } };
    sliders.push(api); api.render();
    return api;
  }

  /* ---------- 설정 창: 화면 아래에서 올라옴 ---------- */
  const settings = el('div', null, stage); settings.id = 'settings';
  el('div', 'dim', settings);
  const setPanel = el('div', 'spanel', settings);
  img('set_paper.webp', 422, 187, setPanel, 'paper');
  el('div', 'stitle', setPanel).textContent = 'SETTINGS';
  img('set_sound.png', 746, 268, setPanel, 'ink');      // 음향: 배경음악 = game main sound 1·2, 효과음 = 그 밖의 모든 음원
  el('div', 'slabel', setPanel, { left: '719px', top: '337px' }).textContent = '배경음악';
  mkSlider(setPanel, 891.29, 334, 'bgm');
  el('div', 'slabel', setPanel, { left: '719px', top: '377px' }).textContent = '효과음';
  mkSlider(setPanel, 891.29, 374, 'sfx');
  img('set_graphic.png', 734, 456, setPanel, 'ink');    // 그래픽
  el('div', 'slabel', setPanel, { left: '719px', top: '525px' }).textContent = '밝기';
  mkSlider(setPanel, 891.29, 522);
  const setChapters = btn('sbtn', setPanel, { left: '716px', top: '594px' }, 'CHAPTERS'); img('set_chapters.webp', 0, 0, setChapters);
  const setCredits = btn('sbtn', setPanel, { left: '716px', top: '705px' }, 'CREDITS'); img('set_credits.webp', 0, 0, setCredits);
  const setClose = btn('sclose', setPanel, { left: '1419px', top: '203px' }, '닫기'); img('set_close.png', 0, 0, setClose);
  let setBusy = false;
  function openSettings() {
    if (busy || setBusy || locked() || settings.classList.contains('open')) return;
    Clock.pause(); hideCaption();
    settings.classList.add('open'); void settings.offsetWidth; settings.classList.add('show');
  }
  async function closeSettings({ resume = true, instant = false } = {}) {
    if (!settings.classList.contains('open') || setBusy) return;
    setBusy = true;
    settings.classList.toggle('instant', instant);
    settings.classList.remove('show');
    if (!instant) await wait(600);
    settings.classList.remove('open', 'instant');
    setBusy = false;
    if (resume) Clock.resume();
  }
  setClose.addEventListener('click', () => closeSettings());
  setChapters.addEventListener('click', () => { if (!setBusy) pages.open('chapter', 'game'); });
  setCredits.addEventListener('click', () => { if (!setBusy) pages.open('credit', 'game'); });

  /* ---------- intro_credit / intro_chapter 페이지 ---------- */
  const pages = (() => {
    let openKey = null, from = null, closing = false;
    const P = {};

    /* intro_credit: content 와 title 이 20초 동안 함께 위로 올라감 */
    {
      const e = el('div', 'page credit', stage);
      const roll = el('div', 'roll', e);
      img('cr_title.webp', 536, 95, roll);
      const list = el('div', 'clist', roll);
      DATA.credits.forEach(([head, role, names, note]) => {
        const b = el('div', 'cblock', list);
        el('p', 'ch', b).textContent = head;
        if (role) el('p', 'cr', b).textContent = role;
        (names || []).forEach(n => el('p', 'cn', b).textContent = n);
        if (note) { b.classList.add('note'); note.forEach(n => el('p', 'cnote', b).textContent = n); }
      });
      el('div', 'cthanks', roll).textContent = DATA.creditThanks;
      img('cr_image.jpg', 503, 2396, roll, 'cimg');
      el('div', 'cgrad', e);
      const back = btn('pback', e, null, '뒤로'); img('back.png', 0, 0, back);
      back.addEventListener('click', () => close());
      P.credit = {
        e,
        reset() { roll.style.transition = 'none'; roll.style.transform = 'translateY(0)'; },
        start() {
          // 마지막의 THANK YOU 와 이미지가 화면 가운데에 오면 멈춥니다
          const end = -(2263 + (2700 - 2263) / 2 - 540);
          void roll.offsetWidth;
          roll.style.transition = `transform ${T.creditRoll}ms linear`;
          roll.style.transform = `translateY(${end}px)`;
        }
      };
    }

    /* intro_chapter */
    {
      const C = DATA.chapters;
      const e = el('div', 'page chapter', stage);
      img('ch_bg.jpg', 0, 0, e, 'bg chbg');
      img('ch_title.webp', 788, 62, e, 'chtitle');
      const BOX = [   // 피그마 CHAPTER 1~4. 위치 · 각도 · 종이 크기
        { x: 31, y: 107.04, w: 664.26, h: 727.94, r: 27.98, pw: 437.874, ph: 591.673 },
        { x: 506, y: 119.51, w: 547.04, h: 662.37, r: 11.37, pw: 439.932, ph: 587.174 },
        { x: 896, y: 192, w: 556.136, h: 672.026, r: -10.71, pw: 452.835, ph: 598.291 },
        { x: 1311.16, y: 125.8, w: 509.662, h: 648.796, r: 6.01, pw: 448.755, ph: 605.125 }
      ];
      const cards = BOX.map((b, k) => {
        const swing = el('div', 'chswing', e, { left: b.x + 'px', top: b.y + 'px', width: b.w + 'px', height: b.h + 'px' });
        const tilt = el('div', 'chtilt', swing);
        img(`ch_${k + 1}.webp`, 0, 0, tilt, 'chimg');
        // 클릭 영역: 사진 종이 모양 그대로 (투명한 모서리는 제외)
        const hit = el('div', 'chhit', tilt, { width: b.pw + 'px', height: b.ph + 'px', left: (b.w - b.pw) / 2 + 'px', top: (b.h - b.ph) / 2 + 'px', transform: `rotate(${b.r}deg)` });
        hit.addEventListener('mouseenter', () => select(k));
        hit.addEventListener('click', () => go(k));
        return { swing, tilt };
      });
      const name = el('div', 'chname', e), title = el('div', 'chsub', e);
      name.addEventListener('click', () => go(sel)); title.addEventListener('click', () => go(sel));
      const L = btn('charrow l', e, null, '이전 챕터'), R = btn('charrow r', e, null, '다음 챕터');
      img('arrow_r.png', 0, 0, L); img('arrow_r.png', 0, 0, R);
      L.addEventListener('click', () => select((sel + C.length - 1) % C.length));
      R.addEventListener('click', () => select((sel + 1) % C.length));
      const back = btn('pback', e, null, '뒤로'); img('back.png', 0, 0, back);
      back.addEventListener('click', () => close());
      let sel = 0, raf = 0, entering = false;
      function select(k) {
        if (entering) return;
        sel = k;
        cards.forEach((c, i) => c.tilt.classList.toggle('active', i === k));
        name.textContent = C[k].name; title.textContent = C[k].title;
        name.classList.remove('swap'); title.classList.remove('swap'); void name.offsetWidth;
        name.classList.add('swap'); title.classList.add('swap');
      }
      /* 빨랫줄에 걸린 것처럼 흔들리며 왼쪽에서 오른쪽으로 들어온 뒤 멈춤 */
      function enterAnim() {
        cancelAnimationFrame(raf);
        entering = true;
        const t0 = performance.now(), D = 2600, from = -1900;
        const step = now => {
          const t = Math.min(1, (now - t0) / D);
          const ease = 1 - Math.pow(1 - Math.min(1, t / 0.62), 3);
          const x = from * (1 - ease);
          cards.forEach((c, i) => {
            const amp = 15 * Math.exp(-3.6 * t) * (1 - t);
            const rot = amp * Math.sin(t * 15 + i * 0.9);
            c.swing.style.transform = `translateX(${x}px) rotate(${rot}deg)`;
          });
          if (t < 1) raf = requestAnimationFrame(step);
          else { cards.forEach(c => c.swing.style.transform = ''); entering = false; }
        };
        cards.forEach(c => c.swing.style.transform = `translateX(${from}px)`);
        raf = requestAnimationFrame(step);
      }
      function go(k) {
        if (closing) return;
        closeTo(C[k].scene, k);
      }
      P.chapter = {
        e,
        reset() { cancelAnimationFrame(raf); entering = false; sel = 0; cards.forEach(c => { c.tilt.classList.remove('active'); c.swing.style.transform = 'translateX(-1900px)'; }); name.textContent = C[0].name; title.textContent = C[0].title; },
        start() { setTimeout(enterAnim, 250); }
      };
    }

    async function open(key, src) {
      if (openKey || closing) return;
      openKey = key; from = src;
      if (src === 'game') closeSettings({ resume: false, instant: false });
      else Clock.pause();
      const p = P[key];
      p.reset();
      p.e.classList.add('open'); void p.e.offsetWidth; p.e.classList.add('show');
      await wait(src === 'game' ? 200 : 0);
      p.start();
    }
    async function close() {
      if (!openKey || closing) return;
      closing = true;
      const p = P[openKey];
      p.e.classList.remove('show');
      await wait(FADE);
      p.e.classList.remove('open');
      openKey = null; closing = false;
      Clock.resume();          // 원래 진행 중이던 화면(또는 intro)으로 돌아감
    }
    /* 챕터 선택: 해당 chapter 영상부터 새로 시작 */
    async function closeTo(sceneId, k) {
      if (!openKey || closing) return;
      closing = true;
      const p = P[openKey];
      resetState();
      if (k === 3) ['board', 'walkman', 'idcard'].forEach(i => state.owned.add(i));   // chapter 4: 집에서 모은 아이템을 가진 상태
      hideMini(); ov.classList.remove('open', 'show'); inv.classList.remove('open', 'closing');
      Clock.reset();
      while (busy) await wait(40);
      const target = SC[sceneId];
      // 페이지가 덮고 있는 동안 씬을 바꾼 뒤 페이지를 걷어냄
      if (cur) { cur.el.classList.remove('on'); cur.el.style.visibility = 'hidden'; cur.leave && cur.leave(); cur = null; }
      setHud(null);
      show(sceneId);
      p.e.classList.remove('show');
      await wait(FADE);
      p.e.classList.remove('open');
      openKey = null; closing = false;
      void target;
    }
    return { open, close, get isOpen() { return !!openKey; } };
  })();

  /* ---------- inventory / options ---------- */
  const inv = el('div', null, stage); inv.id = 'inv';
  el('div', 'dim', inv);
  /* 책 레이어 하나 만들기 (BG 종이 4장 + main book + 내용) */
  function mkBook(name) {
    const layer = el('div', 'blayer ' + name, inv);
    const wrap = el('div', 'wrap', layer);
    const piece = (r, d, cd) => { const p = el('div', 'piece', wrap); p.style.setProperty('--r', r + 'deg'); p.style.setProperty('--d', d + 's'); p.style.setProperty('--cd', cd + 's'); return p; };
    // 열릴 때: BG(0~0.21s) → main book(0.5s) → 내용(1.15s) / 닫힐 때는 역순: 내용 → main book → BG
    img('inv_bg1.webp', 1179, 382, piece(7, 0, .66));
    img('inv_bg2.webp', 226, 84, piece(-6, .07, .59));
    img('inv_bg3.webp', 42, 114, piece(-8, .14, .52));
    img('inv_bg4.webp', 727, 0, piece(9, .21, .45));
    const book = piece(0, .5, .2);
    img('inv_book.webp', 263, 0, book);
    const fade = el('div', 'fadein', wrap, { position: 'absolute', inset: '0' });
    const close = btn('invClose', fade, null, '닫기');
    close.addEventListener('click', closeInventory);
    return { layer, wrap, book, fade };
  }
  const tab = (parent, x, y, kind) => {   // 왼쪽 탭 버튼 (button_1: 가방, button_2: 설정)
    const b = btn('tabbtn ' + kind, parent, { left: x + 'px', top: y + 'px' }, kind === 'bag' ? 'INVENTORY' : 'OPTIONS');
    if (kind === 'bag') { b.style.width = '109px'; b.style.height = '93px'; img('inv_tab1.webp', -6, -2, b); img('icon_backpack.png', 28, 12, b, 'ticon'); }
    else { b.style.width = '100px'; b.style.height = '95px'; img('inv_tab2.webp', -4, -4, b); img('icon_gear.png', 19, 13, b, 'ticon g'); }
    return b;
  };

  // INVENTORY
  const IB = mkBook('invlayer');
  tab(IB.fade, 292, 291, 'bag').classList.add('cur');
  tab(IB.fade, 301, 411, 'gear').addEventListener('click', () => switchBook('opt'));
  img('inv_title.png', 482, 183, IB.fade); img('info_title.png', 482, 614, IB.fade);
  const slots = [];
  for (let n = 0; n < 8; n++) slots.push(el('div', 'slot', IB.fade, { left: (482 + (n % 4) * 118) + 'px', top: (283 + Math.floor(n / 4) * 134) + 'px' }));
  img('info_group.webp', 365, 588, IB.fade);
  const itemArea = el('div', 'itemarea', IB.fade);
  const itemEmpty = el('div', 'itemcard', itemArea);
  img('item_paper.webp', 1005, 159, itemEmpty);       // 처음 화면: 안내 문구가 적힌 종이
  const hint = el('div', 'itemhint', itemEmpty);
  el('p', 'h1', hint).textContent = DATA.text.invHint[0];
  el('p', 'h2', hint).textContent = DATA.text.invHint[1];
  const itemCard = el('div', 'itemcard', itemArea);
  const itemImg = img('item_paper.webp', 1005, 159, itemCard);
  let invSel = null, invBusy = false, view = 'inv';
  const showCard = (node, up) => node.classList.toggle('down', !up);
  Object.entries(DATA.items).filter(([, it]) => it.collect).forEach(([k, it]) => {
    const s = slots[it.slot]; s.dataset.item = k; img(it.slotImg, -3, -3, s);
    s.addEventListener('click', async () => {
      if (invBusy || !state.owned.has(k) || invSel === k) return;
      invBusy = true;
      const visible = invSel ? itemCard : itemEmpty;
      invSel = k;
      slots.forEach(x => x.classList.toggle('sel', x === s));
      visible.classList.add('fall'); showCard(visible, false);           // 지금 보이는 카드는 아래로
      await wait(380);
      itemImg.src = IMG + it.card;
      await ready(itemImg);
      itemCard.classList.remove('fall'); void itemCard.offsetWidth;
      showCard(itemCard, true);                                         // item_XXX 가 아래에서 올라옴
      await wait(560); invBusy = false;
    });
  });

  // OPTIONS
  const OB = mkBook('optlayer');
  tab(OB.fade, 314, 411, 'gear').classList.add('cur');
  /* options 의 button_1: 피그마처럼 좌우 반전된 탭 (x 1585 ~ 1694) */
  const optBag = btn('tabbtn bag flip', OB.fade, { left: '1585px', top: '291px', width: '109px', height: '93px' }, 'INVENTORY');
  { const f = el('div', 'tflip', optBag); img('opt_tab1.png', -6, -2, f); img('icon_backpack.png', 28, 12, f, 'ticon'); img('opt_tab1.png', -6, -2, f, 'thl'); }
  optBag.addEventListener('click', () => switchBook('inv'));
  img('opt_title.webp', 352, 73, OB.fade, 'ink');
  img('opt_photo1.webp', 969, 96, OB.fade);   // Group 225~227: 폴라로이드 사진은 multiply 없이 불투명하게
  img('opt_photo2.webp', 1234, 416, OB.fade);
  img('opt_photo3.webp', 996, 604, OB.fade);
  img('opt_sound.png', 494, 453, OB.fade, 'ink');
  el('div', 'slabel', OB.fade, { left: '494px', top: '521px' }).textContent = '배경음악';
  mkSlider(OB.fade, 666.28, 518, 'bgm');
  el('div', 'slabel', OB.fade, { left: '494px', top: '561px' }).textContent = '효과음';
  mkSlider(OB.fade, 666.28, 558, 'sfx');
  img('opt_graphic.png', 494, 666, OB.fade, 'ink');
  el('div', 'slabel', OB.fade, { left: '494px', top: '734px' }).textContent = '밝기';
  mkSlider(OB.fade, 666.28, 731);

  /* INVENTORY ↔ OPTIONS: 지금 레이어가 통째로 아래로 내려간 뒤 다른 레이어가 올라옴 */
  async function switchBook(to) {
    if (invBusy || view === to || !inv.classList.contains('open')) return;
    invBusy = true;
    const [a, b] = to === 'opt' ? [IB, OB] : [OB, IB];
    a.layer.classList.add('drop');
    await wait(520);
    a.layer.classList.remove('active', 'drop');
    b.layer.classList.add('rise', 'active'); void b.layer.offsetWidth;
    b.layer.classList.remove('rise');
    await wait(700);
    view = to; invBusy = false;
  }
  function openInventory() {
    if (locked() || busy) return;
    hideCaption();
    invSel = null; view = 'inv';
    itemCard.classList.add('down'); itemEmpty.classList.remove('down', 'fall'); itemCard.classList.remove('fall');
    slots.forEach(s => { s.classList.remove('sel'); s.classList.toggle('has', !!s.dataset.item && state.owned.has(s.dataset.item)); });
    IB.layer.classList.add('active'); OB.layer.classList.remove('active', 'drop', 'rise');
    inv.classList.remove('closing'); inv.classList.add('open');
  }
  /* 닫기: 열릴 때의 역순 (내용 → main book → BG) */
  async function closeInventory() {
    if (!inv.classList.contains('open') || inv.classList.contains('closing') || invBusy) return;
    inv.classList.add('closing');
    await wait(1300);
    inv.classList.remove('open', 'closing');
    IB.layer.classList.remove('active'); OB.layer.classList.remove('active');
  }

  const locked = () => ov.classList.contains('open') || inv.classList.contains('open') || settings.classList.contains('open') || pages.isOpen;

  /* ---------- 퍼즐 씬 ---------- */
  function mkPuzzle(rooms, start) {
    const e = el('div', 'scene puzzle', stage);
    const views = {}; let now = null;
    const room = k => {
      if (locked() || busy) return;
      hideCaption();
      if (now) { now.v.classList.remove('on'); now.def.onLeave && now.def.onLeave(); }
      now = views[k]; now.v.classList.add('on'); now.def.onEnter && now.def.onEnter();
      if (now.def.caption) caption(now.def.caption.text, T.captionHold, now.def.caption.size);
    };
    Object.entries(rooms).forEach(([k, r]) => {
      const v = el('div', 'room', e); v.dataset.room = k;
      img(r.bg, r.bx || 0, r.by || 0, v, 'bg');
      if (r.R) img('arrow_r.png', 1793, 483, v, 'arrow').addEventListener('click', () => room(r.R));
      if (r.L) img('arrow_r.png', 0, 483, v, 'arrow flip').addEventListener('click', () => room(r.L));
      (r.spots || []).forEach(s => {
        const b = img('search.png', s.x, s.y, v, 'spot'); b.dataset.spot = s.name;
        b.addEventListener('click', () => { if (!locked() && !busy && s.act) s.act(room); });
      });
      if (r.back) img('back.png', 52, 52, v, 'back').addEventListener('click', () => room(r.back));
      if (r.hand) img('hand.png', r.hand.x, r.hand.y, v, 'hand').addEventListener('click', () => { if (!locked() && !busy) r.hand.act(room); });
      views[k] = { v, def: r };
    });
    return {
      el: e, hud: 'both', room,
      prepare() { Object.values(views).forEach(x => x.v.classList.remove('on')); now = null; busy = false; room(start); busy = true; },
      leave() { hideMini(); if (now && now.def.onLeave) now.def.onLeave(); Object.values(views).forEach(x => x.v.classList.remove('on')); now = null; }
    };
  }

  const HOUSE = {
    frontdoor: { bg: 'bg_frontdoor.jpg', R: 'kitchen', L: 'stair', spots: [
      { name: 'board',  x: 1594, y: 679, act: () => showItem('board') },
      { name: 'soccer', x: 681,  y: 950, act: room => room('frontdoor_1') } ] },
    frontdoor_1: { bg: 'bg_box_close.jpg', back: 'frontdoor', hand: { x: 1014, y: 381, act: room => room('frontdoor_2') } },
    frontdoor_2: { bg: 'bg_box_open.jpg', back: 'frontdoor', caption: { text: DATA.text.boxEmpty, size: 32 } },
    kitchen: { bg: 'bg_kitchen.jpg', R: 'living', L: 'frontdoor', spots: [
      { name: 'soccer', x: 629, y: 471, act: room => room('kitchen_1') } ] },
    kitchen_1: { bg: 'bg_cereal.jpg', back: 'kitchen', caption: { text: DATA.text.kitchen, size: 36 } },
    living: { bg: 'bg_living.jpg', R: 'stair', L: 'kitchen', spots: [
      { name: 'box',  x: 597, y: 844, act: room => room('living_1') },
      { name: 'card', x: 971, y: 661, act: () => showItem('idcard') },
      { name: 'tv',   x: 509, y: 369, act: room => room('living_2') } ] },
    living_1: { bg: 'bg_walkmanbox.jpg', back: 'living', hand: { x: 927, y: 648, act: room => { room('living'); showItem('walkman'); } } },
    living_2: { bg: 'bg_tv.jpg', back: 'living', caption: { text: DATA.text.tv, size: 36 } },
    stair: { bg: 'bg_stair.jpg', R: 'frontdoor', L: 'living', spots: [
      { name: 'board', x: 704, y: 863, act: () => showItem('train') } ] }
  };

  let stairTimer = null;
  const LAB = {
    hall: { bg: 'bg_hall.jpg', R: 'interrogation', L: 'boiler', spots: [
      { name: 'door', x: 467, y: 651, act: room => state.doorOpen ? room('stair') : caption(DATA.text.doorLocked) } ] },
    interrogation: { bg: 'bg_interrogation.jpg', R: 'boiler', L: 'hall', spots: [
      { name: 'paper', x: 981, y: 651, act: () => showItem('newspaper') } ] },
    boiler: { bg: 'bg_boiler.jpg', R: 'hall', L: 'interrogation', spots: [
      { name: 'board', x: 1144, y: 330, act: () => panel.open() } ] },
    stair: { bg: 'bg_stair4.jpg', spots: [
      { name: 'board', x: 455, y: 292, act: room => room('stair_1') } ] },
    stair_1: { bg: 'bg_keypad.jpg', back: 'stair',
      onEnter() {
        caption(DATA.text.needCard, 0);
        stairTimer = later(() => {
          hideCaption();
          showMini(null, { persist: true, pick: k => { if (k === 'idcard') { hideMini(); show('ending'); } } });
        }, 1500);
      },
      onLeave() { cancel(stairTimer); hideMini(); } }
  };

  /* ---------- ending ---------- */
  function mkEndingCard(def, text, hold, next) {
    const e = el('div', 'scene ending', stage);
    const box = el('div', 'eimg', e, { left: def.x + 'px', top: def.y + 'px', width: def.w + 'px', height: def.h + 'px' });
    img(def.img, 0, 0, box);
    el('div', 'etext', e).textContent = text;
    return mkTimed(e, hold, 'setting', next);
  }
  /* ending_2: 10초 타이머 안에 워크맨 / 스케이트 보드 중 하나를 고르기 */
  function mkChoice() {
    const e = el('div', 'scene ending choice', stage);
    const E2 = DATA.endings.ending_2;
    const box = el('div', 'eimg', e, { left: E2.x + 'px', top: E2.y + 'px', width: E2.w + 'px', height: E2.h + 'px' }); img(E2.img, 0, 0, box);
    el('div', 'equestion', e).textContent = DATA.text.ending_2;
    const board = btn('pick', e, { left: '688px', top: '876px' }, '스케이트 보드'); img('pick_board.webp', 0, 0, board);
    const walk = btn('pick', e, { left: '1015px', top: '876px' }, '워크맨'); img('pick_walkman.webp', 0, 0, walk);
    const gauge = el('div', 'egauge', e); const bar = el('i', null, gauge);
    let live = false, raf = 0, t0 = 0;
    const tick = () => {
      if (!live) return;
      const left = Math.max(0, 1 - (Clock.now() - t0) / (T.choiceTime * 1000));
      bar.style.transform = `scaleX(${left})`;
      if (left <= 0) { live = false; show('bad_ending_1'); return; }   // 시간 초과 → bad ending
      raf = requestAnimationFrame(tick);
    };
    const start = () => { live = true; t0 = Clock.now(); bar.style.transform = 'scaleX(1)'; raf = requestAnimationFrame(tick); };
    /* 워크맨 → true ending, 스케이트 보드 → bad ending (전환 애니메이션은 같음) */
    const choose = (b, to) => b.addEventListener('click', () => {
      if (!live || Clock.depth) return;
      live = false; cancelAnimationFrame(raf); b.classList.add('chosen'); show(to);
    });
    choose(walk, 'true_ending_1'); choose(board, 'bad_ending_1');
    const sc = {
      el: e, hud: 'setting',
      prepare() { live = false; bar.style.transform = 'scaleX(1)'; walk.classList.remove('chosen'); board.classList.remove('chosen'); },
      enter() { start(); },
      leave() { live = false; cancelAnimationFrame(raf); }
    };
    return sc;
  }
  function mkResult(image) {
    const e = el('div', 'scene ending result', stage);
    img(image, 0, 0, e, 'bg');
    return mkTimed(e, T.resultHold, 'setting', toIntro);
  }

  /* ---------- 씬 등록 & 순서 ---------- */
  const V = DATA.video, TX = DATA.text, EN = DATA.endings;
  add('intro', mkIntro());
  add('chapter_1', mkVideo(V.chapter_1, null, { sound: 'chapter' }));
  add('intro_animation', mkVideo(V.intro_animation, 'poster_intro_anim.jpg', { cross: true, skip: true, sound: 'intro_animation' }));
  add('scene1', mkDialogue(DATA.scene1));
  add('night', mkCard('night.jpg', T.cardHold));
  add('billy_video', mkVideo(V.billy, null));
  add('billy', mkDialogue(Object.assign({ shake: { delay: 350, duration: 1700, amp: 44 } }, DATA.billy)));
  add('guide1', mkCard('guide_1.jpg', T.guideHold));
  add('minigame', mkMinigame());
  add('mg_fail', mkFail());
  add('chapter_2', mkVideo(V.chapter_2, 'poster_ch2.jpg', { sound: 'chapter' }));
  add('scene2', mkDialogue(DATA.scene2));
  add('overnight', mkCard('overnight.jpg', T.cardHold));
  add('max_scream', mkVideo(V.max_scream, 'poster_max_scream.jpg', { sub: { img: 'sub_max.png', x: 789, y: 927 }, sound: 'max_scream' }));
  add('chapter_3', mkVideo(V.chapter_3, 'poster_ch3.jpg', { sound: 'chapter' }));
  add('scene3', mkDialogue(DATA.scene3));
  add('guide2', mkCard('guide_2.jpg', T.guideHold));
  add('house', mkPuzzle(HOUSE, 'frontdoor'));
  add('chapter_4', mkVideo(V.chapter_4, 'poster_ch4.jpg', { sound: 'chapter' }));
  add('scene4', mkDialogue(DATA.scene4));
  add('lab', mkPuzzle(LAB, 'hall'));
  add('ending', mkEndingCard(EN.ending, TX.ending, T.endingHold));
  add('ending_1', mkEndingCard(EN.ending_1, TX.ending_1, T.endingHold));
  add('ending_2', mkChoice());
  /* 분기: 각 줄의 마지막 장면은 결과 화면으로, 결과 화면은 intro 로 */
  [['true', EN.trueEnding, EN.trueResult], ['bad', EN.badEnding, EN.badResult]].forEach(([k, list, result]) => {
    list.forEach((d, i) => add(`${k}_ending_${i + 1}`, mkEndingCard(d, d.text, T.trueEndingHold,
      () => show(i + 1 < list.length ? `${k}_ending_${i + 2}` : `${k}_ending_result`))));
    add(`${k}_ending_result`, mkResult(result));
  });

  const ORDER = ['intro', 'chapter_1', 'intro_animation', 'scene1', 'night', 'billy_video', 'billy', 'guide1', 'minigame',
    'chapter_2', 'scene2', 'overnight', 'max_scream', 'chapter_3', 'scene3', 'guide2', 'house', 'chapter_4', 'scene4', 'lab',
    'ending', 'ending_1', 'ending_2'];   // ending_2 다음은 선택에 따라 true_ending_* / bad_ending_* 로 갈라집니다

  /* 저장된 밝기 */
  try { const b = localStorage.getItem('signal.bright'); if (b !== null) setBright(+b); } catch (e) { /* 저장 불가 환경 */ }

  /* 이미지 미리 불러오기 */
  const pre = new Set();
  const walk = o => { if (typeof o === 'string') { if (/\.(webp|png|jpg)$/.test(o)) pre.add(o); } else if (o && typeof o === 'object') Object.values(o).forEach(walk); };
  walk(DATA);
  ['item_board.webp', 'item_walkman.webp', 'item_idcard.webp', 'fail.jpg', 'ch_bg.jpg', 'ch_1.webp', 'ch_2.webp', 'ch_3.webp', 'ch_4.webp', 'set_paper.webp', 'bg_tv.jpg'].forEach(s => pre.add(s));
  pre.forEach(s => { const i = new Image(); i.src = IMG + s; });

  /* 테스트용: 주소 뒤에 #scene2, #house, #lab 처럼 씬 이름을 붙이면 그 씬부터 시작합니다 */
  const ALIAS = { true_ending: 'ending' };
  const jump = ALIAS[location.hash.slice(1)] || location.hash.slice(1);
  if (jump === 'lab' || /ending/.test(jump)) ['board', 'walkman', 'idcard'].forEach(i => state.owned.add(i));
  show(SC[jump] ? jump : 'intro');
  window.SIGNAL = { show, state, SC, ORDER, pages, openSettings, Clock, Sound };
})();
