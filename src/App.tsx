import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import BikeLab from "./components/BikeLab";
import Overview from "./components/Overview";
import EngineCycle from "./components/EngineCycle";
import Transmission from "./components/Transmission";
import Physics from "./components/Physics";
import PartsGuide from "./components/PartsGuide";
import Troubleshooter from "./components/Troubleshooter";
import Maintenance from "./components/Maintenance";
import Quiz from "./components/Quiz";
import { BIKE_SPEC } from "./data/parts";

const NAV = [
  ["lab", "3D Lab"],
  ["basics", "Big picture"],
  ["engine", "Engine"],
  ["drive", "Gears"],
  ["physics", "Physics"],
  ["parts", "Parts"],
  ["fix", "Diagnose"],
  ["care", "Maintain"],
  ["quiz", "Quiz"],
];

function Section({ id, step, title, sub, children }: { id: string; step: string; title: string; sub: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 border-t border-slate-800/80 py-16">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6">
        <div className="mb-8 max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">{step}</div>
          <h2 className="mt-1 text-3xl font-extrabold text-white sm:text-4xl">{title}</h2>
          <p className="mt-2 text-slate-400">{sub}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

export default function App() {
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState(0);
  const [modal, setModal] = useState<string | null>(null);

  const openIn3D = useCallback((id: string) => {
    setSelected(id);
    setFocus((f) => f + 1);
    document.getElementById("lab")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 antialiased">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-2.5 sm:px-6">
          <a href="#top" className="flex items-center gap-2 font-extrabold text-white">
            <span className="text-xl">🏍️</span>
            <span className="hidden sm:inline">Bike Anatomy Lab</span>
          </a>
          <nav className="flex flex-1 gap-1 overflow-x-auto text-sm">
            {NAV.map(([id, l]) => (
              <a key={id} href={"#" + id} className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-amber-300">
                {l}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div id="top" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-[1500px] px-4 pb-10 pt-14 sm:px-6">
          <div className="grid items-end gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                For Splendor · Shine · Platina · CD 110 · Passion class bikes
              </span>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-6xl">
                Understand your bike.
                <br />
                <span className="bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">Then fix it yourself.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-slate-300">
                An interactive 3D model of the ideal Indian 110 cc commuter motorcycle. Ride it, pull it apart, watch the piston and valves work,
                learn the physics, and follow guided diagnosis to find faults in your own bike.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#lab" className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-900 shadow-lg shadow-amber-500/20 hover:bg-amber-300">
                  Open the 3D lab ↓
                </a>
                <a href="#fix" className="rounded-xl border border-slate-600 px-5 py-3 font-semibold text-slate-200 hover:border-slate-400">
                  My bike has a problem
                </a>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Our reference bike</div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {BIKE_SPEC.map((s) => (
                  <div key={s.k} className="contents">
                    <dt className="text-slate-500">{s.k}</dt>
                    <dd className="text-slate-100">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <ol className="mt-10 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["1", "Explore", "Rotate, x-ray and explode the 3D bike; click any part."],
              ["2", "See it work", "Start the engine, shift gears, lean into a turn, hit a speed breaker."],
              ["3", "Learn the why", "4-stroke cycle, gearing and the physics of balance and braking."],
              ["4", "Diagnose", "Answer simple questions to locate the fault."],
              ["5", "Repair & test", "Step-by-step jobs, service schedule, then the quiz."],
            ].map(([n, t, d]) => (
              <li key={n} className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-slate-900">{n}</span>
                <b className="text-white">{t}</b>
                <p className="mt-1 text-slate-400">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <Section id="lab" step="Step 1 & 2 · Explore and ride" title="The interactive 3D bike" sub="Everything here is live: click parts, switch to X-ray or Engine cut-away, pull the bike apart with the slider, and ride it with throttle, clutch and gears.">
        <BikeLab selected={selected} onSelect={setSelected} focusSignal={focus} />
      </Section>

      <Section id="basics" step="Step 3 · The big picture" title="How a motorcycle works, in one page" sub="Four systems work together: power, control, electrical and chassis. Learn the chain of events from petrol to forward motion.">
        <Overview onView3D={openIn3D} />
      </Section>

      <Section id="engine" step="Step 3 · The engine" title="The 4-stroke cycle" sub="Scrub through 720° of crank rotation and see exactly what the piston, valves and spark plug do and what goes wrong if one fails.">
        <EngineCycle />
      </Section>

      <Section id="drive" step="Step 3 · Power to the road" title="Clutch, gearbox, chain & sprockets" sub="Why you need gears at all, and how the sprockets decide between pickup and top speed.">
        <Transmission />
      </Section>

      <Section id="physics" step="Step 3 · The physics" title="Balance, lean, braking and suspension" sub="Interactive experiments with real formulas. Move the sliders, and the bike's behaviour will start to make sense.">
        <Physics />
      </Section>

      <Section id="parts" step="Step 4 · Know every part" title="Parts encyclopedia" sub="Each part has what it does, how it works, how it fails, what you can check yourself, tools needed, service interval and approximate cost in India.">
        <PartsGuide onView3D={openIn3D} openId={modal} onClose={() => setModal(null)} />
      </Section>

      <Section id="fix" step="Step 4 · Find the fault" title="Diagnose a problem" sub="Pick what your bike is doing. Use the guided questions for no-start and self-start problems, or browse likely causes by symptom.">
        <Troubleshooter onOpen={setModal} />
      </Section>

      <Section id="care" step="Step 5 · Look after it" title="Maintenance & DIY repairs" sub="Pre-ride checks, a service schedule for Indian conditions, a starter toolkit and clear step-by-step repair guides.">
        <Maintenance />
      </Section>

      <Section id="quiz" step="Final check" title="Test what you learned" sub="15 questions. If you can answer these, you understand your bike.">
        <Quiz />
      </Section>

      <footer className="border-t border-slate-800 py-10 text-center text-xs text-slate-500">
        <p>Bike Anatomy Lab · A learning tool built around a typical 110 cc Indian commuter. Values (torque, clearances, prices) are typical and rounded: always check your owner's manual.</p>
        <p className="mt-1">Ride safe: helmet on, documents with you. 🪖</p>
      </footer>
    </div>
  );
}
