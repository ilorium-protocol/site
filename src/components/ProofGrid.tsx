import { DIMS } from '../data/content';
import { Bars } from './Bars';

export default function ProofGrid() {
  return (
    <div data-rv>
      <div className="panel" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: '8px 28px' }}>
        <span className="lab">example-organism</span>
        <span className="lab dim">state: active</span>
        <span className="lab dim">recovery: unknown</span>
        <span className="lab dim">status: observed</span>
        <span className="lab dim">example data</span>
      </div>
      <div className="grid3 g32">
        {DIMS.map((d) => (
          <article className="cell" key={d.name}>
            <p className="lab dim">{d.name}</p>
            <p className="dim">{d.q}</p>
            <Bars parts={d.parts} />
            <p className="disp val">{d.val}</p>
            <p className="mono dim">{d.note}</p>
            <p className="mono dim">{d.fresh}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
