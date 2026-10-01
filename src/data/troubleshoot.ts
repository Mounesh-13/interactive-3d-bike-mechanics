export interface TreeQuestion {
  q: string;
  hint?: string;
  yes: string;
  no: string;
  yesLabel?: string;
  noLabel?: string;
}
export interface TreeResult {
  result: {
    title: string;
    detail: string;
    fix: string[];
    parts: string[];
    level: "DIY" | "Try, then mechanic" | "Mechanic";
  };
}
export type TreeNode = TreeQuestion | TreeResult;

export interface Tree {
  id: string;
  title: string;
  intro: string;
  start: string;
  nodes: Record<string, TreeNode>;
}

export const TREES: Tree[] = [
  {
    id: "nostart",
    title: "Bike cranks but won't start",
    intro:
      "An engine needs four things: Fuel + Air + Spark + Compression. We'll check them in the order that is fastest and cheapest.",
    start: "fuel",
    nodes: {
      fuel: {
        q: "Is there petrol in the tank, and is the fuel tap on ON (or RES)?",
        hint: "Open the cap and rock the bike. Also check the fuel tap isn't on OFF/PRI.",
        yes: "kill",
        no: "r_nofuel",
        yesLabel: "Yes, fuel is there",
        noLabel: "No / not sure",
      },
      r_nofuel: {
        result: {
          title: "No fuel reaching the carburettor",
          detail: "The simplest cause of a no-start. Don't skip this step.",
          fix: [
            "Fill petrol and turn the tap to ON/RES.",
            "If the tank has fuel but nothing flows: clear the cap's breather hole and clean the petcock strainer.",
          ],
          parts: ["tank", "petcock"],
          level: "DIY",
        },
      },
      kill: {
        q: "Is the kill switch on RUN and the ignition key ON? Does the neutral light come on?",
        hint: "A bumped kill switch causes more 'dead bikes' than any mechanical failure.",
        yes: "spark",
        no: "r_kill",
        yesLabel: "Yes, all fine",
        noLabel: "No",
      },
      r_kill: {
        result: {
          title: "Switch / ignition circuit is off",
          detail: "The ignition is not powered, so there is no spark.",
          fix: [
            "Set kill switch to RUN, key to ON.",
            "If lights are dead too: check battery terminals and the main fuse.",
          ],
          parts: ["handlebar", "fuse", "battery"],
          level: "DIY",
        },
      },
      spark: {
        q: "Remove the spark plug, fit it in the cap, rest the threads on bare engine metal, and kick/crank. Do you see a bright BLUE spark?",
        hint: "Keep fingers away from the cap. A weak orange/yellow or no spark counts as 'No'.",
        yes: "wet",
        no: "plug2",
        yesLabel: "Yes, strong blue spark",
        noLabel: "No / weak spark",
      },
      plug2: {
        q: "Try a new (or known-good) spark plug. Is there a good spark now?",
        yes: "r_plug",
        no: "cap",
        yesLabel: "Yes, spark is OK now",
        noLabel: "Still no spark",
      },
      r_plug: {
        result: {
          title: "Fouled or worn spark plug",
          detail: "The old plug is cracked, oily, carbon-covered or has the wrong gap.",
          fix: [
            "Replace with the right plug (don't try to revive a very black one).",
            "Set the gap to 0.7–0.8 mm.",
            "If it fouls again within days: check for a rich carb (air filter) or oil burning.",
          ],
          parts: ["sparkplug"],
          level: "DIY",
        },
      },
      cap: {
        q: "Is the plug cap clicked tight (and dry), the wire not cracked, and the battery strong (bright headlight)?",
        yes: "r_coil",
        no: "r_cap",
        yesLabel: "Yes, all good",
        noLabel: "No, found a problem",
      },
      r_cap: {
        result: {
          title: "Plug cap / wiring / battery issue",
          detail: "The high-voltage path or the power supply to the ignition is weak.",
          fix: [
            "Dry the plug cap with a cloth, press until it clicks, or replace a cracked cap.",
            "Charge or replace a weak battery. Clean terminals.",
            "Check the connectors at the coil and CDI.",
          ],
          parts: ["coil", "battery", "fuse"],
          level: "DIY",
        },
      },
      r_coil: {
        result: {
          title: "Ignition coil / CDI / pickup coil failure",
          detail: "The ignition is powered but not creating spark. It is one of the three electronic parts.",
          fix: [
            "Swap a known-good coil, then a known-good CDI to find which one has failed (cheapest way).",
            "Measure resistance of the coil and pickup coil and compare with the manual.",
            "If those pass, the magneto (stator) may be burnt: mechanic.",
          ],
          parts: ["coil", "cdi", "magneto"],
          level: "Try, then mechanic",
        },
      },
      wet: {
        q: "Spark is good. Look at the plug tip: is it WET and smelling of petrol?",
        hint: "Wet plug = too much fuel (flooded). Dry plug = not enough fuel.",
        yes: "r_flood",
        no: "drain",
        yesLabel: "Yes, wet with petrol",
        noLabel: "No, it's dry",
      },
      r_flood: {
        result: {
          title: "Flooded engine",
          detail: "Too much petrol: common after repeated kicks with the choke on.",
          fix: [
            "Switch the choke OFF and the fuel tap OFF.",
            "Wipe the plug dry (or let it dry 10 min), refit.",
            "Open the throttle fully and kick 5–6 times to clear the fuel, then start without throttle.",
            "If it floods often: carb float level/needle valve is leaking (mechanic or carb clean).",
          ],
          parts: ["carb", "sparkplug"],
          level: "DIY",
        },
      },
      drain: {
        q: "Open the carburettor drain screw. Does petrol flow out steadily?",
        hint: "Place a small container underneath. No flow = fuel isn't getting to the carb.",
        yes: "comp",
        no: "r_fuelflow",
        yesLabel: "Yes, fuel flows",
        noLabel: "No / just a dribble",
      },
      r_fuelflow: {
        result: {
          title: "Fuel supply is blocked",
          detail: "Petrol is not reaching the carburettor bowl.",
          fix: [
            "Clear the cap's breather hole.",
            "Clean the petcock strainer (switch to RES to test).",
            "Check the fuel hose for kinks or cracks.",
            "Clean the carb's needle valve/float: stuck float is common after long storage.",
          ],
          parts: ["tank", "petcock", "carb"],
          level: "DIY",
        },
      },
      comp: {
        q: "Kick slowly. Do you feel firm resistance (compression) once every two kicks?",
        hint: "A very light kick with no resistance means compression is lost.",
        yes: "air",
        no: "r_comp",
        yesLabel: "Yes, firm resistance",
        noLabel: "No, kick feels light",
      },
      r_comp: {
        result: {
          title: "Compression loss",
          detail: "Fuel and spark are good, but the engine can't compress the mixture.",
          fix: [
            "Check valve clearance: tight valves are a common cause and cheap to fix.",
            "Check the cam chain and timing.",
            "If valves are fine: worn rings or a burnt valve needs an overhaul.",
          ],
          parts: ["valves", "cylinder", "piston"],
          level: "Mechanic",
        },
      },
      air: {
        q: "Is the air filter clean and dry, and is the choke working for a cold engine?",
        yes: "r_carb",
        no: "r_air",
        yesLabel: "Yes, filter is clean",
        noLabel: "No, it's dirty / wet",
      },
      r_air: {
        result: {
          title: "Air supply problem",
          detail: "A clogged or wet filter makes the mixture too rich to light.",
          fix: [
            "Clean or replace the air filter.",
            "Use the choke only when cold, and turn it off as soon as the engine catches.",
          ],
          parts: ["airfilter", "carb"],
          level: "DIY",
        },
      },
      r_carb: {
        result: {
          title: "Clogged carburettor jets (stale petrol)",
          detail: "All basics are fine, so the pilot jet is almost surely clogged by old petrol varnish.",
          fix: [
            "Remove the carb, clean the pilot jet, main jet and passages with carb cleaner and compressed air.",
            "Drain old petrol and refill fresh.",
            "Reset the idle screw after cleaning.",
          ],
          parts: ["carb"],
          level: "Try, then mechanic",
        },
      },
    },
  },
  {
    id: "self",
    title: "Self-start doesn't work",
    intro:
      "Follow the electrical path: battery → fuse → switch / interlocks → relay → motor. The kick starter is your backup in the meantime.",
    start: "lights",
    nodes: {
      lights: {
        q: "Turn the key ON. Do the meter lights (and neutral light) come on brightly?",
        hint: "Dim or no lights tells us the battery or its wiring is the problem.",
        yes: "interlock",
        no: "term",
        yesLabel: "Yes, they're bright",
        noLabel: "Dim or none",
      },
      term: {
        q: "Are the battery terminals loose, green or white with corrosion, or is the main fuse blown?",
        yes: "r_term",
        no: "r_batt",
        yesLabel: "Yes, found something",
        noLabel: "No, they look fine",
      },
      r_term: {
        result: {
          title: "Poor connection or blown fuse",
          detail: "Starter motors draw ~80 A, so even a slightly loose terminal stops everything.",
          fix: [
            "Clean terminals with a wire brush and tighten them.",
            "Replace a blown fuse with the same rating only.",
            "Check the earth cable to the frame/engine.",
          ],
          parts: ["battery", "fuse"],
          level: "DIY",
        },
      },
      r_batt: {
        result: {
          title: "Battery is flat or dead",
          detail: "Old batteries (>3 years) or those left unused lose capacity.",
          fix: [
            "Measure voltage: below 12 V means it is discharged.",
            "Charge it slowly overnight; if it won't hold charge, replace it.",
            "Kick-start meanwhile, then check charging voltage (13.8–14.8 V at 3,000 rpm).",
          ],
          parts: ["battery", "cdi", "magneto"],
          level: "DIY",
        },
      },
      interlock: {
        q: "Is the bike in neutral (N light on) OR the clutch lever pulled, and the kill switch set to RUN?",
        yes: "click",
        no: "r_interlock",
        yesLabel: "Yes",
        noLabel: "No",
      },
      r_interlock: {
        result: {
          title: "Starter safety interlock",
          detail: "The bike won't crank unless it's in neutral or the clutch is pulled.",
          fix: [
            "Shift to neutral or pull the clutch lever fully, then press the starter button.",
            "If it still doesn't work: clutch-lever switch or neutral switch may be faulty/disconnected.",
          ],
          parts: ["handlebar", "gearbox", "clutch"],
          level: "DIY",
        },
      },
      click: {
        q: "Press the starter button. Do you hear a 'click' from the relay (near the battery)?",
        yes: "crank",
        no: "r_relay",
        yesLabel: "Yes, a click",
        noLabel: "No sound at all",
      },
      r_relay: {
        result: {
          title: "Start switch / relay circuit",
          detail: "The signal isn't reaching the relay (or the relay is dead).",
          fix: [
            "Check the starter button contacts (clean the switch cube).",
            "Check the relay coupler and test the relay by bridging its terminals briefly.",
            "Check the starter fuse and the connector at the clutch/neutral switches.",
          ],
          parts: ["handlebar", "starter", "fuse"],
          level: "Try, then mechanic",
        },
      },
      crank: {
        q: "After the click, does the engine turn briskly (vroom-vroom)?",
        yes: "r_nostart",
        no: "slow",
        yesLabel: "Yes, it spins fast",
        noLabel: "No / slow / whirr",
      },
      r_nostart: {
        result: {
          title: "Starter is fine: it's a no-start problem",
          detail: "The electrical side works. The engine is not firing.",
          fix: ["Switch to the 'Bike cranks but won't start' guided diagnosis for fuel/spark/compression."],
          parts: ["sparkplug", "carb"],
          level: "DIY",
        },
      },
      slow: {
        q: "Does the motor spin slowly with a weak, dragging sound (and then clicks)?",
        yes: "r_weak",
        no: "r_motor",
        yesLabel: "Yes, slow / weak",
        noLabel: "No, it whirrs freely or doesn't move",
      },
      r_weak: {
        result: {
          title: "Weak battery or high resistance",
          detail: "The motor needs the full current. A weak battery or bad connection can't deliver it.",
          fix: [
            "Charge or replace the battery.",
            "Check the earth strap and the starter cable ends for corrosion.",
            "If the battery is good: starter brushes may be worn.",
          ],
          parts: ["battery", "starter"],
          level: "DIY",
        },
      },
      r_motor: {
        result: {
          title: "Starter motor or one-way (starter) clutch",
          detail: "A motor that whirrs but doesn't turn the engine has a slipping starter clutch. A motor that doesn't move at all has worn brushes or a dead motor.",
          fix: [
            "Whirr without cranking → the one-way clutch needs replacing (mechanic).",
            "No movement → remove the motor, clean the commutator, replace brushes.",
            "Use the kick starter until fixed.",
          ],
          parts: ["starter", "magneto"],
          level: "Mechanic",
        },
      },
    },
  },
];

