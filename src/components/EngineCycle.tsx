import { useEffect, useRef, useState } from "react";

const R = 30;
const L = 90;
const CX = 200;
const CY = 370;
const HEAD_TOP = 218;

const STROKES = [
  {
    name: "1 · Intake (suck)",
    color: "#7cc4ff",
    from: 0,
    to: 180,
    piston: "Moves DOWN",
    valves: "Intake OPEN · Exhaust closed",
    text: "The piston descends, creating a partial vacuum. The intake valve opens and atmospheric pressure pushes air + petrol mist from the carburettor into the cylinder.",
    fault: "Clogged air filter or carb → not enough mix gets in. Valve clearance too tight → valve never seats.",
  },
  {
    name: "2 · Compression (squeeze)",
    color: "#4d6bff",
    from: 180,
    to: 360,
    piston: "Moves UP",
    valves: "Both CLOSED",
    text: "Both valves close. The piston rises and squeezes the mixture to about 1/9th of its volume, which heats it and makes it explosive. The spark fires just before the top (≈ 20–25° BTDC).",
    fault: "Worn rings or burnt valve → gas leaks past → low compression, hard start, weak pickup.",
  },
  {
    name: "3 · Power (bang)",
    color: "#ff9a2e",
    from: 360,
    to: 540,
    piston: "Pushed DOWN by gas",
    valves: "Both CLOSED",
    text: "The mixture burns in about 2 ms; pressure rockets to ~50 bar and shoves the piston down. This is the only stroke that delivers power to the crank.",
    fault: "No spark (plug, coil, CDI) or a rich or lean mixture → misfire, no power.",
  },
  {
    name: "4 · Exhaust (blow)",
    color: "#9aa0a8",
    from: 540,
    to: 720,
    piston: "Moves UP",
    valves: "Exhaust OPEN · Intake closed",
    text: "The exhaust valve opens and the rising piston pushes the burnt gas out through the silencer. Then the cycle repeats: two full crank turns per power stroke.",
    fault: "Choked silencer or exhaust leak → power loss, popping, heat.",
  },
];

function strokeOf(phi: number) {
  return STROKES.find((s) => phi >= s.from && phi < s.to) ?? STROKES[0];
}

function geometry(phi: number) {
  const th = ((phi % 360) * Math.PI) / 180;
  const y = R * Math.cos(th) + Math.sqrt(L * L - R * R * Math.sin(th) ** 2);
  const pinY = CY - y;
  const crown = pinY - 24;
  const h = crown - HEAD_TOP;
  return { th, y, pinY, crown, h, px: CX + R * Math.sin(th), py: CY - R * Math.cos(th) };
}

function pressure(phi: number): number {
  const vBdc = 68;
  const v = (p: number) => geometry(p).h;
  if (phi < 180) return 0.9;
  if (phi < 360) return 0.9 * Math.pow(vBdc / v(phi), 1.35);
  const pc = 0.9 * Math.pow(vBdc / 8, 1.35);
  const peak = 46;
  if (phi < 375) return pc + (peak - pc) * ((phi - 360) / 15);
  if (phi < 520) return peak * Math.pow(v(375) / v(phi), 1.3);
  if (phi < 545) {
    const p520 = peak * Math.pow(v(375) / v(520), 1.3);
    return p520 + (1.2 - p520) * ((phi - 520) / 25);
  }
  return 1.2;
}

const PV: [number, number][] = Array.from({ length: 361 }, (_, i) => {
  const phi = i * 2;
  return [geometry(phi).h, pressure(phi)];
});

function valveLift(phi: number) {
  const i = (phi + 10) % 720;
  const e = (phi - 530 + 720) % 720;
  return {
    intake: i < 200 ? Math.sin((Math.PI * i) / 200) : 0,
    exhaust: e < 200 ? Math.sin((Math.PI * e) / 200) : 0,
  };
}

