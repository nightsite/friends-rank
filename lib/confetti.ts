type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  life: number;
};

const COLORS = ["#fbbf24", "#f59e0b", "#fb7185", "#a78bfa", "#34d399", "#60a5fa"];

/** Quick canvas confetti burst, no dependencies. Safe to no-op on the server. */
export function fireConfetti(opts?: { count?: number; durationMs?: number }) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const count = opts?.count ?? 140;
  const durationMs = opts?.durationMs ?? 1600;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const cx = w / 2;
  const cy = h * 0.45;
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.random() - 0.5) * Math.PI;
    const speed = 4 + Math.random() * 6;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? -1 : 1),
      vy: -Math.abs(Math.sin(angle)) * speed - 2,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      size: 6 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 1,
    });
  }

  const start = performance.now();
  function step(now: number) {
    const elapsed = now - start;
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    let alive = 0;
    for (const p of particles) {
      p.vy += 0.18;
      p.vx *= 0.995;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life = Math.max(0, 1 - elapsed / durationMs);
      if (p.life > 0) {
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
    }
    if (alive > 0 && elapsed < durationMs + 400) {
      requestAnimationFrame(step);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(step);
}

/**
 * Golden sparkle burst centered on screen for promotion / level-up moments.
 * Smaller and more focused than full confetti.
 */
export function fireSparkles(opts?: { count?: number; durationMs?: number; tint?: string }) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const count = opts?.count ?? 90;
  const durationMs = opts?.durationMs ?? 1400;
  const tint = opts?.tint ?? "#fbbf24";

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const cx = w / 2;
  const cy = h * 0.35;
  type S = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    twinkle: number;
  };
  const sparks: S[] = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1.5 + Math.random() * 5;
    sparks.push({
      x: cx,
      y: cy,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      size: 1.5 + Math.random() * 2.5,
      life: 1,
      twinkle: Math.random() * Math.PI * 2,
    });
  }

  const start = performance.now();
  function step(now: number) {
    if (!ctx) return;
    const elapsed = now - start;
    ctx.clearRect(0, 0, w, h);
    let alive = 0;
    for (const p of sparks) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.vx *= 0.985;
      p.life = Math.max(0, 1 - elapsed / durationMs);
      p.twinkle += 0.4;
      if (p.life > 0) {
        alive++;
        const flicker = 0.6 + Math.abs(Math.sin(p.twinkle)) * 0.4;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.globalAlpha = p.life * flicker;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 4);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.4, tint);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    if (alive > 0 && elapsed < durationMs + 200) {
      requestAnimationFrame(step);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(step);
}
