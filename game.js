(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const messageEl = document.getElementById('message');
  const startEl = document.getElementById('start');
  const restartEl = document.getElementById('restart');

  const W = canvas.width, H = canvas.height;
  const BEST_KEY = 'flappy-best';
  const GRAV = 0.45, FLAP = -7.6, GAP = 150, PIPE_W = 64, SPD = 2.4;

  let bird, pipes, score, best, running, over, acc;

  function bestKey() { try { return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; } catch (e) { return 0; } }

  function newGame() {
    bird = { x: 110, y: H / 2, vy: 0, r: 15 };
    pipes = []; score = 0; running = false; over = false; acc = 0;
    best = bestKey(); bestEl.textContent = String(best); scoreEl.textContent = '0';
    spawnPipe(W + 120); spawnPipe(W + 120 + 230);
    messageEl.textContent = 'Press Start.'; draw();
  }

  function spawnPipe(x) {
    const margin = 60;
    const top = margin + Math.random() * (H - GAP - margin * 2);
    pipes.push({ x, top, passed: false });
  }

  function flap() {
    if (over) { newGame(); start(); return; }
    if (!running) start();
    bird.vy = FLAP;
  }

  function start() { if (over) newGame(); if (!running) { running = true; messageEl.textContent = 'Go!'; } }

  function update() {
    bird.vy += GRAV; bird.y += bird.vy;
    if (bird.y + bird.r > H) { bird.y = H - bird.r; die(); }
    if (bird.y - bird.r < 0) { bird.y = bird.r; bird.vy = 0; }

    for (const p of pipes) {
      p.x -= SPD;
      if (!p.passed && p.x + PIPE_W < bird.x) { p.passed = true; score++; scoreEl.textContent = String(score); }
    }
    if (pipes.length && pipes[0].x + PIPE_W < -10) pipes.shift();
    const lastX = pipes.length ? pipes[pipes.length - 1].x : 0;
    if (lastX < W - 230) spawnPipe(lastX + 230);

    for (const p of pipes) {
      if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + PIPE_W) {
        if (bird.y - bird.r < p.top || bird.y + bird.r > p.top + GAP) die();
      }
    }
  }

  function die() {
    over = true; running = false; messageEl.textContent = 'Game over!';
    if (score > best) { best = score; bestEl.textContent = String(best); try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {} }
  }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1b2a6b'); g.addColorStop(0.6, '#2d4ea3'); g.addColorStop(1, '#7ec8e3');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // clouds
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 3; i++) { const cx = (i * 170 + 60) % W, cy = 90 + i * 40; ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.arc(cx + 26, cy + 6, 22, 0, Math.PI * 2); ctx.fill(); }

    for (const p of pipes) {
      const col = '#3ddc84';
      ctx.save(); ctx.shadowBlur = 12; ctx.shadowColor = col; ctx.fillStyle = col;
      ctx.beginPath(); ctx.roundRect(p.x, 0, PIPE_W, p.top, 8); ctx.fill();
      ctx.beginPath(); ctx.roundRect(p.x, p.top + GAP, PIPE_W, H - (p.top + GAP), 8); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath(); ctx.roundRect(p.x - 4, p.top - 18, PIPE_W + 8, 18, 6); ctx.fill();
      ctx.beginPath(); ctx.roundRect(p.x - 4, p.top + GAP, PIPE_W + 8, 18, 6); ctx.fill();
      ctx.restore();
    }

    // bird
    ctx.save(); ctx.shadowBlur = 14; ctx.shadowColor = '#ffe66d'; ctx.fillStyle = '#ffe66d';
    ctx.beginPath(); ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(bird.x + 6, bird.y - 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8c42'; ctx.beginPath(); ctx.moveTo(bird.x + bird.r, bird.y); ctx.lineTo(bird.x + bird.r + 8, bird.y - 4); ctx.lineTo(bird.x + bird.r + 8, bird.y + 4); ctx.fill();
  }

  let last = 0;
  function loop(ts) {
    const dt = ts - last; last = ts;
    if (running && !over) { acc += dt; while (acc >= 16) { acc -= 16; update(); } draw(); }
    else draw();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('mousedown', flap);
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); flap(); }
  });
  startEl.addEventListener('click', start);
  restartEl.addEventListener('click', () => { newGame(); start(); });
  newGame();
  requestAnimationFrame(loop);
})();
