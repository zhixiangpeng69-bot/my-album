(function () {
  const DURATION = 70000;
  const FALLBACK_CARDS = 24;
  const shell = document.querySelector(".album-shell");
  const deck = document.getElementById("deck");
  const progressText = document.getElementById("progressText");
  const statusText = document.querySelector(".status div");
  const captionSmall = document.getElementById("captionSmall");
  const captionBig = document.getElementById("captionBig");
  const photoInput = document.getElementById("photoInput");
  const pickPhotos = document.getElementById("pickPhotos");
  const playPause = document.getElementById("playPause");
  const restart = document.getElementById("restart");
  const musicToggle = document.getElementById("musicToggle");
  const glowToggle = document.getElementById("glowToggle");
  const bgMusic = document.getElementById("bgMusic");
  const noteModal = document.getElementById("noteModal");
  const noteImage = document.getElementById("noteImage");
  const noteKicker = document.getElementById("noteKicker");
  const noteTitle = document.getElementById("noteTitle");
  const noteBody = document.getElementById("noteBody");
  const noteText = document.getElementById("noteText");
  const saveNote = document.getElementById("saveNote");
  const deleteNote = document.getElementById("deleteNote");
  const canvas = document.getElementById("particleCanvas");
  const ctx = canvas.getContext("2d");
  const NOTE_KEY = "laq-album-notes-v1";

  const captions = [
    { at: 0, small: "", big: "" },
    { at: 0.08, small: "把散落的瞬间", big: "慢慢收进星河" },
    { at: 0.18, small: "你在身旁", big: "就是最好的时光" },
    { at: 0.39, small: "所有的偶然", big: "都是命中注定的必然" },
    { at: 0.62, small: "纵使疾风起繁花散", big: "转身再看仍是你" },
    { at: 0.82, small: "把喜欢写进每一张照片", big: "送给最特别的你" }
  ];

  const params = new URLSearchParams(location.search);
  const previewProgress = clamp(Number(params.get("preview")) || 0);
  let notes = loadNotes();
  let photos = normalizePhotos(window.ALBUM_PHOTOS || []);
  let cards = [];
  let particles = [];
  let startedAt = performance.now() - previewProgress * DURATION;
  let pausedAt = 0;
  let isPaused = false;
  let activePhotoIndex = null;
  let modalElapsed = null;
  let wasPausedBeforeModal = false;
const heartSlots = [
    [-40, -160],  // 0: 左上内侧
    [-120, -200], // 1: 左上最高点附近
    [-210, -200], // 2
    [-290, -160], // 3
    [-350, -90],  // 4
    [-380, 0],    // 5: 左侧最宽处
    [-370, 90],   // 6
    [-320, 180],  // 7
    [-240, 260],  // 8
    [-130, 320],  // 9
    [0, 360],     // 10: 底部尖端 (绝对居中)
    [130, 320],   // 11: 开始右侧，与 9 完全对称
    [240, 260],   // 12: 与 8 对称
    [320, 180],   // 13: 与 7 对称
    [370, 90],    // 14: 与 6 对称
    [380, 0],     // 15: 与 5 对称
    [350, -90],   // 16: 与 4 对称
    [290, -160],  // 17: 与 3 对称
    [210, -200],  // 18: 与 2 对称
    [120, -200],  // 19: 与 1 对称
    [40, -160]    // 20: 与 0 对称
  ];
  function normalizePhotos(list) {
    return list.filter(Boolean).map((item, index) => {
      if (typeof item === "string") {
        const id = item;
        return {
          id,
          src: item,
          title: `LAQ ${String(index + 1).padStart(2, "0")}`,
          kicker: "MY DEAREST MOMENT",
          text: "这张照片被放进花海里，像一颗很小却很亮的星，安静地记住了那一刻。",
          note: notes[id] || ""
        };
      }
      const id = item.id || item.src || `photo-${index}`;
      return {
        id,
        src: item.src,
        title: item.title || `LAQ ${String(index + 1).padStart(2, "0")}`,
        kicker: item.kicker || "MY DEAREST MOMENT",
        text: item.text || "这张照片被放进花海里，像一颗很小却很亮的星，安静地记住了那一刻。",
        note: notes[id] || item.note || ""
      };
    });
  }

  function loadNotes() {
    try {
      return JSON.parse(localStorage.getItem(NOTE_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function persistNotes() {
    localStorage.setItem(NOTE_KEY, JSON.stringify(notes));
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function shortNote(photo) {
    const text = (photo.note || photo.kicker || "").trim();
    if (!text) return "FOREVER MOMENT";
    return text.length > 18 ? `${text.slice(0, 18)}...` : text;
  }

  function cardLabel(photo) {
    return `<b>${escapeHTML(photo.title)}</b>${escapeHTML(shortNote(photo))}`;
  }

  function layoutPhase(p) {
    if (p < 0.08) return 0;
    if (p < 0.13) return 1;
    if (p < 0.2) return 2;
    if (p < 0.26) return 3;
    if (p < 0.34) return 4;
    if (p < 0.40) return 5;
    if (p < 0.46) return 6;
    if (p < 0.58) return 7;
    if (p < 0.70) return 8;
    if (p < 0.86) return 9;
    if (p < 0.90) return 10;
    if (p < 0.95) return 11;
    return 12;
  }

function viewportScale() {
    // 同时计算宽度比例和高度比例，取两者中较小的一个
    const scaleW = window.innerWidth / 1280;
    const scaleH = window.innerHeight / 850; // 以 850px 为基准高度
    // 下限从 0.78 放宽到 0.45，允许在极窄/极矮屏幕下进行充分缩放
    return clamp(Math.min(scaleW, scaleH), 0.45, 1.18);
  }

  function setDragVars(card) {
    card.el.style.setProperty("--drag-x", `${card.dragX.toFixed(2)}px`);
    card.el.style.setProperty("--drag-y", `${card.dragY.toFixed(2)}px`);
  }

  let aimedCard = null;

  function cardAtPoint(x, y, fallback = null) {
    const candidates = cards
      .filter((card) => card.photoIndex >= 0)
      .map((card) => {
        const rect = card.el.getBoundingClientRect();
        const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        if (!inside) return null;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (x - cx) / Math.max(rect.width, 1);
        const dy = (y - cy) / Math.max(rect.height, 1);
        const distance = Math.hypot(dx, dy);
        const stack = Number(card.el.style.getPropertyValue("--stack")) || 0;
        return { card, distance, stack };
      })
      .filter(Boolean);

    if (!candidates.length) return fallback;
    candidates.sort((a, b) => a.distance - b.distance || b.stack - a.stack);
    return candidates[0].card;
  }

  function aimCardAtPoint(x, y) {
    const next = cardAtPoint(x, y);
    if (next === aimedCard) return;
    if (aimedCard) aimedCard.el.classList.remove("is-aimed");
    aimedCard = next;
    if (aimedCard) aimedCard.el.classList.add("is-aimed");
  }

  function clearAim() {
    if (!aimedCard) return;
    aimedCard.el.classList.remove("is-aimed");
    aimedCard = null;
  }

  function openCardAtPoint(x, y, fallback) {
    const target = cardAtPoint(x, y, fallback);
    if (target && target.photoIndex >= 0) openNote(target.photoIndex);
  }

  function attachCardInteractions(card) {
    let startX = 0;
    let startY = 0;
    let baseX = 0;
    let baseY = 0;
    let moved = false;
    let pointerId = null;

    card.el.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      baseX = card.dragX;
      baseY = card.dragY;
      moved = false;
      card.isDragging = true;
      card.el.classList.add("is-dragging");
      card.el.setPointerCapture(pointerId);
    });

    card.el.addEventListener("pointermove", (event) => {
      if (!card.isDragging || event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      if (!moved) return;
      event.preventDefault();
      card.dragX = baseX + dx;
      card.dragY = baseY + dy;
      setDragVars(card);
    });

    function finishDrag(event) {
      if (!card.isDragging || event.pointerId !== pointerId) return;
      card.isDragging = false;
      card.el.classList.remove("is-dragging");
      card.dragPhase = layoutPhase(currentElapsed() / DURATION);
      if (card.el.hasPointerCapture(pointerId)) card.el.releasePointerCapture(pointerId);
      pointerId = null;
      if (!moved && card.photoIndex >= 0) openCardAtPoint(event.clientX, event.clientY, card);
    }

    card.el.addEventListener("pointerup", finishDrag);
    card.el.addEventListener("pointercancel", finishDrag);
  }

  function placeholder(index) {
    const palettes = [
      ["#1b1025", "#e985a6", "#f5d483"],
      ["#09222d", "#75e0ff", "#f7c466"],
      ["#2a1021", "#ff8fb3", "#9ed5ff"],
      ["#20150d", "#e3b35e", "#fff2bf"],
      ["#101a29", "#7cc6ff", "#f08aa6"]
    ];
    const p = palettes[index % palettes.length];
    const title = encodeURIComponent(`照片 ${String(index + 1).padStart(2, "0")}`);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="640" height="920" viewBox="0 0 640 920">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="${p[0]}"/>
            <stop offset="0.52" stop-color="${p[1]}"/>
            <stop offset="1" stop-color="${p[2]}"/>
          </linearGradient>
          <radialGradient id="r" cx="70%" cy="24%" r="65%">
            <stop offset="0" stop-color="#fff" stop-opacity=".38"/>
            <stop offset="1" stop-color="#000" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="640" height="920" rx="54" fill="url(#g)"/>
        <rect width="640" height="920" rx="54" fill="url(#r)"/>
        <circle cx="190" cy="240" r="96" fill="#fff" opacity=".14"/>
        <circle cx="458" cy="618" r="128" fill="#000" opacity=".12"/>
        <text x="50%" y="49%" text-anchor="middle" fill="#fff8e8" font-size="66" font-family="Microsoft YaHei, Arial">${title}</text>
        <text x="50%" y="57%" text-anchor="middle" fill="#fff8e8" opacity=".72" font-size="24" font-family="Georgia, serif">ETERNAL BLOSSOMS</text>
      </svg>`;
    return {
      src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      title: `照片 ${String(index + 1).padStart(2, "0")}`
    };
  }

  function buildCards() {
    deck.innerHTML = "";
    const count = photos.length || FALLBACK_CARDS;
    cards = Array.from({ length: count }, (_, index) => {
      const photoIndex = photos.length ? index % photos.length : -1;
      const data = photos[photoIndex] || placeholder(index);
      const card = document.createElement("article");
      card.className = "photo-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `${data.title} 留言备注`);
      card.dataset.photoIndex = String(photoIndex);
      card.innerHTML = `
        <img alt="${escapeHTML(data.title)}" src="${data.src}">
        <div class="card-label">${cardLabel(data)}</div>
      `;
      deck.appendChild(card);
      const state = {
        el: card,
        index,
        photoIndex,
        seed: seeded(index * 97 + 13),
        dragX: 0,
        dragY: 0,
        dragPhase: null,
        isDragging: false
      };
      setDragVars(state);
      attachCardInteractions(state);
      if (photoIndex >= 0) {
        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openNote(photoIndex);
          }
        });
      }
      return state;
    });
  }

  function seeded(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
  }

  function ease(t) {
    t = clamp(t);
    return t * t * (3 - 2 * t);
  }

  function mix(a, b, t) {
    return a + (b - a) * t;
  }

  function blend(a, b, t) {
    return {
      x: mix(a.x, b.x, t),
      y: mix(a.y, b.y, t),
      z: mix(a.z, b.z, t),
      rx: mix(a.rx, b.rx, t),
      ry: mix(a.ry, b.ry, t),
      rz: mix(a.rz, b.rz, t),
      s: mix(a.s, b.s, t),
      o: mix(a.o, b.o, t)
    };
  }

  function offscreen(card, n) {
    const side = card.index % 2 === 0 ? -1 : 1;
    return {
      x: side * (520 + card.seed * 260),
      y: -260 + card.seed * 520,
      z: -420,
      rx: 0,
      ry: side * 4,
      rz: -14 + card.seed * 28,
      s: 0.82,
      o: 0
    };
  }

  function scatter(card, n) {
    const row = card.index % 5;
    const col = Math.floor(card.index / 5);
    const center = (n - 1) / 2;
    return {
      x: (card.index - center) * 50 + Math.sin(card.index * 1.7) * 72,
      y: (row - 2) * 92 + Math.cos(col * 1.1) * 28,
      z: -120 + row * 28,
      rx: 0,
      ry: -4 + card.seed * 8,
      rz: -14 + card.seed * 28,
      s: 0.92,
      o: 0.92
    };
  }

  function portraitWall(card, n) {
    const row = card.index % 5;
    const col = Math.floor(card.index / 5);
    return {
      x: 170 + (col - 2.4) * 84,
      y: (row - 2) * 104 + Math.sin(col) * 10,
      z: -110 + col * 16,
      rx: 0,
      ry: -4,
      rz: -5 + card.seed * 10,
      s: 0.91,
      o: 0.98
    };
  }

  function fullSpread(card, n) {
    const cols = Math.ceil(Math.sqrt(n * 2.18));
    const rows = Math.ceil(n / cols);
    const col = card.index % cols;
    const row = Math.floor(card.index / cols);
    const scale = viewportScale();
    const gapX = 158 * scale;
    const gapY = 172 * scale;
    const jitterX = Math.sin(card.index * 1.91) * 18 * scale;
    const jitterY = Math.cos(card.index * 1.37) * 16 * scale;
    return {
      x: (col - (cols - 1) / 2) * gapX + jitterX,
      y: (row - (rows - 1) / 2) * gapY + jitterY + 20 * scale,
      z: 16 + row * 12 + card.index * 0.8,
      rx: 0,
      ry: 0,
      rz: -6 + card.seed * 12,
      s: 0.84 + card.seed * 0.05,
      o: 0.97
    };
  }

  function crossRibbon(card, n) {
    const vertical = card.index % 3 === 0;
    const verticalCount = Math.ceil(n / 3);
    const horizontalCount = n - verticalCount;
    const vOrder = Math.floor(card.index / 3) - (verticalCount - 1) / 2;
    const hOrder = card.index - Math.floor(card.index / 3) - 1;
    const hCenter = (horizontalCount - 1) / 2;
    const drift = Math.sin(card.index * 1.37) * 3;
    return {
      x: vertical ? drift : (hOrder - hCenter) * 78,
      y: vertical ? vOrder * 82 : Math.sin(card.index * 0.74) * 5,
      z: vertical ? 36 + card.index : 16 + card.index,
      rx: 0,
      ry: 0,
      rz: vertical ? -2 + card.seed * 4 : -5 + card.seed * 10,
      s: vertical ? 0.88 : 0.86,
      o: 0.97
    };
  }

  function ribbon(card, n) {
    const center = (n - 1) / 2;
    const k = card.index - center;
    return {
      x: k * 52,
      y: Math.sin(card.index * 0.6) * 52,
      z: -Math.abs(k) * 8 + Math.cos(card.index) * 26,
      rx: 4 * Math.sin(card.index),
      ry: -k * 2.8,
      rz: Math.sin(card.index * 0.52) * 15,
      s: 0.78 + Math.max(0, 1 - Math.abs(k) / center) * 0.1,
      o: 0.96
    };
  }

  function blossom(card, n, spin) {
    const ring = card.index % 3;
    const step = Math.floor(card.index / 3);
    const angle = (step / Math.ceil(n / 3)) * Math.PI * 2 + ring * 0.18 + spin;
    const radiusX = 220 + ring * 116;
    const radiusY = 102 + ring * 62;
    return {
      x: Math.cos(angle) * radiusX,
      y: Math.sin(angle) * radiusY - 18,
      z: ring * 44 + Math.sin(angle * 2) * 24,
      rx: 0,
      ry: Math.cos(angle) * 3,
      rz: Math.sin(angle * 1.4 + card.seed * 3) * 7,
      s: 0.78 + ring * 0.035,
      o: 0.98
    };
  }

function heart(card, n, spin) {
    const scale = viewportScale();
    const slot = heartSlots[card.index % heartSlots.length];
    const alternate = card.index % 2 === 0 ? -1 : 1;
    const bob = Math.sin(spin * 2.1 + card.index * 0.72) * 4 + alternate * 6;
    const drift = Math.cos(spin * 1.22 + card.index * 0.93) * 3.5;
    
    const spread = 1.22; 
    
    // --- 上下位置控制 ---
    // 原本默认大约是 -4。改得越小（比如 -60、-100），爱心整体就越往上。
    // 如果想往下移，就改成正数（比如 50）。
    const offsetY = -80; 
    
    return {
      x: slot[0] * spread * scale + 112 * scale + drift, 
      
      // 把原来的 - 4 * scale 换成了 + offsetY * scale
      y: slot[1] * spread * scale + offsetY * scale + bob,
      
      z: 40 + card.index * 1.2,
      rx: 0,
      ry: 0,
      rz: Math.sin(card.index * 0.82 + card.seed * 3) * 5,
      s: 0.7 + card.seed * 0.035, 
      o: 0.98
    };
  }

function ring(card, n, spin) {
    const scale = viewportScale();
    const angle = (card.index / Math.max(n, 1)) * Math.PI * 2 + spin;
    const radiusX = 460 * scale;
    const radiusY = 180 * scale;
    return {
      x: Math.cos(angle) * radiusX,
      y: Math.sin(angle) * radiusY,
      z: Math.sin(angle * 2) * 60,
      rx: 0,
      ry: Math.cos(angle) * 6,
      rz: Math.sin(angle * 1.5 + card.seed * 2) * 8,
      s: 0.84,
      o: 0.98
    };
  }

function wave(card, n, phase, spin) {
    const center = (n - 1) / 2;
    const scale = viewportScale();
    const maxWidth = Math.min(window.innerWidth * 0.72, 1180 * scale);
    const gap = n > 1 ? Math.min(80 * scale, maxWidth / (n - 1)) : 0;
    
    // --- 核心修改：反转顺序，使得最右边（索引最大）的照片 order 为 0，最先开始动作 ---
    const order = n > 1 ? (n - 1 - card.index) / (n - 1) : 0;
    
    const revealStart = order * 0.68;
    const revealSpan = 0.28; // 最后一张会在 0.68 + 0.28 = 0.96 的进度完成，确保动作做完才进入下一阶段
    const reveal = ease((phase - revealStart) / revealSpan);
    
    const source = ring(card, n, spin * 0.85);
    const target = {
      x: (card.index - center) * gap,
      // 这里的 y 已经包含了上下交错的逻辑 (card.index % 2 === 0 ? -1 : 1)
      y: (card.index % 2 === 0 ? -1 : 1) * 60 * scale + Math.sin(card.index * 0.55 + phase * Math.PI * 2) * 6 * scale,
      z: 24 + card.index * 0.9,
      rx: 0,
      ry: 0,
      rz: (card.index % 2 === 0 ? -7 : 7) + (card.seed - 0.5) * 5,
      s: 0.84 + Math.max(0, 1 - Math.abs(card.index - center) / Math.max(center, 1)) * 0.04,
      o: 0.97
    };
    
    return blend(source, target, reveal);
  }

  function bowl(card, n, spin) {
    const center = (n - 1) / 2;
    const k = card.index - center;
    const depth = Math.abs(k) / center;
    const lift = Math.sin(card.index * 0.4 + spin) * 24;
    return {
      x: k * 58,
      y: 86 + depth * depth * 124 + lift,
      z: -Math.abs(k) * 12 + Math.cos(k * 0.24 + spin) * 58,
      rx: 0,
      ry: clamp(-k * 0.38, -5, 5),
      rz: Math.sin(k * 0.28 + spin) * 10,
      s: 0.82 + (1 - depth) * 0.09,
      o: 0.96
    };
  }

function flyingBowl(card, n, spin) {
    const base = bowl(card, n, spin);
    
    // 我们在这里“随机”挑出 7 张照片的序号 (范围是 0 到 20)
    // 你可以随意更改里面的数字，来决定到底哪几张照片飞出来
    const randomFlyers = [2, 5, 8, 11, 14, 17, 19];
    
    // 如果当前照片在这个名单里，就执行飞出动作
    if (randomFlyers.includes(card.index % Math.max(n, 1))) {
      base.x += Math.sin(card.index + spin) * 110;
      base.y -= 150 + card.seed * 80;  // 稍微飞高了一点点，让 7 张重叠时不那么拥挤
      base.z += 90;
      base.ry += 2;
      base.rz += -10 + card.seed * 20;
      base.s += 0.12; // 稍微把飞出来的照片放大一点点，更清楚
    }
    return base;
  }

 function finalRing(card, n) {
    const scale = viewportScale();
    const safeN = Math.max(n, 1);
    const angle = (card.index / safeN) * Math.PI * 2 - Math.PI * 0.56 + (card.seed - 0.5) * 0.22;
    const lumpy = Math.sin(card.index * 1.71) * 18 + Math.cos(card.index * 0.73) * 11;
    
    // 1. 将圈缩小：原数值为 530 和 278，这里下调至 430 和 230
    const radiusX = (430 + lumpy * 0.75 + card.seed * 24) * scale;
    const radiusY = (230 + Math.sin(card.index * 1.17) * 20) * scale;
    
    const edge = Math.sin(angle);
    const bottomGap = edge > 0.52 && Math.abs(Math.cos(angle)) < 0.58;
    const gapSide = card.index % 2 === 0 ? -1 : 1;
    const xJitter = Math.sin(card.index * 2.31) * 22 * scale;
    const yJitter = Math.cos(card.index * 1.93) * 16 * scale;
    const gapX = bottomGap ? gapSide * (72 + edge * 34) * scale : 0;
    const gapY = bottomGap ? (edge - 0.52) * 22 * scale : 0;
    
    return {
      x: Math.cos(angle) * radiusX + xJitter + gapX,
      y: Math.sin(angle) * radiusY - 44 * scale + yJitter + gapY,
      z: 18 + edge * 42 + card.index * 0.8,
      rx: 0,
      ry: Math.cos(angle) * 3.2,
      rz: Math.sin(angle * 1.7 + card.seed * 4) * 7 + (card.seed - 0.5) * 10,
      
      // 2. 将照片放大：原数值为 0.78，这里上调至 1.05
      s: (1.05 + card.seed * 0.06) * scale,
      
      o: 0.97
    };
  }

  function layout(card, n, p) {
    const spin = p * Math.PI * 2;
    const intro = offscreen(card, n);
    const a = scatter(card, n);
    const b = portraitWall(card, n);
    const spread = fullSpread(card, n);
    const c = crossRibbon(card, n);
    const d = blossom(card, n, spin * 0.72);
    const heartPose = heart(card, n, spin * 4.4);
    const e = ring(card, n, spin * 0.85);
    const f = wave(card, n, clamp((p - 0.70) / 0.16), spin);
    const g = bowl(card, n, spin);
    const h = flyingBowl(card, n, spin);
    const i = finalRing(card, n);

    if (p < 0.08) return blend(intro, a, ease(p / 0.08));
    if (p < 0.13) return blend(a, spread, ease((p - 0.08) / 0.05));
    if (p < 0.2) return spread;
    if (p < 0.26) return blend(spread, c, ease((p - 0.2) / 0.06));
    if (p < 0.34) return blend(c, d, ease((p - 0.26) / 0.08));
    if (p < 0.40) return blend(d, heartPose, ease((p - 0.34) / 0.06));
    if (p < 0.46) return heartPose;
    if (p < 0.58) return blend(heartPose, e, ease((p - 0.46) / 0.12));
    if (p < 0.70) return e;
    if (p < 0.86) return f;
    if (p < 0.90) return blend(f, g, ease((p - 0.86) / 0.04));
    if (p < 0.95) return blend(g, h, ease((p - 0.90) / 0.05));
    return blend(h, i, ease((p - 0.95) / 0.05));
  }

 function applyCard(card, t, p, n) {
    const localDelay = card.index * 0.0018;
    const shaped = clamp((p - localDelay) / (1 - localDelay));
    const phase = layoutPhase(shaped);
    const l = layout(card, n, shaped);
    const modalOpen = noteModal.classList.contains("is-open");
    const endRing = p >= 1;
    const breathing = Math.sin(t / (endRing ? 1180 : 780) + card.index) * (endRing ? 0.008 : 0.018);
    
    // --- 核心修改：放手后立即丝滑归位 ---
    // 去掉了原来需要等 phase 变化的限制，只要松手 (isDragging 为 false) 且有偏移，就立刻每一帧自动拉回原位
    if (!card.isDragging && (card.dragX !== 0 || card.dragY !== 0)) {
      card.dragX *= 0.90; // 0.90 是平滑回弹的阻力系数，数字越小回弹越快
      card.dragY *= 0.90;
      if (Math.abs(card.dragX) + Math.abs(card.dragY) < 0.6) {
        card.dragX = 0;
        card.dragY = 0;
        card.dragPhase = null;
      }
      setDragVars(card);
    }
    
    if (modalOpen) {
      const sway = Math.sin(t / 760 + card.index * 0.72);
      const shimmer = Math.sin(t / 520 + card.index * 1.31);
      l.x += sway * 7;
      l.y += Math.cos(t / 930 + card.index) * 5;
      l.ry += shimmer * 2.4;
      l.rz += sway * 1.6;
      l.s += 0.018 + shimmer * 0.006;
      l.o = clamp(l.o * (0.76 + shimmer * 0.08), 0.5, 0.98);
    } else if (endRing) {
      const sway = Math.sin(t / 1320 + card.index * 0.76);
      const float = Math.cos(t / 1590 + card.index * 1.18);
      const shimmer = Math.sin(t / 640 + card.index * 1.41);
      l.x += sway * 4.4;
      l.y += float * 3.4;
      l.ry += shimmer * 1.1;
      l.rz += sway * 1.3;
      l.o = clamp(l.o * (0.9 + shimmer * 0.04), 0.82, 0.99);
    }
    
    card.el.style.setProperty("--x", `${l.x.toFixed(2)}px`);
    card.el.style.setProperty("--y", `${l.y.toFixed(2)}px`);
    card.el.style.setProperty("--z", `${l.z.toFixed(2)}px`);
    card.el.style.setProperty("--rx", `${l.rx.toFixed(2)}deg`);
    card.el.style.setProperty("--ry", `${l.ry.toFixed(2)}deg`);
    card.el.style.setProperty("--rz", `${l.rz.toFixed(2)}deg`);
    card.el.style.setProperty("--s", (l.s + breathing).toFixed(3));
    card.el.style.setProperty("--o", l.o.toFixed(3));
    card.el.style.setProperty("--stack", String(Math.round(500 + l.z + card.index)));
  }

  function updateCaption(p) {
    captionSmall.textContent = "";
    captionBig.textContent = "";
  }

  function updateStatus(p) {
    if (!statusText) return;
    if (p >= 1) {
      statusText.textContent = "VALLEY: DEPART / 永恒驻留";
    } else if (p >= 0.70) {
      statusText.textContent = "VALLEY: FLOW / 星河铺展";
    } else if (p >= 0.38) {
      statusText.textContent = "VALLEY: ORBIT / 环绕成花";
    } else {
      statusText.textContent = "VALLEY: GATHER / 向心汇聚";
    }
  }

  function currentElapsed(now = performance.now()) {
    if (isPaused) return pausedAt;
    const elapsed = now - startedAt;
    if (elapsed >= DURATION) {
      pausedAt = DURATION;
      isPaused = true;
      playPause.textContent = "▶";
      playPause.setAttribute("aria-label", "播放");
      return DURATION;
    }
    return clamp(elapsed, 0, DURATION);
  }

  function syncElapsed(elapsed, keepPaused = isPaused) {
    const safeElapsed = clamp(elapsed, 0, DURATION);
    if (keepPaused) {
      pausedAt = safeElapsed;
      isPaused = true;
      playPause.textContent = "▶";
      playPause.setAttribute("aria-label", "播放");
    } else {
      startedAt = performance.now() - safeElapsed;
      isPaused = false;
      playPause.textContent = "Ⅱ";
      playPause.setAttribute("aria-label", "暂停");
    }
  }

  function renderFrame(now, elapsed) {
    const safeElapsed = clamp(elapsed, 0, DURATION);
    const p = safeElapsed / DURATION;
    const n = cards.length;
    const cardTime = safeElapsed >= DURATION ? now : safeElapsed;
    cards.forEach((card) => applyCard(card, cardTime, p, n));
    progressText.textContent = `${Math.round(p * 100)}%`;
    updateCaption(p);
    updateStatus(p);
    drawParticles(now, p);
  }

  window.__laqAlbum = {
    setProgress(value) {
      const next = clamp(Number(value) || 0, 0, 1) * DURATION;
      syncElapsed(next, true);
      renderFrame(performance.now(), pausedAt);
    }
  };

  function render(now) {
    const elapsed = noteModal.classList.contains("is-open") && modalElapsed !== null
      ? modalElapsed
      : currentElapsed(now);
    renderFrame(now, elapsed);
    requestAnimationFrame(render);
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeParticles();
  }

  function makeParticles() {
    const total = Math.round(Math.min(220, Math.max(110, window.innerWidth / 7)));
    particles = Array.from({ length: total }, (_, i) => ({
      x: seeded(i * 17 + 4) * window.innerWidth,
      y: seeded(i * 31 + 9) * window.innerHeight,
      r: 0.8 + seeded(i * 47 + 2) * 3.2,
      speed: 0.14 + seeded(i * 11 + 7) * 0.42,
      drift: -0.22 + seeded(i * 19 + 5) * 0.44,
      phase: seeded(i * 13 + 8) * Math.PI * 2,
      kind: seeded(i * 23 + 1) > 0.64 ? "heart" : "spark"
    }));
  }

  function drawHeart(x, y, size, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    ctx.beginPath();
    ctx.moveTo(0, 0.35);
    ctx.bezierCurveTo(-1.1, -0.55, -1.55, 0.55, 0, 1.25);
    ctx.bezierCurveTo(1.55, 0.55, 1.1, -0.55, 0, 0.35);
    ctx.fillStyle = `rgba(245, 103, 139, ${alpha})`;
    ctx.shadowColor = "rgba(255, 118, 160, 0.7)";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
  }

  function drawParticles(now, p) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const glow = shell.dataset.glow === "on" ? 1.35 : 1;
    for (const particle of particles) {
      particle.y -= particle.speed;
      particle.x += particle.drift + Math.sin(now / 1200 + particle.phase) * 0.14;
      if (particle.y < -24) particle.y = window.innerHeight + 24;
      if (particle.x < -24) particle.x = window.innerWidth + 24;
      if (particle.x > window.innerWidth + 24) particle.x = -24;

      const twinkle = 0.35 + Math.sin(now / 650 + particle.phase + p * 5) * 0.22;
      if (particle.kind === "heart") {
        drawHeart(particle.x, particle.y, particle.r * 1.9, clamp(twinkle * 0.45 * glow, 0.08, 0.68));
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(246, 207, 122, ${clamp(twinkle * 0.72 * glow, 0.08, 0.78)})`;
        ctx.shadowColor = "rgba(246, 207, 122, 0.7)";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  function refreshCardLabels(photoIndex) {
    const photo = photos[photoIndex];
    if (!photo) return;
    cards.forEach((card) => {
      if (card.photoIndex !== photoIndex) return;
      const label = card.el.querySelector(".card-label");
      if (label) label.innerHTML = cardLabel(photo);
    });
  }

  function openNote(photoIndex) {
    const photo = photos[photoIndex];
    if (!photo) return;
    clearAim();
    activePhotoIndex = photoIndex;
    wasPausedBeforeModal = isPaused;
    modalElapsed = currentElapsed();
    noteImage.src = photo.src;
    noteImage.alt = photo.title;
    noteKicker.textContent = `[ ${photo.kicker} ]`;
    noteTitle.textContent = photo.title;
    noteBody.textContent = photo.text;
    noteText.value = photo.note || "";
    noteModal.classList.add("is-open");
    shell.classList.add("note-active");
    noteModal.setAttribute("aria-hidden", "false");
    window.setTimeout(() => noteText.focus({ preventScroll: true }), 50);
  }

  function closeNote() {
    noteModal.classList.remove("is-open");
    shell.classList.remove("note-active");
    noteModal.setAttribute("aria-hidden", "true");
    if (modalElapsed !== null) syncElapsed(modalElapsed, wasPausedBeforeModal);
    activePhotoIndex = null;
    modalElapsed = null;
  }

  function saveActiveNote(closeAfterSave) {
    const photo = photos[activePhotoIndex];
    if (!photo) return;
    const note = noteText.value.trim();
    photo.note = note;
    if (note) {
      notes[photo.id] = note;
    } else {
      delete notes[photo.id];
    }
    persistNotes();
    refreshCardLabels(activePhotoIndex);
    if (closeAfterSave) closeNote();
  }

let musicManuallyPaused = false; // 记录用户是否手动关掉了音乐

  function updateMusicUI() {
    if (!musicToggle || !bgMusic) return;
    // 直接读取播放器真实的播放状态，绝对不会卡死
    const isPlaying = !bgMusic.paused;
    musicToggle.textContent = isPlaying ? "MUSIC: ON" : "MUSIC: OFF";
    musicToggle.classList.toggle("is-on", isPlaying);
  }

  async function startMusic() {
    if (!bgMusic) return;
    bgMusic.loop = true;
    bgMusic.volume = 0.58;
    try {
      await bgMusic.play();
      musicManuallyPaused = false;
    } catch (error) {
      // 浏览器拦截了，静默等待下一次点击即可，不报错
    }
    updateMusicUI();
  }

  function pauseMusic() {
    if (!bgMusic) return;
    bgMusic.pause();
    musicManuallyPaused = true;
    updateMusicUI();
  }

  function toggleMusic(event) {
    if (event) event.stopPropagation(); // 防止点按钮时触发了全局点击
    if (!bgMusic) return;
    if (bgMusic.paused) {
      startMusic();
    } else {
      pauseMusic();
    }
  }

  function primeMusic(event) {
    // 如果音乐已经在播，或者用户自己点了暂停，就不再去强行触发
    if (!bgMusic || !bgMusic.paused || musicManuallyPaused) return;
    startMusic();
  }
  pickPhotos.addEventListener("click", () => photoInput.click());

  photoInput.addEventListener("change", () => {
    const files = Array.from(photoInput.files || []);
    if (!files.length) return;
    photos.forEach((photo) => {
      if (photo.src && photo.src.startsWith("blob:")) URL.revokeObjectURL(photo.src);
    });
    photos = files.map((file, index) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      src: URL.createObjectURL(file),
      title: file.name.replace(/\.[^.]+$/, "") || `LAQ ${index + 1}`,
      note: notes[`${file.name}-${file.size}-${file.lastModified}`] || ""
    }));
    buildCards();
    startedAt = performance.now();
  });

  playPause.addEventListener("click", () => {
    if (isPaused) {
      if (pausedAt >= DURATION) {
        pausedAt = 0;
      }
      isPaused = false;
      startedAt = performance.now() - pausedAt;
      playPause.textContent = "Ⅱ";
      playPause.setAttribute("aria-label", "暂停");
    } else {
      isPaused = true;
      pausedAt = (performance.now() - startedAt) % DURATION;
      playPause.textContent = "▶";
      playPause.setAttribute("aria-label", "播放");
    }
  });

  restart.addEventListener("click", () => {
    startedAt = performance.now();
    pausedAt = 0;
    isPaused = false;
    playPause.textContent = "Ⅱ";
  });

  glowToggle.addEventListener("click", () => {
    const next = shell.dataset.glow === "on" ? "off" : "on";
    shell.dataset.glow = next;
    glowToggle.textContent = `CONSTANT GLOW: ${next.toUpperCase()}`;
  });

  if (bgMusic) {
    bgMusic.loop = true;
    bgMusic.volume = 0.58;
    bgMusic.addEventListener("play", updateMusicUI);
    bgMusic.addEventListener("pause", updateMusicUI);
    bgMusic.addEventListener("ended", updateMusicUI);
  }

  if (musicToggle) {
    musicToggle.addEventListener("click", toggleMusic);
    updateMusicUI();
  }
  startMusic();

  window.addEventListener("pointermove", (event) => {
    if (noteModal.classList.contains("is-open")) return;
    aimCardAtPoint(event.clientX, event.clientY);
  });

  window.addEventListener("pointerleave", clearAim);

  window.addEventListener("click", (event) => {
    if (noteModal.classList.contains("is-open")) return;
    if (event.target.closest('.controls')) return;

 
    const target = cardAtPoint(event.clientX, event.clientY);
    if (target && target.photoIndex >= 0) {
      openNote(target.photoIndex);
    }
  });

 // 仅使用最可靠的明确点击/触摸事件，不断尝试解锁直到成功
  const triggerEvents = ["pointerdown", "touchstart", "keydown"];
  triggerEvents.forEach(evt => {
    window.addEventListener(evt, primeMusic, { passive: true });
  });

  shell.addEventListener("wheel", (event) => {
    if (noteModal.classList.contains("is-open")) return;
    event.preventDefault();
    const nextElapsed = currentElapsed() + event.deltaY * 22;
    syncElapsed(nextElapsed, true);
    renderFrame(performance.now(), pausedAt);
  }, { passive: false });

  noteModal.addEventListener("click", (event) => {
// 核心修复：彻底斩断点击信号，防止它向下穿透砸中底层的照片卡片
    event.stopPropagation();
    if (event.target.closest('[data-close-note]')) {
      closeNote();
    }
  });

  saveNote.addEventListener("click", () => saveActiveNote(true));

  deleteNote.addEventListener("click", () => {
    noteText.value = "";
    saveActiveNote(false);
    noteText.focus();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && noteModal.classList.contains("is-open")) {
      closeNote();
    }
  });

  window.addEventListener("resize", resizeCanvas);

  buildCards();
  resizeCanvas();
  const openIndex = Number(params.get("open"));
  if (Number.isInteger(openIndex) && openIndex >= 1 && openIndex <= photos.length) {
    openNote(openIndex - 1);
  }
  requestAnimationFrame(render);
})();
