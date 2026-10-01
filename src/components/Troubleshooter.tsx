import { useState } from "react";
import { SYMPTOMS, TREES } from "../data/troubleshoot";
import type { Cause, TreeResult } from "../data/troubleshoot";
import { PART_MAP } from "../data/parts";

const LV: Record<Cause["level"], string> = {
  DIY: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  "Try, then mechanic": "border-amber-500/40 bg-amber-500/10 text-amber-300",
  Mechanic: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};
const LK: Record<Cause["likelihood"], string> = {
  High: "text-rose-300",
  Medium: "text-amber-300",
  Low: "text-slate-400",
};

function PartChips({ ids, onOpen }: { ids: string[]; onOpen: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <button key={id} onClick={() => onOpen(id)} className="rounded-full border border-slate-600 bg-slate-800 px-2.5 py-0.5 text-[11px] text-sky-300 hover:border-sky-400">
          🔧 {PART_MAP[id]?.name ?? id}
        </button>
      ))}
    </div>
  );
}

function Guided({ onOpen }: { onOpen: (id: string) => void }) {
  const [treeId, setTreeId] = useState(TREES[0].id);
  const tree = TREES.find((t) => t.id === treeId)!;
  const [path, setPath] = useState<{ node: string; ans: string }[]>([]);
  const [node, setNode] = useState(tree.start);

  const choose = (id: string) => {
    setTreeId(id);
    const t = TREES.find((x) => x.id === id)!;
    setNode(t.start);
    setPath([]);
  };
  const cur = tree.nodes[node];
  const answer = (next: string, label: string) => {
    setPath((p) => [...p, { node, ans: label }]);
    setNode(next);
  };
  const reset = () => {
    setNode(tree.start);
    setPath([]);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TREES.map((t) => (
          <button key={t.id} onClick={() => choose(t.id)} className={`rounded-lg border px-3 py-2 text-sm font-medium ${treeId === t.id ? "border-amber-400 bg-amber-400/10 text-amber-300" : "border-slate-600 text-slate-300 hover:border-slate-400"}`}>
            {t.title}
          </button>
        ))}
      </div>
      <p className="mb-4 text-sm text-slate-400">{tree.intro}</p>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <ol className="space-y-2 text-sm">
          {path.map((p, i) => {
            const n = tree.nodes[p.node];
            return (
              <li key={i} className="rounded-lg bg-slate-900/70 p-2 text-slate-400">
                <div className="text-[11px] text-slate-500">Step {i + 1}</div>
                <div className="line-clamp-2 text-xs">{"q" in n ? n.q : ""}</div>
                <div className="mt-0.5 text-xs font-semibold text-emerald-300">→ {p.ans}</div>
              </li>
            );
          })}
          {path.length === 0 && <li className="text-xs text-slate-500">Your answers will appear here.</li>}
        </ol>

        <div>
          {"q" in cur ? (
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-sky-400">Question {path.length + 1}</div>
              <h4 className="mt-1 text-lg font-bold text-white">{cur.q}</h4>
              {cur.hint && <p className="mt-2 text-sm text-slate-400">💡 {cur.hint}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => answer(cur.yes, cur.yesLabel ?? "Yes")} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400">
                  ✓ {cur.yesLabel ?? "Yes"}
                </button>
                <button onClick={() => answer(cur.no, cur.noLabel ?? "No")} className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-rose-400">
                  ✗ {cur.noLabel ?? "No"}
                </button>
              </div>
              {path.length > 0 && (
                <button onClick={reset} className="mt-4 text-xs text-slate-400 hover:text-white">
                  ↺ start over
                </button>
              )}
            </div>
          ) : (
            <Result r={(cur as TreeResult).result} onOpen={onOpen} onReset={reset} />
          )}
        </div>
      </div>
    </div>
  );
}

function Result({ r, onOpen, onReset }: { r: TreeResult["result"]; onOpen: (id: string) => void; onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Most likely problem</div>
      <h4 className="mt-1 text-xl font-bold text-white">{r.title}</h4>
      <span className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[11px] ${LV[r.level]}`}>{r.level}</span>
      <p className="mt-3 text-sm text-slate-300">{r.detail}</p>
      <h5 className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">What to do</h5>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-200">
        {r.fix.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ol>
      <h5 className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Related parts (click for details)</h5>
      <PartChips ids={r.parts} onOpen={onOpen} />
      <button onClick={onReset} className="mt-5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700">
        ↺ Diagnose another problem
      </button>
    </div>
  );
}

function SymptomList({ onOpen }: { onOpen: (id: string) => void }) {
  const [id, setId] = useState(SYMPTOMS[0].id);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const s = SYMPTOMS.find((x) => x.id === id)!;
  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {SYMPTOMS.map((x) => (
          <button key={x.id} onClick={() => setId(x.id)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${id === x.id ? "border-amber-400 bg-amber-400/10 text-amber-200" : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500"}`}>
            <span className="text-lg">{x.icon}</span>
            <span>{x.title}</span>
          </button>
        ))}
      </div>
      <div>
        <h4 className="text-xl font-bold text-white">{s.title}</h4>
        <p className="mb-4 text-sm text-slate-400">{s.desc} Check the causes top to bottom: they are ordered by how often they happen.</p>
        <div className="space-y-3">
          {s.causes.map((c, i) => {
            const key = s.id + i;
            return (
              <div key={key} className={`rounded-xl border p-4 transition ${done[key] ? "border-slate-700 bg-slate-900/30 opacity-60" : "border-slate-700 bg-slate-900/70"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <input type="checkbox" checked={!!done[key]} onChange={(e) => setDone((d) => ({ ...d, [key]: e.target.checked }))} className="accent-emerald-400" title="Mark as checked" />
                  <span className="font-semibold text-white">{i + 1}. {c.cause}</span>
                  <span className={`text-[11px] font-medium ${LK[c.likelihood]}`}>● {c.likelihood} likelihood</span>
                  <span className={`ml-auto rounded-full border px-2 py-0.5 text-[11px] ${LV[c.level]}`}>{c.level}</span>
                </div>
                <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-800/60 p-2">
                    <dt className="text-[10px] uppercase tracking-wider text-sky-400">How to check</dt>
                    <dd className="text-slate-300">{c.check}</dd>
                  </div>
                  <div className="rounded-lg bg-slate-800/60 p-2">
                    <dt className="text-[10px] uppercase tracking-wider text-emerald-400">How to fix</dt>
                    <dd className="text-slate-300">{c.fix}</dd>
                  </div>
                </dl>
                <div className="mt-2">
                  <PartChips ids={c.parts} onOpen={onOpen} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Troubleshooter({ onOpen }: { onOpen: (id: string) => void }) {
  const [tab, setTab] = useState<"guided" | "symptom">("guided");
  return (
    <div>
      <div className="mb-5 inline-flex rounded-xl bg-slate-900 p-1 text-sm">
        <button onClick={() => setTab("guided")} className={`rounded-lg px-4 py-2 font-medium ${tab === "guided" ? "bg-amber-400 text-slate-900" : "text-slate-300"}`}>
          🧭 Guided diagnosis
        </button>
        <button onClick={() => setTab("symptom")} className={`rounded-lg px-4 py-2 font-medium ${tab === "symptom" ? "bg-amber-400 text-slate-900" : "text-slate-300"}`}>
          🩺 Symptom → causes
        </button>
      </div>
      {tab === "guided" ? <Guided onOpen={onOpen} /> : <SymptomList onOpen={onOpen} />}
    </div>
  );
}
