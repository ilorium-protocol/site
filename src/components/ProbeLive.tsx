import { AnimatePresence, motion } from 'framer-motion';
import { ENT, LEG, type Attr } from '../data/content';
import { useTick } from '../lib/useTick';

type Row = { beat: string; kind: string; text: string; attr: Attr; op: number; n: number };

export default function ProbeLive() {
  const { ref, t, R } = useTick(200);

  // Feed: a new simulated beat every 400 ms; every 8th is a witness-cosigned checkpoint.
  const base = 412 + Math.floor((R ? 18 : t) / 2);
  const rows: Row[] = [];
  for (let i = 0; i < 7; i++) {
    const n = base - i;
    const e = ENT[((n % ENT.length) + ENT.length) % ENT.length];
    let row: Row = { n, beat: String(n).padStart(4, '0'), kind: e.kind, text: e.text, attr: e.attr, op: +(1 - i * 0.11).toFixed(2) };
    if (n % 8 === 0) {
      row = { ...row, kind: 'checkpoint', text: `Signed summary, tree size ${n}, cosigned by a witness`, attr: 'witness' };
    }
    rows.push(row);
  }
  const dots = '...'.slice(0, R ? 3 : t % 4);

  // Pulse: 24 beats, a pulse every 8 (example N = 8).
  const cur = R ? 17 : t % 24;
  const pulses = Math.floor((cur + 1) / 8);
  // Witness challenge cycle.
  const cc = R ? 15 : t % 16;
  let chalW = 0;
  let chalText = 'No challenge pending. A witness may ask at any moment.';
  if (cc >= 8 && cc <= 13) { chalW = (cc - 7) * 16; chalText = 'Challenge sent by a witness. Deadline: 600 s.'; }
  if (cc >= 14) { chalW = 100; chalText = 'Answered in time. A signed pulse carried the challenge.'; }

  return (
    <div className="two" ref={ref}>
      <div className="panel console">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span className="lab">// probe.status: observing</span>
          <span className="lab dim">example data</span>
        </div>
        <p className="mono dim" aria-hidden="true">PARSING THE MEMBRANE{dots}</p>
        <div role="log" aria-label="Simulated feed of recorded beats (example data)">
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.div
                key={r.n}
                layout="position"
                className="frow"
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: r.op, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <span className="mono dim">beat {r.beat}</span>
                <span className="lab dim">{r.kind}</span>
                <span>{r.text}</span>
                <span className={'chip ' + r.attr}>{r.attr}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <div className="side">
        <div className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p className="lab">// pulse</p>
          <div className="pticks" aria-hidden="true">
            {Array.from({ length: 24 }, (_, i) => {
              const big = i % 8 === 7;
              const on = i <= cur;
              return <i key={i} style={{ height: big ? 36 : 18, background: on ? 'var(--fg)' : 'var(--dim)', opacity: on ? 1 : 0.45 }} />;
            })}
          </div>
          <p className="mono">beat {cur + 1} of 24 · pulse every N beats (example N = 8) · pulses sent: {pulses}</p>
          <div className="chal" aria-hidden="true"><div className="chalbar" style={{ width: chalW + '%' }} /></div>
          <p className="mono dim">{chalText}</p>
        </div>
        <div className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p className="lab">// attribution</p>
          {LEG.map((l) => (
            <div key={l.name} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className={'chip ' + l.name} style={{ minWidth: 112, textAlign: 'center' }}>{l.name}</span>
              <span className="dim">{l.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
