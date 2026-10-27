import type { BarKind } from '../data/content';

export function Bars({ parts, height }: { parts: { w: number; k: BarKind }[]; height?: number }) {
  if (!parts.length) return null;
  return (
    <div className="pbar" style={height ? { height } : undefined} aria-hidden="true">
      {parts.map((p, i) => (
        <i key={i} className={'k-' + p.k} style={{ width: p.w + '%' }} />
      ))}
    </div>
  );
}
