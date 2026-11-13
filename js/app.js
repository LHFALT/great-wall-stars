(function () {
  'use strict';

  const HEROES = (window.HEROES && window.HEROES.length) ? window.HEROES : [];
  const rosterHeroes = HEROES.filter(function (h) { return !h.beidou; });
  const heroByName = {};
  HEROES.forEach(function (h, i) {
    if (heroByName[h.name] == null) heroByName[h.name] = i;
  });

  const veil = document.getElementById('veil');
  const roster = document.getElementById('roster');
  let currentIdx = -1;

  function openHero(hero, idx) {
    if (!hero) return;
    if (typeof idx !== 'number') idx = (heroByName[hero.name] != null) ? heroByName[hero.name] : -1;
    currentIdx = idx;

    document.getElementById('mName').textContent = hero.name;
    document.getElementById('mType').textContent = hero.type || '烈士';
    document.getElementById('mLife').textContent = hero.life || '？—？';
    document.getElementById('mRole').textContent = hero.role || '—';
    document.getElementById('mStory').textContent = hero.story || '';
    document.getElementById('mQuote').textContent = hero.quote ? '「' + hero.quote + '」' : '';
    document.getElementById('mSource').textContent = hero.source ? '资料来源：' + hero.source : '';
    document.getElementById('mCount').textContent = hero.beidou
      ? '北斗七星 · 星位人物 · 可按 ← → 翻阅'
      : (idx >= 0
        ? '第 ' + (rosterHeroes.indexOf(hero) + 1) + ' / ' + rosterHeroes.length + ' 位 · 可按 ← → 翻阅'
        : '无名英烈 · 千千万万，与山河同在');

    closeAll();
    veil.classList.add('open');
    veil.querySelector('.panel').scrollTop = 0;
  }

  function stepHero(dir) {
    if (!rosterHeroes.length) return;
    let pos = currentIdx >= 0 ? rosterHeroes.indexOf(HEROES[currentIdx]) : -1;
    if (pos < 0) {
      pos = dir > 0 ? 0 : rosterHeroes.length - 1;
    } else {
      pos = (pos + dir + rosterHeroes.length) % rosterHeroes.length;
    }
    openHero(rosterHeroes[pos], HEROES.indexOf(rosterHeroes[pos]));
  }

  document.getElementById('mClose').addEventListener('click', function () { veil.classList.remove('open'); });
  veil.addEventListener('click', function (e) { if (e.target === veil) veil.classList.remove('open'); });

  const rGrid = document.getElementById('rGrid');
  const rSub = document.getElementById('rSub');
  rSub.textContent = '共 ' + rosterHeroes.length + ' 位可考英烈与科学家';

  let rosterBuilt = false;
  function buildRoster() {
    if (rosterBuilt) return;
    rosterBuilt = true;
    HEROES.forEach(function (h, i) {
      if (h.beidou) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'r-item';
      const strong = document.createElement('strong');
      strong.textContent = h.name;
      const meta = document.createElement('span');
      meta.textContent = (h.type ? h.type : '') + ' · ' + h.life;
      b.appendChild(strong);
      b.appendChild(meta);
      b.addEventListener('click', function () { openHero(h, i); });
      rGrid.appendChild(b);
    });
  }

  document.getElementById('btnRoster').addEventListener('click', function () {
    buildRoster();
    closeAll();
    roster.classList.add('open');
  });
  document.getElementById('rClose').addEventListener('click', function () { roster.classList.remove('open'); });
  roster.addEventListener('click', function (e) { if (e.target === roster) roster.classList.remove('open'); });

  window.addEventListener('gw:pick', function (e) {
    const idx = e.detail && e.detail.idx;
    const h = HEROES[idx];
    if (!h) return;
    Sound.starBell(idx);
    openHero(h, idx);
  });

  const searchForm = document.getElementById('search');
  const qInput = document.getElementById('q');
  const qMsg = document.getElementById('qmsg');
  let qTimer = null;

  const ritual = document.getElementById('ritual');
  function runRitual() {
    ritual.classList.remove('fire');
    void ritual.offsetWidth;
    ritual.classList.add('fire');
    window.setTimeout(function () { ritual.classList.remove('fire'); }, 1800);
  }

  function findHero(q) {
    const key = q.trim();
    if (!key) return -1;
    if (heroByName[key] != null) return heroByName[key];
    for (let i = 0; i < HEROES.length; i++) {
      if (HEROES[i].name.indexOf(key) === 0) return i;
    }
    for (let i = 0; i < HEROES.length; i++) {
      if (HEROES[i].name.indexOf(key) >= 0) return i;
    }
    return -1;
  }

  function tip(text) {
    qMsg.textContent = text;
    qMsg.classList.add('show');
    window.clearTimeout(qTimer);
    qTimer = window.setTimeout(function () { qMsg.classList.remove('show'); }, 2800);
  }

  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const key = qInput.value.trim();
    if (!key) { tip('请输入英烈姓名'); return; }
    if (!window.GW) { tip('星光尚未就绪，请稍候'); return; }

    const idx = findHero(key);
    if (idx < 0) { tip('未找到「' + key + '」，可查阅英烈名录'); return; }

    const hero = HEROES[idx];
    window.GW.focusStar(idx, 2.2);
    runRitual();

    tip('已定位：' + hero.name + '（' + (hero.life || '') + '）');
    Sound.bell(880);
    qInput.blur();
  });

  const Sound = (function () {
    let ac = null, master = null, wind = null, running = false, fx = null;

    function ensure() {
      if (ac) return ac;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0;
      master.connect(ac.destination);
      return ac;
    }

    function noiseBuffer() {
      const len = ac.sampleRate * 2;
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const ch = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        last = last * 0.96 + w * 0.04;
        ch[i] = last * 3;
      }
      return buf;
    }

    function startAmbient() {
      const src = ac.createBufferSource();
      src.buffer = noiseBuffer();
      src.loop = true;
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      lp.Q.value = 0.6;
      wind = ac.createGain();
      wind.gain.value = 0.16;
      src.connect(lp);
      lp.connect(wind);
      wind.connect(master);
      src.start();

      [110, 164.8].forEach(function (f, i) {
        const o = ac.createOscillator();
        o.type = 'sine';
        o.frequency.value = f;
        const g = ac.createGain();
        g.gain.value = i ? 0.05 : 0.07;
        o.connect(g);
        g.connect(master);
        o.start();
      });

      const lfo = ac.createOscillator();
      lfo.frequency.value = 0.06;
      const lg = ac.createGain();
      lg.gain.value = 0.08;
      lfo.connect(lg);
      lg.connect(wind.gain);
      lfo.start();
    }

    function toggle() {
      const c = ensure();
      if (!c) return false;
      if (c.state === 'suspended') c.resume();
      if (!running) {
        if (!wind) startAmbient();
        running = true;
        master.gain.cancelScheduledValues(c.currentTime);
        master.gain.setValueAtTime(master.gain.value, c.currentTime);
        master.gain.linearRampToValueAtTime(0.55, c.currentTime + 1.6);
      } else {
        master.gain.cancelScheduledValues(c.currentTime);
        master.gain.setValueAtTime(master.gain.value, c.currentTime);
        master.gain.linearRampToValueAtTime(0, c.currentTime + 0.9);
        running = false;
      }
      return running;
    }

    function chime(freq, dur, gain) {
      if (!ac || !running) return;
      const t = ac.currentTime;
      const o = ac.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      const o2 = ac.createOscillator();
      o2.type = 'triangle';
      o2.frequency.value = freq * 2.01;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain || 0.1, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 1.1));
      o.connect(g);
      o2.connect(g);
      g.connect(master);
      o.start(t);
      o2.start(t);
      o.stop(t + (dur || 1.1) + 0.06);
      o2.stop(t + (dur || 1.1) + 0.06);
    }

    function bell(freq, dur, ratios) {
      const c = ensure();
      if (!c || !running) return;
      if (c.state === 'suspended') c.resume();
      if (!fx) {
        fx = c.createGain();
        fx.gain.value = 0.5;
        fx.connect(master);
      }
      const t = c.currentTime;
      const f0 = freq || 720;
      const d = dur || 2.6;

      (ratios || [[1, 0.16], [2.76, 0.07], [5.4, 0.032]]).forEach(function (p) {
        const o = c.createOscillator();
        o.type = 'sine';
        o.frequency.value = f0 * p[0];
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(p[1], t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g);
        g.connect(fx);
        o.start(t);
        o.stop(t + d + 0.1);
      });
    }

    const PENTA = [0, 2, 4, 7, 9];
    const TIMBRES = [
      [[1, 0.15], [2.76, 0.07], [5.40, 0.032]],
      [[1, 0.17], [2.00, 0.05], [4.20, 0.022]],
      [[1, 0.14], [3.10, 0.06], [6.20, 0.020]]
    ];

    function starBell(idx) {
      const i = Math.abs(idx | 0);
      const oct = Math.floor((i % 15) / 5);
      const semi = PENTA[i % 5] + oct * 12;
      const jitter = (((i * 137) % 997) / 997 - 0.5) * 18;
      const f0 = 528 * Math.pow(2, (semi - 12) / 12 + jitter / 1200);
      bell(f0, 2.2 + (i % 5) * 0.18, TIMBRES[i % 3]);
    }

    return { toggle: toggle, chime: chime, bell: bell, starBell: starBell, isOn: function () { return running; } };
  })();

  const btnSound = document.getElementById('btnSound');
  const btnSoundLabel = document.getElementById('btnSoundLabel');
  btnSound.addEventListener('click', function () {
    const on = Sound.toggle();
    btnSoundLabel.textContent = on ? '静音' : '声音';
    btnSound.classList.toggle('on', on);
    if (on) Sound.chime(1320, 2.2, 0.06);
  });

  const litCountEl = document.getElementById('litCount');

  function renderLit(n) {
    if (!n) { litCountEl.classList.remove('show'); return; }
    litCountEl.textContent = '此刻有 ' + n + ' 颗星光为你亮着';
    litCountEl.classList.add('show');
  }

  window.addEventListener('gw:lit', function (e) { renderLit(e.detail && e.detail.count); });
  if (window.GW && window.GW.litCount) renderLit(window.GW.litCount());

  const rEnd = document.getElementById('rEnd');
  rGrid.addEventListener('scroll', function () {
    if (rGrid.scrollTop + rGrid.clientHeight >= rGrid.scrollHeight - 10) rEnd.classList.add('show');
  });

  const tools = document.getElementById('tools');
  const toolsMenu = document.getElementById('toolsMenu');
  const btnMenu = document.getElementById('btnMenu');

  function closeTools() {
    tools.classList.remove('open');
    btnMenu.classList.remove('on');
    btnMenu.setAttribute('aria-expanded', 'false');
  }

  btnMenu.addEventListener('click', function (e) {
    e.stopPropagation();
    const open = tools.classList.toggle('open');
    btnMenu.classList.toggle('on', open);
    btnMenu.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  toolsMenu.addEventListener('click', function (e) {
    if (e.target.closest('button, a')) closeTools();
  });

  document.addEventListener('click', function (e) {
    if (!tools.contains(e.target)) closeTools();
  });

  document.getElementById('btnReset').addEventListener('click', function () {
    if (window.GW) window.GW.resetView();
  });

  function closeAll() {
    veil.classList.remove('open');
    roster.classList.remove('open');
    closeTools();
  }

  function trapFocus(box, e) {
    const items = Array.prototype.filter.call(
      box.querySelectorAll('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null; }
    );
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeAll(); return; }
    if (e.key === 'Tab') {
      if (veil.classList.contains('open')) { trapFocus(veil, e); return; }
      if (roster.classList.contains('open')) { trapFocus(roster, e); return; }
    }
    if (!veil.classList.contains('open')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepHero(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); stepHero(1); }
  });
})();
