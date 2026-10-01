import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Bike3D from "../scene/Bike3D";
import type { BikeControls, Telemetry, ViewMode } from "../scene/shared";
import { PARTS, PART_MAP, SYSTEMS } from "../data/parts";
import type { SystemId } from "../data/parts";
import { PartCard } from "./PartCard";

const MODES: { id: ViewMode; label: string; hint: string }[] = [
  { id: "normal", label: "Normal", hint: "How the bike looks" },
  { id: "xray", label: "X-ray", hint: "Body panels turn see-through" },
  { id: "engine", label: "Engine cut-away", hint: "Watch piston, valves and crank work" },
];

const CAMS: { id: string; label: string }[] = [
  { id: "iso", label: "3/4" },
  { id: "right", label: "Right" },
  { id: "left", label: "Left" },
  { id: "front", label: "Front" },
  { id: "rear", label: "Rear" },
  { id: "top", label: "Top" },
  { id: "engine", label: "Engine" },
  { id: "chain", label: "Chain" },
];

const SPEEDS = [
  { v: 0.05, l: "Slow-mo" },
  { v: 0.15, l: "Slow" },
  { v: 0.4, l: "Medium" },
  { v: 1, l: "Real" },
];

const STROKE_COL: Record<string, string> = {
  Intake: "#7cc4ff",
  Compression: "#4d6bff",
  Power: "#ff9a2e",
  Exhaust: "#9aa0a8",
};
const STROKE_TXT: Record<string, string> = {
  Intake: "Piston goes down, intake valve open: fuel-air mix is sucked in.",
  Compression: "Both valves shut, piston rises and squeezes the mixture.",
  Power: "Spark! Burning gas pushes the piston down: this is the only stroke that makes power.",
  Exhaust: "Piston rises, exhaust valve open: burnt gas is pushed out.",
};

interface Props {
  selected: string | null;
  onSelect: (id: string | null) => void;
  /** set by parent when it wants a specific camera preset (e.g. from parts guide) */
  focusSignal: number;
}

