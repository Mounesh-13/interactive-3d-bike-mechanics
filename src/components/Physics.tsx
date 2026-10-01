import { useMemo, useState } from "react";
import type { ReactNode } from "react";

const G = 9.81;
const M = 175;

function Card({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mb-4 text-sm text-slate-400">{sub}</p>
      {children}
    </div>
  );
}

function Slider({ label, value, unit, min, max, step = 1, onChange, accent = "accent-amber-400" }: { label: string; value: number; unit: string; min: number; max: number; step?: number; onChange: (v: number) => void; accent?: string }) {
  return (
    <label className="block text-sm text-slate-300">
      <span className="flex justify-between">
        <b>{label}</b>
        <span className="font-mono">
          {value} {unit}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className={`w-full ${accent}`} />
    </label>
  );
}

/* ───────── 1. lean ───────── */
function Lean() {
  const [kmh, setKmh] = useState(40);
  const [rad, setRad] = useState(30);
  const [surf, setSurf] = useState(0.8);
  const v = kmh / 3.6;
  const phi = Math.atan((v * v) / (G * rad));
  const deg = (phi * 180) / Math.PI;
  const mu = Math.tan(phi);
  const risk = mu / surf;
  const status = risk < 0.6 ? ["Comfortable", "text-emerald-400"] : risk < 0.85 ? ["Near the limit", "text-amber-400"] : ["Slide! Slow down", "text-rose-400"];
  const a = (-phi * 180) / Math.PI;
  return (
    <Card title="1 · Why a bike leans in a turn" sub="To turn, you need a sideways force toward the centre of the curve. The road's friction supplies it, and leaning keeps the forces balanced through your centre of gravity.">
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <svg viewBox="0 0 200 190" className="w-full rounded-xl bg-slate-950/70">
          <line x1="10" y1="170" x2="190" y2="170" stroke="#475569" strokeWidth="3" />
          <g transform={`rotate(${a} 100 170)`}>
            <rect x="97" y="80" width="6" height="90" rx="3" fill="#94a3b8" />
            <circle cx="100" cy="62" r="13" fill="#f59e0b" />
            <rect x="90" y="75" width="20" height="40" rx="8" fill="#ef4444" />
            <rect x="94" y="150" width="12" height="20" rx="3" fill="#111" />
            <circle cx="100" cy="110" r="4" fill="#22d3ee" />
          </g>
          <text x="104" y="30" fill="#e2e8f0" fontSize="20" fontWeight="700">{deg.toFixed(0)}°</text>
          <text x="104" y="44" fill="#94a3b8" fontSize="10">lean angle</text>
        </svg>
        <div className="space-y-3">
          <Slider label="Speed" value={kmh} unit="km/h" min={10} max={100} onChange={setKmh} />
          <Slider label="Curve radius" value={rad} unit="m" min={8} max={150} onChange={setRad} accent="accent-sky-400" />
          <div className="flex gap-1.5 text-xs">
            {[["Dry tar", 0.8], ["Wet road", 0.45], ["Sand / gravel", 0.28]].map(([n, m]) => (
              <button key={n} onClick={() => setSurf(m as number)} className={`rounded-md border px-2 py-1 ${surf === m ? "border-amber-400 text-amber-300" : "border-slate-600 text-slate-300"}`}>
                {n}
              </button>
            ))}
          </div>
          <div className="rounded-lg bg-slate-950/60 p-3 text-sm">
            <div className="font-mono text-slate-200">tan θ = v² / (g · r) → θ = {deg.toFixed(1)}°</div>
            <div className="text-slate-400">Friction needed ≈ {mu.toFixed(2)} · tyre grip available ≈ {surf}</div>
            <div className={`font-semibold ${status[1]}`}>{status[0]}</div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[13px] text-slate-400">
        Double your speed and the lean needed in the same curve becomes ~4× the tangent. That is why a speed that felt fine at 30 km/h can throw you off at 60. On wet or sandy roads the same lean is already past the limit; brake <i>before</i> the curve, not in it.
      </p>
    </Card>
  );
}

