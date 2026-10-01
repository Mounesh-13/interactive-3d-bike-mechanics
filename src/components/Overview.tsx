import { useState } from "react";

const PIPE = [
  { id: "tank", icon: "⛽", t: "Fuel tank + tap", s: "Stores petrol", d: "Petrol flows by gravity through the petcock to the carburettor. About 9–10 L tank; the last 1–1.5 L is the reserve (RES)." },
  { id: "carb", icon: "🌬️", t: "Air filter + carburettor", s: "Mixes air & fuel", d: "The air filter cleans incoming air. The carburettor sprays a fine mist of petrol into it at roughly 15 parts air to 1 part fuel by weight." },
  { id: "cylinder", icon: "🔥", t: "Cylinder + spark", s: "Burns the mix", d: "The piston squeezes the mixture, the spark plug lights it, and the burning gas expands and shoves the piston down with up to ~1 tonne of force." },
  { id: "crankshaft", icon: "🔄", t: "Crankshaft", s: "Makes rotation", d: "The connecting rod pushes on an offset crank pin, turning straight-line push into rotation. The flywheel keeps it spinning smoothly between power strokes." },
  { id: "clutch", icon: "🤚", t: "Clutch", s: "Connect / disconnect", d: "Springs squeeze friction plates together so the engine's rotation passes on. Pull the lever and the plates separate, so you can stop or shift gears." },
  { id: "gearbox", icon: "⚙️", t: "Gearbox", s: "Speed ⇄ pulling power", d: "Gear pairs multiply torque in low gears (strong pull, low speed) and reduce it in high gears (relaxed cruising)." },
  { id: "chain", icon: "⛓️", t: "Chain + sprockets", s: "Final drive 3 : 1", d: "A 14-tooth sprocket drives a 42-tooth sprocket: the rear wheel turns 3× slower but with 3× the torque." },
  { id: "rearwheel", icon: "🛞", t: "Rear wheel", s: "Pushes the road", d: "The tyre pushes backwards against the road with friction; the road pushes the bike forward (Newton's 3rd law)." },
];

const RIDER = [
  { c: "Throttle grip (right hand)", e: "Cable → carburettor slide", r: "More air + fuel → more power", id: "handlebar" },
  { c: "Clutch lever (left hand)", e: "Cable → clutch plates", r: "Engine disconnects from gearbox", id: "clutch" },
  { c: "Gear lever (left foot)", e: "Linkage → shift drum", r: "Picks gear 1-2-3-4 or Neutral", id: "gearlever" },
  { c: "Front brake lever (right hand)", e: "Cable → front drum cam", r: "Shoes rub the drum, speed turns to heat", id: "frontbrake" },
  { c: "Rear brake pedal (right foot)", e: "Rod → rear drum cam", r: "Same, for the rear wheel", id: "rearbrake" },
  { c: "Handlebar", e: "Steering head → fork", r: "Turns the front wheel; lean does the rest", id: "fork" },
];

const ELEC = [
  { t: "Magneto", s: "Spinning magnets make AC", id: "magneto" },
  { t: "Regulator-rectifier", s: "AC → 14 V DC", id: "cdi" },
  { t: "Battery", s: "Stores 12 V for starting", id: "battery" },
  { t: "CDI + coil", s: "12 V → 20,000 V pulse", id: "coil" },
  { t: "Spark plug", s: "Spark jumps 0.7 mm gap", id: "sparkplug" },
];

export default function Overview({ onView3D }: { onView3D: (id: string) => void }) {
  const [i, setI] = useState(2);
  const cur = PIPE[i];
  return (
    <div className="space-y-10">
      <div>
        <h3 className="mb-1 text-xl font-bold text-white">The power path: petrol → motion</h3>
        <p className="mb-4 text-sm text-slate-400">Click each step. Every bike on the road, from a Splendor to a Shine to a Platina, works like this.</p>
        <div className="flex flex-wrap items-stretch gap-2">
          {PIPE.map((p, k) => (
            <div key={p.id} className="flex items-center gap-2">
              <button
                onClick={() => setI(k)}
                className={`w-[118px] rounded-xl border p-2 text-center transition ${
                  k === i ? "border-amber-400 bg-amber-400/10" : "border-slate-700 bg-slate-900/60 hover:border-slate-500"
                }`}
              >
                <div className="text-2xl">{p.icon}</div>
                <div className="text-[12px] font-semibold text-slate-100">{p.t}</div>
                <div className="text-[10px] text-slate-400">{p.s}</div>
              </button>
              {k < PIPE.length - 1 && <span className="text-slate-600">➜</span>}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
          <div className="text-sm font-bold text-amber-300">
            Step {i + 1}: {cur.t}
          </div>
          <p className="mt-1 text-sm text-slate-200">{cur.d}</p>
          <button onClick={() => onView3D(cur.id)} className="mt-3 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-slate-700">
            🔍 Find it on the 3D bike
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/50 p-5">
          <h3 className="text-lg font-bold text-white">⚡ The electrical loop</h3>
          <p className="mb-3 mt-1 text-sm text-slate-400">The engine drives a generator that keeps the battery full. The battery and CDI make the spark that keeps the engine running: a loop.</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {ELEC.map((e, k) => (
              <div key={e.id} className="flex items-center gap-1.5">
                <button onClick={() => onView3D(e.id)} className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-2 py-1.5 text-left hover:border-yellow-400">
                  <div className="text-xs font-semibold text-yellow-200">{e.t}</div>
                  <div className="text-[10px] text-slate-400">{e.s}</div>
                </button>
                {k < ELEC.length - 1 && <span className="text-slate-600">→</span>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Lights, horn and indicators also run from this system. If the battery is dead, a kick start still works because the magneto alone can power the spark once the engine spins.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/50 p-5">
          <h3 className="text-lg font-bold text-white">🎮 What each control does</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {RIDER.map((r) => (
              <li key={r.c} className="flex gap-2">
                <button onClick={() => onView3D(r.id)} className="mt-0.5 shrink-0 text-amber-300 hover:text-amber-200">
                  ◉
                </button>
                <span>
                  <b className="text-slate-100">{r.c}</b>
                  <span className="text-slate-400"> · {r.e} · </span>
                  <span className="text-slate-300">{r.r}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { n: "~30%", t: "of petrol energy becomes motion", d: "The rest leaves as heat (exhaust + fins). That's why air-cooling fins and engine oil matter." },
          { n: "15 : 1", t: "air-to-fuel ratio by weight", d: "About 9,000 L of air burns 1 L of petrol. A dirty air filter wrecks this balance." },
          { n: "~1 tonne", t: "force on the piston at peak", d: "≈ 50 bar × 20 cm². Strong parts, good oil and correct tuning keep it safe." },
          { n: "1 in 4", t: "strokes produce power", d: "Intake, compression, power, exhaust: only one pushes. The flywheel carries you through the rest." },
        ].map((x) => (
          <div key={x.n} className="rounded-2xl border border-slate-700/70 bg-gradient-to-b from-slate-800/60 to-slate-900/60 p-4">
            <div className="text-3xl font-extrabold text-amber-400">{x.n}</div>
            <div className="text-sm font-semibold text-white">{x.t}</div>
            <p className="mt-1 text-xs text-slate-400">{x.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