function Btn({
  active,
  onClick,
  children,
  title,
  className = "",
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "border-amber-400 bg-amber-400 text-slate-900"
          : "border-slate-600/70 bg-slate-900/70 text-slate-200 hover:border-slate-400"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export default function BikeLab({ selected, onSelect, focusSignal }: Props) {
  const [mode, setMode] = useState<ViewMode>("normal");
  const [explode, setExplode] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [engineOn, setEngineOn] = useState(false);
  const [throttle, setThrottle] = useState(0);
  const [brake, setBrake] = useState(0);
  const [gear, setGear] = useState(0);
  const [clutch, setClutch] = useState(false);
  const [steer, setSteer] = useState(0);
  const [slow, setSlow] = useState(0.15);
  const [bumpToken, setBumpToken] = useState(0);
  const [cam, setCam] = useState({ preset: "iso", token: 0 });
  const [autoRotate, setAutoRotate] = useState(false);
  const [tele, setTele] = useState<Telemetry | null>(null);
  const [notice, setNotice] = useState("Click any part of the bike to learn about it, or press Start and ride!");
  const [group, setGroup] = useState<SystemId | "all">("all");

  const stateRef = useRef({ engineOn, gear, clutch });
  stateRef.current = { engineOn, gear, clutch };

  const controls: BikeControls = {
    mode,
    explode,
    selected,
    engineOn,
    throttle,
    brake,
    gear,
    clutch,
    steer,
    slow,
    bumpToken,
    camPreset: cam.preset,
    camToken: cam.token,
    autoRotate,
  };

  const goCam = useCallback((preset: string) => setCam((c) => ({ preset, token: c.token + 1 })), []);

  // parent asks us to focus on the selected part: zoom in a bit
  useEffect(() => {
    if (focusSignal === 0) return;
    if (selected && PART_MAP[selected]?.system === "engine") goCam("engine");
    else goCam("iso");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSignal]);

  const handleTele = useCallback((t: Telemetry) => setTele(t), []);
  const handleStall = useCallback((msg: string) => {
    setEngineOn(false);
    setNotice("🛑 " + msg);
  }, []);

  const start = (kind: "self" | "kick") => {
    const s = stateRef.current;
    if (s.engineOn) return setNotice("Engine is already running.");
    if (s.gear > 0 && !s.clutch) {
      return setNotice("⚠️ The bike is in gear. Pull the clutch (hold C) or shift to Neutral, then start it.");
    }
    setEngineOn(true);
    setNotice(
      kind === "self"
        ? "✅ Self-start: relay clicked, starter motor spun the crank, engine fired. Idle ≈ 1,400 rpm."
        : "✅ Kick start: you spun the crank by foot; spark + fuel did the rest.",
    );
  };

  const shift = (g: number) => {
    const s = stateRef.current;
    if (g === s.gear) return;
    if (!s.clutch && s.engineOn && (tele?.speed ?? 0) > 2) {
      setNotice("⚠️ Shifted without the clutch: that's a gearbox crunch in real life. Pull the clutch first!");
    } else {
      setNotice(g === 0 ? "Neutral: engine is disconnected from the wheel." : `Gear ${g} selected.`);
    }
    setGear(g);
  };

  // keyboard riding
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && (t as HTMLInputElement).type === "text"))) return;
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setThrottle(1);
          break;
        case "ArrowDown":
          e.preventDefault();
          setBrake(1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          setSteer(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          setSteer(1);
          break;
        case "c":
        case "C":
          setClutch(true);
          break;
      }
    };
    const up = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          setThrottle(0);
          break;
        case "ArrowDown":
          setBrake(0);
          break;
        case "ArrowLeft":
        case "ArrowRight":
          setSteer(0);
          break;
        case "c":
        case "C":
          setClutch(false);
          break;
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const part = selected ? PART_MAP[selected] : null;
  const speed = tele?.speed ?? 0;
  const rpm = tele?.rpm ?? 0;
  const rpmPct = Math.min(100, (rpm / 9000) * 100);
  const hoveredName = hovered ? PART_MAP[hovered]?.name : null;
  const list3d = PARTS.filter((p) => !p.ref3d && (group === "all" || p.system === group));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
      {/* ───── left: canvas + controls ───── */}
      <div className="space-y-3">
        <div className="relative h-[520px] overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950 shadow-2xl md:h-[640px]">
          <Bike3D
            controls={controls}
            onSelect={onSelect}
            onHover={setHovered}
            onTelemetry={handleTele}
            onStall={handleStall}
          />

          {/* mode switch */}
          <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
            <div className="pointer-events-auto flex flex-wrap gap-1 rounded-lg bg-slate-950/70 p-1 backdrop-blur">
              {MODES.map((m) => (
                <Btn key={m.id} active={mode === m.id} onClick={() => { setMode(m.id); if (m.id === "engine") goCam("engine"); }} title={m.hint}>
                  {m.label}
                </Btn>
              ))}
            </div>
          </div>

          {/* camera */}
          <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-end gap-2">
            <div className="pointer-events-auto flex max-w-[260px] flex-wrap justify-end gap-1 rounded-lg bg-slate-950/70 p-1 backdrop-blur">
              {CAMS.map((c) => (
                <Btn key={c.id} active={cam.preset === c.id} onClick={() => goCam(c.id)}>
                  {c.label}
                </Btn>
              ))}
              <Btn active={autoRotate} onClick={() => setAutoRotate((a) => !a)} title="Auto-rotate">
                ⟳
              </Btn>
            </div>
          </div>

          {/* engine stroke banner */}
          {mode !== "normal" && (
            <div className="pointer-events-none absolute left-1/2 top-16 w-[min(92%,460px)] -translate-x-1/2 rounded-xl border border-slate-600/60 bg-slate-950/80 p-2.5 text-center backdrop-blur">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: STROKE_COL[tele?.stroke ?? "Intake"] }} />
                <span style={{ color: STROKE_COL[tele?.stroke ?? "Intake"] }}>{tele?.stroke ?? "Intake"} stroke</span>
                <span className="font-mono text-xs text-slate-400">{Math.round(tele?.phase ?? 0)}° / 720°</span>
              </div>
              <p className="mt-0.5 text-[12px] text-slate-300">{STROKE_TXT[tele?.stroke ?? "Intake"]}</p>
              {!engineOn && mode === "engine" && (
                <p className="text-[11px] text-slate-500">Engine is off: showing a slow demo rotation. Start it to see real rpm.</p>
              )}
            </div>
          )}

          {/* HUD */}
          <div className="pointer-events-none absolute bottom-3 left-3 flex items-end gap-3 rounded-xl bg-slate-950/75 p-3 backdrop-blur">
            <div>
              <div className="font-mono text-4xl font-bold leading-none text-white tabular-nums">
                {speed.toFixed(0)}
                <span className="ml-1 text-xs font-normal text-slate-400">km/h</span>
              </div>
              <div className="mt-2 h-1.5 w-36 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: rpmPct + "%",
                    background: rpm > 7800 ? "#ef4444" : rpm > 6000 ? "#f59e0b" : "#22c55e",
                  }}
                />
              </div>
              <div className="mt-1 font-mono text-[11px] text-slate-400">
                {rpm.toFixed(0)} rpm · {engineOn ? "ON" : "OFF"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
              <span>Gear</span>
              <b className="text-right text-white">{gear === 0 ? "N" : gear}</b>
              <span>Lean</span>
              <b className="text-right text-white">{Math.abs(tele?.lean ?? 0).toFixed(0)}°</b>
              <span>Fork</span>
              <b className="text-right text-white">{(tele?.fork ?? 0).toFixed(0)} mm</b>
              <span>Shock</span>
              <b className="text-right text-white">{(tele?.shock ?? 0).toFixed(0)} mm</b>
            </div>
          </div>

          {/* hover chip */}
          <div className="pointer-events-none absolute bottom-3 right-3 max-w-[45%] rounded-lg bg-slate-950/75 px-3 py-2 text-xs text-slate-300 backdrop-blur">
            {hoveredName ? (
              <>
                <span className="text-amber-300">{hoveredName}</span>
                <span className="text-slate-500"> · click for details</span>
              </>
            ) : (
              <span className="text-slate-500">Drag to rotate · scroll to zoom · click a part</span>
            )}
          </div>
        </div>

        {/* explode slider */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-xs text-slate-300">
          <span className="font-semibold text-slate-100">💥 Exploded view</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={explode}
            onChange={(e) => setExplode(+e.target.value)}
            className="h-1 w-48 accent-amber-400"
          />
          <span className="text-slate-500">pull the bike apart to see each part separately</span>
        </div>

        {/* ride panel */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="mr-2 text-sm font-bold text-white">🏍️ Ride it</h3>
            <Btn onClick={() => start("self")} className="!border-emerald-500/60 !text-emerald-300">
              ⚡ Self start
            </Btn>
            <Btn onClick={() => start("kick")}>🦶 Kick start</Btn>
            <Btn
              onClick={() => {
                setEngineOn(false);
                setNotice("Engine killed (kill switch).");
              }}
              className="!border-rose-500/60 !text-rose-300"
            >
              ■ Kill
            </Btn>
            <span className="mx-1 h-5 w-px bg-slate-700" />
            <button
              onMouseDown={() => setClutch(true)}
              onMouseUp={() => setClutch(false)}
              onMouseLeave={() => setClutch(false)}
              onTouchStart={() => setClutch(true)}
              onTouchEnd={() => setClutch(false)}
              className={`select-none rounded-md border px-2.5 py-1 text-xs font-medium ${
                clutch ? "border-sky-400 bg-sky-400 text-slate-900" : "border-slate-600/70 bg-slate-900/70 text-slate-200"
              }`}
            >
              🤚 Clutch (hold C)
            </button>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((g) => (
                <Btn key={g} active={gear === g} onClick={() => shift(g)}>
                  {g === 0 ? "N" : g}
                </Btn>
              ))}
            </div>
          </div>

          <div className="grid gap-3 text-xs text-slate-300 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 flex justify-between">
                <b className="text-slate-100">Throttle (↑)</b>
                <span className="font-mono">{Math.round(throttle * 100)}%</span>
              </span>
              <input type="range" min={0} max={1} step={0.01} value={throttle} onChange={(e) => setThrottle(+e.target.value)} onPointerUp={(e) => e.currentTarget.blur()} className="w-full accent-emerald-400" />
            </label>
            <label className="block">
              <span className="mb-1 flex justify-between">
                <b className="text-slate-100">Brake (↓)</b>
                <span className="font-mono">{Math.round(brake * 100)}%</span>
              </span>
              <input type="range" min={0} max={1} step={0.01} value={brake} onChange={(e) => setBrake(+e.target.value)} onPointerUp={(e) => e.currentTarget.blur()} className="w-full accent-rose-400" />
            </label>
            <label className="block">
              <span className="mb-1 flex justify-between">
                <b className="text-slate-100">Steer (← →)</b>
                <span className="font-mono">{steer < -0.05 ? "◀ left" : steer > 0.05 ? "right ▶" : "straight"}</span>
              </span>
              <input type="range" min={-1} max={1} step={0.01} value={steer} onChange={(e) => setSteer(+e.target.value)} onPointerUp={(e) => e.currentTarget.blur()} className="w-full accent-sky-400" />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400">Motion speed:</span>
            {SPEEDS.map((s) => (
              <Btn key={s.v} active={slow === s.v} onClick={() => setSlow(s.v)}>
                {s.l}
              </Btn>
            ))}
            <span className="mx-1 h-5 w-px bg-slate-700" />
            <Btn
              onClick={() => {
                setBumpToken((t) => t + 1);
                setNotice("🚧 Speed breaker placed ahead. Ride towards it and watch the fork and shocks compress (see Fork / Shock in the HUD).");
              }}
            >
              🚧 Speed breaker
            </Btn>
            <Btn
              onClick={() => {
                setSteer(0);
                setThrottle(0);
                setBrake(0);
              }}
            >
              Reset controls
            </Btn>
          </div>

          <p className="mt-3 rounded-lg bg-slate-950/60 px-3 py-2 text-[13px] text-slate-300">{notice}</p>
          <p className="mt-2 text-[11px] text-slate-500">
            Try: Self start → pull clutch → gear 1 → release clutch while adding throttle → shift up through 2, 3, 4. Then
            steer while riding fast and see the bike lean. Motion speed only slows the visuals; speed and rpm numbers are real.
          </p>
        </div>
      </div>

      {/* ───── right: info panel ───── */}
      <aside className="max-h-[1180px] overflow-y-auto rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 lg:sticky lg:top-16 lg:self-start">
        {part ? (
          <>
            <button
              onClick={() => onSelect(null)}
              className="mb-3 text-xs text-slate-400 hover:text-white"
            >
              ← all parts
            </button>
            <PartCard part={part} />
          </>
        ) : (
          <div>
            <h3 className="text-lg font-bold text-white">Pick a part</h3>
            <p className="mt-1 text-sm text-slate-400">
              Click on the bike, or choose from this list. Every part explains what it does, how it works, how it fails
              and what you can fix yourself.
            </p>
            <div className="my-3 flex flex-wrap gap-1">
              <Btn active={group === "all"} onClick={() => setGroup("all")}>
                All
              </Btn>
              {(Object.keys(SYSTEMS) as SystemId[]).map((s) => (
                <Btn key={s} active={group === s} onClick={() => setGroup(s)}>
                  {SYSTEMS[s].icon} {SYSTEMS[s].label}
                </Btn>
              ))}
            </div>
            <ul className="space-y-1">
              {list3d.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => onSelect(p.id)}
                    onMouseEnter={() => setHovered(p.id)}
                    onMouseLeave={() => setHovered(null)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-800"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SYSTEMS[p.system].color }} />
                    <span className="flex-1">{p.name}</span>
                    <span className="text-xs text-slate-500">{p.hindi.split(" / ")[0]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
