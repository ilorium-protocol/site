// Deterministic generator: every organism draws its own event from its id (a family resemblance).
export function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function () {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mini(name: string) {
  const r = rng(name);
  const vx = 15 + r() * 6;
  const vy = 21 + r() * 4;
  const n = 9 + Math.floor(r() * 5);
  let d = '';
  for (let k = 0; k < n; k++) {
    const a = ((245 + (k + 0.5) * (300 / n) + (r() - 0.5) * 10) * Math.PI) / 180;
    const L = 5 + r() * (k % 3 === 0 ? 11 : 8);
    let ex = vx + Math.cos(a) * L;
    let ey = vy + Math.sin(a) * L;
    const dd = Math.hypot(ex - 20, ey - 20);
    if (dd > 15) {
      const f = 15 / dd;
      ex = 20 + (ex - 20) * f;
      ey = 20 + (ey - 20) * f;
    }
    const cx = vx + Math.cos(a + 0.18) * L * 0.55;
    const cy = vy + Math.sin(a + 0.18) * L * 0.55;
    d += `M${vx.toFixed(1)} ${vy.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)} `;
  }
  return { d, vx: vx.toFixed(1), vy: vy.toFixed(1) };
}
