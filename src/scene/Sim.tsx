import { useContext, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Lab, R_W, TWO_PI, WB } from "./shared";
import type { Telemetry } from "./shared";

export const PRIMARY = 3.15;
export const FINAL = 3.0;
export const GEARS = [0, 2.92, 1.78, 1.25, 1.0];
const MASS = 175; // bike + rider
const G = 9.81;

/** Engine torque curve in Nm (≈110 cc commuter) */
export function engineTorque(rpm: number): number {
  if (rpm < 800) return 3.5;
  const x = (rpm - 5500) / 4500;
  let t = 8.7 * (1 - 0.55 * x * x);
  if (rpm > 8000) t *= Math.max(0, 1 - (rpm - 8000) / 600);
  return Math.max(t, 0);
}

function clamp(x: number, a: number, b: number) {
  return Math.min(b, Math.max(a, x));
}

function bumpH(sb: { on: boolean; x: number; z: number; h: number }, wx: number): number {
  if (!sb.on) return 0;
  const dx = wx - sb.x;
  const dz = 0 - sb.z;
  const c = Math.cos(sb.h);
  const s = Math.sin(sb.h);
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  if (Math.abs(lz) > 1.5 || Math.abs(lx) > 0.8) return 0;
  const Rb = 3.25;
  return Math.max(0, Math.sqrt(Rb * Rb - lx * lx) - (Rb - 0.1));
}

function strokeName(phi: number) {
  if (phi < 180) return "Intake";
  if (phi < 360) return "Compression";
  if (phi < 540) return "Power";
  return "Exhaust";
}

