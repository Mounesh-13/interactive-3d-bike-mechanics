import { useState } from "react";

const PRE_RIDE = [
  ["⛽ Petrol", "Enough in the tank? Fuel tap on ON. No petrol smell or wet patches."],
  ["🛢️ Engine oil", "Bike upright on flat ground; level between MIN and MAX on the sight glass/dipstick."],
  ["🛞 Tyres", "Pressure (25–28 front / 28–32 rear psi), no nails/cuts, tread above the wear bar."],
  ["⛓️ Chain", "Slack 20–30 mm, not rusty-dry, no tight links. Lube if the rear wheel has flung dust."],
  ["🛑 Brakes", "Lever and pedal bite firmly with 10–30 mm free play. Brake light comes on."],
  ["🤚 Clutch & throttle", "Clutch free play ≈ 10–20 mm; throttle snaps shut when released."],
  ["💡 Lights & horn", "Headlight (low/high), tail lamp, both indicators, horn."],
  ["🔩 Nuts & bolts", "Look for loose mirrors, footpegs, axle nuts and exhaust bolts. Check for oil drips under the bike."],
  ["🪞 Mirrors & seat", "Set mirrors; seat latched; number plate secure."],
  ["🧢 You", "ISI helmet strapped, closed shoes, gloves, documents (RC, insurance, PUC, licence)."],
];

const SCHEDULE: { km: string; items: string[] }[] = [
  { km: "Every ride / weekly", items: ["Tyre pressure", "Engine oil level", "Chain slack", "Lights, horn, brakes", "Petrol & reserve"] },
  { km: "Every 500 km", items: ["Lubricate the chain", "Check the clutch / brake free play"] },
  { km: "Every 1,000 km", items: ["Adjust the chain", "Clean the air filter if dusty", "Check all fasteners"] },
  { km: "Every 3,000–4,000 km", items: ["Change engine oil (and clean the strainer)", "Clean the air filter", "Clean spark plug", "Lube all cables"] },
  { km: "Every 6,000 km", items: ["Valve clearance check", "Clean carburettor / FI throttle body", "Grease swingarm & steering bearings", "Check battery & terminals"] },
  { km: "Every 8,000–10,000 km", items: ["Replace the spark plug", "Inspect brake shoes", "Inspect tyre wear"] },
  { km: "Every 12,000 km", items: ["Replace the air filter element", "Replace fork oil if leaking / every 20,000 km", "Check the cam chain tension"] },
  { km: "Every 20,000–25,000 km", items: ["Chain + both sprockets (replace as a set)", "Brake shoes", "Rear shocks check", "Cush-drive rubbers", "Starter brushes"] },
];

const TOOLS = [
  ["Plug spanner (in toolkit)", "Spark plug removal"],
  ["Spanner set 8–19 mm", "Almost everything: axle, chain adjusters, mirrors"],
  ["Screwdriver set (flat + Philips)", "Carb screws, covers, mirrors"],
  ["Feeler gauge", "Plug gap and valve clearance"],
  ["Tyre pressure gauge + pump", "Weekly pressure check"],
  ["Tyre levers + puncture kit", "Roadside puncture repair"],
  ["Multimeter (₹300–600)", "Battery voltage, fuses, coil resistance: the electrical detective"],
  ["Chain lube + brush", "Chain care every 500 km"],
  ["Pliers + insulation tape + spare bulbs & fuses", "Emergency electrical fixes"],
  ["Spare clutch cable + spare plug", "Carry on long trips"],
  ["Torque wrench (optional)", "Correct tightness on important bolts"],
  ["Gloves + torch + old cloth", "Cleaner, safer work"],
];

