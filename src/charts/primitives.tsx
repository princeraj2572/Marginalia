/** Hand-written SVG chart primitives. No chart library. */

export function Sparkline({
  values,
  width = 160,
  height = 40,
  label,
}: {
  values: number[];
  width?: number;
  height?: number;
  label: string;
}) {
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const pts = values.map((v, i) => [i * step, height - 2 - (v / max) * (height - 4)] as const);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const last = pts.at(-1);
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-xs"
    >
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
      {last && <circle cx={last[0]} cy={last[1]} r="3" fill="var(--accent)" />}
    </svg>
  );
}

/** Intensity bucket 0..4 for a value relative to the max. */
export function bucket(value: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(4, Math.ceil((value / max) * 4)) as 1 | 2 | 3 | 4;
}

const HEAT = [
  'var(--surface-2)',
  'color-mix(in srgb, var(--accent) 25%, var(--surface-2))',
  'color-mix(in srgb, var(--accent) 50%, var(--surface-2))',
  'color-mix(in srgb, var(--accent) 75%, var(--surface-2))',
  'var(--accent)',
];

/** grid[week][day]; renders weeks as columns and days as rows. */
export function Heatmap({ grid, label }: { grid: number[][]; label: string }) {
  const max = Math.max(...grid.flat(), 0);
  const cell = 18;
  const gap = 4;
  const w = grid.length * (cell + gap) - gap;
  const h = 7 * (cell + gap) - gap;
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} className="w-full max-w-sm">
      {grid.map((week, x) =>
        week.map((v, y) => (
          <rect
            key={`${x}-${y}`}
            x={x * (cell + gap)}
            y={y * (cell + gap)}
            width={cell}
            height={cell}
            rx="3"
            fill={HEAT[bucket(v, max)]}
          >
            <title>{`${v} min`}</title>
          </rect>
        )),
      )}
    </svg>
  );
}

export function BarPair({
  a,
  b,
  labelA,
  labelB,
}: {
  a: number;
  b: number;
  labelA: string;
  labelB: string;
}) {
  const max = Math.max(a, b, 1);
  const row = (v: number, label: string, fill: string, y: number) => (
    <g transform={`translate(0 ${y})`}>
      <rect width="200" height="14" rx="3" fill="var(--surface-2)" />
      <rect width={(v / max) * 200} height="14" rx="3" fill={fill} />
      <text x="208" y="12" fontSize="12" fill="var(--text)" className="num">
        {label}: {v}
      </text>
    </g>
  );
  return (
    <svg
      role="img"
      aria-label={`${labelA} ${a}, ${labelB} ${b}`}
      viewBox="0 0 300 40"
      className="w-full max-w-sm"
    >
      {row(a, labelA, 'var(--accent)', 0)}
      {row(b, labelB, 'var(--text-muted)', 24)}
    </svg>
  );
}
