import { useContext, useLayoutEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import {
  ARM,
  AXLE_R_REL,
  COL,
  ENG,
  FORK_L,
  HEAD,
  Helix,
  Lab,
  M,
  PIV,
  Part,
  RAKE,
  Spin,
  TILT,
  TWO_PI,
  Tube,
} from "./shared";
import type { V3 } from "./shared";
import { FINAL, GEARS, PRIMARY } from "./Sim";

const SIDES: (1 | -1)[] = [-1, 1];
const PI = Math.PI;
const FS: [number, number] = [-0.235, 0.305]; // front sprocket (body coords)
const CHAIN_Z = -0.125;
const R1 = 0.0286;
const R2 = 0.0849;

/* ════════════════════════ FRAME ════════════════════════ */
function Frame() {
  const tubes = useMemo(() => {
    const t: [V3, V3, number][] = [
      [[0.292, 0.952, 0], [0.362, 0.815, 0], 0.021],
      [[0.335, 0.875, 0], [-0.12, 0.7, 0], 0.017],
      [[0.352, 0.83, 0], [0.22, 0.38, 0], 0.016],
      [[0.12, 0.27, -0.15], [0.12, 0.27, 0.15], 0.011],
      [[-0.7, 0.78, -0.1], [-0.7, 0.78, 0.1], 0.01],
    ];
    for (const s of SIDES) {
      t.push([[0.22, 0.38, 0], [0.12, 0.27, 0.15 * s], 0.013]);
      t.push([[0.12, 0.27, 0.15 * s], [-0.33, 0.3, 0.15 * s], 0.013]);
      t.push([[-0.33, 0.3, 0.15 * s], [-0.24, 0.714, 0.1 * s], 0.013]);
      t.push([[-0.12, 0.7, 0], [-0.12, 0.7, 0.1 * s], 0.011]);
      t.push([[-0.12, 0.7, 0.1 * s], [-0.7, 0.78, 0.1 * s], 0.011]);
      t.push([[-0.2865, 0.5, 0.126 * s], [-0.52, 0.762, 0.1 * s], 0.009]);
      t.push([[-0.47, 0.748, 0.1 * s], [-0.47, 0.72, 0.17 * s], 0.007]);
      t.push([[-0.1, 0.285, 0.15 * s], [-0.1, 0.255, 0.235 * s], 0.009]);
    }
    return t;
  }, []);
  return (
    <Part id="frame" kind="mech" explode={[0, 0, 0]}>
      {tubes.map((t, i) => (
        <Tube key={i} a={t[0]} b={t[1]} r={t[2]} color={COL.black} metal={0.5} rough={0.35} />
      ))}
      {SIDES.map((s) => (
        <Tube key={"p" + s} a={[-0.1, 0.255, 0.2 * s]} b={[-0.1, 0.255, 0.265 * s]} r={0.015} color={COL.rubber} rough={0.9} metal={0} />
      ))}
    </Part>
  );
}

/* ════════════════════════ WHEEL ════════════════════════ */
function WheelMesh() {
  const spokes = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = spokes.current;
    if (!m) return;
    const d = new THREE.Object3D();
    const n = 36;
    for (let i = 0; i < n; i++) {
      const a = (i * TWO_PI) / n;
      const side = i % 2 === 0 ? 1 : -1;
      const cross = (i % 4 < 2 ? 1 : -1) * 0.2;
      const p0 = new THREE.Vector3(0.048 * Math.cos(a), 0.048 * Math.sin(a), 0.03 * side);
      const p1 = new THREE.Vector3(0.228 * Math.cos(a + cross), 0.228 * Math.sin(a + cross), 0);
      const dir = p1.clone().sub(p0);
      const len = dir.length();
      d.position.copy(p0).add(p1).multiplyScalar(0.5);
      d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      d.scale.set(1, len, 1);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <Spin of="wheelAng">
      <mesh scale={[1, 1, 1.35]}>
        <torusGeometry args={[0.262, 0.038, 18, 72]} />
        <M color="#111214" metal={0} rough={0.95} />
      </mesh>
      <mesh rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.226, 0.226, 0.05, 48, 1, true]} />
        <M color="#c8cdd3" metal={0.9} rough={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.09, 24]} />
        <M color="#b9bec4" metal={0.85} rough={0.3} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0, 0.034 * s]} rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.006, 24]} />
          <M color="#c8cdd3" metal={0.9} rough={0.3} />
        </mesh>
      ))}
      <instancedMesh ref={spokes} args={[undefined, undefined, 36]}>
        <cylinderGeometry args={[0.0017, 0.0017, 1, 4]} />
        <M color="#d3d7dc" metal={1} rough={0.3} />
      </instancedMesh>
    </Spin>
  );
}

function DrumBrake() {
  return (
    <>
      <Spin of="wheelAng">
        <mesh position={[0, 0, 0.052]} rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.066, 0.066, 0.044, 32, 1, true]} />
          <M color="#b4b9bf" metal={0.8} rough={0.35} shell side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.03]} rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.066, 0.066, 0.004, 32]} />
          <M color="#b4b9bf" metal={0.8} rough={0.35} shell />
        </mesh>
      </Spin>
      <mesh position={[0, 0, 0.076]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.067, 0.067, 0.006, 32]} />
        <M color="#26282c" metal={0.6} rough={0.45} shell />
      </mesh>
      {[0, PI].map((r, i) => (
        <group key={i} position={[0, 0, 0.052]} rotation={[0, 0, r + 0.3]}>
          <mesh rotation={[PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.0585, 0.0585, 0.026, 20, 1, true, 0, 2.2]} />
            <M color="#6b4a2b" metal={0} rough={0.95} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.052, 0.052, 0.022, 20, 1, true, 0, 2.2]} />
            <M color="#8a8f95" metal={0.8} rough={0.4} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.052, 0.052]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.03, 10]} />
        <M color="#e3b04b" metal={0.8} rough={0.3} />
      </mesh>
      <Tube a={[0, 0.052, 0.082]} b={[-0.075, 0.1, 0.086]} r={0.005} color="#b9bec4" metal={0.8} />
    </>
  );
}

