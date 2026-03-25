import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollY } from '../hooks/useScrollProgress';

// ── Mouse tracking ref shared across components ──
const mouseRef = { x: 0, y: 0 };

function TronArc({ color, radius, tilt, arcLength, baseSpeed, thickness, scrollY, phaseOffset }: {
  color: string;
  radius: number;
  tilt: [number, number, number];
  arcLength: number;
  baseSpeed: number;
  thickness: number;
  scrollY: React.RefObject<number>;
  phaseOffset: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const headMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const prevScrollRef = useRef(0);
  const scrollVelocityRef = useRef(0);

  const arcGeo = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, arcLength, false, 0);
    const pts = curve.getPoints(64).map(p => new THREE.Vector3(p.x, p.y, 0));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, thickness, 8, false);
  }, [radius, arcLength, thickness]);

  const glowGeo = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, arcLength, false, 0);
    const pts = curve.getPoints(64).map(p => new THREE.Vector3(p.x, p.y, 0));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, thickness * 3.5, 8, false);
  }, [radius, arcLength, thickness]);

  const headPos = useMemo(() => {
    return new THREE.Vector3(Math.cos(arcLength) * radius, Math.sin(arcLength) * radius, 0);
  }, [radius, arcLength]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const sy = scrollY.current ?? 0;
    const scrollNorm = Math.min(sy / 1500, 1);
    const t = Date.now() * 0.001;

    // Track scroll velocity for reactive bursts
    scrollVelocityRef.current = Math.abs(sy - prevScrollRef.current);
    prevScrollRef.current = sy;
    const velocityKick = Math.min(scrollVelocityRef.current * 0.003, 1.5);

    // Speed ramps up as you scroll + velocity burst
    const speedMultiplier = 1 + scrollNorm * 3 + velocityKick * 2;
    angleRef.current += delta * baseSpeed * speedMultiplier;

    // Sinusoidal wobble — each arc drifts independently
    const wobbleX = Math.sin(t * 0.7 + phaseOffset) * 0.15;
    const wobbleY = Math.cos(t * 0.5 + phaseOffset * 1.3) * 0.12;
    const wobbleZ = Math.sin(t * 0.3 + phaseOffset * 0.7) * 0.08;

    // Mouse influence — arcs lean toward the cursor
    const mouseInfluenceX = mouseRef.y * 0.15;
    const mouseInfluenceY = mouseRef.x * 0.15;

    // Orbit tilt shifts with scroll + wobble + mouse
    groupRef.current.rotation.set(
      tilt[0] + scrollNorm * 0.5 + wobbleX + mouseInfluenceX,
      tilt[1] + scrollNorm * 0.8 + wobbleY + mouseInfluenceY,
      tilt[2] + angleRef.current + wobbleZ
    );

    // Glow intensifies with scroll + velocity flare
    if (glowMatRef.current) {
      glowMatRef.current.opacity = 0.12 + scrollNorm * 0.2 + velocityKick * 0.15;
    }
    if (coreMatRef.current) {
      coreMatRef.current.emissiveIntensity = 0.8 + scrollNorm * 1.5 + velocityKick * 1.0;
    }

    // Head sphere pulses
    if (headMatRef.current) {
      const pulse = 0.85 + Math.sin(t * 3 + phaseOffset) * 0.15;
      headMatRef.current.opacity = pulse;
    }
    if (haloMatRef.current) {
      const haloPulse = 0.2 + Math.sin(t * 2.5 + phaseOffset) * 0.1 + velocityKick * 0.2;
      haloMatRef.current.opacity = haloPulse;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={arcGeo}>
        <meshStandardMaterial
          ref={coreMatRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
          toneMapped={false}
        />
      </mesh>
      <mesh geometry={glowGeo}>
        <meshBasicMaterial
          ref={glowMatRef}
          color={color}
          transparent
          opacity={0.12}
          toneMapped={false}
        />
      </mesh>
      <mesh position={headPos}>
        <sphereGeometry args={[thickness * 2.5, 16, 16]} />
        <meshBasicMaterial ref={headMatRef} color="white" transparent opacity={1} toneMapped={false} />
      </mesh>
      <mesh position={headPos}>
        <sphereGeometry args={[thickness * 5, 16, 16]} />
        <meshBasicMaterial ref={haloMatRef} color={color} transparent opacity={0.25} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Particles({ scrollY }: { scrollY: React.RefObject<number> }) {
  const count = 200;
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const prevScrollRef = useRef(0);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const sy = scrollY.current ?? 0;
    const scrollNorm = Math.min(sy / 1500, 1);
    const velocity = Math.min(Math.abs(sy - prevScrollRef.current) * 0.003, 1.5);
    prevScrollRef.current = sy;

    // Particles swirl faster with scroll + velocity burst
    ref.current.rotation.y += delta * (0.015 + scrollNorm * 0.08 + velocity * 0.05);
    ref.current.rotation.x += delta * (scrollNorm * 0.03 + velocity * 0.02);

    // Mouse gently tilts the particle field
    ref.current.rotation.z += (mouseRef.x * 0.02 - ref.current.rotation.z) * 0.02;

    // Scale outward — particles scatter more with velocity
    const spread = 1 + scrollNorm * 0.4 + velocity * 0.15;
    ref.current.scale.set(spread, spread, spread);

    if (matRef.current) {
      matRef.current.opacity = 0.5 + scrollNorm * 0.3 + velocity * 0.1;
      matRef.current.size = 0.02 + scrollNorm * 0.015 + velocity * 0.008;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.02}
        color="#8B949E"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

function CentralSphere({ scrollY }: { scrollY: React.RefObject<number> }) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const prevScrollRef = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const sy = scrollY.current ?? 0;
    const scrollNorm = Math.min(sy / 1500, 1);
    const velocity = Math.min(Math.abs(sy - prevScrollRef.current) * 0.003, 1.5);
    prevScrollRef.current = sy;

    // Sphere rotation accelerates + velocity kick
    ref.current.rotation.y += delta * (0.12 + scrollNorm * 0.6 + velocity * 0.3);
    ref.current.rotation.x += delta * (0.04 + scrollNorm * 0.2 + velocity * 0.1);

    // Sphere breathes — pulsing scale + velocity expansion
    const breath = 1 + Math.sin(Date.now() * 0.002) * 0.05;
    const scrollScale = 1 + scrollNorm * 0.3;
    const velocityScale = 1 + velocity * 0.08;
    const s = breath * scrollScale * velocityScale;
    ref.current.scale.set(s, s, s);

    // Wireframe glow intensifies + velocity flare
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.12 + scrollNorm * 0.4 + velocity * 0.3;
    }
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.7, 1]} />
      <meshStandardMaterial
        ref={matRef}
        color="#1C2128"
        wireframe
        emissive="#8B949E"
        emissiveIntensity={0.12}
        metalness={1}
        roughness={0.3}
      />
    </mesh>
  );
}

