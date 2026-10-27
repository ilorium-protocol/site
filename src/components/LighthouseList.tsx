import { LH } from '../data/content';
import { useTick } from '../lib/useTick';

export default function LighthouseList() {
  const { ref, t, R } = useTick(200);
  const act = R ? -1 : Math.floor(t / 9) % LH.length;
  return (
    <div className="panel lh" ref={ref}>
      {LH.map((r, i) => (
        <div className={'lhr' + (i === act ? ' on' : '')} key={r.name}>
          <div>
            <span className="mono">{r.name}</span>
            <br />
            <span className="dim">{r.text}</span>
          </div>
          <span className={'chip ' + r.st}>{r.st}</span>
        </div>
      ))}
    </div>
  );
}