export interface Cause {
  cause: string;
  likelihood: "High" | "Medium" | "Low";
  check: string;
  fix: string;
  parts: string[];
  level: "DIY" | "Try, then mechanic" | "Mechanic";
}
export interface Symptom {
  id: string;
  icon: string;
  title: string;
  desc: string;
  causes: Cause[];
}

export const SYMPTOMS: Symptom[] = [
  {
    id: "stall",
    icon: "🛑",
    title: "Stalls or idles roughly",
    desc: "Dies at traffic lights, or idles unevenly and shakes.",
    causes: [
      {
        cause: "Clogged pilot jet / dirty carburettor",
        likelihood: "High",
        check: "Does it improve if you give a little throttle? Does choke help? Then the idle circuit is blocked.",
        fix: "Clean the carb, especially the pilot jet. Set the idle screw to about 1,400 rpm.",
        parts: ["carb"],
        level: "Try, then mechanic",
      },
      {
        cause: "Fouled / worn spark plug",
        likelihood: "High",
        check: "Remove the plug: black sooty, wet or an eroded electrode.",
        fix: "Clean or replace the plug, and set the gap to 0.7–0.8 mm.",
        parts: ["sparkplug"],
        level: "DIY",
      },
      {
        cause: "Air leak at the intake joint",
        likelihood: "Medium",
        check: "Revs hang high when you close the throttle; hissing near the carb. Spray carb cleaner around the joint: idle changes if there is a leak.",
        fix: "Tighten the clamps or replace the cracked rubber intake boot.",
        parts: ["carb", "airfilter"],
        level: "Try, then mechanic",
      },
      {
        cause: "Valve clearance too tight",
        likelihood: "Medium",
        check: "Hard starting when hot, popping, low power, overdue valve service.",
        fix: "Adjust the tappets to spec.",
        parts: ["valves"],
        level: "Try, then mechanic",
      },
    ],
  },
  {
    id: "power",
    icon: "🐌",
    title: "Weak pickup / low power",
    desc: "Bike feels sluggish, struggles up slopes, can't reach the top speed it used to.",
    causes: [
      {
        cause: "Clogged air filter",
        likelihood: "High",
        check: "Look at the element: dark, oily, packed with dust.",
        fix: "Clean or replace it.",
        parts: ["airfilter"],
        level: "DIY",
      },
      {
        cause: "Clutch slipping",
        likelihood: "High",
        check: "RPM rises faster than speed when you accelerate hard in a high gear. Clutch lever with no free play.",
        fix: "Set free play to 10–20 mm. If it persists: new clutch plates.",
        parts: ["clutch"],
        level: "Try, then mechanic",
      },
      {
        cause: "Chain too tight, dry or stretched / dragging brakes",
        likelihood: "Medium",
        check: "Lift the rear and spin the wheel. It should keep rolling freely. Brake drum hot after a ride?",
        fix: "Adjust the chain slack to 20–30 mm, lubricate, and check brake free play.",
        parts: ["chain", "rearbrake", "frontbrake"],
        level: "DIY",
      },
      {
        cause: "Low tyre pressure",
        likelihood: "Medium",
        check: "Tyres look flat, handling is heavy.",
        fix: "Inflate to 25–28 psi front / 28–32 psi rear.",
        parts: ["frontwheel", "rearwheel"],
        level: "DIY",
      },
      {
        cause: "Weak compression (worn rings or valves)",
        likelihood: "Low",
        check: "Blue smoke, oil consumption, hard starting, little compression resistance on kick.",
        fix: "Top-end overhaul.",
        parts: ["piston", "cylinder", "valves"],
        level: "Mechanic",
      },
    ],
  },
  {
    id: "mileage",
    icon: "⛽",
    title: "Mileage has dropped",
    desc: "You're burning more petrol per km than before.",
    causes: [
      {
        cause: "Dirty air filter (rich mixture)",
        likelihood: "High",
        check: "Black smoke, black plug tip.",
        fix: "Clean/replace the filter.",
        parts: ["airfilter", "sparkplug"],
        level: "DIY",
      },
      {
        cause: "Low tyre pressure",
        likelihood: "High",
        check: "Check with a gauge. Under-inflated tyres can reduce mileage by 5–10%.",
        fix: "Inflate to spec.",
        parts: ["frontwheel", "rearwheel"],
        level: "DIY",
      },
      {
        cause: "Dirty carb / wrong idle or choke stuck partly on",
        likelihood: "Medium",
        check: "Rich smell, sooty plug, rough idle.",
        fix: "Clean the carb and check the choke is fully off.",
        parts: ["carb"],
        level: "Try, then mechanic",
      },
      {
        cause: "Chain dry / dragging brake / riding style",
        likelihood: "Medium",
        check: "Wheel doesn't spin freely. Riding at high rpm in low gear.",
        fix: "Lube chain, free the brakes, shift up earlier (keep between 3,000–5,000 rpm).",
        parts: ["chain", "frontbrake", "rearbrake"],
        level: "DIY",
      },
      {
        cause: "Fuel leak",
        likelihood: "Low",
        check: "Petrol smell, wet spots under the tank or carb.",
        fix: "Replace the hose, O-rings or petcock gasket.",
        parts: ["petcock", "tank", "carb"],
        level: "DIY",
      },
    ],
  },
  {
    id: "smoke",
    icon: "💨",
    title: "Smoke from exhaust",
    desc: "The colour of smoke tells you what's wrong.",
    causes: [
      {
        cause: "BLACK smoke = too much fuel",
        likelihood: "High",
        check: "Also: sooty plug, poor mileage, strong petrol smell.",
        fix: "Clean the air filter, clean the carb, and check the choke.",
        parts: ["airfilter", "carb"],
        level: "DIY",
      },
      {
        cause: "BLUE / grey smoke = burning engine oil",
        likelihood: "High",
        check: "Oil level dropping. Smoke on throttle blip or after idling. Oily plug.",
        fix: "Worn rings, bore or valve-stem seals need an overhaul. Check the oil grade and level.",
        parts: ["piston", "cylinder", "engine"],
        level: "Mechanic",
      },
      {
        cause: "WHITE smoke (thick, sweet, persistent) = coolant/water or head gasket",
        likelihood: "Low",
        check: "On air-cooled bikes this is rare. Thin white steam on a cold morning is normal condensation.",
        fix: "If it is persistent with milky oil: head gasket / water ingress, mechanic.",
        parts: ["cylinder"],
        level: "Mechanic",
      },
    ],
  },
  {
    id: "overheat",
    icon: "🌡️",
    title: "Overheating / knocking",
    desc: "Engine gets very hot, pings or knocks under load.",
    causes: [
      {
        cause: "Low or old engine oil",
        likelihood: "High",
        check: "Check the level, colour and age.",
        fix: "Top up or change the oil.",
        parts: ["oil", "engine"],
        level: "DIY",
      },
      {
        cause: "Lean mixture (air leak / blocked jet) or wrong petrol",
        likelihood: "Medium",
        check: "White plug tip, popping in the exhaust, hot engine.",
        fix: "Clean the carb, fix leaks, use good-quality petrol.",
        parts: ["carb", "sparkplug"],
        level: "Try, then mechanic",
      },
      {
        cause: "Carbon build-up / wrong plug heat range / retarded timing",
        likelihood: "Medium",
        check: "Pinging under load, high mileage.",
        fix: "Decarbonise, fit the correct plug, check CDI/pickup.",
        parts: ["sparkplug", "cylinder", "cdi"],
        level: "Mechanic",
      },
      {
        cause: "Dragging brakes / tight chain / clogged fins",
        likelihood: "Low",
        check: "Wheels don't spin freely, fins coated with mud.",
        fix: "Adjust, and clean fins.",
        parts: ["frontbrake", "chain", "cylinder"],
        level: "DIY",
      },
    ],
  },
  {
    id: "clutch",
    icon: "🦶",
    title: "Gear shift or clutch problems",
    desc: "Hard to shift, bike jerks, false neutral, no neutral.",
    causes: [
      {
        cause: "Wrong clutch free play",
        likelihood: "High",
        check: "Lever free play outside 10–20 mm. Too much: clutch drags. Too little: it slips.",
        fix: "Adjust at the lever/cable end, and lube the cable.",
        parts: ["clutch", "cables"],
        level: "DIY",
      },
      {
        cause: "Old / wrong engine oil",
        likelihood: "High",
        check: "Dark oil or scooter (MB) oil in a wet-clutch bike.",
        fix: "Change to JASO MA-rated oil.",
        parts: ["oil", "clutch"],
        level: "DIY",
      },
      {
        cause: "Loose or bent gear lever / linkage",
        likelihood: "Medium",
        check: "Lever moves too far or doesn't return.",
        fix: "Tighten the pinch bolt, straighten or replace the lever, set the height.",
        parts: ["gearlever"],
        level: "DIY",
      },
      {
        cause: "Worn gearbox dogs / shift fork",
        likelihood: "Low",
        check: "Gear jumps out (esp. 3rd/4th) even with correct adjustment.",
        fix: "Gearbox repair.",
        parts: ["gearbox"],
        level: "Mechanic",
      },
    ],
  },
  {
    id: "brake",
    icon: "🚨",
    title: "Weak, noisy or dragging brakes",
    desc: "Bike takes longer to stop, squeals, or the drum gets hot.",
    causes: [
      {
        cause: "Too much free play",
        likelihood: "High",
        check: "Lever or pedal travels far before biting.",
        fix: "Turn the adjuster nut at the wheel.",
        parts: ["frontbrake", "rearbrake"],
        level: "DIY",
      },
      {
        cause: "Worn or glazed shoes",
        likelihood: "High",
        check: "Wear indicator past the limit, squealing, shiny lining.",
        fix: "Replace shoes in pairs.",
        parts: ["frontbrake", "rearbrake"],
        level: "Try, then mechanic",
      },
      {
        cause: "Oil, chain lube or water on the lining",
        likelihood: "Medium",
        check: "Sudden weak brake or grabbing; oily drum.",
        fix: "Clean the drum with brake cleaner and replace contaminated shoes.",
        parts: ["frontbrake", "rearbrake", "chain"],
        level: "Try, then mechanic",
      },
      {
        cause: "Dragging: no free play / seized cable or cam",
        likelihood: "Medium",
        check: "Wheel doesn't spin freely; drum is hot.",
        fix: "Adjust, lubricate cable and cam.",
        parts: ["cables", "frontbrake", "rearbrake"],
        level: "DIY",
      },
    ],
  },
  {
    id: "chainnoise",
    icon: "⛓️",
    title: "Chain noise or jerks",
    desc: "Rattle, clank, squeal or jerk when you open or close the throttle.",
    causes: [
      {
        cause: "Chain too loose or dry",
        likelihood: "High",
        check: "Slack more than 30 mm, rust-brown chain.",
        fix: "Clean, lube and adjust to 20–30 mm.",
        parts: ["chain"],
        level: "DIY",
      },
      {
        cause: "Chain stretched / sprockets worn",
        likelihood: "High",
        check: "Pull the chain at the rear sprocket: more than half a tooth lifts? Hooked teeth.",
        fix: "Replace the chain and both sprockets as a set.",
        parts: ["chain", "sprockets"],
        level: "Try, then mechanic",
      },
      {
        cause: "Worn cush-drive rubbers",
        likelihood: "Medium",
        check: "Clunk on throttle on/off, rear wheel has rotational play in the hub.",
        fix: "Replace the rubbers.",
        parts: ["rearwheel"],
        level: "Try, then mechanic",
      },
      {
        cause: "Rear wheel misaligned",
        likelihood: "Low",
        check: "Chain rubbing on one side, rear tyre not centred in the swingarm.",
        fix: "Align the marks on both sides of the swingarm.",
        parts: ["chain", "swingarm"],
        level: "DIY",
      },
    ],
  },
  {
    id: "wobble",
    icon: "🌪️",
    title: "Vibration, wobble or pulling to one side",
    desc: "Handlebar shakes, bike weaves or drifts left/right.",
    causes: [
      {
        cause: "Wrong tyre pressure or uneven wear",
        likelihood: "High",
        check: "Check pressures; look for flat or scalloped wear.",
        fix: "Inflate properly, replace worn tyres.",
        parts: ["frontwheel", "rearwheel"],
        level: "DIY",
      },
      {
        cause: "Loose spokes or wheel out of true",
        likelihood: "High",
        check: "Spin the wheel and watch the rim against a fixed pointer. Tap the spokes.",
        fix: "True the wheel and tighten spokes (wheel shop).",
        parts: ["frontwheel", "rearwheel"],
        level: "Try, then mechanic",
      },
      {
        cause: "Worn steering-head or swingarm bearings / bushes",
        likelihood: "Medium",
        check: "Lift the front and turn the bars: notchy or loose. Rock the rear wheel sideways: clunk.",
        fix: "Adjust or replace bearings, and replace the bushes.",
        parts: ["bearings", "swingarm"],
        level: "Mechanic",
      },
      {
        cause: "Bent fork or frame after a fall",
        likelihood: "Low",
        check: "Look from behind: wheels not in line, bars off-centre.",
        fix: "Alignment check and repair.",
        parts: ["fork", "frame"],
        level: "Mechanic",
      },
      {
        cause: "Loose engine mounting bolts / weak shocks (vibration)",
        likelihood: "Low",
        check: "Buzz on pegs and seat at some rpm.",
        fix: "Tighten the mounts; replace the shocks in pairs.",
        parts: ["shocks", "frame"],
        level: "Try, then mechanic",
      },
    ],
  },
  {
    id: "electric",
    icon: "💡",
    title: "Lights dim, horn weak, or battery keeps dying",
    desc: "Electrical gremlins.",
    causes: [
      {
        cause: "Battery old / loose terminals",
        likelihood: "High",
        check: "Resting voltage under 12.4 V; terminals loose or corroded.",
        fix: "Clean the terminals, charge or replace the battery.",
        parts: ["battery"],
        level: "DIY",
      },
      {
        cause: "Not charging: regulator / stator fault",
        likelihood: "High",
        check: "Voltage at 3,000 rpm below 13 V (not charging) or above 15 V (overcharging).",
        fix: "Test the stator output, replace the regulator-rectifier or stator.",
        parts: ["cdi", "magneto"],
        level: "Try, then mechanic",
      },
      {
        cause: "Bad earth / loose coupler / blown fuse",
        likelihood: "Medium",
        check: "Flickering lights, electric items working intermittently.",
        fix: "Clean earth points, push connectors firmly, replace the fuse with the same rating.",
        parts: ["fuse"],
        level: "DIY",
      },
      {
        cause: "Parasitic drain (something stays on)",
        likelihood: "Low",
        check: "Battery is flat after standing for 2–3 days.",
        fix: "Disconnect accessories (alarms, USB chargers). A mechanic can measure the drain.",
        parts: ["battery", "fuse"],
        level: "Try, then mechanic",
      },
    ],
  },
  {
    id: "backfire",
    icon: "💥",
    title: "Popping or backfiring in the exhaust",
    desc: "Crackling when you roll off the throttle, or a bang from the silencer.",
    causes: [
      {
        cause: "Exhaust leak at the header joint",
        likelihood: "High",
        check: "Black soot around the flange; the pops are louder with the engine hot.",
        fix: "Replace the gasket and tighten the nuts evenly.",
        parts: ["exhaust"],
        level: "DIY",
      },
      {
        cause: "Lean mixture or air leak at the intake",
        likelihood: "High",
        check: "Pops on deceleration, hot engine, white plug.",
        fix: "Clean the carb, set the air screw and check the intake joint.",
        parts: ["carb", "airfilter"],
        level: "Try, then mechanic",
      },
      {
        cause: "Valve clearance too tight / burnt exhaust valve",
        likelihood: "Medium",
        check: "Pops with hard starting and power loss.",
        fix: "Adjust the valves; if the valve is burnt, an overhaul is needed.",
        parts: ["valves"],
        level: "Mechanic",
      },
    ],
  },
  {
    id: "leak",
    icon: "🛢️",
    title: "Oil leaks",
    desc: "Drops under the bike, oily engine or fork.",
    causes: [
      {
        cause: "Loose drain plug / worn washer / overfilled oil",
        likelihood: "High",
        check: "Drip at the bottom of the engine after an oil change.",
        fix: "Fit a new washer; tighten to spec; fill to the correct level only.",
        parts: ["oil", "engine"],
        level: "DIY",
      },
      {
        cause: "Cover or head gasket seep",
        likelihood: "Medium",
        check: "Wet, dirty line along a cover joint.",
        fix: "Tighten the bolts evenly, or replace the gasket.",
        parts: ["engine", "cylinder"],
        level: "Try, then mechanic",
      },
      {
        cause: "Fork seal or rear-shock leak",
        likelihood: "Medium",
        check: "Oily film on a fork tube or shock body.",
        fix: "Replace the seals or the shock.",
        parts: ["fork", "shocks"],
        level: "Mechanic",
      },
    ],
  },
];