/* ───────── 2. steering stability ───────── */
function Steering() {
  return (
    <Card title="2 · Why a bike stays upright" sub="A rolling bike balances itself. Three effects help, and none of them is mainly the 'gyroscope'.">
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <svg viewBox="0 0 200 200" className="w-full rounded-xl bg-slate-950/70">
          <circle cx="110" cy="115" r="62" fill="none" stroke="#64748b" strokeWidth="6" />
          <line x1="20" y1="177" x2="190" y2="177" stroke="#475569" strokeWidth="2" />
          <line x1="72" y1="12" x2="130" y2="177" stroke="#fbbf24" strokeWidth="3" strokeDasharray="5 3" />
          <line x1="110" y1="115" x2="72" y2="12" stroke="#cbd5e1" strokeWidth="5" />
          <circle cx="110" cy="115" r="5" fill="#e2e8f0" />
          <line x1="110" y1="177" x2="130" y2="177" stroke="#f43f5e" strokeWidth="5" />
          <text x="108" y="192" fill="#f43f5e" fontSize="10">trail ≈ 95 mm</text>
          <text x="86" y="44" fill="#fbbf24" fontSize="10">steering axis</text>
          <path d="M72 70 L72 90" stroke="#94a3b8" />
          <text x="40" y="100" fill="#94a3b8" fontSize="10">rake 26°</text>
        </svg>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
          <li><b className="text-amber-300">Trail (caster effect):</b> the steering axis hits the ground <i>ahead</i> of where the tyre touches. The tyre therefore trails behind like a shopping-trolley wheel, and when the bike starts to fall left, the wheel automatically steers left, back under the fall.</li>
          <li><b className="text-amber-300">Steering geometry (rake 26°, trail ≈ 95 mm):</b> sets how eager or lazy the bike feels. A bent fork changes both: the bike starts pulling to one side.</li>
          <li><b className="text-amber-300">Gyroscopic effect:</b> a spinning front wheel resists tilting (angular momentum L = I·ω). A wheel of ~0.2 kg·m² at 60 km/h has L ≈ 10 kg·m²/s. That helps a little, but experiments show bikes balance even with the gyro cancelled.</li>
          <li><b className="text-amber-300">Counter-steering:</b> to turn right at speed, you briefly push the right grip <i>forward</i>. The wheel points left, the bike falls to the right and the curve begins. You already do this without noticing.</li>
          <li><b className="text-amber-300">Speed helps:</b> above ~15–20 km/h the self-stability is strong. At walking pace you must balance with the handlebar.</li>
        </ul>
      </div>
    </Card>
  );
}