/* ════════════════════════ CHAIN ════════════════════════ */
function buildPath(c1: [number, number], r1: number, c2: [number, number], r2: number) {
  const dx = c2[0] - c1[0];
  const dy = c2[1] - c1[1];
  const d = Math.hypot(dx, dy);
  const phi = Math.atan2(dy, dx);
  const beta = Math.acos((r1 - r2) / d);
  const n1 = phi + beta;
  const n2 = phi - beta;
  const top = Math.sin(n1) > Math.sin(n2) ? n1 : n2;
  const bot = top === n1 ? n2 : n1;
  const pts: number[] = [];
  pts.push(c1[0] + r1 * Math.cos(top), c1[1] + r1 * Math.sin(top));
  pts.push(c2[0] + r2 * Math.cos(top), c2[1] + r2 * Math.sin(top));
  const N = 14;
  const d2 = bot - top;
  for (let i = 1; i <= N; i++) {
    const a = top + (d2 * i) / N;
    pts.push(c2[0] + r2 * Math.cos(a), c2[1] + r2 * Math.sin(a));
  }
  pts.push(c1[0] + r1 * Math.cos(bot), c1[1] + r1 * Math.sin(bot));
  const d1 = d2 < 0 ? -(TWO_PI + d2) : TWO_PI - d2;
  for (let i = 1; i < N; i++) {
    const a = bot + (d1 * i) / N;
    pts.push(c1[0] + r1 * Math.cos(a), c1[1] + r1 * Math.sin(a));
  }
  return pts;
}

function ChainLinks() {
  const { sim } = useContext(Lab);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const N = 86;
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const s = sim.current;
    const a = -s.compR / ARM;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const c2: [number, number] = [
      PIV[0] + AXLE_R_REL[0] * ca - AXLE_R_REL[1] * sa,
      PIV[1] + AXLE_R_REL[0] * sa + AXLE_R_REL[1] * ca,
    ];
    const pts = buildPath(FS, R1, c2, R2);
    const n = pts.length / 2;
    const cum: number[] = [0];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      cum.push(cum[i] + Math.hypot(pts[j * 2] - pts[i * 2], pts[j * 2 + 1] - pts[i * 2 + 1]));
    }
    const total = cum[n];
    for (let i = 0; i < N; i++) {
      const dd = (((s.chainS + (i * total) / N) % total) + total) % total;
      let k = 0;
      while (k < n - 1 && cum[k + 1] < dd) k++;
      const j = (k + 1) % n;
      const t = (dd - cum[k]) / Math.max(cum[k + 1] - cum[k], 1e-6);
      const x = pts[k * 2] + (pts[j * 2] - pts[k * 2]) * t;
      const y = pts[k * 2 + 1] + (pts[j * 2 + 1] - pts[k * 2 + 1]) * t;
      const ang = Math.atan2(pts[j * 2 + 1] - pts[k * 2 + 1], pts[j * 2] - pts[k * 2]);
      dummy.position.set(x, y, CHAIN_Z);
      dummy.rotation.set(0, 0, ang);
      dummy.scale.set(1, 1, i % 2 ? 0.7 : 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, N]} frustumCulled={false}>
      <boxGeometry args={[0.0125, 0.008, 0.011]} />
      <M color="#9aa0a7" metal={0.9} rough={0.35} />
    </instancedMesh>
  );
}

function Sprocket({ teeth, r }: { teeth: number; r: number }) {
  return (
    <>
      <mesh rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[r + 0.003, r + 0.003, 0.006, teeth]} />
        <M color="#8e949b" metal={0.9} rough={0.4} />
      </mesh>
      <mesh rotation={[PI / 2, 0, 0]} position={[0, 0, 0.004]}>
        <cylinderGeometry args={[r * 0.7, r * 0.7, 0.004, 24]} />
        <M color="#3b3e44" metal={0.7} rough={0.5} />
      </mesh>
    </>
  );
}

/* ════════════════════════ ENGINE ════════════════════════ */
const MAIN: [number, number] = [-0.115, 0.015];
const COUNT: [number, number] = [-0.185, -0.015];
const GEAR_D = Math.hypot(MAIN[0] - COUNT[0], MAIN[1] - COUNT[1]);
const GEAR_Z = [-0.045, -0.012, 0.021, 0.054];

function EngineCases() {
  return (
    <Part id="engine" kind="engine" explode={[0, -0.3, 0]}>
      <RoundedBox args={[0.32, 0.2, 0.2]} radius={0.02} smoothness={3} position={[-0.09, -0.01, 0]}>
        <M color="#a8aeb5" metal={0.75} rough={0.4} shell />
      </RoundedBox>
      <mesh position={[MAIN[0], MAIN[1] + 0.005, -0.108]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.072, 0.072, 0.012, 32]} />
        <M color="#b9bfc6" metal={0.8} rough={0.35} shell />
      </mesh>
      <mesh position={[0, 0, 0.108]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.078, 0.078, 0.012, 32]} />
        <M color="#b9bfc6" metal={0.8} rough={0.35} shell />
      </mesh>
      <mesh position={[-0.17, -0.055, 0.106]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.006, 20]} />
        <M color="#3b82f6" metal={0.2} rough={0.2} emissive="#1d4ed8" ei={0.4} />
      </mesh>
      <mesh position={[-0.05, 0.1, 0.06]}>
        <cylinderGeometry args={[0.014, 0.014, 0.02, 16]} />
        <M color="#d9a441" metal={0.8} rough={0.3} />
      </mesh>
    </Part>
  );
}

function GearSet() {
  const rm = GEARS.slice(1).map((g) => GEAR_D / (1 + g));
  const rc = GEARS.slice(1).map((g) => GEAR_D - GEAR_D / (1 + g));
  return (
    <Part id="gearbox" kind="engine" explode={[-0.1, -0.2, 0.05]}>
      <Spin of="crankAng" k={1 / PRIMARY} dir={1} position={[MAIN[0], MAIN[1], 0]}>
        <mesh rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.17, 12]} />
          <M color="#c3c8ce" metal={0.9} rough={0.3} />
        </mesh>
        {rm.map((r, i) => (
          <mesh key={i} position={[0, 0, GEAR_Z[i]]} rotation={[PI / 2, 0, 0]}>
            <cylinderGeometry args={[r, r, 0.016, Math.max(8, Math.round(r * 520))]} />
            <M color="#d4a64a" metal={0.85} rough={0.35} />
          </mesh>
        ))}
      </Spin>
      <Spin of="countAng" dir={-1} position={[COUNT[0], COUNT[1], 0]}>
        <mesh rotation={[PI / 2, 0, 0]} position={[0, 0, -0.025]}>
          <cylinderGeometry args={[0.008, 0.008, 0.2, 12]} />
          <M color="#c3c8ce" metal={0.9} rough={0.3} />
        </mesh>
        {rc.map((r, i) => (
          <mesh key={i} position={[0, 0, GEAR_Z[i]]} rotation={[PI / 2, 0, 0]}>
            <cylinderGeometry args={[r, r, 0.016, Math.max(8, Math.round(r * 520))]} />
            <M color="#4d8f7a" metal={0.85} rough={0.35} />
          </mesh>
        ))}
      </Spin>
      <mesh position={[-0.15, -0.085, 0]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.016, 0.016, 0.11, 16]} />
        <M color="#3a3d42" metal={0.7} rough={0.4} />
      </mesh>
    </Part>
  );
}