export function Simulator({
  onTelemetry,
  onStall,
}: {
  onTelemetry: (t: Telemetry) => void;
  onStall: (msg: string) => void;
}) {
  const { sim, ctrl } = useContext(Lab);
  const cb = useRef({ onTelemetry, onStall });
  cb.current = { onTelemetry, onStall };

  useFrame((_, delta) => {
    const s = sim.current;
    const c = ctrl.current;
    const dt = Math.min(delta, 0.05);
    const g = c.gear;
    const coupled = g > 0 && !c.clutch;
    const ratio = PRIMARY * GEARS[g] * FINAL;
    const rpmWheel = g > 0 ? ((s.v / R_W) * ratio * 60) / TWO_PI : 0;

    /* ── engine + drivetrain ── */
    let F = 0;
    if (c.engineOn) {
      if (coupled) {
        let rpm = rpmWheel;
        if (c.throttle > 0.06) rpm = Math.max(rpm, 1600 + c.throttle * 2400);
        s.rpm = Math.min(rpm, 9000);
        if (c.throttle <= 0.06 && rpmWheel < 750) {
          s.stallT += dt;
          if (s.stallT > 0.35) {
            s.stallT = -10;
            s.rpm = 0;
            cb.current.onStall(
              "Engine stalled! You released the clutch in gear at ~0 speed without giving throttle. Pull the clutch (or shift to N) when you stop.",
            );
          }
        } else if (s.stallT > 0) s.stallT = 0;
        let T: number;
        if (c.throttle > 0.03) T = engineTorque(s.rpm) * c.throttle;
        else T = -(0.8 + (s.rpm / 7500) * 1.6);
        F = (T * ratio * 0.9) / R_W;
      } else {
        const target = 1400 + c.throttle * 6100;
        s.rpm += (target - s.rpm) * Math.min(1, dt * (c.throttle > 0.02 ? 6 : 3));
        if (s.stallT < 0) s.stallT = 0;
      }
    } else {
      s.stallT = 0;
      if (coupled) {
        s.rpm = rpmWheel;
        const T = -(1.2 + (s.rpm / 7500) * 2.0);
        F = (T * ratio * 0.9) / R_W;
      } else s.rpm *= Math.exp(-dt * 4);
    }
    F = clamp(F, -0.9 * MASS * G, 0.8 * MASS * G);
    const drag = s.v > 0.01 ? 0.5 * 1.2 * 0.65 * s.v * s.v + 34 : 0;
    const Fb = s.v > 0.01 ? c.brake * 0.75 * MASS * G : 0;
    const a = (F - drag - Fb) / (MASS * 1.08);
    s.v = Math.max(0, s.v + a * dt);
    if (s.v < 0.02 && F <= 0) s.v = 0;
    s.accel += (a - s.accel) * Math.min(1, dt * 8);

    /* ── visual motion ── */
    const slow = c.slow;
    s.vVis = s.v * slow;
    s.wheelAng += (s.v / R_W) * slow * dt;
    const ef = Math.min(0.04, slow * 0.25);
    let crankW = ((s.rpm * TWO_PI) / 60) * ef;
    if (!c.engineOn && c.mode === "engine" && s.rpm < 30) crankW = 1.8;
    s.crankAng += crankW * dt;
    s.countAng = s.wheelAng * 3;
    s.chainS -= s.v * slow * (0.0849 / R_W) * dt;

    /* ── steering & lean ── */
    s.steerAct += (c.steer - s.steerAct) * Math.min(1, dt * 5);
    const kMin = 1 / 1.8;
    const kMax = s.v > 0.1 ? Math.min(kMin, (0.55 * G) / (s.v * s.v)) : kMin;
    const kappa = s.steerAct * kMax;
    s.lean = Math.atan((s.v * s.v * kappa) / G);
    const sf = Math.min(1, s.v / 10);
    s.steerAngle = Math.atan(WB * kappa) * (1 + 6 * sf);
    s.yawVis = s.v * kappa * slow;
    s.turnR = Math.abs(kappa) > 1e-4 ? 1 / Math.abs(kappa) : Infinity;

    /* ── speed breaker ── */
    if (c.bumpToken !== s.bumpSeen) {
      s.bumpSeen = c.bumpToken;
      s.sb = { on: true, x: 3.4, z: 0, h: 0 };
    }
    if (s.sb.on) {
      const dx = s.vVis * dt;
      const dy = s.yawVis * dt;
      const px = s.sb.x - dx;
      const cs = Math.cos(dy);
      const sn = Math.sin(dy);
      s.sb.x = px * cs + s.sb.z * sn;
      s.sb.z = -px * sn + s.sb.z * cs;
      s.sb.h += dy;
      if (s.sb.x < -6) s.sb.on = false;
    }

    /* ── suspension (spring–damper, time-scaled with the slow-mo factor) ── */
    const uf = bumpH(s.sb, 0.61);
    const ur = bumpH(s.sb, -0.62);
    const dtS = dt * Math.max(slow, 0.05);
    const wn = TWO_PI * 1.6;
    const zeta = 0.35;
    const ufv = (uf - s.lastUf) / Math.max(dtS, 1e-4);
    const urv = (ur - s.lastUr) / Math.max(dtS, 1e-4);
    s.lastUf = uf;
    s.lastUr = ur;
    s.zfv += (wn * wn * (uf - s.zf) + 2 * zeta * wn * (ufv - s.zfv)) * dtS;
    s.zf += s.zfv * dtS;
    s.zrv += (wn * wn * (ur - s.zr) + 2 * zeta * wn * (urv - s.zrv)) * dtS;
    s.zr += s.zrv * dtS;
    const tF = clamp(-s.accel * 0.0055, -0.02, 0.05);
    const tR = clamp(s.accel * 0.0045, -0.04, 0.03);
    s.ltf += (tF - s.ltf) * Math.min(1, dt * 6);
    s.ltr += (tR - s.ltr) * Math.min(1, dt * 6);
    s.compF = clamp(uf - s.zf + s.ltf, -0.03, 0.075);
    s.compR = clamp(ur - s.zr + s.ltr, -0.03, 0.06);
    const hf = uf - s.compF;
    const hr = ur - s.compR;
    s.heave = (hf + hr) / 2;
    s.pitch = (hf - hr) / WB;

    /* ── telemetry ── */
    s.teleT += dt;
    if (s.teleT > 0.1) {
      s.teleT = 0;
      const phi = (((s.crankAng * 180) / Math.PI) % 720 + 720) % 720;
      cb.current.onTelemetry({
        speed: s.v * 3.6,
        rpm: s.rpm,
        gear: g,
        lean: (s.lean * 180) / Math.PI,
        steerDeg: (s.steerAngle * 180) / Math.PI,
        fork: s.compF * 1000,
        shock: s.compR * 1000,
        stroke: strokeName(phi),
        phase: phi,
        accel: s.accel,
        turnR: s.turnR,
      });
    }
  });
  return null;
}

