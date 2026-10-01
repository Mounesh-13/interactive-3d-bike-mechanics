import { useState } from "react";

const QS: { q: string; o: string[]; a: number; e: string; topic: string }[] = [
  { q: "Which stroke of a 4-stroke engine actually produces power?", o: ["Intake", "Compression", "Combustion / power", "Exhaust"], a: 2, e: "Only the power stroke pushes the piston with burning gas. The other three are 'housekeeping' strokes carried by the flywheel.", topic: "Engine" },
  { q: "Your bike cranks well but doesn't start. What are the 3 things (besides compression) you check first?", o: ["Fuel, air, spark", "Battery, clutch, chain", "Tyres, brakes, mirrors", "Oil, coolant, horn"], a: 0, e: "Fuel + Air + Spark (+ compression) is the engine's four-part recipe. Check fuel tap and petrol first, then spark.", topic: "Troubleshooting" },
  { q: "A dirty air filter usually makes the mixture…", o: ["Lean (too little fuel)", "Rich (too much fuel)", "Perfect", "No effect"], a: 1, e: "Less air with the same fuel = rich. You see black smoke, a sooty plug and falling mileage.", topic: "Fuel & Air" },
  { q: "The camshaft turns at ____ the speed of the crankshaft.", o: ["Double", "The same", "Half", "One-quarter"], a: 2, e: "Each valve opens once every 2 crank turns (720°), so the cam turns once for every two crank turns.", topic: "Engine" },
  { q: "What does pulling the clutch lever do?", o: ["Brakes the rear wheel", "Separates the engine from the gearbox", "Opens the throttle", "Switches off the spark"], a: 1, e: "The pressure plate lifts, the friction plates separate, and engine power no longer reaches the gearbox.", topic: "Transmission" },
  { q: "You want better pickup on hills with a pillion. Which sprocket change helps?", o: ["Smaller rear sprocket", "Bigger rear sprocket (more teeth)", "Bigger front sprocket", "No change helps"], a: 1, e: "More teeth at the rear (or fewer at the front) raises the final reduction: more torque at the wheel, lower top speed.", topic: "Transmission" },
  { q: "Correct chain slack at the middle of the lower run is about…", o: ["0 mm: as tight as possible", "5 mm", "20–30 mm", "60–80 mm"], a: 2, e: "20–30 mm. Too tight kills bearings and power; too loose can jump off.", topic: "Maintenance" },
  { q: "In a corner at higher speed, the lean angle needed depends on…", o: ["Only the tyre brand", "tan θ = v² / (g·r)", "Engine power", "Tank level"], a: 1, e: "The lean angle grows with the square of speed and shrinks with a larger radius.", topic: "Physics" },
  { q: "Why does the front brake do about 70% of stopping?", o: ["It is bigger", "Weight transfers forward when braking", "The tyre is wider", "Rear brakes are always weak"], a: 1, e: "Deceleration pitches the load onto the front tyre, giving it much more grip to use. The rear is nearly light under hard braking.", topic: "Physics" },
  { q: "Metallic 'tick-tick' from the top of the engine at idle that fades when warm usually means…", o: ["Valve clearance too large", "Flat tyre", "Dead battery", "Low coolant"], a: 0, e: "Loose tappet gap → ticking. Adjusted with a feeler gauge (0.05–0.08 mm cold, check manual).", topic: "Troubleshooting" },
  { q: "The starter clicks but the engine barely turns and lights go dim. Most likely cause?", o: ["Blocked jet", "Weak battery / loose terminal", "Worn tyres", "Dirty air filter"], a: 1, e: "The starter draws ~80 A; a weak battery or poor connection can't deliver it. Clean terminals, charge or replace the battery.", topic: "Electrical" },
  { q: "Fast flashing of the turn indicators tells you…", o: ["Battery is full", "A bulb has blown", "Chain is loose", "Engine is hot"], a: 1, e: "A blown bulb changes the circuit load so the flasher relay blinks quickly: a built-in warning.", topic: "Electrical" },
  { q: "Blue smoke from the exhaust usually means…", o: ["Too much petrol", "Burning engine oil", "Water in petrol", "Normal"], a: 1, e: "Blue/grey smoke is oil burning: worn rings, bore or valve seals. Black smoke is fuel; thin white steam on cold mornings is normal.", topic: "Troubleshooting" },
  { q: "What happens to a bike's air drag when speed doubles?", o: ["Doubles", "Becomes 4×", "Becomes 8× power needed", "No change"], a: 2, e: "Drag force grows with v², and the power to overcome it with v³: 2× speed needs ~8× the power for drag.", topic: "Physics" },
  { q: "Which oil is correct for a wet-clutch commuter bike?", o: ["Scooter (JASO MB) oil", "Any gear oil", "JASO MA grade 10W-30 / 20W-40", "Diesel engine oil"], a: 2, e: "JASO MA oils keep the wet clutch gripping. MB (scooter, friction-modified) oils can cause slipping.", topic: "Maintenance" },
];