function ClutchPack() {
  return (
    <Part id="clutch" kind="engine" explode={[0, 0.0, -0.3]}>
      <Spin of="crankAng" k={1 / PRIMARY} dir={1} position={[MAIN[0], MAIN[1], 0]}>
        <mesh position={[0, 0, -0.082]} rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.056, 0.056, 0.046, 32, 1, true]} />
          <M color="#8d9299" metal={0.8} rough={0.4} shell side={THREE.DoubleSide} />
        </mesh>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <mesh key={i} position={[0, 0, -0.064 - i * 0.0058]} rotation={[PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.0045, 32]} />
            <M color={i % 2 === 0 ? "#c3c8ce" : "#7b5a34"} metal={i % 2 === 0 ? 0.9 : 0.05} rough={0.6} />
          </mesh>
        ))}
        <mesh position={[0, 0, -0.103]} rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.042, 0.042, 0.004, 24]} />
          <M color="#555a61" metal={0.8} rough={0.4} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[Math.cos((i * PI) / 2) * 0.03, Math.sin((i * PI) / 2) * 0.03, -0.106]} rotation={[PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.008, 10]} />
            <M color="#e2e5e9" metal={1} rough={0.25} />
          </mesh>
        ))}
      </Spin>
    </Part>
  );
}

function CrankAssembly() {
  return (
    <Part id="crankshaft" kind="engine" explode={[0, -0.05, 0.4]}>
      <Spin of="crankAng" offset={TILT} dir={-1}>
        <mesh rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.24, 16]} />
          <M color="#c3c8ce" metal={0.9} rough={0.3} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[0, 0, 0.024 * s]} rotation={[PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.012, 32]} />
              <M color="#7d828a" metal={0.85} rough={0.35} />
            </mesh>
            <mesh position={[0, -0.032, 0.024 * s]}>
              <boxGeometry args={[0.07, 0.03, 0.012]} />
              <M color="#4b4f55" metal={0.8} rough={0.4} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.0275, 0]} rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.011, 0.011, 0.05, 16]} />
          <M color="#e3b04b" metal={0.9} rough={0.25} />
        </mesh>
      </Spin>
    </Part>
  );
}

function MagnetoAssembly() {
  return (
    <Part id="magneto" kind="engine" explode={[0, 0, 0.55]}>
      <mesh position={[0, 0, 0.05]} rotation={[PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.032, 0.032, 0.008, 20]} />
        <M color="#2d3035" metal={0.5} rough={0.6} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i * PI) / 3;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.04, Math.sin(a) * 0.04, 0.054]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.022, 0.014, 0.016]} />
            <M color="#b87333" metal={0.8} rough={0.4} />
          </mesh>
        );
      })}
      <Spin of="crankAng" dir={-1} position={[0, 0, 0.074]}>
        <mesh rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.064, 0.064, 0.026, 32, 1, true]} />
          <M color="#2c2f33" metal={0.6} rough={0.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.011]} rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.064, 0.064, 0.004, 32]} />
          <M color="#2c2f33" metal={0.6} rough={0.5} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i * PI) / 3 + PI / 6;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.059, Math.sin(a) * 0.059, 0]} rotation={[0, 0, a]}>
              <boxGeometry args={[0.008, 0.026, 0.02]} />
              <M color="#c0392b" metal={0.4} rough={0.5} />
            </mesh>
          );
        })}
      </Spin>
    </Part>
  );
}

