"use client";

import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";

/* category colors mirrored from the node registry / hero scene */
const PALETTE = ["#7c5cff", "#06b6d4", "#ec4899", "#3b82f6", "#22c55e", "#f59e0b"];

/* ------------------------------------------------------------------ */
/* CSS fallback — orbiting dots (no WebGL required)                    */
/* ------------------------------------------------------------------ */
export function LoaderFallback({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 loader-spin">
          {PALETTE.map((c, i) => {
            const angle = (i / PALETTE.length) * Math.PI * 2;
            const r = 32;
            return (
              <span
                key={i}
                className="absolute h-3 w-3 rounded-full"
                style={{
                  left: `calc(50% + ${Math.cos(angle) * r}px - 6px)`,
                  top: `calc(50% + ${Math.sin(angle) * r}px - 6px)`,
                  background: c,
                  boxShadow: `0 0 12px ${c}`,
                  opacity: 0.9,
                  animation: `fx-pulse 1.4s ${i * 0.12}s ease-in-out infinite`,
                }}
              />
            );
          })}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="h-4 w-4 rounded-sm animate-glow-pulse"
            style={{ background: "#9d84ff", boxShadow: "0 0 18px #7c5cff" }}
          />
        </div>
      </div>
      {label && (
        <span className="text-xs font-medium tracking-wide text-ink-dim">
          {label}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3D scene — morphing icosahedron orbited by node satellites.         */
/* Everything three.js lives inside this dynamic() factory so it is    */
/* only ever loaded client-side and never touches the SSR bundle.      */
/* ------------------------------------------------------------------ */
const Canvas3D = dynamic(
  async () => {
    const { Canvas, useFrame } = await import("@react-three/fiber");
    const { useRef, useMemo } = await import("react");

    function Scene() {
      const core = useRef<import("three").Mesh>(null);
      const ring = useRef<import("three").Group>(null);

      const sats = useMemo(
        () =>
          PALETTE.map((c, i) => ({
            color: c,
            angle: (i / PALETTE.length) * Math.PI * 2,
            radius: 2.1,
            speed: 0.6 + i * 0.08,
          })),
        []
      );

      useFrame((state, delta) => {
        const t = state.clock.elapsedTime;
        if (core.current) {
          core.current.rotation.x += delta * 0.6;
          core.current.rotation.y += delta * 0.9;
          core.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.08);
        }
        if (ring.current) {
          ring.current.rotation.z += delta * 0.5;
          ring.current.children.forEach((child, i) => {
            const a = sats[i].angle + t * sats[i].speed;
            child.position.set(
              Math.cos(a) * sats[i].radius,
              Math.sin(a) * sats[i].radius,
              Math.sin(a * 1.3) * 0.5
            );
          });
        }
      });

      return (
        <group>
          <ambientLight intensity={0.5} />
          <pointLight position={[4, 4, 5]} intensity={40} color="#9d84ff" />
          <pointLight position={[-4, -3, -3]} intensity={28} color="#06b6d4" />
          <mesh ref={core}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color="#7c5cff"
              emissive="#7c5cff"
              emissiveIntensity={1.3}
              roughness={0.2}
              metalness={0.5}
              flatShading
              toneMapped={false}
            />
          </mesh>
          <group ref={ring}>
            {sats.map((s, i) => (
              <mesh key={i}>
                <sphereGeometry args={[0.17, 16, 16]} />
                <meshStandardMaterial
                  color={s.color}
                  emissive={s.color}
                  emissiveIntensity={1.6}
                  toneMapped={false}
                />
              </mesh>
            ))}
          </group>
        </group>
      );
    }

    return function Inner() {
      return (
        <Canvas
          camera={{ position: [0, 0, 6], fov: 50 }}
          dpr={[1, 1.8]}
          gl={{ antialias: true, alpha: true }}
          onCreated={(state) => state.gl.setClearColor(0x000000, 0)}
        >
          <Scene />
        </Canvas>
      );
    };
  },
  { ssr: false, loading: () => <LoaderFallback /> }
);

/* ------------------------------------------------------------------ */
/* WebGL error boundary → CSS fallback                                 */
/* ------------------------------------------------------------------ */
class GLBoundary extends Component<
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
    /* fallback already shown */
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/* Public loader — 3D with graceful CSS fallback                       */
/* ------------------------------------------------------------------ */
export function Loader3D({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <GLBoundary fallback={<LoaderFallback />}>
        <div className="h-[120px] w-[120px]">
          <Canvas3D />
        </div>
      </GLBoundary>
      {label && (
        <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink-dim">
          <span>{label}</span>
          <span className="loader-dots inline-flex gap-0.5">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      )}
    </div>
  );
}

/** Full-screen loading overlay used by route-level loading.tsx files. */
export function FullscreenLoader({ label }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-bg">
      <div className="aurora-bg absolute inset-0 opacity-40" />
      <div className="relative">
        <Loader3D label={label} />
      </div>
    </div>
  );
}
