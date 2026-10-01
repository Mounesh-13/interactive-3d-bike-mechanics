import { useState } from "react";
import { FINAL, GEARS, PRIMARY, engineTorque } from "../scene/Sim";

const RW = 0.3;

function calc(rpm: number, gear: number, front: number, rear: number) {
  const final = rear / front;
  const overall = PRIMARY * GEARS[gear] * final;
  const wheelRpm = rpm / overall;
  const v = ((wheelRpm * 2 * Math.PI) / 60) * RW; // m/s
  const T = engineTorque(rpm);
  const wheelT = T * overall * 0.9;
  const F = wheelT / RW;
  const ps = (T * ((rpm * 2 * Math.PI) / 60)) / 735.5;
  return { final, overall, wheelRpm, kmh: v * 3.6, T, wheelT, F, ps };
}

export default function Transmission() {
  const [rpm, setRpm] = useState(5500);
  const [gear, setGear] = useState(2);
  const [front, setFront] = useState(14);
  const [rear, setRear] = useState(42);
  const c = calc(rpm, gear, front, rear);
  const base = calc(rpm, gear, 14, 42);

  // torque/power curve
  const pts: { r: number; t: number; p: number }[] = [];
  for (let r = 1000; r <= 8500; r += 250) {
    const t = engineTorque(r);
    pts.push({ r, t, p: (t * ((r * 2 * Math.PI) / 60)) / 735.5 });
  }
  const X = (r: number) => 40 + ((r - 1000) / 7500) * 330;
  const Yt = (t: number) => 170 - (t / 10) * 140;
  const Yp = (p: number) => 170 - (p / 10) * 140;
  const tPath = pts.map((q, i) => `${i ? "L" : "M"}${X(q.r)},${Yt(q.t)}`).join(" ");
  const pPath = pts.map((q, i) => `${i ? "L" : "M"}${X(q.r)},${Yp(q.p)}`).join(" ");

  const stages = [
    { n: "Crankshaft", v: `${rpm.toFixed(0)} rpm`, c: "#ef4444" },
    { n: `Primary drive ÷ ${PRIMARY}`, v: `${(rpm / PRIMARY).toFixed(0)} rpm`, c: "#f59e0b" },
    { n: `Gear ${gear} ÷ ${GEARS[gear]}`, v: `${(rpm / PRIMARY / GEARS[gear]).toFixed(0)} rpm`, c: "#10b981" },
    { n: `Sprockets ÷ ${c.final.toFixed(2)}`, v: `${c.wheelRpm.toFixed(0)} rpm`, c: "#0ea5e9" },
    { n: "Rear wheel", v: `${c.kmh.toFixed(0)} km/h`, c: "#a78bfa" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5">
          <h3 className="text-lg font-bold text-white">Gear calculator</h3>
          <p className="mb-4 text-sm text-slate-400">Change engine rpm, gear and sprocket size, and watch speed and pulling force trade places.</p>
          <div className="space-y-3 text-sm text-slate-300">
            <label className="block">
              <span className="flex justify-between"><b>Engine speed</b><span className="font-mono">{rpm} rpm</span></span>
              <input type="range" min={1000} max={8500} step={50} value={rpm} onChange={(e) => setRpm(+e.target.value)} className="w-full accent-amber-400" />
            </label>
            <div className="flex items-center gap-2">
              <b>Gear</b>
              {[1, 2, 3, 4].map((g) => (
                <button key={g} onClick={() => setGear(g)} className={`h-8 w-8 rounded-md border text-sm font-semibold ${gear === g ? "border-amber-400 bg-amber-400 text-slate-900" : "border-slate-600"}`}>
                  {g}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="flex justify-between"><b>Front sprocket</b><span className="font-mono">{front}T</span></span>
                <input type="range" min={12} max={17} value={front} onChange={(e) => setFront(+e.target.value)} className="w-full accent-emerald-400" />
              </label>
              <label>
                <span className="flex justify-between"><b>Rear sprocket</b><span className="font-mono">{rear}T</span></span>
                <input type="range" min={38} max={48} value={rear} onChange={(e) => setRear(+e.target.value)} className="w-full accent-emerald-400" />
              </label>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "Road speed", v: c.kmh.toFixed(0), u: "km/h", d: c.kmh - base.kmh },
              { k: "Wheel torque", v: c.wheelT.toFixed(0), u: "Nm", d: c.wheelT - base.wheelT },
              { k: "Push on road", v: c.F.toFixed(0), u: "N", d: c.F - base.F },
              { k: "Engine power", v: c.ps.toFixed(1), u: "PS", d: 0 },
            ].map((x) => (
              <div key={x.k} className="rounded-xl bg-slate-800/70 p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">{x.k}</div>
                <div className="font-mono text-xl font-bold text-white">
                  {x.v}
                  <span className="ml-1 text-xs font-normal text-slate-400">{x.u}</span>
                </div>
                {Math.abs(x.d) > 0.5 && (
                  <div className={`text-[11px] ${x.d > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {x.d > 0 ? "▲" : "▼"} {Math.abs(x.d).toFixed(0)} vs stock 14/42
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-lg bg-slate-950/60 p-3 text-[13px] text-slate-300">
            💡 <b>Sprocket tuning:</b> a bigger rear (or smaller front) sprocket gives stronger pickup and hill-climbing but lowers top speed. Riders carrying pillions or luggage in hilly areas often go +1–2 teeth at the rear. Always change the chain with it.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5">
          <h3 className="text-lg font-bold text-white">Where does the power go?</h3>
          <div className="mt-3 space-y-2">
            {stages.map((s, i) => (
              <div key={s.n} className="flex items-center gap-3">
                <div className="flex h-12 flex-1 items-center justify-between rounded-lg border px-3" style={{ borderColor: s.c + "88", background: s.c + "14" }}>
                  <span className="text-sm font-semibold text-slate-100">{s.n}</span>
                  <span className="font-mono text-sm" style={{ color: s.c }}>{s.v}</span>
                </div>
                {i < stages.length - 1 && <span className="text-slate-600">⬇</span>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Overall reduction = primary {PRIMARY} × gear {GEARS[gear]} × final {c.final.toFixed(2)} = <b className="text-slate-200">{c.overall.toFixed(1)} : 1</b>. Torque is multiplied by that number (minus ≈10% losses); speed is divided by it.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-1">Gear</th><th>Ratio</th><th>Speed at 7,500 rpm</th><th>Best for</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map((g) => (
                  <tr key={g} className={g === gear ? "bg-amber-400/10" : ""}>
                    <td className="py-1 font-bold">{g}</td>
                    <td>{(PRIMARY * GEARS[g] * (rear / front)).toFixed(1)}:1</td>
                    <td>{calc(7500, g, front, rear).kmh.toFixed(0)} km/h</td>
                    <td className="text-slate-400">{["Starting, steep slopes, heavy load", "City crawl, 20–40 km/h", "Open roads, overtaking", "Relaxed cruise, best mileage"][g - 1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,430px)_1fr]">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4">
          <h3 className="text-sm font-bold text-white">Engine torque &amp; power curve (110 cc)</h3>
          <svg viewBox="0 0 400 210" className="mt-2 w-full">
            <line x1="40" y1="170" x2="375" y2="170" stroke="#475569" />
            <line x1="40" y1="170" x2="40" y2="20" stroke="#475569" />
            {[2000, 4000, 6000, 8000].map((r) => (
              <g key={r}>
                <line x1={X(r)} x2={X(r)} y1="170" y2="174" stroke="#64748b" />
                <text x={X(r)} y="188" fill="#94a3b8" fontSize="10" textAnchor="middle">{r}</text>
              </g>
            ))}
            <text x="205" y="204" fill="#94a3b8" fontSize="10" textAnchor="middle">engine rpm</text>
            <path d={tPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
            <path d={pPath} fill="none" stroke="#22d3ee" strokeWidth="2.5" />
            <line x1={X(rpm)} x2={X(rpm)} y1="20" y2="170" stroke="#e2e8f0" strokeDasharray="4 3" />
            <circle cx={X(rpm)} cy={Yt(c.T)} r="4.5" fill="#f59e0b" />
            <circle cx={X(rpm)} cy={Yp(c.ps)} r="4.5" fill="#22d3ee" />
            <text x="50" y="30" fill="#f59e0b" fontSize="11">torque (Nm) · {c.T.toFixed(1)}</text>
            <text x="50" y="44" fill="#22d3ee" fontSize="11">power (PS) · {c.ps.toFixed(1)}</text>
          </svg>
        </div>
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5 text-sm text-slate-300">
          <h3 className="mb-2 text-lg font-bold text-white">Torque vs power, in plain words</h3>
          <ul className="list-disc space-y-1.5 pl-5">
            <li><b>Torque</b> is the twisting force: what pushes you off the line and up a slope. Our engine peaks at ≈ 8.7 Nm near 5,500 rpm: a flat, friendly commuter curve.</li>
            <li><b>Power = torque × rpm</b> (P = T × ω). It rises with rpm even after torque flattens, to ≈ 8 PS at 7,500 rpm: it decides top speed.</li>
            <li>A gearbox lets a small engine act like a big one: in 1st gear (ratio {(PRIMARY * GEARS[1] * FINAL).toFixed(1)}:1) 8.7 Nm at the crank becomes ≈ {(8.7 * PRIMARY * GEARS[1] * FINAL * 0.9).toFixed(0)} Nm at the wheel.</li>
            <li>Rev-limiter, redline and the end of the power curve are why you shift up around 6,000–7,000 rpm.</li>
            <li><b>Mileage tip:</b> the engine is most efficient at low rpm with moderate throttle. Shift up early (3,000–5,000 rpm), don't lug below ~2,500 rpm in top gear.</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">Stock final drive here: {FINAL}:1 (14T / 42T). Values are representative for a 110 cc commuter and rounded for learning.</p>
        </div>
      </div>
    </div>
  );
}
