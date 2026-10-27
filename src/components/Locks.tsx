import { useTick } from '../lib/useTick';

const cls = (on: boolean) => 'lkb ' + (on ? 'on' : 'off');

/**
 * Three locks, one stage cycle. Exactly ONE Ember point in this whole section:
 * the closed birth gate. When the gate opens, the Ember is gone.
 */
export default function Locks() {
  const { ref, t, R } = useTick(200);
  const st = R ? 3 : Math.floor(t / 9) % 4;
  // Lock 2 in the static state (no JS / reduced motion) rests on the closed gate: that is the section's single Ember.
  const st2 = R ? 1 : st;
  const gateOpen = st2 >= 2;
  return (
    <div ref={ref}>
      <div className="grid3">
        <article className="cell">
          <p className="lab dim">Lock 1 · Germline</p>
          <div className="lk">
            <div className={cls(st >= 0)}><span className="lab">Custodians · human</span></div>
            <div className="mono dim" style={{ textAlign: 'center', opacity: st >= 1 ? 1 : 0.4 }}>amend through an IIP</div>
            <div className={cls(st >= 1)}><span className="lab">Genome 1.0 · seven laws</span></div>
            <div className="lkr">
              <div className={cls(st >= 2)}><span className="mono">organism</span></div>
              <div className={cls(st >= 3)}><span className="mono">organism</span></div>
              <div className={cls(st >= 3)}><span className="mono">organism</span></div>
            </div>
          </div>
          <p className="disp title">Only humans change what every generation inherits.</p>
          <p className="dim">No organism amends the Genome, in any generation. The laws travel whole through every succession.</p>
        </article>
        <article className="cell">
          <p className="lab dim">Lock 2 · Birth gate</p>
          <div className="lk">
            <div className="lkr">
              <div className={cls(true)}><span className="mono">parent</span><br /><span className="mono dim">conforms, stop drill recent</span></div>
              <div style={{ flex: '0 0 74px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className={'gatedot ' + (gateOpen ? 'open' : 'closed')} />
                <span className="mono dim">{gateOpen ? 'gate open' : 'gate closed'}</span>
              </div>
              <div className={cls(st2 >= 3)}><span className="mono">newborn</span><br /><span className="mono dim">in gestation</span></div>
            </div>
            <div className={cls(st2 >= 1)}><span className="lab">Human stop key holder accepts the key</span></div>
          </div>
          <p className="disp title">Only conforming organisms may originate others.</p>
          <p className="dim">A birth is valid only after a human holder accepts the newborn's key. The gate is the same for every birth.</p>
        </article>
        <article className="cell">
          <p className="lab dim">Lock 3 · Stop</p>
          <div className="lk">
            <div className={cls(true)}>
              <svg viewBox="0 0 240 40" width="100%" height="40" aria-hidden="true" style={{ display: 'block', opacity: st >= 3 ? 0 : 1 }}>
                <polyline points="0,20 24,20 30,4 36,34 42,20 84,20 90,4 96,34 102,20 144,20 150,4 156,34 162,20 204,20 210,4 216,34 222,20 240,20" fill="none" style={{ stroke: 'var(--fg)', strokeWidth: 1.5 }} />
              </svg>
              <svg viewBox="0 0 240 40" width="100%" height="40" aria-hidden="true" style={{ display: 'block', marginTop: -40, opacity: st >= 3 ? 1 : 0 }}>
                <polyline points="0,20 240,20" fill="none" style={{ stroke: 'var(--dim)', strokeWidth: 1.5 }} />
              </svg>
            </div>
            <div className={cls(st >= 2)}><span className="lab">Stop key holder · human</span></div>
            <div className={cls(st >= 3)}>
              <span className="mono">{st >= 3 ? 'Stop report: what was blocked, what already reached third parties.' : 'Beats continue. A human holds the key.'}</span>
            </div>
          </div>
          <p className="disp title">Every organism is born stoppable by a human.</p>
          <p className="dim">When no human founder remains, independent Wardens hold the key. Any one of them can stop.</p>
        </article>
      </div>
      <p className="mono dim" style={{ marginTop: 20 }}>Illustration of the rules. No organism has yet demonstrated them in operation.</p>
    </div>
  );
}