function CylinderInternals() {
  const { sim, ctrl } = useContext(Lab);
  const pistonRef = useRef<THREE.Group>(null);
  const rodRef = useRef<THREE.Mesh>(null);
  const gasRef = useRef<THREE.Mesh>(null);
  const gasMat = useRef<THREE.MeshBasicMaterial>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const ivRef = useRef<THREE.Group>(null);
  const evRef = useRef<THREE.Group>(null);
  const r = 0.0275;
  const l = 0.095;

  useFrame(() => {
    const s = sim.current;
    const th = s.crankAng % TWO_PI;
    const phi = (((s.crankAng * 180) / PI) % 720 + 720) % 720;
    const y = r * Math.cos(th) + Math.sqrt(l * l - r * r * Math.sin(th) ** 2);
    if (pistonRef.current) pistonRef.current.position.y = y;
    const px = r * Math.sin(th);
    const py = r * Math.cos(th);
    const len = Math.hypot(px, y - py);
    if (rodRef.current) {
      rodRef.current.position.set(px / 2, (py + y) / 2, 0);
      rodRef.current.rotation.z = Math.atan2(px, y - py);
      rodRef.current.scale.y = len;
    }
    const visible = ctrl.current.mode !== "normal";
    if (gasRef.current) {
      const crown = y + 0.03;
      const h = Math.max(0.002, 0.162 - crown);
      gasRef.current.position.y = crown + h / 2;
      gasRef.current.scale.y = h;
      gasRef.current.visible = visible;
    }
    if (gasMat.current) {
      if (phi < 180) gasMat.current.color.setRGB(0.45, 0.75, 1.0);
      else if (phi < 360) {
        const k = (phi - 180) / 180;
        gasMat.current.color.setRGB(0.3 - 0.1 * k, 0.45 - 0.1 * k, 1.0 - 0.2 * k);
      } else if (phi < 540) {
        const k = (phi - 360) / 180;
        gasMat.current.color.setRGB(1.0, 0.75 - 0.4 * k, 0.15);
      } else gasMat.current.color.setRGB(0.55, 0.55, 0.58);
    }
    const spark = phi > 338 && phi < 372;
    if (flashRef.current) {
      flashRef.current.visible = visible && spark;
      const k = 1 + Math.sin(((phi - 338) / 34) * PI) * 1.5;
      flashRef.current.scale.setScalar(k);
    }
    const iph = (phi + 10) % 720;
    const eph = (phi - 530 + 720) % 720;
    const il = iph < 200 ? Math.sin((PI * iph) / 200) : 0;
    const el = eph < 200 ? Math.sin((PI * eph) / 200) : 0;
    if (ivRef.current) ivRef.current.position.y = -il * 0.009;
    if (evRef.current) evRef.current.position.y = -el * 0.009;
  });

  const lobeI = 225 * (PI / 180);
  const lobeE = 135 * (PI / 180);
  const valve = (x: number, ref: RefObject<THREE.Group | null>, color: string) => (
    <group position={[x, 0, 0]}>
      <group ref={ref}>
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.011, 0.011, 0.003, 16]} />
          <M color={color} metal={0.9} rough={0.3} />
        </mesh>
        <mesh position={[0, 0.192, 0]}>
          <cylinderGeometry args={[0.0028, 0.0028, 0.06, 8]} />
          <M color="#d8dce1" metal={1} rough={0.2} />
        </mesh>
        <group position={[0, 0.168, 0]}>
          <Helix radius={0.0085} length={0.05} turns={6} wire={0.0013} color="#c9ccd1" />
        </group>
      </group>
    </group>
  );

  return (
    <>
      <Part id="cylinder" kind="engine" explode={[0, 0.16, 0]}>
        <mesh position={[0, 0.099, 0]}>
          <cylinderGeometry args={[0.042, 0.042, 0.118, 28]} />
          <M color="#202226" metal={0.5} rough={0.55} shell />
        </mesh>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <mesh key={i} position={[0, 0.07 + i * 0.0125, 0]}>
            <cylinderGeometry args={[0.066, 0.066, 0.0045, 28]} />
            <M color="#202226" metal={0.5} rough={0.55} shell />
          </mesh>
        ))}
        <mesh position={[0, 0.195, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.074, 28]} />
          <M color="#26282c" metal={0.5} rough={0.55} shell />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 0.172 + i * 0.015, 0]}>
            <cylinderGeometry args={[0.067, 0.067, 0.0045, 28]} />
            <M color="#26282c" metal={0.5} rough={0.55} shell />
          </mesh>
        ))}
        <mesh position={[0, 0.244, 0]}>
          <cylinderGeometry args={[0.047, 0.047, 0.02, 28]} />
          <M color="#b9bfc6" metal={0.8} rough={0.35} shell />
        </mesh>
        <mesh position={[0.055, 0.2, 0]} rotation={[0, 0, PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, 0.04, 16]} />
          <M color="#b9bfc6" metal={0.8} rough={0.4} shell />
        </mesh>
        <mesh position={[-0.06, 0.2, 0]} rotation={[0, 0, PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.04, 16]} />
          <M color="#b9bfc6" metal={0.8} rough={0.4} shell />
        </mesh>
      </Part>

      <Part id="piston" kind="engine" explode={[0, 0.07, 0.0]}>
        <group ref={pistonRef}>
          <mesh position={[0, 0.002, 0]}>
            <cylinderGeometry args={[0.0238, 0.0238, 0.056, 24]} />
            <M color="#d9dde1" metal={0.85} rough={0.3} />
          </mesh>
          {[0.02, 0.012, 0.004].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[PI / 2, 0, 0]}>
              <torusGeometry args={[0.0239, 0.0017, 6, 24]} />
              <M color="#3a3d42" metal={0.8} rough={0.4} />
            </mesh>
          ))}
          <mesh rotation={[PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.0055, 0.0055, 0.042, 12]} />
            <M color="#6f757c" metal={0.9} rough={0.3} />
          </mesh>
        </group>
        <mesh ref={rodRef}>
          <cylinderGeometry args={[0.0075, 0.0075, 1, 10]} />
          <M color="#9ca2a9" metal={0.9} rough={0.3} />
        </mesh>
      </Part>

      <Part id="valves" kind="engine" explode={[0, 0.22, 0]}>
        {valve(-0.02, ivRef, "#4dd0e1")}
        {valve(0.02, evRef, "#ef6c4a")}
        <Spin of="crankAng" k={0.5} dir={-1} position={[0, 0.236, 0]}>
          <mesh rotation={[PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.09, 12]} />
            <M color="#c3c8ce" metal={0.9} rough={0.3} />
          </mesh>
          {[
            { a: lobeI, z: -0.016 },
            { a: lobeE, z: 0.016 },
          ].map((lb, i) => (
            <mesh
              key={i}
              position={[-Math.sin(lb.a) * 0.008, Math.cos(lb.a) * 0.008, lb.z]}
              rotation={[0, 0, lb.a]}
            >
              <boxGeometry args={[0.016, 0.026, 0.012]} />
              <M color="#e3b04b" metal={0.9} rough={0.3} />
            </mesh>
          ))}
        </Spin>
      </Part>

      <mesh ref={gasRef} visible={false}>
        <cylinderGeometry args={[0.0235, 0.0235, 1, 20]} />
        <meshBasicMaterial ref={gasMat} color="#7ac" transparent opacity={0.6} depthWrite={false} />
      </mesh>
      <mesh ref={flashRef} position={[0, 0.162, 0]} visible={false}>
        <sphereGeometry args={[0.01, 12, 12]} />
        <meshBasicMaterial color="#fff2a8" />
      </mesh>
    </>
  );
}

function EngineGroup() {
  return (
    <group position={ENG}>
      <EngineCases />
      <GearSet />
      <ClutchPack />
      <CrankAssembly />
      <MagnetoAssembly />
      <group rotation={[0, 0, -TILT]}>
        <CylinderInternals />
      </group>
    </group>
  );
}

/* ════════════════════════ FUEL / ELECTRICAL (body coords) ════════════════════════ */
function ExhaustSystem() {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      [
        [0.142, 0.394, 0],
        [0.19, 0.34, 0.05],
        [0.225, 0.27, 0.13],
        [0.17, 0.19, 0.19],
        [0.0, 0.185, 0.205],
        [-0.25, 0.19, 0.21],
      ].map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    );
    return new THREE.TubeGeometry(curve, 60, 0.0155, 12, false);
  }, []);
  return (
    <Part id="exhaust" kind="mech" explode={[0, -0.25, 0.5]}>
      <mesh geometry={geo}>
        <M color="#cfd3d8" metal={1} rough={0.22} />
      </mesh>
      <mesh position={[0.142, 0.394, 0]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <M color="#cfd3d8" metal={1} rough={0.3} />
      </mesh>
      <Tube a={[-0.27, 0.19, 0.21]} b={[-0.8, 0.3, 0.215]} r={0.048} seg={24} color="#d4d8dd" metal={1} rough={0.18} />
      <Tube a={[-0.4, 0.215, 0.21]} b={[-0.58, 0.248, 0.213]} r={0.053} seg={24} color="#8d9299" metal={1} rough={0.3} />
      <Tube a={[-0.79, 0.298, 0.215]} b={[-0.83, 0.305, 0.215]} r={0.04} seg={20} color="#111" metal={0.3} rough={0.6} />
    </Part>
  );
}