/* ───────────── road ───────────── */
export function Ground() {
  const { sim } = useContext(Lab);
  const inst = useRef<THREE.InstancedMesh>(null);
  const sbGroup = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(() => {
    const arr: { x: number; z: number; h: number }[] = [];
    for (let i = -7; i < 7; i++) for (let j = -7; j < 7; j++) arr.push({ x: i * 2 + (j % 2 === 0 ? 0 : 1), z: j * 2, h: 0 });
    return arr;
  }, []);

  const stripe = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 64;
    cv.height = 4;
    const x = cv.getContext("2d")!;
    x.fillStyle = "#f5c518";
    x.fillRect(0, 0, 32, 4);
    x.fillStyle = "#111";
    x.fillRect(32, 0, 32, 4);
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(8, 1);
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter;
    return t;
  }, []);

  useFrame((_, delta) => {
    const s = sim.current;
    const dt = Math.min(delta, 0.05);
    const dx = s.vVis * dt;
    const dy = s.yawVis * dt;
    const cs = Math.cos(dy);
    const sn = Math.sin(dy);
    const m = inst.current;
    if (m) {
      for (let i = 0; i < data.length; i++) {
        const p = data[i];
        const x = p.x - dx;
        let nx = x * cs + p.z * sn;
        let nz = -x * sn + p.z * cs;
        if (nx > 14) nx -= 28;
        else if (nx < -14) nx += 28;
        if (nz > 14) nz -= 28;
        else if (nz < -14) nz += 28;
        p.x = nx;
        p.z = nz;
        p.h += dy;
        dummy.position.set(nx, 0.004, nz);
        dummy.rotation.set(0, p.h, 0);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      }
      m.instanceMatrix.needsUpdate = true;
    }
    const g = sbGroup.current;
    if (g) {
      g.visible = s.sb.on;
      g.position.set(s.sb.x, 0, s.sb.z);
      g.rotation.y = s.sb.h;
    }
  });

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]}>
        <circleGeometry args={[20, 64]} />
        <meshStandardMaterial color="#20242b" roughness={0.95} metalness={0} />
      </mesh>
      <instancedMesh ref={inst} args={[undefined, undefined, data.length]} frustumCulled={false}>
        <boxGeometry args={[0.6, 0.008, 0.07]} />
        <meshStandardMaterial color="#8d97a6" roughness={0.9} />
      </instancedMesh>
      <group ref={sbGroup} visible={false}>
        <mesh position={[0, 0.1 - 3.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[3.25, 3.25, 3, 24, 1, false, Math.PI - 0.26, 0.52]} />
          <meshStandardMaterial map={stripe} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/* ───────────── camera ───────────── */
const PRESETS: Record<string, { pos: [number, number, number]; t: [number, number, number] }> = {
  iso: { pos: [2.1, 1.25, 2.7], t: [0, 0.5, 0] },
  right: { pos: [0.3, 0.75, 3.4], t: [0, 0.5, 0] },
  left: { pos: [0.3, 0.75, -3.4], t: [0, 0.5, 0] },
  front: { pos: [3.4, 0.8, 0.8], t: [0, 0.5, 0] },
  rear: { pos: [-3.4, 0.9, 0.8], t: [0, 0.5, 0] },
  top: { pos: [0.05, 4.3, 0.5], t: [0, 0.4, 0] },
  engine: { pos: [0.85, 0.62, 1.1], t: [-0.03, 0.36, 0] },
  chain: { pos: [-0.5, 0.45, -1.35], t: [-0.4, 0.3, -0.1] },
  front3: { pos: [1.6, 0.6, 1.1], t: [0.5, 0.45, 0] },
};

export function CameraRig() {
  const { ctrl } = useContext(Lab);
  const camera = useThree((s) => s.camera);
  const controls = useRef<any>(null);
  const goal = useRef<{ pos: THREE.Vector3; t: THREE.Vector3 } | null>(null);
  const seen = useRef(0);
  const c = ctrl.current;

  useEffect(() => {
    if (c.camToken === seen.current) return;
    seen.current = c.camToken;
    const p = PRESETS[c.camPreset] ?? PRESETS.iso;
    goal.current = { pos: new THREE.Vector3(...p.pos), t: new THREE.Vector3(...p.t) };
  }, [c.camToken, c.camPreset]);

  useFrame((_, dt) => {
    const gl = goal.current;
    const ct = controls.current;
    if (!gl || !ct) return;
    const k = 1 - Math.exp(-dt * 4.5);
    camera.position.lerp(gl.pos, k);
    ct.target.lerp(gl.t, k);
    ct.update();
    if (camera.position.distanceTo(gl.pos) < 0.015) goal.current = null;
  });

  return (
    <OrbitControls
      ref={controls}
      target={[0, 0.5, 0]}
      enablePan={false}
      minDistance={0.6}
      maxDistance={7}
      maxPolarAngle={Math.PI / 2 - 0.02}
      autoRotate={c.autoRotate}
      autoRotateSpeed={1.2}
      onStart={() => {
        goal.current = null;
      }}
    />
  );
}