const HOWTOS: { t: string; time: string; level: string; steps: string[]; tip: string }[] = [
  {
    t: "Check & adjust chain slack",
    time: "10 min",
    level: "Easy",
    steps: [
      "Put the bike on the centre stand (or side stand with an extra pair of hands). Gear in neutral.",
      "Push the chain up/down at the middle of the lower run. Free movement should be 20–30 mm.",
      "Loosen the rear axle nut a little. Slacken the rear brake rod nut and torque-arm bolt if present.",
      "Turn the adjuster nuts equally on both sides. Use the marks on the swingarm to keep the wheel aligned.",
      "Tighten the axle nut firmly, re-fit the cotter pin if there is one, and re-adjust rear brake free play.",
      "Spin the wheel: the chain should run without tight spots.",
    ],
    tip: "A chain that is tight in one spot has a stiff link; that one needs replacing.",
  },
  {
    t: "Adjust clutch free play",
    time: "5 min",
    level: "Easy",
    steps: [
      "Measure at the lever tip: free play before the clutch starts to disengage should be 10–20 mm.",
      "Slide the rubber boot back on the cable adjuster near the lever.",
      "Loosen the lock-nut and turn the adjuster until the free play is right. Out = less play.",
      "Tighten the lock-nut and refit the boot.",
      "Test: start the engine, pull the lever and select 1st. It should engage without a loud clunk and without creeping.",
    ],
    tip: "If the adjuster runs out of thread, use the second adjuster at the engine end of the cable.",
  },
  {
    t: "Clean / replace the spark plug",
    time: "10 min",
    level: "Easy",
    steps: [
      "Engine cold. Pull the plug cap straight off (don't yank the wire).",
      "Blow away dirt around the plug, then unscrew it with the plug spanner.",
      "Read the tip: light brown is good · black sooty is rich · white is lean · wet oily means oil burning.",
      "Clean with a brass brush; set the gap to 0.7–0.8 mm with the feeler gauge by bending the side electrode.",
      "Thread it in by hand first (to avoid cross-threading), then ¼ turn with the spanner. Push the cap on until it clicks.",
    ],
    tip: "Replace rather than clean if the electrode is rounded or the porcelain is cracked.",
  },
  {
    t: "Change engine oil",
    time: "30 min",
    level: "Easy–Medium",
    steps: [
      "Warm the engine for 2–3 minutes, then switch off. Put the bike on the centre stand over a drain pan.",
      "Remove the filler cap, then the drain plug. Let it drain for 10 minutes.",
      "Remove and wash the oil strainer (mesh) with petrol; check the O-ring.",
      "Fit the strainer, a new drain washer, and tighten the plug (don't over-tighten; it strips aluminium threads).",
      "Add about 0.9 L of JASO MA 10W-30 / 20W-40. Wait a minute, then check the level with the bike upright.",
      "Start the engine for 30 s, stop, and re-check. Look for leaks.",
    ],
    tip: "Take old oil to a collection point: never pour it down a drain.",
  },
  {
    t: "Fix a puncture (tube-type tyre)",
    time: "40 min",
    level: "Medium",
    steps: [
      "Put the bike on the centre stand; remove the wheel (brake, speedo cable, chain slack and axle nut).",
      "Deflate completely, push both tyre beads into the centre of the rim, and lever one side off.",
      "Pull out the tube. Inflate and dip it in water to find the bubbles.",
      "Roughen the area with the buffer, apply rubber solution, wait until tacky, then press the patch on firmly.",
      "Check inside the tyre for the nail or thorn! Run your hand along carefully.",
      "Refit with a little talc on the tube, lever the tyre back, inflate to spec, and refit the wheel. Re-set the chain and the brake.",
    ],
    tip: "Carry a spare tube on long rides; repairing by the roadside is far quicker with a spare.",
  },
  {
    t: "Adjust front and rear brake free play",
    time: "5 min",
    level: "Easy",
    steps: [
      "Front: pull the lever lightly; free movement at the lever tip should be about 10–20 mm.",
      "Turn the wing nut at the wheel-end of the cable to adjust it. Tightening it reduces the play.",
      "Rear: free play at the pedal should be about 20–30 mm; adjust the wing nut at the end of the brake rod.",
      "Spin each wheel; it must turn freely with no drag. Then press the brake and confirm it grips evenly.",
      "Adjust the brake-light switch if the light is late or early.",
    ],
    tip: "Brake lining dust and oil are the usual enemies of weak drum brakes. Keep the chain lube off the drum!",
  },
  {
    t: "Clean the air filter",
    time: "15 min",
    level: "Easy",
    steps: [
      "Open the side cover / air box lid (usually 2–4 screws).",
      "Take out the element. Paper: tap and blow compressed air from the inside out. Foam: wash in soapy water and squeeze (don't twist).",
      "Let foam dry completely, then work in a little engine oil and squeeze out the excess.",
      "Wipe the inside of the air box. Make sure the element seals all around.",
      "Refit the cover. Never run without a filter.",
    ],
    tip: "Black smoke and falling mileage? Look here first.",
  },
];

