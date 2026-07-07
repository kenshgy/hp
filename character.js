// ─── Pixel Pal: ページ内を歩き回るドット絵の小人 ──────────
// 外部画像なし。ピクセルマップを canvas に描画し、
// スクロール・マウス・ナビ操作に反応するステートマシンで動く。
(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  const SCALE = window.innerWidth <= 760 ? 2 : 3;
  const W = 12;
  const H = 16;

  // パレット: . 透明 / o アウトライン / s 肌 / a アクセント / l 脚
  const accent =
    getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2b4c8c";
  const COLORS = { o: "#0a0b10", s: "#e8c49a", a: accent, l: "#c9cdd8" };

  // 12x16 のフレーム定義（文字列1行 = 1ピクセル行）
  const FRAMES = {
    idle1: [
      "....oooo....",
      "...osssso...",
      "...osssso...",
      "...osssso...",
      "....oooo....",
      "...oaaaao...",
      "..oaaaaaao..",
      ".osaaaaaaso.",
      ".o.aaaaaa.o.",
      "...aaaaaa...",
      "...oaaaao...",
      "....o..o....",
      "....l..l....",
      "....l..l....",
      "....l..l....",
      "...oo..oo...",
    ],
    idle2: [
      "............",
      "....oooo....",
      "...osssso...",
      "...osssso...",
      "...osssso...",
      "....oooo....",
      "...oaaaao...",
      "..oaaaaaao..",
      ".osaaaaaaso.",
      ".o.aaaaaa.o.",
      "...aaaaaa...",
      "...oaaaao...",
      "....o..o....",
      "....l..l....",
      "....l..l....",
      "...oo..oo...",
    ],
    walk1: [
      "....oooo....",
      "...osssso...",
      "...osssso...",
      "...osssso...",
      "....oooo....",
      "...oaaaao...",
      "..oaaaaaao..",
      ".osaaaaaaso.",
      ".o.aaaaaa.o.",
      "...aaaaaa...",
      "...oaaaao...",
      "....o..o....",
      "...l....l...",
      "...l....l...",
      "..l......l..",
      ".oo......oo.",
    ],
    walk2: [
      "....oooo....",
      "...osssso...",
      "...osssso...",
      "...osssso...",
      "....oooo....",
      "...oaaaao...",
      "..oaaaaaao..",
      ".osaaaaaaso.",
      ".o.aaaaaa.o.",
      "...aaaaaa...",
      "...oaaaao...",
      "....o..o....",
      "....l.l.....",
      "....l.l.....",
      "....l.l.....",
      "...ool.oo...",
    ],
    jump: [
      "....oooo....",
      "...osssso...",
      "...osssso...",
      "...osssso...",
      "....oooo....",
      "..ooaaaaoo..",
      ".s.aaaaaa.s.",
      "...aaaaaa...",
      "...aaaaaa...",
      "...oaaaao...",
      "....o..o....",
      "...l....l...",
      "..l......l..",
      "............",
      "............",
      "............",
    ],
    sit: [
      "............",
      "............",
      "............",
      "....oooo....",
      "...osssso...",
      "...osssso...",
      "...osssso...",
      "....oooo....",
      "...oaaaao...",
      "..oaaaaaao..",
      ".osaaaaaaso.",
      "...aaaaaa...",
      "...oaaaao...",
      "..ll....ll..",
      "..oo....oo..",
      "............",
    ],
    point: [
      "....oooo....",
      "...osssso...",
      "...osssso...",
      "...osssso...",
      "....oooo....",
      "...oaaaao...",
      "..oaaaaaaoss",
      ".osaaaaaaoo.",
      ".o.aaaaaa...",
      "...aaaaaa...",
      "...oaaaao...",
      "....o..o....",
      "....l..l....",
      "....l..l....",
      "....l..l....",
      "...oo..oo...",
    ],
  };

  const canvas = document.createElement("canvas");
  canvas.className = "pixel-pal";
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  function drawFrame(name, flip) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const rows = FRAMES[name];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const c = rows[y][x];
        if (c === ".") continue;
        ctx.fillStyle = COLORS[c];
        const px = flip ? W - 1 - x : x;
        ctx.fillRect(px * SCALE, y * SCALE, SCALE, SCALE);
      }
    }
  }

  // ─── 床の決定: ビューポート内で最も下にあるセクション境界線 ──
  const floors = () =>
    [...document.querySelectorAll(".hero, .section")].map((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom;
    });

  function currentFloorY() {
    const vh = window.innerHeight;
    const candidates = floors().filter((y) => y > vh * 0.35 && y < vh - 4);
    return candidates.length ? candidates[0] : vh - 24;
  }

  // ─── ステート ──────────────────────────
  const state = {
    x: window.innerWidth * 0.72,
    y: 0,
    targetX: window.innerWidth * 0.72,
    vy: 0,
    jumping: false,
    facing: 1, // 1: 右向き, -1: 左向き
    mode: "idle", // idle | walk | sit | point
    lastInput: performance.now(),
    frame: 0,
    frameTime: 0,
    lastScrollY: window.scrollY,
    pointUntil: 0,
  };
  state.y = currentFloorY();

  function wake() {
    state.lastInput = performance.now();
    if (state.mode === "sit") state.mode = "idle";
  }

  // スクロール: 進行方向へ少し歩く。速いと小ジャンプ
  window.addEventListener(
    "scroll",
    () => {
      const dy = window.scrollY - state.lastScrollY;
      state.lastScrollY = window.scrollY;
      wake();
      state.targetX = Math.min(
        Math.max(state.targetX + dy * 0.6, 40),
        window.innerWidth - 60
      );
      if (Math.abs(dy) > 90 && !state.jumping) {
        state.jumping = true;
        state.vy = -5;
      }
    },
    { passive: true }
  );

  // マウスが近づくと逃げる
  window.addEventListener(
    "mousemove",
    (e) => {
      const cx = state.x + (W * SCALE) / 2;
      const cy = state.y - (H * SCALE) / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist < 70) {
        wake();
        const dir = e.clientX < cx ? 1 : -1;
        state.targetX = Math.min(
          Math.max(state.x + dir * 120, 40),
          window.innerWidth - 60
        );
      }
    },
    { passive: true }
  );

  // タップ: キャラの近くならジャンプ、遠くならそちらへ歩く
  window.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      if (!t) return;
      wake();
      const cx = state.x + (W * SCALE) / 2;
      const dist = Math.hypot(t.clientX - cx, t.clientY - (state.y - (H * SCALE) / 2));
      if (dist < 90 && !state.jumping) {
        state.jumping = true;
        state.vy = -5;
      } else {
        state.targetX = Math.min(Math.max(t.clientX - (W * SCALE) / 2, 20), window.innerWidth - 50);
      }
    },
    { passive: true }
  );

  // ナビクリック: 画面を横切って走る
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    link.addEventListener("click", () => {
      wake();
      state.targetX = state.x < window.innerWidth / 2 ? window.innerWidth - 80 : 60;
      if (!state.jumping) {
        state.jumping = true;
        state.vy = -4;
      }
    });
  });

  // Contact が見えたらメールリンクの横で指差し
  const contactMail = document.querySelector(".contact-mail");
  if (contactMail) {
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            wake();
            const r = contactMail.getBoundingClientRect();
            state.targetX = Math.min(r.right + 24, window.innerWidth - 60);
            state.pointUntil = performance.now() + 3000;
          }
        });
      },
      { threshold: 0.6 }
    ).observe(contactMail);
  }

  // ─── メインループ ──────────────────────
  let lastTime = performance.now();
  let lastDrawn = "";

  function tick(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // 床への追従（スクロールで床が動く）
    const floorY = currentFloorY();

    // 水平移動
    const dx = state.targetX - state.x;
    const moving = Math.abs(dx) > 2;
    if (moving) {
      state.facing = dx > 0 ? 1 : -1;
      state.x += Math.sign(dx) * Math.min(Math.abs(dx), 130 * dt);
    }

    // ジャンプ物理
    if (state.jumping) {
      state.vy += 22 * dt * 60 * 0.016;
      state.y += state.vy;
      if (state.y >= floorY) {
        state.y = floorY;
        state.jumping = false;
        state.vy = 0;
      }
    } else {
      // 床の変化には滑らかに追従
      state.y += (floorY - state.y) * Math.min(dt * 10, 1);
    }

    // モード決定
    const idleFor = now - state.lastInput;
    if (state.jumping) state.mode = "jump";
    else if (moving) state.mode = "walk";
    else if (now < state.pointUntil) state.mode = "point";
    else if (idleFor > 4000) state.mode = "sit";
    else state.mode = "idle";

    // フレーム選択
    state.frameTime += dt;
    const speed = state.mode === "walk" ? 0.14 : 0.5;
    if (state.frameTime > speed) {
      state.frameTime = 0;
      state.frame = 1 - state.frame;
    }
    let frameName;
    switch (state.mode) {
      case "walk":  frameName = state.frame ? "walk1" : "walk2"; break;
      case "jump":  frameName = "jump"; break;
      case "sit":   frameName = "sit"; break;
      case "point": frameName = "point"; break;
      default:      frameName = state.frame ? "idle1" : "idle2";
    }

    // 描画（変化があるときだけ）
    const key = `${frameName}:${state.facing}`;
    if (key !== lastDrawn) {
      drawFrame(frameName, state.facing === -1);
      lastDrawn = key;
    }
    canvas.style.transform = `translate(${Math.round(state.x)}px, ${Math.round(
      state.y - H * SCALE
    )}px)`;

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
