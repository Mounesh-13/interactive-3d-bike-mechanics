import { createContext, useContext, useMemo, useRef } from "react";
import type { MutableRefObject, ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type V3 = [number, number, number];
export type ViewMode = "normal" | "xray" | "engine";
export type PartKind = "body" | "mech" | "engine";

export interface BikeControls {
  mode: ViewMode;
  explode: number;
  selected: string | null;
  engineOn: boolean;
  throttle: number;
  brake: number;
  gear: number;
  clutch: boolean;
  steer: number;
  slow: number;
  bumpToken: number;
  camPreset: string;
  camToken: number;
  autoRotate: boolean;
}

export interface Telemetry {
  speed: number;
  rpm: number;
  gear: number;
  lean: number;
  steerDeg: number;
  fork: number;
  shock: number;
  stroke: string;
  phase: number;
  accel: number;
  turnR: number;
}

export interface Sim {
  v: number;
  rpm: number;
  wheelAng: number;
  crankAng: number;
  countAng: number;
  chainS: number;
  steerAct: number;
  steerAngle: number;
  lean: number;
  yawVis: number;
  vVis: number;
  accel: number;
  turnR: number;
  stallT: number;
  zf: number;
  zfv: number;
  zr: number;
  zrv: number;
  lastUf: number;
  lastUr: number;
  ltf: number;
  ltr: number;
  compF: number;
  compR: number;
  heave: number;
  pitch: number;
  teleT: number;
  bumpSeen: number;
  sb: { on: boolean; x: number; z: number; h: number };
}

export function newSim(): Sim {
  return {
    v: 0,
    rpm: 0,
    wheelAng: 0,
    crankAng: 0,
    countAng: 0,
    chainS: 0,
    steerAct: 0,
    steerAngle: 0,
    lean: 0,
    yawVis: 0,
    vVis: 0,
    accel: 0,
    turnR: Infinity,
    stallT: 0,
    zf: 0,
    zfv: 0,
    zr: 0,
    zrv: 0,
    lastUf: 0,
    lastUr: 0,
    ltf: 0,
    ltr: 0,
    compF: 0,
    compR: 0,
    heave: 0,
    pitch: 0,
    teleT: 0,
    bumpSeen: 0,
    sb: { on: false, x: 10, z: 0, h: 0 },
  };
}

/* ───── geometry constants (metres, bike faces +X, right side is +Z) ───── */
export const RAKE = (26 * Math.PI) / 180;
export const FORK_L = 0.72;
export const HEAD: V3 = [0.294, 0.947, 0];
export const PIV: V3 = [-0.33, 0.31, 0];
export const AXLE_R_REL: V3 = [-0.29, -0.01, 0];
export const ARM = 0.29;
export const ENG: V3 = [-0.05, 0.32, 0];
export const TILT = (55 * Math.PI) / 180;
export const WB = 1.23;
export const R_W = 0.3;
export const TWO_PI = Math.PI * 2;

export const COL = {
  red: "#b3121a",
  black: "#17181c",
  chrome: "#d8dce1",
  alu: "#a8aeb5",
  dark: "#2a2c31",
  rubber: "#0e0e10",
};

/* ───── context ───── */
export interface LabCtx {
  selected: string | null;
  hovered: string | null;
  mode: ViewMode;
  ctrl: MutableRefObject<BikeControls>;
  sim: MutableRefObject<Sim>;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
}
export const Lab = createContext<LabCtx>(null as unknown as LabCtx);
const PartCtx = createContext<{ id: string; kind: PartKind }>({ id: "", kind: "mech" });

export function ghostOpacity(kind: PartKind, shell: boolean, mode: ViewMode): number {
  if (mode === "normal") return 1;
  if (mode === "xray") {
    if (kind === "body") return 0.14;
    if (shell) return 0.2;
    return 1;
  }
  if (kind === "engine") return shell ? 0.22 : 1;
  return kind === "body" ? 0.04 : 0.1;
}

interface MProps {
  color: string;
  metal?: number;
  rough?: number;
  shell?: boolean;
  side?: THREE.Side;
  emissive?: string;
  ei?: number;
}

/** Material that reacts to hover / selection / x-ray mode of its parent Part */
export function M({ color, metal = 0.3, rough = 0.55, shell = false, side, emissive, ei = 0 }: MProps) {
  const { selected, hovered, mode } = useContext(Lab);
  const p = useContext(PartCtx);
  const o = ghostOpacity(p.kind, shell, mode);
  const sel = p.id !== "" && selected === p.id;
  const hov = p.id !== "" && hovered === p.id;
  const em = sel ? "#ff7a00" : hov ? "#ffb347" : (emissive ?? "#000000");
  const emi = sel ? 0.55 : hov ? 0.3 : ei;
  return (
    <meshStandardMaterial
      key={o < 1 ? "g" : "s"}
      color={color}
      metalness={metal}
      roughness={rough}
      transparent={o < 1}
      opacity={o}
      depthWrite={o >= 1}
      emissive={em}
      emissiveIntensity={emi}
      {...(side !== undefined ? { side } : {})}
    />
  );
}

interface PartProps {
  id: string;
  kind?: PartKind;
  position?: V3;
  rotation?: V3;
  explode?: V3;
  children?: ReactNode;
}

/** Clickable, hoverable, explodable group */
export function Part({
  id,
  kind = "mech",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  explode = [0, 0, 0],
  children,
}: PartProps) {
  const L = useContext(Lab);
  const g = useRef<THREE.Group>(null);
  const cur = useRef(0);
  useFrame((_, dt) => {
    const t = L.ctrl.current.explode;
    cur.current += (t - cur.current) * Math.min(1, dt * 6);
    const e = cur.current;
    if (g.current) {
      g.current.position.set(
        position[0] + explode[0] * e,
        position[1] + explode[1] * e,
        position[2] + explode[2] * e,
      );
    }
  });
  const live = ghostOpacity(kind, false, L.mode) > 0.5;
  return (
    <PartCtx.Provider value={{ id, kind }}>
      <group
        ref={g}
        position={position}
        rotation={rotation}
        onClick={(e) => {
          if (!live) return;
          e.stopPropagation();
          L.select(id);
        }}
        onPointerOver={(e) => {
          if (!live) return;
          e.stopPropagation();
          L.hover(id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          L.hover(null);
          document.body.style.cursor = "auto";
        }}
      >
        {children}
      </group>
    </PartCtx.Provider>
  );
}

/** Cylinder between two points */
export function Tube({
  a,
  b,
  r = 0.012,
  seg = 10,
  color = COL.dark,
  metal = 0.4,
  rough = 0.5,
  shell = false,
}: {
  a: V3;
  b: V3;
  r?: number;
  seg?: number;
  color?: string;
  metal?: number;
  rough?: number;
  shell?: boolean;
}) {
  const g = useMemo(() => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const d = vb.clone().sub(va);
    const len = Math.max(d.length(), 1e-5);
    const mid = va.clone().add(vb).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      d.clone().normalize(),
    );
    return { mid, q, len };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a[0], a[1], a[2], b[0], b[1], b[2]]);
  return (
    <mesh position={g.mid} quaternion={g.q}>
      <cylinderGeometry args={[r, r, g.len, seg]} />
      <M color={color} metal={metal} rough={rough} shell={shell} />
    </mesh>
  );
}

/** Rotating group driven by simulation angle */
export function Spin({
  of,
  k = 1,
  offset = 0,
  dir = -1,
  position = [0, 0, 0],
  children,
}: {
  of: "wheelAng" | "crankAng" | "countAng";
  k?: number;
  offset?: number;
  dir?: 1 | -1;
  position?: V3;
  children?: ReactNode;
}) {
  const { sim } = useContext(Lab);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.z = dir * (offset + sim.current[of] * k);
  });
  return (
    <group ref={g} position={position}>
      {children}
    </group>
  );
}

/** Coil spring along +Y */
export function Helix({
  radius,
  length,
  turns,
  wire,
  color,
  metal = 0.8,
  rough = 0.35,
}: {
  radius: number;
  length: number;
  turns: number;
  wire: number;
  color: string;
  metal?: number;
  rough?: number;
}) {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const n = turns * 12;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = t * turns * TWO_PI;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, t * length, Math.sin(a) * radius));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, n * 2, wire, 6, false);
  }, [radius, length, turns, wire]);
  return (
    <mesh geometry={geo}>
      <M color={color} metal={metal} rough={rough} />
    </mesh>
  );
}