function CarbAndIntake() {
  return (
    <>
      <Part id="carb" kind="mech" explode={[0.2, 0.35, 0]}>
        <Tube a={[0.079, 0.484, 0]} b={[0.01, 0.58, 0]} r={0.021} seg={16} color="#7a8088" metal={0.8} rough={0.4} />
        <mesh position={[0.039, 0.585, 0]}>
          <cylinderGeometry args={[0.019, 0.019, 0.05, 16]} />
          <M color="#d8dce1" metal={1} rough={0.25} />
        </mesh>
        <mesh position={[0.039, 0.5, 0]}>
          <cylinderGeometry args={[0.024, 0.024, 0.032, 16]} />
          <M color="#6a7077" metal={0.8} rough={0.4} />
        </mesh>
        <mesh position={[0.039, 0.53, 0.026]} rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.03, 8]} />
          <M color="#e3b04b" metal={0.8} rough={0.3} />
        </mesh>
      </Part>
      <Part id="airfilter" kind="mech" explode={[-0.05, 0.45, 0]}>
        <RoundedBox args={[0.17, 0.13, 0.14]} radius={0.015} smoothness={3} position={[-0.2, 0.585, 0]}>
          <M color="#2f3338" metal={0.2} rough={0.7} shell />
        </RoundedBox>
        <mesh position={[-0.2, 0.585, 0]}>
          <boxGeometry args={[0.12, 0.09, 0.1]} />
          <M color="#e2c26b" metal={0} rough={1} />
        </mesh>
        <Tube a={[0.005, 0.583, 0]} b={[-0.115, 0.589, 0]} r={0.022} seg={16} color="#1b1c20" metal={0.1} rough={0.8} />
      </Part>
    </>
  );
}

function PlugAndCoil() {
  return (
    <>
      <Part id="sparkplug" kind="mech" explode={[0.2, 0.2, 0.5]}>
        <mesh position={[0.114, 0.435, 0.057]} rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.016, 6]} />
          <M color="#c3c8ce" metal={1} rough={0.3} />
        </mesh>
        <mesh position={[0.114, 0.435, 0.085]} rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.0085, 0.0085, 0.04, 12]} />
          <M color="#f4f1ea" metal={0} rough={0.3} />
        </mesh>
        <mesh position={[0.114, 0.435, 0.115]} rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.013, 0.013, 0.026, 14]} />
          <M color="#141416" metal={0.1} rough={0.6} />
        </mesh>
        <Tube a={[0.114, 0.435, 0.125]} b={[0.114, 0.5, 0.13]} r={0.004} color="#111" metal={0} rough={0.8} />
        <Tube a={[0.114, 0.5, 0.13]} b={[0.12, 0.742, 0.065]} r={0.004} color="#111" metal={0} rough={0.8} />
      </Part>
      <Part id="coil" kind="mech" explode={[0.2, 0.5, 0.1]}>
        <RoundedBox args={[0.05, 0.035, 0.04]} radius={0.005} position={[0.12, 0.752, 0.05]}>
          <M color="#1f3a5f" metal={0.2} rough={0.6} />
        </RoundedBox>
      </Part>
    </>
  );
}

function BatteryEtc() {
  return (
    <>
      <Part id="battery" kind="mech" explode={[-0.1, -0.1, 0.5]}>
        <RoundedBox args={[0.085, 0.12, 0.07]} radius={0.006} position={[-0.4, 0.5, 0]}>
          <M color="#e6e8ea" metal={0.1} rough={0.6} />
        </RoundedBox>
        <mesh position={[-0.4, 0.563, -0.02]}>
          <boxGeometry args={[0.02, 0.008, 0.012]} />
          <M color="#c0392b" metal={0.5} rough={0.5} />
        </mesh>
        <mesh position={[-0.4, 0.563, 0.02]}>
          <boxGeometry args={[0.02, 0.008, 0.012]} />
          <M color="#222" metal={0.5} rough={0.5} />
        </mesh>
      </Part>
      <Part id="cdi" kind="mech" explode={[-0.2, 0.4, 0]}>
        <RoundedBox args={[0.07, 0.03, 0.05]} radius={0.004} position={[-0.4, 0.595, 0]}>
          <M color="#262a30" metal={0.4} rough={0.5} />
        </RoundedBox>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[-0.4 + (i - 2) * 0.012, 0.612, 0]}>
            <boxGeometry args={[0.005, 0.012, 0.04]} />
            <M color="#8d9299" metal={0.9} rough={0.3} />
          </mesh>
        ))}
      </Part>
    </>
  );
}

function FuelTankEtc() {
  return (
    <>
      <Part id="tank" kind="body" explode={[0, 0.38, 0]}>
        <mesh position={[0, 0.88, 0]} scale={[0.26, 0.11, 0.17]}>
          <sphereGeometry args={[1, 36, 24]} />
          <M color={COL.red} metal={0.5} rough={0.2} />
        </mesh>
        <mesh position={[0, 0.822, 0]} scale={[0.255, 0.04, 0.172]}>
          <sphereGeometry args={[1, 28, 16]} />
          <M color="#141417" metal={0.4} rough={0.3} />
        </mesh>
        <mesh position={[0.07, 0.988, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.012, 20]} />
          <M color={COL.chrome} metal={1} rough={0.2} />
        </mesh>
        {SIDES.map((s) => (
          <mesh key={s} position={[0.04, 0.875, 0.166 * s]}>
            <boxGeometry args={[0.11, 0.06, 0.012]} />
            <M color="#0f0f11" metal={0} rough={0.9} />
          </mesh>
        ))}
      </Part>
      <Part id="petcock" kind="mech" explode={[0.15, -0.05, -0.35]}>
        <mesh position={[0.1, 0.79, -0.1]} rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.03, 12]} />
          <M color="#d8dce1" metal={1} rough={0.25} />
        </mesh>
        <Tube a={[0.1, 0.79, -0.118]} b={[0.125, 0.745, -0.125]} r={0.006} color="#111" metal={0} rough={0.7} />
        <Tube a={[0.1, 0.78, -0.1]} b={[0.08, 0.52, -0.04]} r={0.004} color="#101010" metal={0} rough={0.8} />
      </Part>
    </>
  );
}