export default function EngineCycle() {
  const [phi, setPhi] = useState(30);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const last = useRef(0);
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    let raf = 0;
    const tick = (t: number) => {
      const dt = last.current ? (t - last.current) / 1000 : 0;
      last.current = t;
      setPhi((p) => (p + dt * 90 * speed) % 720);
      raf = requestAnimationFrame(tick);
    };
    last.current = 0;
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, visible]);

  const st = strokeOf(phi);
  const g = geometry(phi);
  const vl = valveLift(phi);
  const spark = phi > 338 && phi < 375;
  const p = pressure(phi);
  const gasColor =
    phi < 180 ? "#7cc4ff" : phi < 360 ? "#3b5bff" : phi < 540 ? (phi < 440 ? "#ffb347" : "#ff7a2e") : "#8a9099";

  // P-V plot
  const px = (v: number) => 30 + ((v - 6) / 66) * 240;
  const py = (pr: number) => 190 - (pr / 50) * 170;
  const path = PV.map((q, i) => `${i ? "L" : "M"}${px(q[0]).toFixed(1)},${py(q[1]).toFixed(1)}`).join(" ");

  return (
    <div ref={wrap} className="grid gap-6 lg:grid-cols-[minmax(0,460px)_1fr]">
      <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-3">
        <svg viewBox="0 0 400 430" className="w-full">
          {/* intake & exhaust ducts */}
          <path d="M178 150 L178 120 Q178 100 150 100 L40 100 L40 130 L140 130 Q150 130 150 150 L150 218" fill="none" stroke="#475569" strokeWidth="3" />
          <path d="M222 150 L222 120 Q222 100 250 100 L360 100 L360 130 L260 130 Q250 130 250 150 L250 218" fill="none" stroke="#475569" strokeWidth="3" />
          <text x="40" y="92" fill="#7cc4ff" fontSize="11">INTAKE ← from carburettor</text>
          <text x="258" y="92" fill="#9aa0a8" fontSize="11">EXHAUST → to silencer</text>
          {vl.intake > 0.05 && [0, 1, 2].map((k) => (
            <text key={k} x={60 + ((phi * 1.5 + k * 40) % 110)} y="119" fill="#7cc4ff" fontSize="14">➜</text>
          ))}
          {vl.exhaust > 0.05 && [0, 1, 2].map((k) => (
            <text key={k} x={260 + ((phi * 1.5 + k * 40) % 90)} y="119" fill="#aab0b8" fontSize="14">➜</text>
          ))}

          {/* head + cylinder */}
          <rect x="150" y="150" width="100" height={HEAD_TOP - 150} fill="#2a2f3a" stroke="#64748b" strokeWidth="2" />
          <rect x="158" y={HEAD_TOP} width="84" height="130" fill="#0f172a" stroke="none" />
          <path d={`M158 ${HEAD_TOP} V348 M242 ${HEAD_TOP} V348`} stroke="#94a3b8" strokeWidth="5" />
          {[0, 1, 2, 3, 4].map((k) => (
            <g key={k}>
              <rect x="138" y={226 + k * 22} width="14" height="8" fill="#334155" />
              <rect x="248" y={226 + k * 22} width="14" height="8" fill="#334155" />
            </g>
          ))}

          {/* gas */}
          <rect x="161" y={HEAD_TOP} width="78" height={Math.max(0, g.crown - HEAD_TOP)} fill={gasColor} opacity="0.55" />

          {/* valves */}
          {[
            { x: 178, lift: vl.intake, c: "#4dd0e1" },
            { x: 222, lift: vl.exhaust, c: "#ef6c4a" },
          ].map((v) => (
            <g key={v.x}>
              <line x1={v.x} y1={165 + v.lift * 10} x2={v.x} y2={HEAD_TOP + v.lift * 10} stroke="#e2e8f0" strokeWidth="3" />
              <rect x={v.x - 11} y={HEAD_TOP + v.lift * 10 - 2} width="22" height="5" rx="2" fill={v.c} />
              <path d={`M${v.x - 6} 168 l12 6 l-12 6 l12 6 l-12 6`} fill="none" stroke="#cbd5e1" strokeWidth="1.5" transform={`translate(0,${v.lift * 4})`} />
            </g>
          ))}
          {/* spark plug */}
          <rect x="194" y="150" width="12" height="52" fill="#e5e7eb" />
          <rect x="190" y="130" width="20" height="22" fill="#111827" />
          {spark && (
            <g>
              <circle cx="200" cy={HEAD_TOP - 6} r="9" fill="#fde047" opacity="0.9" />
              <text x="215" y={HEAD_TOP - 4} fill="#fde047" fontSize="12">SPARK!</text>
            </g>
          )}

          {/* piston */}
          <rect x="161" y={g.crown} width="78" height="52" fill="#cbd5e1" stroke="#64748b" />
          {[6, 14, 22].map((o) => (
            <line key={o} x1="161" x2="239" y1={g.crown + o} y2={g.crown + o} stroke="#334155" strokeWidth="2" />
          ))}
          <circle cx={CX} cy={g.pinY} r="5" fill="#475569" />

          {/* crank, rod */}
          <circle cx={CX} cy={CY} r="46" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
          <path d={`M${CX} ${CY} L${g.px} ${g.py}`} stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" />
          <line x1={g.px} y1={g.py} x2={CX} y2={g.pinY} stroke="#94a3b8" strokeWidth="9" strokeLinecap="round" />
          <circle cx={g.px} cy={g.py} r="7" fill="#fbbf24" />
          <circle cx={CX} cy={CY} r="9" fill="#e2e8f0" />
          <path d={`M${CX - 30} ${CY + 30} A42 42 0 0 0 ${CX + 30} ${CY + 30}`} fill="none" stroke="#64748b" strokeDasharray="3 4" />
          <text x={CX - 52} y={CY + 66} fill="#94a3b8" fontSize="11">crank turns clockwise ↻</text>
          <text x="262" y="270" fill="#94a3b8" fontSize="11">piston</text>
          <text x="266" y="352" fill="#94a3b8" fontSize="11">con-rod</text>
          <text x="20" y="170" fill="#7cc4ff" fontSize="11">intake valve</text>
          <text x="262" y="170" fill="#ef6c4a" fontSize="11">exhaust valve</text>
          <text x="213" y="145" fill="#e5e7eb" fontSize="11">spark plug</text>
        </svg>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border p-4" style={{ borderColor: st.color + "88", background: st.color + "12" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-lg font-bold" style={{ color: st.color }}>
              {st.name}
            </h4>
            <span className="font-mono text-xs text-slate-400">crank angle {Math.round(phi)}° of 720°</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
            <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-200">Piston: {st.piston}</span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-200">{st.valves}</span>
          </div>
          <p className="mt-2 text-sm text-slate-200">{st.text}</p>
          <p className="mt-2 text-[13px] text-rose-300/90">
            <b>If this goes wrong:</b> {st.fault}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-900/70 p-3 text-xs text-slate-300">
          <button onClick={() => setPlaying((x) => !x)} className="rounded-md bg-amber-400 px-3 py-1.5 font-semibold text-slate-900">
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
          <input
            type="range"
            min={0}
            max={719}
            value={phi}
            onChange={(e) => {
              setPlaying(false);
              setPhi(+e.target.value);
            }}
            className="min-w-[160px] flex-1 accent-amber-400"
          />
          {[0.25, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded-md border px-2 py-1 ${speed === s ? "border-amber-400 text-amber-300" : "border-slate-600"}`}
            >
              {s}×
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-[300px_1fr]">
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-2">
            <div className="px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pressure vs volume (P-V)</div>
            <svg viewBox="0 0 300 220" className="w-full">
              <line x1="30" y1="190" x2="285" y2="190" stroke="#475569" />
              <line x1="30" y1="190" x2="30" y2="10" stroke="#475569" />
              <text x="150" y="212" fill="#94a3b8" fontSize="10" textAnchor="middle">Volume →</text>
              <text x="6" y="100" fill="#94a3b8" fontSize="10" transform="rotate(-90 10 100)">Pressure →</text>
              <path d={path} fill="none" stroke="#64748b" strokeWidth="1.5" />
              <circle cx={px(g.h)} cy={py(p)} r="6" fill={st.color} stroke="#fff" />
              <text x="190" y="30" fill="#ff9a2e" fontSize="10">power stroke</text>
              <text x="60" y="138" fill="#4d6bff" fontSize="10">compression</text>
              <text x="170" y="180" fill="#9aa0a8" fontSize="10">intake / exhaust</text>
            </svg>
            <div className="px-1 pb-1 text-[11px] text-slate-400">
              Now: <b className="text-slate-200">{p.toFixed(1)} bar</b>. The area inside the loop is the useful work each cycle.
            </div>
          </div>
          <div className="text-sm text-slate-300">
            <h5 className="mb-1 font-semibold text-white">Remember it as</h5>
            <p className="rounded-lg bg-slate-900/70 p-3 text-center text-lg font-bold text-amber-300">Suck · Squeeze · Bang · Blow</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] text-slate-400">
              <li>4 strokes = 2 crank turns = 720°. Camshaft turns once per 720° (half crank speed).</li>
              <li>At 6,000 rpm the engine fires 50 times every second.</li>
              <li>The three missing power strokes are covered by the heavy flywheel's momentum.</li>
              <li>Valve timing and spark timing are why the chain/ cam timing marks must be aligned during repair.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