const SAFETY = [
  "Work on level ground with the engine cold, keys removed. Use the centre stand or a paddock stand.",
  "Never use a spanner on a hot exhaust. Wait 30 minutes.",
  "Petrol is dangerous: no smoking or flames; use a metal container; work outdoors.",
  "Disconnect the battery (negative first) before working on wiring.",
  "Brake and tyre jobs affect your life: if you're not sure, have a mechanic check your work.",
  "Dust from brake shoes is harmful: wipe with a damp cloth, don't blow it.",
  "Specs in this guide are typical. Your owner's manual always has the final value.",
];

export default function Maintenance() {
  const [tab, setTab] = useState<"pre" | "sched" | "tools" | "how" | "safe">("pre");
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [open, setOpen] = useState(0);
  const count = Object.values(checked).filter(Boolean).length;

  const tabs: [typeof tab, string][] = [
    ["pre", "✅ Pre-ride check"],
    ["sched", "📅 Service schedule"],
    ["tools", "🧰 Toolkit"],
    ["how", "🔧 Step-by-step repairs"],
    ["safe", "⚠️ Safety"],
  ];

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1 rounded-xl bg-slate-900 p-1 text-sm">
        {tabs.map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={`rounded-lg px-3 py-2 font-medium ${tab === id ? "bg-amber-400 text-slate-900" : "text-slate-300 hover:text-white"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "pre" && (
        <div className="max-w-3xl">
          <p className="mb-3 text-sm text-slate-400">A 2-minute walk-around before every ride prevents most breakdowns. Tap each item as you check it.</p>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-emerald-400 transition-all" style={{ width: (count / PRE_RIDE.length) * 100 + "%" }} />
          </div>
          <ul className="space-y-2">
            {PRE_RIDE.map(([t, d], i) => (
              <li key={t}>
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${checked[i] ? "border-emerald-500/40 bg-emerald-500/5" : "border-slate-700 bg-slate-900/60"}`}>
                  <input type="checkbox" checked={!!checked[i]} onChange={(e) => setChecked((c) => ({ ...c, [i]: e.target.checked }))} className="mt-1 h-4 w-4 accent-emerald-400" />
                  <span>
                    <span className="font-semibold text-white">{t}</span>
                    <span className="block text-sm text-slate-400">{d}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {count === PRE_RIDE.length && <p className="mt-4 rounded-lg bg-emerald-500/10 p-3 text-emerald-300">🏁 All checked. Ride safe!</p>}
        </div>
      )}

      {tab === "sched" && (
        <div className="grid gap-3 md:grid-cols-2">
          {SCHEDULE.map((s) => (
            <div key={s.km} className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-4">
              <div className="text-sm font-bold text-amber-300">{s.km}</div>
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-slate-300">
                {s.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs text-slate-500 md:col-span-2">Typical for 100–125 cc commuter motorcycles in Indian conditions. Dusty roads, monsoon and heavy city traffic mean shorter intervals. Follow your owner's manual and do the free services!</p>
        </div>
      )}

      {tab === "tools" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {TOOLS.map(([t, u]) => (
            <div key={t} className="flex gap-3 rounded-xl border border-slate-700/70 bg-slate-900/60 p-3">
              <span className="text-xl">🔩</span>
              <div>
                <div className="text-sm font-semibold text-white">{t}</div>
                <div className="text-xs text-slate-400">{u}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "how" && (
        <div className="max-w-3xl space-y-2">
          {HOWTOS.map((h, i) => (
            <div key={h.t} className="overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/60">
              <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                <span className="font-semibold text-white">{h.t}</span>
                <span className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="rounded-full bg-slate-800 px-2 py-0.5">⏱ {h.time}</span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5">{h.level}</span>
                  <span>{open === i ? "▲" : "▼"}</span>
                </span>
              </button>
              {open === i && (
                <div className="border-t border-slate-700/70 p-4">
                  <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-200">
                    {h.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  <p className="mt-3 rounded-lg bg-amber-400/10 p-3 text-sm text-amber-200">💡 {h.tip}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "safe" && (
        <ul className="max-w-3xl space-y-2">
          {SAFETY.map((s) => (
            <li key={s} className="flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-slate-200">
              <span>⚠️</span>
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
