"use client";

import { useRef, useMemo, Component, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* category colors mirrored from the node registry */
const PALETTE = ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#06b6d4", "#7c5cff"];

type NodePoint = { pos: [number, number, number]; color: string; scale: number };

function useConstellation(count: number) {
  return useMemo(() => {
    const nodes: NodePoint[] = [];
    for (let i = 0; i < count; i++) {
      const r = 3.4 + Math.random() * 3.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      nodes.push({
        pos: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.6,
          r * Math.cos(phi),
        ],
        color: PALETTE[i % PALETTE.length],
        scale: 0.08 + Math.random() * 0.14,
      });
    }
    const links: Array<[[number, number, number], [number, number, number]]> = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i].pos;
        const b = nodes[j].pos;
        const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        if (d < 2.9 && links.length < 90) links.push([a, b]);
      }
    }
    return { nodes, links };
  }, [count]);
}

function GlowNode({ pos, color, scale }: NodePoint) {
  const ref = useRef<THREE.Group>(null);
  const seed = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // self-contained float (replaces drei <Float>)
    ref.current.position.y = pos[1] + Math.sin(t * 1.4 + seed) * 0.18;
    ref.current.rotation.y = t * 0.3 + seed;
    const p = 1 + Math.sin(t * 2 + pos[0]) * 0.12;
    ref.current.scale.setScalar(scale * p);
  });
  return (
    <group ref={ref} position={pos}>
      <mesh>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.6}
          roughness={0.25}
          metalness={0.4}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Native three.js line segment (replaces drei <Line>). */
function LinkLine({
  points,
}: {
  points: [[number, number, number], [number, number, number]];
}) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [...points[0], ...points[1]],
        3
      )
    );
    return g;
  }, [points]);
  return (
    // eslint-disable-next-line react/no-unknown-property
    <line>
      <primitive object={geom} attach="geometry" />
      <lineBasicMaterial
        attach="material"
        color="#2e3350"
        transparent
        opacity={0.5}
      />
    </line>
  );
}

function Scene({ pointer }: { pointer: React.MutableRefObject<[number, number]> }) {
  const group = useRef<THREE.Group>(null);
  const { nodes, links } = useConstellation(26);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.08;
    // subtle parallax toward pointer
    const [px, py] = pointer.current;
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      py * 0.25,
      0.05
    );
    group.current.position.x = THREE.MathUtils.lerp(
      group.current.position.x,
      px * 0.6,
      0.05
    );
    void state;
  });

  return (
    <group ref={group}>
      <ambientLight intensity={0.4} />
      <pointLight position={[6, 6, 6]} intensity={60} color="#9d84ff" />
      <pointLight position={[-6, -4, -4]} intensity={40} color="#06b6d4" />
      {links.map((l, i) => (
        <LinkLine key={i} points={l} />
      ))}
      {nodes.map((n, i) => (
        <GlowNode key={i} {...n} />
      ))}
    </group>
  );
}

export default function HeroScene() {
  const pointer = useRef<[number, number]>([0, 0]);

  return (
    <WebGLBoundary fallback={<HeroSceneFallback />}>
      <div
        className="absolute inset-0"
        onPointerMove={(e) => {
          const x = (e.clientX / window.innerWidth) * 2 - 1;
          const y = (e.clientY / window.innerHeight) * 2 - 1;
          pointer.current = [x, -y];
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 11], fov: 50 }}
          dpr={[1, 1.8]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
          fallback={<HeroSceneFallback />}
        >
          <Scene pointer={pointer} />
        </Canvas>
      </div>
    </WebGLBoundary>
  );
}

/** Error boundary that swaps in the CSS fallback if WebGL/three fails. */
class WebGLBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* swallow — fallback already shown */
  }
  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

/** Pure-CSS fallback constellation (no WebGL required). */
export function HeroSceneFallback() {
  const dots = Array.from({ length: 22 });
  return (
    <div className="absolute inset-0 overflow-hidden">
      {dots.map((_, i) => {
        const left = (i * 37) % 100;
        const top = (i * 53) % 100;
        const color = PALETTE[i % PALETTE.length];
        const size = 6 + (i % 4) * 4;
        return (
          <span
            key={i}
            className="absolute rounded-full animate-float-slow"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              background: color,
              boxShadow: `0 0 ${size * 2}px ${color}`,
              opacity: 0.6,
              animationDelay: `${(i % 7) * 0.6}s`,
            }}
          />
        );
      })}
    </div>
  );
}
