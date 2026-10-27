import { useTick } from '../lib/useTick';

export default function VoiceHow() {
  const { ref, t, R } = useTick(200);
  const T = R ? 60 : t;

  // 01 — what we saw
  const bars = Array.from({ length: 10 }, (_, i) => {
    const h = 22 + 62 * Math.abs(Math.sin((T + i * 4) / 6));
    return { h, hot: i === T % 10 };
  });
  const barsCap = `beat ${412 + Math.floor(T / 2)} · recorded, never rewritten`;

  // 02 — when we saw it
  const tlStep = R ? 4 : Math.floor(T / 5) % 6;
  const tlW = Math.min(100, tlStep * 25);
  const tlCap = tlStep >= 4 ? 'ordered by cause, dated by witnesses' : `witness clock: ${9 + tlStep}:0${tlStep} UTC (example)`;

  // 03 — what we could not see
  const ow = R ? 72 : Math.round(58 + 24 * Math.sin(T / 9));
  const hw = 100 - ow;

  // step 1 — the Probe observes
  const s1x = R ? 50 : 8 + ((T * 4) % 86);
  const DP: [number, number][] = [[22, 48], [38, 66], [52, 44], [64, 70], [76, 52], [30, 80], [86, 72]];
  const attributed = DP.filter((p) => p[0] < s1x).length;
  // step 2 — beats land
  const nf = R ? 5 : Math.floor(T / 4) % 7;
  // step 3 — the Spore goes public
  const sl = ['/.well-known/ilorium.json', 'organism: example-organism', 'genome: 1.0', 'stop_key_holder: human', 'status: in gestation'];
  const sn = R ? 6 : Math.floor(T / 4) % 7;

  return (
    <div ref={ref}>
      <div className="grid3 tinted">
        <article className="cell t1">
          <p className="lab ionk">01/</p>
          <h3 className="disp title">This is what we saw.</h3>
          <div className="vis vi">
            <div className="tk">
              {bars.map((b, i) => (
                <i key={i} style={{ height: b.h, background: b.hot ? 'var(--ion)' : 'var(--fg)', opacity: b.hot ? 1 : 0.85, transition: 'height .2s' }} />
              ))}
            </div>
            <p className="mono dim vcap">{barsCap}</p>
          </div>
          <p>Every material action goes into the Strata, a log that is never rewritten: a payment, a deployment, a reply to a customer.</p>
        </article>
        <article className="cell t2">
          <p className="lab ionk">02/</p>
          <h3 className="disp title">This is when we saw it.</h3>
          <div className="vis vi">
            <div style={{ position: 'absolute', left: 24, right: 24, top: 62, height: 2, background: 'var(--line)' }} />
            <div style={{ position: 'absolute', left: 24, top: 62, height: 2, background: 'var(--ion)', width: tlW + '%', maxWidth: 'calc(100% - 48px)', transition: 'width .25s linear' }} />
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="tl-dot"
                style={{
                  left: `calc(24px + (100% - 48px) * ${i / 4})`,
                  ...(i === 0
                    ? { borderRadius: '50%', background: 'var(--ember)' }
                    : { border: '1.5px solid ' + (i <= tlStep ? 'var(--ion)' : 'var(--fg)'), background: i <= tlStep ? 'var(--ion)' : 'var(--bg)' }),
                }}
              />
            ))}
            <p className="mono dim vcap">{tlCap}</p>
          </div>
          <p>Each record holds its place in the chain, and a witness records when it arrived. Order comes from what happened before what.</p>
        </article>
        <article className="cell t1">
          <p className="lab ionk">03/</p>
          <h3 className="disp title">This is what we could not see.</h3>
          <div className="vis vi">
            <div className="hbar">
              <i style={{ display: 'block', width: ow + '%', background: 'var(--ion)', transition: 'width .25s linear' }} />
              <i className="k-hatch" style={{ display: 'block', width: hw + '%', border: '1px solid var(--dim)', borderLeft: 0, transition: 'width .25s linear' }} />
            </div>
            <p className="mono dim vcap">observed {ow}% · not observed {hw}%, same size</p>
          </div>
          <p>Gaps are published with the same weight as findings. Missing data is never filled with a guess.</p>
        </article>
      </div>

      <div id="how" style={{ marginTop: 72 }} className="sh">
        <p className="lab dim">[ How it works ]</p>
        <h3 className="disp h2" style={{ fontSize: 'clamp(26px,3.4vw,38px)' }}>Three steps from an organization to a record.</h3>
      </div>
      <div className="grid3 tinted">
        <article className="cell">
          <p className="lab ionk">Step 01</p>
          <h3 className="disp title">The Probe observes</h3>
          <p className="mono dim" style={{ margin: '-8px 0 0' }}>in development · built from milestone M1</p>
          <div className="vis vi s1">
            <span className="lab dim" style={{ position: 'absolute', left: 12, top: 8 }}>membrane</span>
            <div className="mem2" />
            <div style={{ position: 'absolute', top: 26, bottom: 14, width: 2, background: 'var(--ion)', left: s1x + '%', opacity: 0.9, boxShadow: '0 0 14px var(--ion)' }} />
            {DP.map((p, i) => (
              <span
                key={i}
                className="s1d"
                style={{
                  left: p[0] + '%',
                  top: p[1] + '%',
                  background: p[0] < s1x ? 'var(--ion)' : 'var(--bg)',
                  border: '1.5px solid ' + (p[0] < s1x ? 'var(--ion)' : 'var(--fg)'),
                }}
              />
            ))}
            <p className="mono dim vcap">read-only · {attributed} of 7 attributed</p>
          </div>
          <p>A read-only, open-source recorder is designed to watch the systems that belong to the organism. It observes and attributes. It never scores.</p>
        </article>
        <article className="cell">
          <p className="lab ionk">Step 02</p>
          <h3 className="disp title">Beats land in the Strata</h3>
          <div className="vis vi">
            {[0, 1, 2, 3, 4].map((i) => {
              const on = nf > i;
              return (
                <div
                  key={i}
                  className="s2r"
                  style={{
                    top: 14 + i * 24,
                    border: '1px solid ' + (on ? 'var(--ion)' : 'var(--line)'),
                    background: on ? (nf === i + 1 ? 'color-mix(in srgb, var(--ion) 45%, transparent)' : 'color-mix(in srgb, var(--ion) 18%, transparent)') : 'transparent',
                  }}
                >
                  <span className="mono" style={{ position: 'absolute', right: 6, top: -1, fontSize: 11 }}>{on ? 'beat ' + (417 + i) : ''}</span>
                </div>
              );
            })}
          </div>
          <p>Each material event becomes a beat. Checkpoints are signed, and an independent witness cosigns them before they count.</p>
        </article>
        <article className="cell">
          <p className="lab ionk">Step 03</p>
          <h3 className="disp title">The Spore goes public</h3>
          <div className="vis vi" style={{ height: 150 }}>
            <div className="mono" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {sl.map((l, i) => (
                <span key={i} style={{ opacity: sn > i ? 1 : 0.15, transition: 'opacity .2s' }}>{l}</span>
              ))}
            </div>
            <span style={{ position: 'absolute', right: 18, bottom: 16, width: 14, height: 14, borderRadius: '50%', background: 'var(--ion)', opacity: sn >= 6 ? 1 : 0 }} />
            <p className="mono dim" style={{ position: 'absolute', right: 40, bottom: 14, opacity: sn >= 6 ? 1 : 0 }}>on the Radiant</p>
          </div>
          <p>The organism publishes its identity file and appears on the Radiant with its state, its status and its evidence.</p>
        </article>
      </div>
    </div>
  );
}