/* ════════════════════════ BODY ════════════════════════ */
function SeatAndTail() {
  return (
    <>
      <Part id="seat" kind="body" explode={[-0.1, 0.45, 0]}>
        <RoundedBox args={[0.62, 0.075, 0.27]} radius={0.03} smoothness={4} position={[-0.36, 0.795, 0]} rotation={[0, 0, -0.035]}>
          <M color="#1a1a1d" metal={0} rough={0.85} />
        </RoundedBox>
        {SIDES.map((s) => (
          <group key={s}>
            <Tube a={[-0.52, 0.81, 0.12 * s]} b={[-0.6, 0.875, 0.12 * s]} r={0.009} color={COL.chrome} metal={1} rough={0.25} />
            <Tube a={[-0.6, 0.875, 0.12 * s]} b={[-0.82, 0.885, 0.12 * s]} r={0.009} color={COL.chrome} metal={1} rough={0.25} />
            <Tube a={[-0.82, 0.885, 0.12 * s]} b={[-0.84, 0.79, 0.1 * s]} r={0.009} color={COL.chrome} metal={1} rough={0.25} />
          </group>
        ))}
        <Tube a={[-0.82, 0.885, -0.12]} b={[-0.82, 0.885, 0.12]} r={0.009} color={COL.chrome} metal={1} rough={0.25} />
      </Part>
      <Part id="mudguard" kind="body" position={[-0.62, 0.3, 0]} rotation={[0, 0, 0.25]} explode={[-0.2, 0.4, 0]}>
        <mesh rotation={[PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.332, 0.332, 0.11, 40, 1, true, PI - 0.75, 1.5]} />
          <M color={COL.black} metal={0.3} rough={0.4} side={THREE.DoubleSide} />
        </mesh>
      </Part>
      <Part id="taillight" kind="mech" explode={[-0.4, 0.2, 0]}>
        <mesh position={[-0.79, 0.63, 0]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.2, 0.012, 0.11]} />
          <M color={COL.black} metal={0.3} rough={0.4} />
        </mesh>
        <Tube a={[-0.84, 0.62, 0]} b={[-0.86, 0.7, 0]} r={0.02} color={COL.black} metal={0.3} rough={0.5} />
        <RoundedBox args={[0.055, 0.05, 0.12]} radius={0.012} position={[-0.87, 0.725, 0]}>
          <M color="#c4121b" metal={0.2} rough={0.2} emissive="#ff1a1a" ei={0.5} />
        </RoundedBox>
        <mesh position={[-0.875, 0.575, 0]}>
          <boxGeometry args={[0.01, 0.1, 0.16]} />
          <M color="#e9e6d6" metal={0} rough={0.7} />
        </mesh>
      </Part>
      <Part id="indicators" kind="mech" explode={[-0.2, 0.1, 0]}>
        {SIDES.map((s) => (
          <mesh key={s} position={[-0.86, 0.75, 0.115 * s]}>
            <sphereGeometry args={[0.019, 14, 14]} />
            <M color="#ff9f1a" metal={0.1} rough={0.2} emissive="#ff8a00" ei={0.45} />
          </mesh>
        ))}
      </Part>
      {SIDES.map((s) => (
        <Part key={s} id="sidepanel" kind="body" explode={[0, 0, 0.3 * s]}>
          <RoundedBox args={[0.34, 0.2, 0.012]} radius={0.012} smoothness={3} position={[-0.31, 0.56, 0.118 * s]}>
            <M color="#15161a" metal={0.3} rough={0.3} />
          </RoundedBox>
          <mesh position={[-0.31, 0.56, 0.126 * s]}>
            <boxGeometry args={[0.2, 0.012, 0.002]} />
            <M color={COL.red} metal={0.3} rough={0.3} />
          </mesh>
        </Part>
      ))}
    </>
  );
}

function PedalsAndLevers() {
  return (
    <>
      <Part id="gearlever" kind="mech" explode={[-0.1, -0.1, -0.3]}>
        <Tube a={[-0.19, 0.235, -0.115]} b={[-0.02, 0.215, -0.19]} r={0.007} color="#cfd3d8" metal={1} rough={0.25} />
        <Tube a={[-0.04, 0.217, -0.185]} b={[0.0, 0.213, -0.2]} r={0.011} color={COL.rubber} metal={0} rough={0.9} />
      </Part>
      <Part id="kick" kind="mech" explode={[-0.2, -0.05, 0.3]}>
        <Tube a={[-0.19, 0.23, 0.115]} b={[-0.33, 0.13, 0.135]} r={0.007} color="#cfd3d8" metal={1} rough={0.25} />
        <Tube a={[-0.33, 0.13, 0.135]} b={[-0.4, 0.15, 0.17]} r={0.007} color="#cfd3d8" metal={1} rough={0.25} />
        <Tube a={[-0.385, 0.146, 0.16]} b={[-0.41, 0.155, 0.18]} r={0.012} color={COL.rubber} metal={0} rough={0.9} />
      </Part>
    </>
  );
}

/* ════════════════════════ SUSPENSION ════════════════════════ */
const SHOCK_TOP: V3 = [-0.47, 0.72, 0];
const SHOCK_L0 = Math.hypot(-0.6 - SHOCK_TOP[0], 0.36 - SHOCK_TOP[1]);