export default function Quiz() {
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [miss, setMiss] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const q = QS[i];
  const pick = (k: number) => {
    if (sel !== null) return;
    setSel(k);
    if (k === q.a) setScore((s) => s + 1);
    else setMiss((m) => [...m, q.topic]);
  };
  const next = () => {
    if (i + 1 >= QS.length) setDone(true);
    else {
      setI(i + 1);
      setSel(null);
    }
  };
  const restart = () => {
    setI(0);
    setSel(null);
    setScore(0);
    setMiss([]);
    setDone(false);
  };

  if (done) {
    const pct = Math.round((score / QS.length) * 100);
    const topics = [...new Set(miss)];
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-400/40 bg-amber-400/5 p-8 text-center">
        <div className="text-5xl">{pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "📚"}</div>
        <h3 className="mt-2 text-2xl font-bold text-white">
          {score} / {QS.length} correct
        </h3>
        <p className="mt-2 text-slate-300">
          {pct >= 80 ? "You understand how your bike works. You're ready to diagnose and repair." : pct >= 50 ? "Good base. Revisit the sections below and try again." : "Spend some time with the 3D lab and the engine simulator, then retry."}
        </p>
        {topics.length > 0 && <p className="mt-3 text-sm text-slate-400">Review: {topics.join(", ")}</p>}
        <button onClick={restart} className="mt-5 rounded-lg bg-amber-400 px-5 py-2 font-semibold text-slate-900">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-2 flex justify-between text-xs text-slate-400">
        <span>Question {i + 1} of {QS.length} · {q.topic}</span>
        <span>Score {score}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-amber-400" style={{ width: (i / QS.length) * 100 + "%" }} />
      </div>
      <h3 className="text-xl font-bold text-white">{q.q}</h3>
      <div className="mt-4 space-y-2">
        {q.o.map((o, k) => {
          const state = sel === null ? "idle" : k === q.a ? "right" : k === sel ? "wrong" : "dim";
          return (
            <button
              key={o}
              onClick={() => pick(k)}
              className={`block w-full rounded-xl border p-3 text-left text-sm transition ${
                state === "idle" ? "border-slate-600 bg-slate-900/60 text-slate-200 hover:border-amber-400" : state === "right" ? "border-emerald-400 bg-emerald-500/10 text-emerald-200" : state === "wrong" ? "border-rose-400 bg-rose-500/10 text-rose-200" : "border-slate-800 text-slate-500"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {sel !== null && (
        <div className="mt-4 rounded-xl bg-slate-900/80 p-4 text-sm text-slate-300">
          <b className={sel === q.a ? "text-emerald-400" : "text-rose-400"}>{sel === q.a ? "Correct! " : "Not quite. "}</b>
          {q.e}
          <div>
            <button onClick={next} className="mt-3 rounded-lg bg-amber-400 px-4 py-1.5 text-sm font-semibold text-slate-900">
              {i + 1 >= QS.length ? "See result" : "Next →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
