import { motion } from 'framer-motion';
import { NODES, type NodeState } from '../data/content';
import { mini } from '../lib/rng';
import { useTick } from '../lib/useTick';

const RING: Record<NodeState, React.CSSProperties> = {
  active: { fill: 'var(--bg)', stroke: 'var(--dim)', strokeWidth: 1.4 },
  dormant: { fill: 'var(--bg)', stroke: 'var(--dim)', strokeWidth: 1.4, strokeDasharray: '2 3', opacity: 0.65 },
  released: { fill: 'var(--bg)', stroke: 'var(--dim)', strokeWidth: 1.4, strokeDasharray: '7 3' },
  coalesced: { fill: 'var(--panel)', stroke: 'var(--dim)', strokeWidth: 1.4 },
};

const GLYPHS = NODES.map((n) => mini(n.name));
const ACTIVE = NODES.map((n, i) => ({ n, i })).filter((x) => x.n.st === 'active').map((x) => x.i);

const edges = NODES.flatMap((n) =>
  n.p.map((pi) => {
    const a = NODES[pi];
    const mx = (a.x + n.x) / 2;
    return {
      key: `${pi}-${n.name}`,
      d: `M${a.x} ${a.y} C${mx} ${a.y} ${mx} ${n.y} ${n.x} ${n.y}`,
      dashed: n.ty === 'inherited',
    };
  }),
);

export default function RadiantNetwork() {
  const { ref, t, R } = useTick(200);
  // One example node "beats" at a time, in turn. Purely illustrative.
  const hot = R ? -1 : ACTIVE[Math.floor(t / 8) % ACTIVE.length];
  const cap = hot < 0 ? 'Nine example organisms, ordered by first beat.' : `${NODES[hot].name} · gen ${NODES[hot].gen} · beat (example)`;
  return (
    <div ref={ref} data-rv>
      <div className="panel" style={{ padding: 20, overflowX: 'auto' }}>
        <div
          className="net"
          role="img"
          aria-label="An animated example lineage network of nine organisms ordered left to right by first beat. Lines show founded, inherited and coalesced successions. One organism is dormant, one released and two coalesced into another."
        >
          <svg className="nl" viewBox="0 0 640 400" aria-hidden="true">
            {edges.map((e) => (
              <path
                key={e.key}
                d={e.d}
                pathLength={e.dashed ? undefined : 1}
                className={e.dashed ? 'dashed' : undefined}
                fill="none"
                style={{ stroke: 'var(--fg)', strokeWidth: 1.4, ...(e.dashed ? { animation: 'flow2 1.2s linear infinite' } : {}) }}
              />
            ))}
          </svg>
          {NODES.map((n, i) => {
            const g = GLYPHS[i];
            return (
              <div
                className="nd"
                key={n.name}
                style={{
                  left: ((n.x / 640) * 100).toFixed(2) + '%',
                  top: ((n.y / 400) * 100).toFixed(2) + '%',
                  ['--d' as string]: 0.15 * n.gen + 0.05 * i + 's',
                  opacity: n.st === 'dormant' ? 0.8 : undefined,
                }}
              >
                {i === hot && (
                  <motion.span
                    key={t}
                    className="pulse"
                    initial={{ scale: 0.8, opacity: 0.9 }}
                    animate={{ scale: 1.9, opacity: 0 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                )}
                <svg className="mini" viewBox="0 0 40 40" aria-hidden="true">
                  <circle cx="20" cy="20" r="18" style={RING[n.st]} />
                  <path d={g.d} fill="none" style={{ stroke: 'var(--fg)', strokeWidth: 1.2, strokeLinecap: 'round' }} />
                  <circle cx={g.vx} cy={g.vy} r="1.7" style={{ fill: 'var(--fg)' }} />
                </svg>
                <span className="mono ndl">{n.name}</span>
                <span className="mono dim ndl">gen {n.gen} · {n.st}</span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mono dim rd-cap" style={{ marginTop: 12 }} aria-live="off">{cap}</p>
      <div className="legend mono dim" style={{ marginTop: 12 }}>
        <span>solid line: founded</span>
        <span>dashed line: inherited from a seed</span>
        <span>two lines into one: coalesced</span>
        <span>dashed ring: dormant</span>
        <span>each node draws its own event, generated from its id: a family resemblance</span>
        <span>Ordered by first beat. Never a ranking. Example data.</span>
      </div>
    </div>
  );
}