/** Camera that drifts on scroll — pulls back and tilts */
function ScrollCamera({ scrollY }: { scrollY: React.RefObject<number> }) {
  const { camera } = useThree();

  useFrame(() => {
    const sy = scrollY.current ?? 0;
    const scrollNorm = Math.min(sy / 1500, 1);

    // Camera pulls back and drifts up-right as you scroll
    const targetZ = 5 + scrollNorm * 2.5;
    const targetY = scrollNorm * 1.2;
    const targetX = scrollNorm * 0.8;

    // Mouse subtly shifts the camera viewpoint
    const mouseShiftX = mouseRef.x * 0.3;
    const mouseShiftY = mouseRef.y * 0.2;

    camera.position.x += (targetX + mouseShiftX - camera.position.x) * 0.05;
    camera.position.y += (targetY + mouseShiftY - camera.position.y) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;

    camera.lookAt(0, 0, 0);
  });

  return null;
}

/** Colored point lights that orbit slowly and shift with scroll */
function OrbitalLights({ scrollY }: { scrollY: React.RefObject<number> }) {
  const redRef = useRef<THREE.PointLight>(null);
  const greenRef = useRef<THREE.PointLight>(null);
  const yellowRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const t = Date.now() * 0.001;
    const sy = scrollY.current ?? 0;
    const scrollNorm = Math.min(sy / 1500, 1);

    const intensity = 0.4 + scrollNorm * 0.8;
    const orbitRadius = 4 + scrollNorm * 2;

    if (redRef.current) {
      redRef.current.position.set(
        Math.sin(t * 0.5) * orbitRadius,
        Math.cos(t * 0.3) * 3,
        Math.cos(t * 0.5) * orbitRadius
      );
      redRef.current.intensity = intensity;
    }
    if (greenRef.current) {
      greenRef.current.position.set(
        Math.sin(t * 0.4 + 2) * orbitRadius,
        Math.cos(t * 0.25 + 1) * 3,
        Math.cos(t * 0.4 + 2) * orbitRadius
      );
      greenRef.current.intensity = intensity;
    }
    if (yellowRef.current) {
      yellowRef.current.position.set(
        Math.sin(t * 0.3 + 4) * orbitRadius,
        Math.cos(t * 0.2 + 3) * 3,
        Math.cos(t * 0.3 + 4) * orbitRadius
      );
      yellowRef.current.intensity = intensity * 0.7;
    }
  });

  return (
    <>
      <pointLight ref={redRef} color="#D94843" intensity={0.4} distance={15} />
      <pointLight ref={greenRef} color="#4CAF50" intensity={0.4} distance={15} />
      <pointLight ref={yellowRef} color="#E2B347" intensity={0.3} distance={15} />
    </>
  );
}

