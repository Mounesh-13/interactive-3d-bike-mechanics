import { useEffect, useMemo, useState } from "react";
import { PARTS, PART_MAP, SYSTEMS } from "../data/parts";
import type { SystemId } from "../data/parts";
import { LevelBadge, PartCard } from "./PartCard";

export default function PartsGuide({ onView3D, openId, onClose }: { onView3D: (id: string) => void; openId: string | null; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [sys, setSys] = useState<SystemId | "all">("all");
  const [level, setLevel] = useState<0 | 1 | 2 | 3>(0);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (openId) setOpen(openId);
  }, [openId]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return PARTS.filter(
      (p) =>
        (sys === "all" || p.system === sys) &&
        (level === 0 || p.level === level) &&
        (!s || (p.name + " " + p.hindi + " " + p.what + " " + p.fails.join(" ")).toLowerCase().includes(s)),
    );
  }, [q, sys, level]);

  const part = open ? PART_MAP[open] : null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search: 'plug', 'clutch', 'smoke', 'क्लच'…"
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400 sm:w-72"
        />
        <div className="flex flex-wrap gap-1">
          <button onClick={() => setSys("all")} className={`rounded-md border px-2 py-1 text-xs ${sys === "all" ? "border-amber-400 bg-amber-400 text-slate-900" : "border-slate-600 text-slate-300"}`}>
            All systems
          </button>
          {(Object.keys(SYSTEMS) as SystemId[]).map((s) => (
            <button key={s} onClick={() => setSys(s)} className={`rounded-md border px-2 py-1 text-xs ${sys === s ? "border-amber-400 bg-amber-400 text-slate-900" : "border-slate-600 text-slate-300"}`}>
              {SYSTEMS[s].icon} {SYSTEMS[s].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 text-xs">
          {[
            [0, "Any difficulty"],
            [1, "🟢 Easy DIY"],
            [2, "🟡 Practice"],
            [3, "🔴 Mechanic"],
          ].map(([v, l]) => (
            <button key={v} onClick={() => setLevel(v as 0 | 1 | 2 | 3)} className={`rounded-md border px-2 py-1 ${level === v ? "border-amber-400 text-amber-300" : "border-slate-600 text-slate-300"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-3 text-xs text-slate-500">{list.length} parts · click a card for the full explanation</p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => (
          <button
            key={p.id}
            onClick={() => setOpen(p.id)}
            className="group rounded-xl border border-slate-700/70 bg-slate-900/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-400/60"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs" style={{ color: SYSTEMS[p.system].color }}>
                {SYSTEMS[p.system].icon} {SYSTEMS[p.system].label}
              </span>
              <LevelBadge level={p.level} />
            </div>
            <div className="mt-2 font-semibold text-white group-hover:text-amber-300">{p.name}</div>
            <div className="text-xs text-amber-200/70">{p.hindi}</div>
            <p className="mt-2 line-clamp-3 text-[13px] text-slate-400">{p.what}</p>
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="py-10 text-center text-slate-500">No part matches. Try another word.</p>}

      {part && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => {
            setOpen(null);
            onClose();
          }}
        >
          <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-slate-600 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setOpen(null);
                onClose();
              }}
              className="absolute right-4 top-4 rounded-full bg-slate-800 px-2.5 py-1 text-sm text-slate-300 hover:text-white"
            >
              ✕
            </button>
            <PartCard
              part={part}
              onView3D={(id) => {
                setOpen(null);
                onClose();
                onView3D(id);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
