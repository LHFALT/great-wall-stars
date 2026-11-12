(function () {
  'use strict';

  const RAW = window.STARS_BAKED || [];
  const IW = 2048, IH = 1136;

  const stageEl = document.querySelector('.stage');
  const frame = document.getElementById('frame');
  const cv = document.getElementById('dust');
  const ctx = cv.getContext('2d');

  let DPR = Math.min(window.devicePixelRatio || 1, 2);
  let imgW = 0, imgH = 0, offX = 0, offY = 0;

  let stars = [];
  let focusIdx = -1;
  let focusBei = -1;
  const revealAt = performance.now();

  const HOLD_MS = 60000;
  const FADE_MS = 30000;
  const lit = new Map();
  let litChanged = false;

  const mouse = { x: 0, y: 0, active: false };

  const PALETTE = ['#F6C98A', '#E2543F'];

  // 北斗七星：斗身 0-1-2-3，斗柄 3-4-5-6，勺口在 3-0 一侧敞开
  const BEIDOU_SHAPE = [
    [0.00, 0.00], [-0.25, -0.12], [-0.53, 0.22], [-0.35, 0.40],
    [-0.45, 0.67], [-0.49, 0.91], [-0.77, 1.17]
  ];
  const BEIDOU_R = [4.0, 3.6, 3.6, 4.6, 3.8, 3.6, 3.4];
  const BEIDOU_LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]];
  // 七星对应人物：天枢—天璇—天玑—天权—玉衡—开阳—摇光
  const BEIDOU_HEROES = ['林则徐', '邓世昌', '孙中山', '毛泽东', '李大钊', '彭德怀', '张学良'];
  let beidou = [];
  const beidouLit = new Map();

  function rgbaOf(idx, a) {
    const hex = PALETTE[idx];
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  // 星点光晕预渲染成精灵图，避免每帧为上千颗星重复创建径向渐变
  const SPRITES = PALETTE.map(function (hex) {
    const size = 96;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g2 = c.getContext('2d');
    const r = parseInt(hex.slice(1, 3), 16);
    const g0 = parseInt(hex.slice(3, 5), 16);
    const b0 = parseInt(hex.slice(5, 7), 16);
    const rgb = r + ',' + g0 + ',' + b0;
    const grd = g2.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, 'rgba(' + rgb + ',1)');
    grd.addColorStop(0.32, 'rgba(' + rgb + ',0.34)');
    grd.addColorStop(0.68, 'rgba(' + rgb + ',0.09)');
    grd.addColorStop(1, 'rgba(' + rgb + ',0)');
    g2.fillStyle = grd;
    g2.fillRect(0, 0, size, size);
    return c;
  });

  const LUMA_MIN = 212;
  const SAMPLE_STEP = 5;
  const STAR_MAX = 100;
  const STAR_MIN = 80;
  const MIN_GAP = 72;
  const MAX_OFFSET = 20;
  const WALK = 2.4;

  let bright = null;
  let positions = [];

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function lumaAt(px, py) {
    if (!bright) return 0;
    const x = px | 0, y = py | 0;
    if (x < 0 || y < 0 || x >= IW || y >= IH) return 0;
    return bright[y * IW + x];
  }

  function buildStars() {
    const img = new Image();
    img.onload = function () {
      let pts = [];
      try {
        const c = document.createElement('canvas');
        c.width = IW; c.height = IH;
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0, IW, IH);
        const d = g.getImageData(0, 0, IW, IH).data;

        bright = new Float32Array(IW * IH);
        for (let i = 0, n = IW * IH; i < n; i++) {
          bright[i] = 0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2];
        }
        for (let y = 0; y < IH; y += SAMPLE_STEP) {
          for (let x = 0; x < IW; x += SAMPLE_STEP) {
            if (bright[y * IW + x] >= LUMA_MIN) pts.push([x, y]);
          }
        }
      } catch (err) {
        bright = null;
        pts = [];
      }

      const rnd = mulberry32(20261111);
      const chosen = [];

      if (pts.length) {
        let guard = 0;
        while (chosen.length < STAR_MAX && guard++ < 40000) {
          const p = pts[(rnd() * pts.length) | 0];

          const x = p[0] + (rnd() * 2 - 1) * MAX_OFFSET;
          const y = p[1] + (rnd() * 2 - 1) * MAX_OFFSET;
          if (lumaAt(x, y) < LUMA_MIN) continue;

          let ok = true;
          for (let k = 0; k < chosen.length; k++) {
            const dx = chosen[k][0] - x, dy = chosen[k][1] - y;
            if (dx * dx + dy * dy < MIN_GAP * MIN_GAP) { ok = false; break; }
          }
          if (!ok) continue;
          chosen.push([x, y]);
        }
      }

      if (chosen.length < STAR_MIN && RAW.length) {

        positions = RAW.map(function (p) {
          return [p[0] / 100 * IW, p[1] / 100 * IH];
        });
      } else {
        positions = chosen;
      }
      initStars();
      buildBeidou();
    };
    img.src = 'images/great-wall-bg.jpg';
  }

  function layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.max(vw / IW, vh / IH);
    imgW = IW * s; imgH = IH * s;
    offX = (vw - imgW) / 2; offY = (vh - imgH) / 2;

    frame.style.width = imgW + 'px';
    frame.style.height = imgH + 'px';
    frame.style.left = offX + 'px';
    frame.style.top = offY + 'px';
  }

  function initStars() {
    stars = positions.map(function (p, i) {
      const nx = p[0] / IW, ny = p[1] / IH;
      const r1 = mulberry32(i * 7919 + 13)();
      const r2 = mulberry32(i * 104729 + 7)();
      const r3 = mulberry32(i * 1299709 + 5)();
      const ang = r2 * Math.PI * 2;
      return {
        x: offX + nx * imgW,
        y: offY + ny * imgH,
        nx: nx,
        r: 1 + r1 * 2,
        tone: i % 6 === 0 ? 1 : 0,
        a: 0.48 + r3 * 0.5,
        phase: (i * 2.3999632) % (Math.PI * 2),
        sp: 0.4 + (i % 8) * 0.17,
        wx: 0, wy: 0,
        vx: Math.cos(ang) * 0.055,
        vy: Math.sin(ang) * 0.055
      };
    });
  }

  function insideQuad(px, py, q) {
    let inside = false;
    for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
      const xi = q[i].x, yi = q[i].y, xj = q[j].x, yj = q[j].y;
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function buildBeidou() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const S = Math.min(vw, vh) * 0.255;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const rad = 15 * Math.PI / 180;
    const cr = Math.cos(rad), sr = Math.sin(rad);
    const pts = BEIDOU_SHAPE.map(function (p) {
      const vx = (p[0] - BEIDOU_SHAPE[0][0]) * S;
      const vy = (p[1] - BEIDOU_SHAPE[0][1]) * S;
      const q = {
        x: vx * cr - vy * sr,
        y: vx * sr + vy * cr
      };
      if (q.x < minX) minX = q.x;
      if (q.x > maxX) maxX = q.x;
      if (q.y < minY) minY = q.y;
      if (q.y > maxY) maxY = q.y;
      return q;
    });

    // 页面顶部居中，纵向避开导航与搜索框
    let top = 14;
    const link = document.querySelector('.top-nav a');
    if (link) {
      let bottom = link.getBoundingClientRect().bottom;
      const sf = document.querySelector('.search');
      if (sf) bottom = Math.max(bottom, sf.getBoundingClientRect().bottom);
      top = Math.max(top, bottom + 10);
    }
    const dx = vw / 3 - (minX + maxX) / 2;
    const dy = top - minY;

    const heroes = window.HEROES || [];
    beidou = pts.map(function (p, i) {
      return {
        x: p.x + dx,
        y: p.y + dy,
        r: BEIDOU_R[i],
        a: i === 3 ? 1 : 0.95 - i * 0.02,
        phase: i * 1.73,
        hi: heroes.findIndex(function (h) { return h.name === BEIDOU_HEROES[i]; })
      };
    });

    // 天枢（0）略微上移
    beidou[0].y -= S * 0.07;

    // 隐藏落在斗身里的普通星点，避免勺子中间多出一颗
    const bowl = beidou.slice(0, 4);
    for (let i = 0; i < stars.length; i++) {
      stars[i].hide = insideQuad(stars[i].x, stars[i].y, bowl);
    }
  }

  function resetView() {
    focusIdx = -1;
    focusBei = -1;
  }

  function focusStar(idx) {
    for (let i = 0; i < beidou.length; i++) {
      if (beidou[i].hi === idx) {
        focusIdx = -1;
        focusBei = i;
        return true;
      }
    }
    if (!stars.length) return false;
    const i = idx % stars.length;
    if (!stars[i]) return false;
    focusBei = -1;
    focusIdx = i;
    return true;
  }

  function pickStar(sx, sy) {
    const r = 16;
    let best = -1, bestD2 = r * r;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      if (s.hide) continue;
      const dx = s.x - sx, dy = s.y - sy;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) { bestD2 = d2; best = i; }
    }
    return best;
  }

  function pickBeidou(sx, sy) {
    let best = -1, bestD2 = 20 * 20;
    for (let i = 0; i < beidou.length; i++) {
      const dx = beidou[i].x - sx, dy = beidou[i].y - sy;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) { bestD2 = d2; best = i; }
    }
    return best;
  }

  const HEROES = window.HEROES || [];
  let hoverIdx = -1;
  let hoverBei = -1;
  let hoverKey = '';

  const tipEl = document.createElement('div');
  tipEl.className = 'star-tip';
  document.body.appendChild(tipEl);

  cv.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;

    const s = pickStar(mouse.x, mouse.y);
    const b = s >= 0 ? -1 : pickBeidou(mouse.x, mouse.y);
    const key = s >= 0 ? 's' + s : (b >= 0 ? 'b' + b : '');
    if (key !== hoverKey) {
      hoverKey = key;
      hoverIdx = s;
      hoverBei = b;
      const heroIdx = s >= 0 ? s : (b >= 0 ? beidou[b].hi : -1);
      cv.style.cursor = heroIdx >= 0 ? 'pointer' : '';
      const h = heroIdx >= 0 ? HEROES[heroIdx] : null;
      if (h && h.quote) {
        tipEl.textContent = '「' + h.quote + '」';
        tipEl.classList.add('show');
      } else {
        tipEl.classList.remove('show');
      }
    }
    if (hoverIdx >= 0 || hoverBei >= 0) {
      tipEl.style.left = Math.max(8, Math.min(window.innerWidth - 280, e.clientX + 16)) + 'px';
      tipEl.style.top = (e.clientY + 18) + 'px';
    }
  });

  cv.addEventListener('mouseleave', function () {
    hoverIdx = -1;
    hoverBei = -1;
    hoverKey = '';
    mouse.active = false;
    tipEl.classList.remove('show');
    cv.style.cursor = '';
  });

  function pickAt(clientX, clientY) {
    let idx = pickStar(clientX, clientY);
    if (idx < 0) {
      const b = pickBeidou(clientX, clientY);
      if (b >= 0) idx = beidou[b].hi;
    }
    if (idx >= 0) {
      window.dispatchEvent(new CustomEvent('gw:pick', { detail: { idx: idx } }));
    }
  }

  stageEl.addEventListener('pointerup', function (e) {
    if (e.button !== 0) return;
    if (e.target.closest('button, input, textarea, a, .search, .tools, .veil')) return;
    pickAt(e.clientX, e.clientY);
  });

  function draw(now) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      if (s.hide) continue;
      const tw = 0.5 + 0.5 * Math.sin(now * 0.0012 * s.sp + s.phase);
      const rise = Math.min(1, Math.max(0, (now - revealAt) / 2400 * 1.25 - s.nx * 0.35));
      const p = rise * rise * (3 - 2 * rise);
      if (p <= 0) continue;

      s.wx += s.vx; s.wy += s.vy;
      if (s.wx > WALK || s.wx < -WALK) { s.vx *= -1; s.wx = Math.max(-WALK, Math.min(WALK, s.wx)); }
      if (s.wy > WALK || s.wy < -WALK) { s.vy *= -1; s.wy = Math.max(-WALK, Math.min(WALK, s.wy)); }

      const hot = i === hoverIdx;

      let glow = 0;
      const litAt = lit.get(i);
      if (litAt !== undefined) {
        const age = now - litAt;
        glow = age <= HOLD_MS ? 1 : Math.max(0, 1 - (age - HOLD_MS) / FADE_MS);
        if (age > HOLD_MS + FADE_MS) { lit.delete(i); litChanged = true; }
      }

      const cx = s.x + s.wx, cy = s.y + s.wy;
      const tone = glow > 0 ? 0 : s.tone;

      const rad = s.r * 4.6 * (hot ? 1.9 : 1 + 0.55 * glow);
      const alpha = Math.min(1, s.a * (0.68 + 0.32 * tw) * p * (hot ? 1.9 : 1 + 0.5 * glow));
      ctx.globalAlpha = alpha;
      ctx.drawImage(SPRITES[tone], cx - rad, cy - rad, rad * 2, rad * 2);
    }
    ctx.globalAlpha = 1;

    const bRise = Math.min(1, Math.max(0, (now - revealAt) / 2200));
    if (beidou.length && bRise > 0) {
      // 连线，让七星从普通星点里区分出来
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(246,201,138,' + (0.28 * bRise) + ')';
      ctx.beginPath();
      for (let k = 0; k < BEIDOU_LINKS.length; k++) {
        const a = beidou[BEIDOU_LINKS[k][0]], b = beidou[BEIDOU_LINKS[k][1]];
        if (!a || !b) continue;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();

      for (let i = 0; i < beidou.length; i++) {
        const b = beidou[i];
        const hot = i === hoverBei;
        let flash = 0;
        const bat = beidouLit.get(i);
        if (bat !== undefined) {
          const age = now - bat;
          flash = age <= HOLD_MS ? 1 : Math.max(0, 1 - (age - HOLD_MS) / FADE_MS);
          if (age > HOLD_MS + FADE_MS) beidouLit.delete(i);
        }
        const tw = 0.88 + 0.12 * Math.sin(now * 0.0011 + b.phase);
        const alpha = Math.min(1, b.a * tw * bRise * (hot ? 1.6 : 1 + 0.35 * flash));

        // 柔和外晕
        const halo = b.r * 3.6 * (hot ? 1.6 : 1 + 0.5 * flash);
        const g1 = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, halo);
        g1.addColorStop(0, 'rgba(255,246,228,' + (alpha * 0.62) + ')');
        g1.addColorStop(0.42, 'rgba(246,201,138,' + (alpha * 0.18) + ')');
        g1.addColorStop(1, 'rgba(246,201,138,0)');
        ctx.fillStyle = g1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, halo, 0, Math.PI * 2);
        ctx.fill();

        // 十字星芒
        const ray = b.r * 4.4;
        const gh = ctx.createLinearGradient(b.x - ray, b.y, b.x + ray, b.y);
        gh.addColorStop(0, 'rgba(255,248,232,0)');
        gh.addColorStop(0.5, 'rgba(255,248,232,' + (alpha * 0.85) + ')');
        gh.addColorStop(1, 'rgba(255,248,232,0)');
        const gv = ctx.createLinearGradient(b.x, b.y - ray, b.x, b.y + ray);
        gv.addColorStop(0, 'rgba(255,248,232,0)');
        gv.addColorStop(0.5, 'rgba(255,248,232,' + (alpha * 0.85) + ')');
        gv.addColorStop(1, 'rgba(255,248,232,0)');
        ctx.lineWidth = 1;
        ctx.strokeStyle = gh;
        ctx.beginPath();
        ctx.moveTo(b.x - ray, b.y);
        ctx.lineTo(b.x + ray, b.y);
        ctx.stroke();
        ctx.strokeStyle = gv;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y - ray);
        ctx.lineTo(b.x, b.y + ray);
        ctx.stroke();

        // 实心亮核
        const core = b.r * 1.25;
        const g2 = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, core);
        g2.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
        g2.addColorStop(0.45, 'rgba(255,246,226,' + (alpha * 0.8) + ')');
        g2.addColorStop(1, 'rgba(255,238,200,0)');
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, core, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (litChanged) {
      litChanged = false;
      window.dispatchEvent(new CustomEvent('gw:lit', { detail: { count: lit.size } }));
    }

    if (mouse.active) {
      const R = 185;
      const near = [];
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const dx = s.x - mouse.x, dy = s.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R) near.push({ d: Math.sqrt(d2), s: s });
      }
      near.sort(function (a, b) { return a.d - b.d; });
      const n = Math.min(3, near.length);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,214,150,1)';
      for (let k = 0; k < n; k++) {
        const it = near[k];
        const fade = 1 - it.d / R;
        ctx.globalAlpha = 0.34 * fade * fade * (0.72 + 0.28 * Math.sin(now * 0.004 + k));
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(it.s.x, it.s.y);
        ctx.stroke();
      }
    }

    if (focusIdx >= 0 && stars[focusIdx]) {
      const f = stars[focusIdx];
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.003);
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = 'rgba(255,236,198,1)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 14 + 4 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 25 + 9 * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (focusBei >= 0 && beidou[focusBei]) {
      const f = beidou[focusBei];
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.003);
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = 'rgba(255,236,198,1)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 18 + 4 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 30 + 9 * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    layout();
    initStars();
    buildBeidou();

    cv.width = Math.floor(window.innerWidth * DPR);
    cv.height = Math.floor(window.innerHeight * DPR);
    cv.style.width = window.innerWidth + 'px';
    cv.style.height = window.innerHeight + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  window.addEventListener('resize', resize);

  resize();
  buildStars();

  function loop(now) {
    draw(now);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.addEventListener('gw:pick', function (e) {
    const idx = e.detail && e.detail.idx;
    if (typeof idx !== 'number' || idx < 0) return;
    lit.set(idx, performance.now());
    for (let i = 0; i < beidou.length; i++) {
      if (beidou[i].hi === idx) { beidouLit.set(i, performance.now()); break; }
    }
    window.dispatchEvent(new CustomEvent('gw:lit', { detail: { count: lit.size } }));
  });

  window.GW = {
    focusStar: focusStar,
    resetView: resetView,
    litCount: function () { return lit.size; }
  };
})();
