import { DIMS, CPS, LAWS } from '../data/content';
import { Bars } from './Bars';
import { useTick } from '../lib/useTick';

export default function CheckSection() {
  const { ref, t, R } = useTick(200);
  const cpAct = R ? -1 : Math.floor(t / 14) % 4;
  const pulse = R ? '12 s ago' : (Math.floor(t / 5) % 59) + 1 + ' s ago';
  return (
    <div className="two chk" ref={ref} data-rv>
      <div className="panel vs">
        <div className="vsh">
          <span className="lab">// vital signs</span>
          <span className="chip declared">EXAMPLE DATA</span>
        </div>
        <p className="disp title" style={{ margin: '4px 0 6px' }}>example-organism</p>
        <div className="vsr"><span>state of being</span><span>active · last pulse {pulse}</span></div>
        <div className="vsr"><span>web status</span><span>Observed</span></div>
        <div className="vsr"><span>provenance</span><span>Founded · generation 0</span></div>
        <div className="vsr"><span>stop key holder</span><span>human</span></div>
        <div className="vsr"><span>period · scope</span><span>2026-10-01 to 2026-10-20 · 3 systems inside the membrane</span></div>
        <div className="mdg">
          {DIMS.map((d) => (
            <div className="md" key={d.name}>
              <span className="lab dim">{d.name}</span>
              <Bars parts={d.parts} height={12} />
              <span className="mono">{d.val}</span>
              <span className="mono dim">{d.fresh}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px dashed var(--line)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="lab dim">conformity, law by law</span>
          <div className="cbs">
            {LAWS.map((n, i) => (
              <span
                key={n}
                className={'cb ' + (i === 6 ? 'k-hatch' : 'k-solid')}
                title={`Law ${i + 1} · ${n} · ${i === 6 ? 'not verified' : 'conforms'}`}
              />
            ))}
          </div>
          <span className="mono dim">6 conform · Law 7, Continuity, not verified</span>
        </div>
        <div className="vsr"><span>evidence bundle</span><span>example-organism · 2026-10 · linked</span></div>
      </div>
      <div className="steps">
        <p className="lab dim">// the counterparty check</p>
        <ol className="cps">
          {CPS.map((c, i) => (
            <li className={'cp' + (i === cpAct ? ' on' : '')} key={c.n}>
              <span className="lab">{c.n}</span>
              <div>
                <p className="disp title" style={{ fontSize: 22 }}>{c.t}</p>
                <p className="dim">{c.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="disp title">You decide. Ilorium records nothing about who checks whom.</p>
        <div className="btns">
          <a className="btn b2 cut" href="/examples/example-organism.evidence-bundle.example.json" download>
            Download the Evidence Bundle (example)
          </a>
        </div>
        <p className="mono">Verdict: PASS · FAIL · UNKNOWN. Integrity of evidence, nothing more.</p>
        <p className="mono dim">Vital Signs whose bundle cannot be reached show UNKNOWN. Never a seal, never a score. Free, no account.</p>
      </div>
    </div>
  );
}
