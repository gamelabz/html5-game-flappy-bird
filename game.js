(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const messageEl = document.getElementById('message');
  const startBtn = document.getElementById('start');

  const W = canvas.width;
  const H = canvas.height;
  const BEST_KEY = 'flappy-best-score';
  const GROUND_H = 70;

  const STATE = { READY: 'ready', PLAYING: 'playing', OVER: 'over' };
  let state = STATE.READY;

  const bird = { x: 90, y: H / 2, vy: 0, r: 13 };
  let pipes = [];
  let score = 0;
  let best = Number(localStorage.getItem(BEST_KEY) || 0);
  let frame = 0;
  let clouds = [];
  let t = 0;

  function updateHud() {
    scoreEl.textContent = String(score);
    bestEl.textContent = String(best);
  }

  function spawnPipe() {
    const gap = 165;
    const minTop = 60;
    const maxTop = H - GROUND_H - gap - 60;
    const top = minTop + Math.random() * (maxTop - minTop);
    pipes.push({ x: W + 20, top, gap, w: 64, scored: false });
  }

  function startGame() {
    bird.y = H / 2; bird.vy = 0;
    pipes = [];
    score = 0;
    frame = 0;
    spawnPipe();
    state = STATE.PLAYING;
    startBtn.disabled = true;
    messageEl.textContent = '';
    updateHud();
  }

  function gameOver() {
    state = STATE.OVER;
    if (score > best) { best = score; localStorage.setItem(BEST_KEY, String(best)); }
    updateHud();
    messageEl.textContent = `Game Over! Score: ${score} — Best: ${best}.`;
    startBtn.disabled = false;
    startBtn.textContent = 'Play Again';
  }

  function flap() {
    if (state === STATE.READY) { startGame(); return; }
    if (state === STATE.PLAYING) bird.vy = -7.4;
  }

  function update() {
    t += 1;
    // clouds drift always
    if (clouds.length < 4) clouds.push({ x: Math.random() * W, y: 40 + Math.random() * 200, s: 0.3 + Math.random() * 0.4 });
    for (const c of clouds) { c.x -= c.s; if (c.x < -60) { c.x = W + 40; c.y = 40 + Math.random() * 200; } }

    if (state !== STATE.PLAYING) return;

    frame++;
    bird.vy += 0.42;
    bird.y += bird.vy;

    if (bird.y - bird.r < 0) { bird.y = bird.r; bird.vy = 0; }
    if (bird.y + bird.r > H - GROUND_H) { gameOver(); return; }

    const speed = 2.6;
    for (const p of pipes) {
      p.x -= speed;
      if (!p.scored && p.x + p.w < bird.x) {
        p.scored = true;
        score++;
        if (score > best) { best = score; localStorage.setItem(BEST_KEY, String(best)); }
        updateHud();
      }
    }
    pipes = pipes.filter(p => p.x + p.w > -10);
    if (frame % 95 === 0) spawnPipe();

    // collisions
    for (const p of pipes) {
      if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + p.w) {
        if (bird.y - bird.r < p.top || bird.y + bird.r > p.top + p.gap) { gameOver(); return; }
      }
    }
  }

  function draw() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#2a3a7a');
    sky.addColorStop(0.6, '#4a5aa0');
    sky.addColorStop(1, '#ffd6a5');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // clouds
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (const c of clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 22, 0, Math.PI * 2);
      ctx.arc(c.x + 24, c.y + 6, 18, 0, Math.PI * 2);
      ctx.arc(c.x - 22, c.y + 6, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    // pipes
    for (const p of pipes) {
      const g = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
      g.addColorStop(0, '#39d98a');
      g.addColorStop(1, '#1f8f5b');
      ctx.fillStyle = g;
      ctx.fillRect(p.x, 0, p.w, p.top);
      ctx.fillRect(p.x, p.top + p.gap, p.w, H - GROUND_H - (p.top + p.gap));
      // lip
      ctx.fillStyle = '#2bbf78';
      ctx.fillRect(p.x - 4, p.top - 14, p.w + 8, 14);
      ctx.fillRect(p.x - 4, p.top + p.gap, p.w + 8, 14);
    }

    // ground
    const gr = ctx.createLinearGradient(0, H - GROUND_H, 0, H);
    gr.addColorStop(0, '#6b4f2a');
    gr.addColorStop(1, '#4a3318');
    ctx.fillStyle = gr;
    ctx.fillRect(0, H - GROUND_H, W, GROUND_H);

    // bird
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(Math.max(-0.5, Math.min(1.2, bird.vy * 0.06)));
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // wing
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.ellipse(-3, 3, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // eye
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(6, -4, 2.4, 0, Math.PI * 2);
    ctx.fill();
    // beak
    ctx.fillStyle = '#ff7b00';
    ctx.beginPath();
    ctx.moveTo(bird.r - 2, -2);
    ctx.lineTo(bird.r + 7, 0);
    ctx.lineTo(bird.r - 2, 3);
    ctx.fill();
    ctx.restore();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'arrowup' || k === 'w') { e.preventDefault(); flap(); }
    if (k === 'p' && state === STATE.PLAYING) { state = STATE.READY; messageEl.textContent = 'Paused — press Space to resume.'; }
    if (k === 'r') startGame();
  });
  canvas.addEventListener('mousedown', flap);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); flap(); }, { passive: false });
  startBtn.addEventListener('click', startGame);

  updateHud();
  requestAnimationFrame(loop);
})();
