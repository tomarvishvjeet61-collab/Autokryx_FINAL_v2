import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

// Ring of small nodes orbiting the core — reads as "verified identity network",
// echoing the copy's own language (Network Effect Engine / verified communities)
// rather than a decorative generic particle field.
function NetworkRing({ radius, count, tilt, speed }) {
  const ref = useRef();
  const nodes = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      const angle = (i / count) * Math.PI * 2;
      return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
    });
  }, [radius, count]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * speed;
  });

  return (
    <group ref={ref} rotation={[tilt, 0, 0]}>
      <mesh>
        <torusGeometry args={[radius, 0.004, 8, 96]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={0.28} />
      </mesh>
      {nodes.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshBasicMaterial color="#d4af37" />
        </mesh>
      ))}
    </group>
  );
}

function IdentityCore({ pointer, scroll }) {
  const group = useRef();
  const wireRef = useRef();
  const scaleState = useRef(1);

  useFrame(() => {
    if (!group.current) return;
    const progress = scroll.current; // 0 = hero fully in view, 1 = scrolled past
    const nx = pointer.current.x - 0.5;
    const ny = pointer.current.y - 0.5;
    const targetRotX = ny * 0.55;
    // Scroll adds its own orbit on top of the pointer tilt — the "camera orbit
    // on scroll" the brief asks for, driven by the same render loop as the
    // pointer response so the two motions never fight each other.
    const targetRotY = nx * 0.75 + progress * 2.4;
    group.current.rotation.x += (targetRotX - group.current.rotation.x) * 0.045;
    group.current.rotation.y += 0.0022 + (targetRotY - group.current.rotation.y) * 0.045;
    if (wireRef.current) wireRef.current.rotation.y -= 0.0012;

    // Core recedes and drifts up slightly as the hero scrolls out of view.
    const targetScale = 1 - progress * 0.32;
    scaleState.current += (targetScale - scaleState.current) * 0.08;
    group.current.scale.setScalar(scaleState.current);
    group.current.position.y = progress * 0.55;
  });

  return (
    <group ref={group}>
      {/* Faceted glass core — the verified "identity" at the center of the brand */}
      <mesh>
        <icosahedronGeometry args={[1.05, 0]} />
        <MeshTransmissionMaterial
          thickness={0.55}
          roughness={0.06}
          transmission={1}
          ior={1.25}
          chromaticAberration={0.025}
          distortion={0.08}
          distortionScale={0.2}
          temporalDistortion={0.05}
          color="#f4ead0"
          attenuationColor="#d4af37"
          attenuationDistance={1.2}
        />
      </mesh>
      {/* Gold wireframe shell — structure/infrastructure motif */}
      <mesh ref={wireRef} scale={1.32}>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshBasicMaterial color="#d4af37" wireframe transparent opacity={0.32} />
      </mesh>
      <NetworkRing radius={1.9} count={8} tilt={0.55} speed={0.08} />
      <NetworkRing radius={1.55} count={5} tilt={-0.35} speed={-0.11} />
    </group>
  );
}

export default function HeroCore({ pointerRef, scrollRef }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 4.2], fov: 32 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 3, 4]} intensity={1.1} color="#fff6e0" />
      <pointLight position={[-3, -2, -2]} intensity={0.6} color="#b8860b" />
      <Suspense fallback={null}>
        <IdentityCore pointer={pointerRef} scroll={scrollRef} />
      </Suspense>
    </Canvas>
  );
}
