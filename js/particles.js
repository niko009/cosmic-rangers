class ParticleSystem {
  constructor() {
    this.items = [];
  }

  // Classic explosion burst
  burst(x, y, color, count = 18, speed = 160, opts = {}) {
    const life = opts.life ?? 0.55;
    const size = opts.size ?? 3;
    const drag = opts.drag ?? 0.985;
    const gravity = opts.gravity ?? 0;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * speed + speed * 0.2;
      this.items.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: life * (0.6 + Math.random() * 0.5),
        max: life,
        size: size * (0.5 + Math.random()),
        color,
        drag,
        gravity,
        type: opts.type || "square",
        glow: opts.glow !== false
      });
    }
  }

  // Directed trail (engine, muzzle)
  trail(x, y, angle, color, count = 4, speed = 120) {
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.6;
      const a = angle + spread;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.items.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.15 + Math.random() * 0.2,
        max: 0.35,
        size: 1.5 + Math.random() * 2.5,
        color,
        drag: 0.92,
        gravity: 0,
        type: "circle",
        glow: true
      });
    }
  }

  // Soft glowing orbs (power-up, boss)
  sparkle(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 90;
      this.items.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 30,
        life: 0.5 + Math.random() * 0.6,
        max: 1.1,
        size: 2 + Math.random() * 4,
        color,
        drag: 0.97,
        gravity: -20,
        type: "circle",
        glow: true
      });
    }
  }

  // Ring shockwave
  ring(x, y, color, maxR = 80) {
    this.items.push({
      x, y,
      vx: 0, vy: 0,
      life: 0.45,
      max: 0.45,
      size: 2,
      color,
      drag: 1,
      gravity: 0,
      type: "ring",
      ringR: 8,
      ringMax: maxR,
      glow: true
    });
  }

  update(dt) {
    for (const p of this.items) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= p.drag;
      p.vy *= p.drag;
      if (p.gravity) p.vy += p.gravity * dt;
      p.life -= dt;
      if (p.type === "ring") {
        p.ringR += (p.ringMax - p.ringR) * Math.min(1, dt * 8);
      }
    }
    this.items = this.items.filter(p => p.life > 0);
  }

  draw(ctx) {
    for (const p of this.items) {
      const alpha = Math.max(0, p.life / p.max);
      ctx.globalAlpha = alpha;
      if (p.glow) {
        ctx.shadowBlur = p.size * 3;
        ctx.shadowColor = p.color;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.type === "circle") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "ring") {
        ctx.lineWidth = 3 * alpha;
        ctx.globalAlpha = alpha * 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.ringR, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // square / spark
        const s = p.size;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
}