/* ───────── 3. weight transfer ───────── */
function Transfer() {
  const [a, setA] = useState(0);
  const L = 1.23;
  const dr = 0.65;
  const df = L - dr;
  const h = 0.62;
  const nf = (M * (G * dr - a * h)) / L;
  const nr = (M * (G * df + a * h)) / L;
  const total = M * G;
  const pf = Math.max(0, Math.min(100, (nf / total) * 100));
  const pr = Math.max(0, Math.min(100, (nr / total) * 100));
  const note =
    a < -6.5
      ? "Front tyre carries almost all the weight; the rear wheel is nearly light and will lock easily. Use both brakes smoothly."
      : a < -2
        ? "Braking: weight moves forward, so the front brake can do most of the work (≈ 70–80%)."
        : a > 3
          ? "Hard acceleration: weight moves to the rear; the front gets light (wheelie territory)."
          : "Cruising: about 47% on the front, 53% on the rear.";
  return (
    <Card title="3 · Weight transfer: why the front brake matters" sub="Your centre of gravity is high (≈ 62 cm) compared to the short wheelbase (123 cm). Braking pitches load onto the front tyre.">
      <Slider label="Acceleration (negative = braking)" value={a} unit="m/s²" min={-9} max={5} step={0.1} onChange={setA} accent="accent-rose-400" />
      <div className="mt-4 grid grid-cols-2 gap-4">
        {[["Front tyre load", nf, pf, "#22d3ee"], ["Rear tyre load", nr, pr, "#f59e0b"]].map(([n, N, p, c]) => (
          <div key={n as string}>
            <div className="mb-1 flex justify-between text-xs text-slate-300">
              <span>{n as string}</span>
              <span className="font-mono">{Math.max(0, N as number).toFixed(0)} N · {(p as number).toFixed(0)}%</span>
            </div>
            <div className="h-5 overflow-hidden rounded bg-slate-800">
              <div className="h-full" style={{ width: p + "%", background: c as string }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-lg bg-slate-950/60 p-3 text-[13px] text-slate-300">{note}</p>
      <p className="mt-2 text-[12px] text-slate-500">N<sub>front</sub> = m (g·d<sub>rear</sub> − a·h) / L &nbsp;·&nbsp; N<sub>rear</sub> = m (g·d<sub>front</sub> + a·h) / L. Bike + rider ≈ 175 kg.</p>
    </Card>
  );
}

/* ───────── 4. braking ───────── */
function Braking() {
  const [kmh, setKmh] = useState(50);
  const [mu, setMu] = useState(0.7);
  const [rt, setRt] = useState(0.8);
  const v = kmh / 3.6;
  const react = v * rt;
  const brake = (v * v) / (2 * mu * 0.9 * G);
  const total = react + brake;
  const max = 70;
  return (
    <Card title="4 · Stopping distance" sub="Reaction time + braking. The braking part grows with the SQUARE of speed because kinetic energy = ½ m v².">
      <div className="space-y-3">
        <Slider label="Speed" value={kmh} unit="km/h" min={20} max={100} onChange={setKmh} />
        <Slider label="Reaction time" value={rt} unit="s" min={0.4} max={1.6} step={0.1} onChange={setRt} accent="accent-sky-400" />
        <div className="flex gap-1.5 text-xs">
          {[["Dry", 0.7], ["Wet", 0.4], ["Sand / oil", 0.25]].map(([n, m]) => (
            <button key={n} onClick={() => setMu(m as number)} className={`rounded-md border px-2 py-1 ${mu === m ? "border-amber-400 text-amber-300" : "border-slate-600 text-slate-300"}`}>
              {n} (μ {m})
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <div className="flex h-7 overflow-hidden rounded bg-slate-800 text-[11px] font-semibold text-slate-900">
          <div className="flex items-center justify-center bg-sky-400" style={{ width: Math.min(100, (react / max) * 100) + "%" }}>{react.toFixed(0)} m</div>
          <div className="flex items-center justify-center bg-rose-400" style={{ width: Math.min(100 - (react / max) * 100, (brake / max) * 100) + "%" }}>{brake.toFixed(0)} m</div>
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-slate-500"><span>0</span><span>{max} m scale</span></div>
      </div>
      <div className="mt-2 text-sm text-slate-200">
        Total stopping distance: <b className="font-mono text-amber-300">{total.toFixed(1)} m</b> <span className="text-slate-400">(≈ {(total / 2).toFixed(0)} bike lengths)</span>
      </div>
      <p className="mt-2 text-[13px] text-slate-400">
        <span className="text-sky-300">Blue</span> = distance travelled before you even touch the brake. <span className="text-rose-300">Red</span> = braking. Worn shoes, wrong free-play or low tyre pressure all lengthen the red part.
      </p>
    </Card>
  );
}

/* ───────── 5. suspension ───────── */
function stepResponse(zeta: number) {
  const wn = 2 * Math.PI * 1.6;
  const dt = 0.002;
  let z = 0;
  let vz = 0;
  const out: [number, number][] = [];
  for (let t = 0; t <= 1.5; t += dt) {
    const acc = wn * wn * (1 - z) - 2 * zeta * wn * vz;
    vz += acc * dt;
    z += vz * dt;
    if (Math.round(t / dt) % 5 === 0) out.push([t, z]);
  }
  return out;
}
function Suspension() {
  const [zeta, setZeta] = useState(0.35);
  const curve = useMemo(() => stepResponse(zeta), [zeta]);
  const px = (t: number) => 30 + (t / 1.5) * 250;
  const py = (z: number) => 160 - z * 85;
  const d = curve.map((q, i) => `${i ? "L" : "M"}${px(q[0])},${py(q[1])}`).join(" ");
  const label = zeta < 0.2 ? "Under-damped: bouncy, like a worn shock" : zeta < 0.55 ? "Slightly under-damped: comfortable, one small overshoot" : zeta < 1.1 ? "Near-critical: settles fast, firm" : "Over-damped: slow, harsh, wheel can't follow bumps";
  return (
    <Card title="5 · Suspension: spring + damper" sub="Hit a step (like a speed breaker edge). The spring pushes back; the damper (oil forced through tiny holes) removes the energy so it doesn't keep bouncing.">
      <svg viewBox="0 0 300 190" className="w-full rounded-xl bg-slate-950/70">
        <line x1="30" y1="160" x2="285" y2="160" stroke="#475569" />
        <line x1="30" y1={py(1)} x2="285" y2={py(1)} stroke="#475569" strokeDasharray="4 4" />
        <text x="34" y={py(1) - 4} fill="#64748b" fontSize="10">bump height</text>
        <text x="150" y="182" fill="#94a3b8" fontSize="10" textAnchor="middle">time →</text>
        <path d={d} fill="none" stroke="#a78bfa" strokeWidth="3" />
      </svg>
      <div className="mt-3">
        <Slider label="Damping ratio ζ" value={zeta} unit="" min={0.05} max={1.5} step={0.05} onChange={setZeta} accent="accent-violet-400" />
        <p className="mt-2 text-sm text-violet-300">{label}</p>
      </div>
      <p className="mt-2 text-[13px] text-slate-400">
        This is exactly what the 3D bike does when you ride over the speed breaker. Leaking shock oil means ζ → 0 (pogo-stick); a too-stiff preload makes the ride harsh. <b>Bounce test:</b> push down on the seat and release. It should rise once and settle.
      </p>
    </Card>
  );
}

/* ───────── 6. power / top speed ───────── */
function TopSpeed() {
  const [kmh, setKmh] = useState(60);
  const [pillion, setPillion] = useState(false);
  const mass = pillion ? 245 : M;
  const cda = pillion ? 0.75 : 0.65;
  const need = (vk: number) => {
    const v = vk / 3.6;
    return (0.5 * 1.2 * cda * v ** 3 + 0.02 * mass * G * v) / 0.88 / 735.5;
  };
  let top = 20;
  while (top < 160 && need(top) < 7.4) top += 0.5;
  const X = (k: number) => 36 + ((k - 20) / 100) * 240;
  const Y = (p: number) => 160 - (p / 14) * 140;
  const path = Array.from({ length: 51 }, (_, i) => {
    const k = 20 + i * 2;
    return `${i ? "L" : "M"}${X(k)},${Y(need(k))}`;
  }).join(" ");
  return (
    <Card title="6 · Why a 110 cc bike tops out near 85 km/h" sub="Air drag grows with the CUBE of speed. Power needed = ½ρ·CdA·v³ + rolling resistance × v.">
      <svg viewBox="0 0 300 190" className="w-full rounded-xl bg-slate-950/70">
        <line x1="36" y1="160" x2="285" y2="160" stroke="#475569" />
        <line x1="36" y1="160" x2="36" y2="14" stroke="#475569" />
        <line x1="36" x2="285" y1={Y(7.4)} y2={Y(7.4)} stroke="#22d3ee" strokeDasharray="5 3" />
        <text x="40" y={Y(7.4) - 4} fill="#22d3ee" fontSize="10">engine power at wheel ≈ 7.4 PS</text>
        <path d={path} fill="none" stroke="#f43f5e" strokeWidth="3" />
        <circle cx={X(kmh)} cy={Y(need(kmh))} r="5" fill="#fbbf24" stroke="#fff" />
        <line x1={X(top)} x2={X(top)} y1={Y(7.4)} y2="160" stroke="#10b981" strokeDasharray="3 3" />
        <text x={X(top) - 4} y="174" fill="#10b981" fontSize="10" textAnchor="end">top speed ≈ {top.toFixed(0)}</text>
        <text x="160" y="186" fill="#94a3b8" fontSize="10" textAnchor="middle">speed (km/h) →</text>
      </svg>
      <div className="mt-3 space-y-2">
        <Slider label="Cruise speed" value={kmh} unit="km/h" min={20} max={120} onChange={setKmh} />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={pillion} onChange={(e) => setPillion(e.target.checked)} className="accent-amber-400" /> Carrying a pillion (+70 kg, more drag)
        </label>
        <p className="text-sm text-slate-200">
          At {kmh} km/h you need <b className="font-mono text-amber-300">{need(kmh).toFixed(1)} PS</b> at the engine. Going from 60 → 90 km/h needs about {(need(90) / need(60)).toFixed(1)}× the power, so mileage drops sharply above 60 km/h.
        </p>
      </div>
    </Card>
  );
}

export default function Physics() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Lean />
      <Steering />
      <Transfer />
      <Braking />
      <Suspension />
      <TopSpeed />
    </div>
  );
}
