import { LEVEL_LABEL, SYSTEMS } from "../data/parts";
import type { PartInfo } from "../data/parts";

export function SystemBadge({ id }: { id: PartInfo["system"] }) {
  const s = SYSTEMS[id];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
      style={{ borderColor: s.color + "88", color: s.color, background: s.color + "18" }}
    >
      <span>{s.icon}</span> {s.label}
    </span>
  );
}

export function LevelBadge({ level }: { level: 1 | 2 | 3 }) {
  const l = LEVEL_LABEL[level];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${l.cls}`}>
      {level === 1 ? "🟢" : level === 2 ? "🟡" : "🔴"}&nbsp;{l.text}
    </span>
  );
}

export function PartCard({
  part,
  onView3D,
}: {
  part: PartInfo;
  onView3D?: (id: string) => void;
}) {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-300">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <SystemBadge id={part.system} />
          <LevelBadge level={part.level} />
        </div>
        <h3 className="mt-2 text-xl font-bold text-white">{part.name}</h3>
        <p className="text-amber-300/90">{part.hindi}</p>
        {part.spec && (
          <p className="mt-2 inline-block rounded-md bg-slate-800 px-2 py-1 font-mono text-[12px] text-cyan-300">
            {part.spec}
          </p>
        )}
      </div>

      <p className="text-base text-slate-100">{part.what}</p>

      <div>
        <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-sky-400">How it works</h4>
        <p>{part.how}</p>
      </div>

      <div className="rounded-lg border border-rose-500/25 bg-rose-500/5 p-3">
        <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-rose-400">
          Signs it is going bad
        </h4>
        <ul className="list-disc space-y-0.5 pl-4">
          {part.fails.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3">
        <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
          Check &amp; fix it yourself
        </h4>
        <ul className="list-disc space-y-0.5 pl-4">
          {part.diy.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>

      <dl className="grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-3">
        <div className="rounded-lg bg-slate-800/70 p-2">
          <dt className="text-[10px] uppercase tracking-wider text-slate-500">Tools</dt>
          <dd>{part.tools}</dd>
        </div>
        <div className="rounded-lg bg-slate-800/70 p-2">
          <dt className="text-[10px] uppercase tracking-wider text-slate-500">Service interval</dt>
          <dd>{part.interval}</dd>
        </div>
        <div className="rounded-lg bg-slate-800/70 p-2">
          <dt className="text-[10px] uppercase tracking-wider text-slate-500">Approx. cost (India)</dt>
          <dd>{part.cost}</dd>
        </div>
      </dl>

      {onView3D && (
        <button
          onClick={() => onView3D(part.ref3d ?? part.id)}
          className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
        >
          🔍 Show in 3D model
        </button>
      )}
    </div>
  );
}