function ShockUnit({ side }: { side: 1 | -1 }) {
  const { sim } = useContext(Lab);
  const g = useRef<THREE.Group>(null);
  const st = useRef<THREE.Group>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  const down = useMemo(() => new THREE.Vector3(0, -1, 0), []);
  useFrame(() => {
    const a = -sim.current.compR / ARM;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const lx = PIV[0] + (-0.27 * ca - 0.05 * sa);
    const ly = PIV[1] + (-0.27 * sa + 0.05 * ca);
    v.set(lx - SHOCK_TOP[0], ly - SHOCK_TOP[1], 0);
    const len = v.length();
    v.normalize();
    if (g.current) g.current.quaternion.setFromUnitVectors(down, v);
    if (st.current) st.current.scale.y = len / SHOCK_L0;
  });
  return (
    <group ref={g} position={[SHOCK_TOP[0], SHOCK_TOP[1], 0.17 * side]}>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.021, 0.021, 0.09, 14]} />
        <M color="#111214" metal={0.4} rough={0.5} />
      </mesh>
      <mesh position={[0, -0.01, 0]}>
        <sphereGeometry args={[0.014, 10, 10]} />
        <M color={COL.chrome} metal={1} rough={0.2} />
      </mesh>
      <group ref={st}>
        <mesh position={[0, -SHOCK_L0 * 0.55, 0]}>
          <cylinderGeometry args={[0.007, 0.007, SHOCK_L0 * 0.8, 10]} />
          <M color={COL.chrome} metal={1} rough={0.15} />
        </mesh>
        <group position={[0, -SHOCK_L0 * 0.9, 0]}>
          <Helix radius={0.026} length={SHOCK_L0 * 0.78} turns={9} wire={0.0032} color="#c9202a" metal={0.4} rough={0.35} />
        </group>
        <mesh position={[0, -SHOCK_L0, 0]}>
          <sphereGeometry args={[0.014, 10, 10]} />
          <M color={COL.chrome} metal={1} rough={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/* ════════════════════════ FULL BIKE ════════════════════════ */
export function BikeModel() {
  const { sim } = useContext(Lab);
  const leanRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const steerRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const swingRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const s = sim.current;
    if (leanRef.current) leanRef.current.rotation.x = s.lean;
    if (bodyRef.current) {
      bodyRef.current.position.y = s.heave;
      bodyRef.current.rotation.z = s.pitch;
    }
    if (steerRef.current) steerRef.current.rotation.y = -s.steerAngle;
    if (innerRef.current) innerRef.current.position.y = -FORK_L + s.compF / Math.cos(RAKE);
    if (swingRef.current) swingRef.current.rotation.z = -s.compR / ARM;
  });

  return (
    <group ref={leanRef}>
      <group ref={bodyRef}>
        <Frame />
        <EngineGroup />
        <ExhaustSystem />
        <CarbAndIntake />
        <PlugAndCoil />
        <BatteryEtc />
        <FuelTankEtc />
        <SeatAndTail />
        <PedalsAndLevers />

        {/* chain & front sprocket */}
        <Part id="chain" kind="mech" explode={[0, -0.2, -0.5]}>
          <ChainLinks />
          <mesh position={[-0.43, 0.362, -0.142]} rotation={[0, 0, -0.13]}>
            <boxGeometry args={[0.41, 0.048, 0.008]} />
            <M color="#111214" metal={0.3} rough={0.5} shell />
          </mesh>
        </Part>
        <Part id="sprockets" kind="mech" position={[FS[0], FS[1], CHAIN_Z]} explode={[0, 0, -0.35]}>
          <Spin of="countAng" dir={-1}>
            <Sprocket teeth={14} r={R1} />
          </Spin>
        </Part>

        {/* shocks */}
        {SIDES.map((s) => (
          <Part key={s} id="shocks" kind="mech" explode={[0, 0.1, 0.35 * s]}>
            <ShockUnit side={s} />
          </Part>
        ))}

        {/* swing arm group */}
        <group ref={swingRef} position={PIV}>
          <Part id="swingarm" kind="mech" explode={[0, -0.25, 0]}>
            {SIDES.map((s) => (
              <group key={s}>
                <Tube a={[0, 0, 0.105 * s]} b={[AXLE_R_REL[0], AXLE_R_REL[1], 0.105 * s]} r={0.018} color={COL.black} metal={0.5} rough={0.35} />
                <Tube a={[-0.27, 0, 0.105 * s]} b={[-0.27, 0.05, 0.17 * s]} r={0.008} color={COL.black} metal={0.5} rough={0.35} />
                <mesh position={[AXLE_R_REL[0], AXLE_R_REL[1], 0.118 * s]}>
                  <boxGeometry args={[0.04, 0.03, 0.008]} />
                  <M color="#3a3d42" metal={0.7} rough={0.4} />
                </mesh>
              </group>
            ))}
            <Tube a={[-0.12, -0.003, -0.105]} b={[-0.12, -0.003, 0.105]} r={0.012} color={COL.black} metal={0.5} rough={0.35} />
            <Tube a={[0, 0, -0.17]} b={[0, 0, 0.17]} r={0.013} color={COL.chrome} metal={1} rough={0.25} />
            <Tube a={[AXLE_R_REL[0], AXLE_R_REL[1], -0.145]} b={[AXLE_R_REL[0], AXLE_R_REL[1], 0.135]} r={0.011} color={COL.chrome} metal={1} rough={0.25} />
          </Part>
          <Part id="rearwheel" kind="mech" position={AXLE_R_REL} explode={[-0.45, 0, 0]}>
            <WheelMesh />
          </Part>
          <Part id="rearbrake" kind="mech" position={AXLE_R_REL} explode={[-0.3, 0.0, 0.45]}>
            <DrumBrake />
          </Part>
          <Part id="sprockets" kind="mech" position={[AXLE_R_REL[0], AXLE_R_REL[1], CHAIN_Z]} explode={[-0.3, 0, -0.35]}>
            <Spin of="wheelAng" dir={-1}>
              <Sprocket teeth={42} r={R2} />
            </Spin>
          </Part>
        </group>

        {/* steering assembly */}
        <group position={HEAD} rotation={[0, 0, RAKE]}>
          <group ref={steerRef}>
            <Part id="fork" kind="mech" explode={[0, 0.25, 0]}>
              {SIDES.map((s) => (
                <group key={s}>
                  <Tube a={[0, 0.0, 0.075 * s]} b={[0, -0.5, 0.075 * s]} r={0.0155} color={COL.chrome} metal={1} rough={0.15} />
                  <Tube a={[0, -0.12, 0.075 * s]} b={[0, -0.32, 0.075 * s]} r={0.021} color={COL.rubber} metal={0} rough={0.9} />
                </group>
              ))}
              <RoundedBox args={[0.05, 0.03, 0.2]} radius={0.008} position={[0, 0.015, 0]}>
                <M color="#2b2d31" metal={0.7} rough={0.35} />
              </RoundedBox>
              <RoundedBox args={[0.05, 0.035, 0.18]} radius={0.008} position={[0, -0.155, 0]}>
                <M color="#2b2d31" metal={0.7} rough={0.35} />
              </RoundedBox>
              <Tube a={[0, 0.05, 0]} b={[0, -0.16, 0]} r={0.011} color={COL.chrome} metal={1} rough={0.2} />
            </Part>

            <Part id="handlebar" kind="mech" explode={[-0.1, 0.4, 0]}>
              <Tube a={[0, 0.07, -0.17]} b={[0, 0.07, 0.17]} r={0.0115} color={COL.chrome} metal={1} rough={0.2} />
              <mesh position={[0, 0.07, 0]}>
                <boxGeometry args={[0.045, 0.022, 0.06]} />
                <M color="#2a2c31" metal={0.6} rough={0.4} />
              </mesh>
              {SIDES.map((s) => (
                <group key={s}>
                  <Tube a={[0, 0.07, 0.17 * s]} b={[-0.05, 0.09, 0.3 * s]} r={0.0115} color={COL.chrome} metal={1} rough={0.2} />
                  <Tube a={[-0.05, 0.09, 0.3 * s]} b={[-0.08, 0.1, 0.375 * s]} r={0.0165} color={COL.rubber} metal={0} rough={0.95} />
                  <Tube a={[-0.045, 0.082, 0.275 * s]} b={[0.07, 0.04, 0.325 * s]} r={0.0055} color={COL.chrome} metal={1} rough={0.25} />
                  <RoundedBox args={[0.045, 0.03, 0.05]} radius={0.008} position={[-0.04, 0.078, 0.245 * s]}>
                    <M color="#131416" metal={0.2} rough={0.6} />
                  </RoundedBox>
                </group>
              ))}
            </Part>

            <Part id="mirror" kind="mech" explode={[-0.1, 0.35, 0]}>
              {SIDES.map((s) => (
                <group key={s}>
                  <Tube a={[-0.03, 0.095, 0.31 * s]} b={[-0.08, 0.27, 0.35 * s]} r={0.005} color={COL.chrome} metal={1} rough={0.25} />
                  <mesh position={[-0.085, 0.295, 0.355 * s]} scale={[0.3, 0.85, 1.3]}>
                    <sphereGeometry args={[0.05, 18, 14]} />
                    <M color="#141416" metal={0.3} rough={0.35} />
                  </mesh>
                  <mesh position={[-0.0995, 0.295, 0.355 * s]} rotation={[0, -PI / 2, 0]} scale={[1.3, 0.85, 1]}>
                    <circleGeometry args={[0.04, 20]} />
                    <M color="#a9bdd0" metal={1} rough={0.05} />
                  </mesh>
                </group>
              ))}
            </Part>

            <Part id="speedo" kind="mech" position={[0, 0.15, 0]} explode={[0, 0.3, 0]}>
              <RoundedBox args={[0.08, 0.045, 0.12]} radius={0.01} smoothness={3}>
                <M color="#17181c" metal={0.2} rough={0.4} />
              </RoundedBox>
              {SIDES.map((s) => (
                <mesh key={s} position={[-0.0405, 0.0, 0.027 * s]} rotation={[0, 0, PI / 2]}>
                  <cylinderGeometry args={[0.024, 0.024, 0.003, 20]} />
                  <M color="#0d2a33" metal={0.1} rough={0.3} emissive="#22d3ee" ei={0.55} />
                </mesh>
              ))}
            </Part>

            <Part id="headlight" kind="body" position={[0.14, -0.07, 0]} rotation={[0, 0, -RAKE]} explode={[0.35, 0.1, 0]}>
              <mesh scale={[0.85, 1, 1]}>
                <sphereGeometry args={[0.088, 28, 20]} />
                <M color="#1c1d21" metal={0.5} rough={0.25} />
              </mesh>
              <mesh position={[0.068, 0, 0]} rotation={[0, 0, PI / 2]}>
                <cylinderGeometry args={[0.07, 0.07, 0.01, 28]} />
                <M color="#fff3d1" metal={0.1} rough={0.1} emissive="#ffe9a8" ei={0.9} />
              </mesh>
              <mesh position={[0.068, 0, 0]} rotation={[0, PI / 2, 0]}>
                <torusGeometry args={[0.073, 0.006, 8, 36]} />
                <M color={COL.chrome} metal={1} rough={0.15} />
              </mesh>
            </Part>

            <Part id="indicators" kind="mech" explode={[0.2, 0.1, 0]}>
              {SIDES.map((s) => (
                <group key={s}>
                  <Tube a={[0.1, -0.06, 0.07 * s]} b={[0.1, -0.075, 0.15 * s]} r={0.004} color="#111" metal={0.2} />
                  <mesh position={[0.1, -0.08, 0.16 * s]}>
                    <sphereGeometry args={[0.019, 14, 14]} />
                    <M color="#ff9f1a" metal={0.1} rough={0.2} emissive="#ff8a00" ei={0.45} />
                  </mesh>
                </group>
              ))}
            </Part>

            {/* everything that moves with the front wheel along the fork */}
            <group ref={innerRef} position={[0, -FORK_L, 0]}>
              <Part id="frontwheel" kind="mech" explode={[0.45, 0, 0]}>
                <WheelMesh />
              </Part>
              <Part id="frontbrake" kind="mech" explode={[0.3, 0, 0.45]}>
                <DrumBrake />
              </Part>
              <Part id="fork" kind="mech" explode={[0, -0.12, 0]}>
                {SIDES.map((s) => (
                  <group key={s}>
                    <Tube a={[0, 0, 0.075 * s]} b={[0, 0.32, 0.075 * s]} r={0.0225} color="#25272b" metal={0.6} rough={0.35} />
                    <mesh position={[0, 0.325, 0.075 * s]}>
                      <sphereGeometry args={[0.0225, 12, 10]} />
                      <M color="#25272b" metal={0.6} rough={0.35} />
                    </mesh>
                  </group>
                ))}
                <Tube a={[0, 0, -0.1]} b={[0, 0, 0.1]} r={0.011} color={COL.chrome} metal={1} rough={0.25} />
              </Part>
              <Part id="mudguard" kind="body" rotation={[0, 0, -(RAKE + 0.25)]} explode={[0.1, 0.45, 0]}>
                <mesh rotation={[PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.335, 0.335, 0.11, 40, 1, true, PI - 0.85, 1.7]} />
                  <M color={COL.black} metal={0.3} rough={0.4} side={THREE.DoubleSide} />
                </mesh>
              </Part>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

// Re-exported for the UI calculators
export { FINAL, GEARS, PRIMARY };
