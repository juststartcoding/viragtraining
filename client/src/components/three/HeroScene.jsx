import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, RoundedBox, Sparkles, Environment, Lightformer, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

/** Camera gently follows the mouse for a parallax feel */
function Rig() {
  useFrame((state) => {
    const { camera, pointer } = state;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.8, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.8, 0.04);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Spin({ children, speed = 0.3, axis = 'y' }) {
  const ref = useRef();
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation[axis] += d * speed;
  });
  return <group ref={ref}>{children}</group>;
}

/** "Code window" built from rounded boxes */
function CodeBlock(props) {
  const lines = [
    [0.9, '#f97316'],
    [1.3, '#93b8fd'],
    [0.7, '#34d399'],
    [1.1, '#93b8fd'],
    [0.5, '#f472b6'],
  ];
  return (
    <group {...props}>
      <RoundedBox args={[2.2, 1.6, 0.18]} radius={0.12} smoothness={4}>
        <meshPhysicalMaterial color="#121d4d" roughness={0.15} metalness={0.3} clearcoat={1} />
      </RoundedBox>
      {['#f87171', '#fbbf24', '#34d399'].map((c, i) => (
        <mesh key={c} position={[-0.88 + i * 0.16, 0.6, 0.1]}>
          <circleGeometry args={[0.045, 24]} />
          <meshBasicMaterial color={c} />
        </mesh>
      ))}
      {lines.map(([w, c], i) => (
        <RoundedBox key={i} args={[w, 0.09, 0.04]} radius={0.04} position={[-0.95 + w / 2 + (i % 2) * 0.15, 0.32 - i * 0.2, 0.11]}>
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.6} />
        </RoundedBox>
      ))}
    </group>
  );
}

export default function HeroScene() {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const s = reduced ? 0 : 1; // animation speed multiplier

  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 8], fov: 42 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={2} />
      <pointLight position={[-4, -2, 3]} intensity={30} color="#f97316" />
      <pointLight position={[4, 3, -2]} intensity={40} color="#3b6cf6" />

      {/* Main glossy blob */}
      <Float speed={2 * s} rotationIntensity={0.6 * s} floatIntensity={1.2 * s}>
        <mesh position={[0.1, 0.15, 0]} scale={1.5}>
          <icosahedronGeometry args={[1, 64]} />
          <MeshDistortMaterial color="#3b6cf6" emissive="#1e35af" emissiveIntensity={0.35} roughness={0.05} metalness={0.15} distort={0.38 * (s || 0.3)} speed={1.6 * s} clearcoat={1} clearcoatRoughness={0.1} />
        </mesh>
      </Float>

      {/* Orange torus ring */}
      <Float speed={1.5 * s} rotationIntensity={1.2 * s} floatIntensity={1 * s}>
        <Spin speed={0.4 * s} axis="x">
          <mesh position={[-1.75, 1.35, -0.5]} rotation={[0.6, 0.4, 0]}>
            <torusGeometry args={[0.45, 0.17, 48, 96]} />
            <meshPhysicalMaterial color="#f97316" roughness={0.15} metalness={0.4} clearcoat={1} />
          </mesh>
        </Spin>
      </Float>

      {/* Code window */}
      <Float speed={1.8 * s} rotationIntensity={0.4 * s} floatIntensity={0.8 * s}>
        <CodeBlock position={[1.45, -1.35, 0.9]} rotation={[-0.15, -0.45, 0.08]} scale={0.62} />
      </Float>

      {/* Small shapes */}
      <Float speed={2.5 * s} floatIntensity={2 * s}>
        <mesh position={[1.95, 1.75, -1]}>
          <octahedronGeometry args={[0.38]} />
          <meshPhysicalMaterial color="#a855f7" roughness={0.1} metalness={0.3} clearcoat={1} flatShading />
        </mesh>
      </Float>
      <Float speed={3 * s} floatIntensity={2 * s}>
        <mesh position={[-1.95, -1.3, 0.5]}>
          <sphereGeometry args={[0.32, 48, 48]} />
          <meshPhysicalMaterial color="#e0e7ff" roughness={0.05} metalness={0.1} clearcoat={1} />
        </mesh>
      </Float>
      <Float speed={2 * s} rotationIntensity={2 * s} floatIntensity={1.5 * s}>
        <RoundedBox args={[0.55, 0.55, 0.55]} radius={0.1} position={[-0.6, -2.1, -0.8]} rotation={[0.5, 0.5, 0]}>
          <meshPhysicalMaterial color="#34d399" roughness={0.15} metalness={0.2} clearcoat={1} />
        </RoundedBox>
      </Float>

      <Sparkles count={60} scale={[9, 6, 4]} size={2.2} speed={0.4 * s} color="#93b8fd" opacity={0.7} />
      <ContactShadows position={[0, -2.8, 0]} opacity={0.35} scale={12} blur={2.6} far={4} color="#000" />

      {/* Local studio lighting for reflections (no network download) */}
      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 4, 3]} scale={[10, 2, 1]} />
        <Lightformer intensity={1.5} color="#f97316" position={[-5, 0, 1]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer intensity={1.5} color="#3b6cf6" position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
      </Environment>

      {!reduced && <Rig />}
    </Canvas>
  );
}