export default function HeroScene() {
  const scrollY = useScrollY();
  const [mounted, setMounted] = useState(false);

  // Smooth fade-in on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Track mouse position normalized to -1..1
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseRef.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div style={{
      width: '60%',
      height: '100vh',
      position: 'fixed',
      top: 0,
      right: 0,
      pointerEvents: 'none',
      zIndex: 0,
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'scale(1)' : 'scale(0.92)',
      transition: 'opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1), transform 1.8s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />

        <ScrollCamera scrollY={scrollY} />
        <OrbitalLights scrollY={scrollY} />

        <CentralSphere scrollY={scrollY} />

        {/* Red arcs — fast, tight orbit */}
        <TronArc color="#D94843" radius={1.4} tilt={[0.4, 0.2, 0]} arcLength={1.3} baseSpeed={1.2} thickness={0.025} scrollY={scrollY} phaseOffset={0} />
        <TronArc color="#D94843" radius={1.5} tilt={[0.5, 0.3, Math.PI]} arcLength={0.8} baseSpeed={1.0} thickness={0.02} scrollY={scrollY} phaseOffset={2.1} />

        {/* Green arcs — medium */}
        <TronArc color="#4CAF50" radius={1.6} tilt={[1.2, 0.8, 0]} arcLength={1.1} baseSpeed={0.85} thickness={0.025} scrollY={scrollY} phaseOffset={4.2} />
        <TronArc color="#4CAF50" radius={1.7} tilt={[1.3, 0.9, Math.PI * 0.7]} arcLength={0.7} baseSpeed={0.75} thickness={0.02} scrollY={scrollY} phaseOffset={1.5} />

        {/* Yellow arcs — slow, wide */}
        <TronArc color="#E2B347" radius={1.9} tilt={[0.3, 1.5, 0]} arcLength={1.5} baseSpeed={0.6} thickness={0.025} scrollY={scrollY} phaseOffset={3.3} />
        <TronArc color="#E2B347" radius={2.0} tilt={[0.4, 1.6, Math.PI * 1.3]} arcLength={0.9} baseSpeed={0.5} thickness={0.02} scrollY={scrollY} phaseOffset={5.0} />

        <Particles scrollY={scrollY} />
      </Canvas>
    </div>
  );
}
