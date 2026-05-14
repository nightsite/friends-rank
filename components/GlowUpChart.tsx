import { rankScore } from "@/lib/ranks";

type RatingPoint = {
  rank: number;
  /** ISO date string */
  updatedAt: string;
  categorySlug: string;
  categoryName: string;
};

type Props = {
  ratings: RatingPoint[];
  className?: string;
  /** number of weekly buckets to plot (most recent N) */
  weeks?: number;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const COLORS: Record<string, string> = {
  gym: "#34d399",
  gaming: "#a78bfa",
  "face-card": "#fb7185",
  status: "#fbbf24",
};

function bucketStart(now: Date, weeksAgo: number): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - 7 * weeksAgo);
  return d;
}

type SeriesAcc = { name: string; sums: number[]; counts: number[] };

export function GlowUpChart({ ratings, className = "", weeks = 10 }: Props) {
  const now = new Date();
  const buckets: Date[] = [];
  for (let i = weeks - 1; i >= 0; i--) buckets.push(bucketStart(now, i));

  const accs = new Map<string, SeriesAcc>();
  for (const r of ratings) {
    if (!accs.has(r.categorySlug)) {
      accs.set(r.categorySlug, {
        name: r.categoryName,
        sums: Array(weeks).fill(0),
        counts: Array(weeks).fill(0),
      });
    }
    const acc = accs.get(r.categorySlug)!;
    const t = new Date(r.updatedAt).getTime();
    for (let i = 0; i < buckets.length; i++) {
      const start = buckets[i].getTime();
      const end = start + WEEK_MS;
      if (t >= start && t < end) {
        acc.sums[i] += rankScore(r.rank);
        acc.counts[i] += 1;
        break;
      }
    }
  }

  const series = new Map<string, { name: string; values: (number | null)[] }>();
  for (const [slug, acc] of accs) {
    series.set(slug, {
      name: acc.name,
      values: acc.sums.map((sum, i) => (acc.counts[i] === 0 ? null : sum / acc.counts[i])),
    });
  }

  if (series.size === 0) {
    return (
      <p className={`text-sm italic text-zinc-500 ${className}`.trim()}>
        Not enough data yet — once you get a few reviews this chart wakes up.
      </p>
    );
  }

  const W = 640;
  const H = 200;
  const padX = 28;
  const padY = 16;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  function x(i: number) {
    if (weeks === 1) return padX + innerW / 2;
    return padX + (innerW * i) / (weeks - 1);
  }
  function y(v: number) {
    return padY + innerH - ((v - 1) / 4) * innerH;
  }

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label="Weekly average per category"
          className="block min-w-[420px]"
        >
          <defs>
            <pattern id="gridDots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="0" cy="0" r="1" fill="rgba(255,255,255,0.06)" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={W} height={H} fill="url(#gridDots)" />
          {[1, 2, 3, 4, 5].map((s) => (
            <g key={s}>
              <line
                x1={padX}
                x2={W - padX}
                y1={y(s)}
                y2={y(s)}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="2 4"
              />
              <text x={4} y={y(s) + 4} fontSize="10" fill="rgba(228,228,231,0.5)">
                {s}
              </text>
            </g>
          ))}
          {Array.from(series.entries()).map(([slug, s]) => {
            const color = COLORS[slug] ?? "#fbbf24";
            const pts = s.values
              .map((v, i) => (v == null ? null : `${x(i)},${y(v)}`))
              .filter(Boolean) as string[];
            if (pts.length === 0) return null;
            return (
              <g key={slug}>
                <polyline
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={pts.join(" ")}
                  opacity="0.95"
                />
                {s.values.map((v, i) =>
                  v == null ? null : (
                    <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={color} />
                  ),
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <ul className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
        {Array.from(series.entries()).map(([slug, s]) => (
          <li key={slug} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: COLORS[slug] ?? "#fbbf24" }}
            />
            {s.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
