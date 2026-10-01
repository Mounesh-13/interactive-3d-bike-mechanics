import { useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { BikeModel } from "./BikeModel";
import { CameraRig, Ground, Simulator } from "./Sim";
import { Lab, newSim } from "./shared";
import type { BikeControls, LabCtx, Sim, Telemetry } from "./shared";

interface Props {
  controls: BikeControls;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onTelemetry: (t: Telemetry) => void;
  onStall: (msg: string) => void;
}

export default function Bike3D({ controls, onSelect, onHover, onTelemetry, onStall }: Props) {
  const ctrlRef = useRef(controls);
  ctrlRef.current = controls;
  const simRef = useRef<Sim>(newSim());
  const [hovered, setHovered] = useState<string | null>(null);

  const ctx: LabCtx = useMemo(
    () => ({
      selected: controls.selected,
      hovered,
      mode: controls.mode,
      ctrl: ctrlRef,
      sim: simRef,
      select: (id) => onSelect(id),
      hover: (id) => {
        setHovered(id);
        onHover(id);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controls.selected, controls.mode, hovered],
  );

  return (
    <Canvas
      camera={{ position: [2.1, 1.25, 2.7], fov: 36, near: 0.05, far: 60 }}
      dpr={[1, 1.75]}
      onPointerMissed={() => onSelect(null)}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#0a0f1c"]} />
      <fog attach="fog" args={["#0a0f1c", 7, 19]} />
      <Lab.Provider value={ctx}>
        <Simulator onTelemetry={onTelemetry} onStall={onStall} />
        <ambientLight intensity={0.35} />
        <hemisphereLight args={["#bcd2ff", "#222633", 0.5]} />
        <directionalLight position={[3, 6, 4]} intensity={1.5} />
        <directionalLight position={[-4, 3, -3]} intensity={0.7} color="#ffcf9e" />
        <Environment resolution={256}>
          <Lightformer intensity={2.2} rotation-x={Math.PI / 2} position={[0, 5, -6]} scale={[14, 4, 1]} />
          <Lightformer intensity={1.6} rotation-y={Math.PI / 2} position={[-6, 1.5, 0]} scale={[12, 3, 1]} />
          <Lightformer intensity={1.6} rotation-y={-Math.PI / 2} position={[7, 1.5, 0]} scale={[12, 3, 1]} />
          <Lightformer intensity={1.2} position={[0, 2, 7]} scale={[12, 3, 1]} />
          <Lightformer form="ring" color="#ffb066" intensity={5} scale={3} position={[-6, 4, 6]} />
        </Environment>
        <Ground />
        <ContactShadows position={[0, 0.003, 0]} opacity={0.55} scale={5} blur={2.4} far={1.2} resolution={512} />
        <BikeModel />
        <CameraRig />
      </Lab.Provider>
    </Canvas>
  );
}
