import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Float } from '@react-three/drei'
import * as THREE from 'three'

// ============ Mochi 3D Model (built from primitives) ============
function MochiModel({ hovered, clicked }) {
  const groupRef = useRef()
  const headRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const tailRef = useRef()
  const leftEyeRef = useRef()
  const rightEyeRef = useRef()

  // Wave animation when hovered
  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()

    // Idle float
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.08

    // Head tilt
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.5) * 0.1
      headRef.current.rotation.z = Math.sin(t * 0.3) * 0.05
    }

    // Wave arm when hovered
    if (rightArmRef.current) {
      if (hovered) {
        rightArmRef.current.rotation.z = Math.sin(t * 4) * 0.4 - 0.3
      } else {
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z, -0.3, 0.05
        )
      }
    }

    // Jump when clicked
    if (clicked && groupRef.current) {
      groupRef.current.position.y = Math.abs(Math.sin(t * 8)) * 0.3
    }

    // Eye glow pulse
    if (leftEyeRef.current && rightEyeRef.current) {
      const pulse = (Math.sin(t * 2) + 1) / 2
      const emissive = new THREE.Color(0, pulse * 0.8, 0.8)
      leftEyeRef.current.material.emissive = emissive
      rightEyeRef.current.material.emissive = emissive
    }

    // Tail sway
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 1.2) * 0.3
    }
  })

  return (
    <group ref={groupRef} scale={1}>
      {/* === BODY === */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.32, 0.35, 0.7, 16]} />
        <meshStandardMaterial color="#F8F9FA" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* GenLayer logo on chest */}
      <mesh position={[0, -0.05, 0.34]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.18, 0.18]} />
        <meshStandardMaterial color="#111111" roughness={0.8} />
      </mesh>
      {/* Triangle logo */}
      <mesh position={[0, -0.04, 0.341]}>
        <coneGeometry args={[0.06, 0.1, 3]} />
        <meshStandardMaterial color="#F8F9FA" roughness={0.5} />
      </mesh>

      {/* Body stripe bands */}
      {[-0.05, 0.15].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.33, 0.025, 8, 32]} />
          <meshStandardMaterial color="#EC4899" roughness={0.3} metalness={0.3} />
        </mesh>
      ))}

      {/* Belt */}
      <mesh position={[0, -0.25, 0]}>
        <torusGeometry args={[0.33, 0.04, 8, 32]} />
        <meshStandardMaterial color="#7C3AED" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Belt buckle left */}
      <mesh position={[-0.2, -0.25, 0.25]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#EC4899" roughness={0.2} metalness={0.6} emissive="#EC4899" emissiveIntensity={0.3} />
      </mesh>
      {/* Belt buckle right */}
      <mesh position={[0.2, -0.25, 0.25]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#EC4899" roughness={0.2} metalness={0.6} emissive="#EC4899" emissiveIntensity={0.3} />
      </mesh>

      {/* === HEAD === */}
      <group ref={headRef} position={[0, 0.58, 0]}>
        {/* Helmet */}
        <mesh>
          <sphereGeometry args={[0.38, 24, 24]} />
          <meshStandardMaterial color="#F8F9FA" roughness={0.2} metalness={0.15} />
        </mesh>

        {/* Black visor */}
        <mesh position={[0, -0.02, 0.2]} rotation={[0.15, 0, 0]}>
          <sphereGeometry args={[0.3, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#0A0A0A" roughness={0.1} metalness={0.5} transparent opacity={0.95} />
        </mesh>

        {/* Left eye (cyan glowing) */}
        <mesh ref={leftEyeRef} position={[-0.1, 0.04, 0.33]}>
          <ellipseCurveGeometry />
          <planeGeometry args={[0.1, 0.06]} />
          <meshStandardMaterial
            color="#00F5FF"
            emissive="#00F5FF"
            emissiveIntensity={0.8}
            roughness={0}
            metalness={0}
          />
        </mesh>

        {/* Right eye (cyan glowing) */}
        <mesh ref={rightEyeRef} position={[0.1, 0.04, 0.33]}>
          <planeGeometry args={[0.1, 0.06]} />
          <meshStandardMaterial
            color="#00F5FF"
            emissive="#00F5FF"
            emissiveIntensity={0.8}
            roughness={0}
            metalness={0}
          />
        </mesh>

        {/* Cat ears */}
        <mesh position={[-0.22, 0.28, 0]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.1, 0.2, 3]} />
          <meshStandardMaterial color="#F8F9FA" roughness={0.3} />
        </mesh>
        <mesh position={[-0.19, 0.3, 0.02]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.065, 0.14, 3]} />
          <meshStandardMaterial color="#EC4899" roughness={0.4} />
        </mesh>

        <mesh position={[0.22, 0.28, 0]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.1, 0.2, 3]} />
          <meshStandardMaterial color="#F8F9FA" roughness={0.3} />
        </mesh>
        <mesh position={[0.19, 0.3, 0.02]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.065, 0.14, 3]} />
          <meshStandardMaterial color="#7C3AED" roughness={0.4} />
        </mesh>

        {/* Headphones */}
        <mesh position={[-0.36, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.07, 0.03, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#7C3AED" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[-0.38, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
          <meshStandardMaterial color="#EC4899" roughness={0.2} metalness={0.5} emissive="#EC4899" emissiveIntensity={0.4} />
        </mesh>

        <mesh position={[0.36, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.07, 0.03, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#7C3AED" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[0.38, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
          <meshStandardMaterial color="#EC4899" roughness={0.2} metalness={0.5} emissive="#EC4899" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* === LEFT ARM === */}
      <group position={[-0.44, 0.05, 0]} rotation={[0, 0, 0.4]}>
        <mesh>
          <cylinderGeometry args={[0.09, 0.09, 0.45, 12]} />
          <meshStandardMaterial color="#F8F9FA" roughness={0.3} />
        </mesh>
        {/* Arm bands */}
        {[-0.1, 0.1].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <torusGeometry args={[0.09, 0.018, 8, 16]} />
            <meshStandardMaterial color="#EC4899" roughness={0.3} metalness={0.3} />
          </mesh>
        ))}
        {/* Hand */}
        <mesh position={[0, -0.28, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#6B7280" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Wrist joint */}
        <mesh position={[0, -0.22, 0]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#7C3AED" roughness={0.3} metalness={0.5} emissive="#7C3AED" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* === RIGHT ARM (wave-able) === */}
      <group ref={rightArmRef} position={[0.44, 0.05, 0]} rotation={[0, 0, -0.4]}>
        <mesh>
          <cylinderGeometry args={[0.09, 0.09, 0.45, 12]} />
          <meshStandardMaterial color="#F8F9FA" roughness={0.3} />
        </mesh>
        {[-0.1, 0.1].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <torusGeometry args={[0.09, 0.018, 8, 16]} />
            <meshStandardMaterial color="#EC4899" roughness={0.3} metalness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, -0.28, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#6B7280" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#7C3AED" roughness={0.3} metalness={0.5} emissive="#7C3AED" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* === LEGS === */}
      {/* Left leg */}
      <group position={[-0.16, -0.52, 0]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.1, 0.4, 12]} />
          <meshStandardMaterial color="#F8F9FA" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.25, 0]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#EC4899" roughness={0.3} metalness={0.5} emissive="#EC4899" emissiveIntensity={0.3} />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.32, 0.06]}>
          <ellipsoid args={[0.11, 0.07, 0.14]} />
          <sphereGeometry args={[0.12, 12, 8]} />
          <meshStandardMaterial color="#F8F9FA" roughness={0.3} />
        </mesh>
        {/* Foot stripe */}
        <mesh position={[0, -0.32, 0]}>
          <torusGeometry args={[0.11, 0.025, 8, 16]} />
          <meshStandardMaterial color="#7C3AED" roughness={0.3} metalness={0.5} />
        </mesh>
      </group>

      {/* Right leg */}
      <group position={[0.16, -0.52, 0]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.1, 0.4, 12]} />
          <meshStandardMaterial color="#F8F9FA" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.25, 0]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#EC4899" roughness={0.3} metalness={0.5} emissive="#EC4899" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, -0.32, 0.06]}>
          <sphereGeometry args={[0.12, 12, 8]} />
          <meshStandardMaterial color="#F8F9FA" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.32, 0]}>
          <torusGeometry args={[0.11, 0.025, 8, 16]} />
          <meshStandardMaterial color="#7C3AED" roughness={0.3} metalness={0.5} />
        </mesh>
      </group>

      {/* === TAIL === */}
      <group ref={tailRef} position={[0.25, -0.2, -0.28]}>
        <mesh rotation={[0.8, 0, 0.5]}>
          <torusGeometry args={[0.22, 0.045, 8, 24, Math.PI * 1.2]} />
          <meshStandardMaterial color="#1A1A2E" roughness={0.4} />
        </mesh>
      </group>

      {/* Point light from chest for glow effect */}
      <pointLight position={[0, 0, 0.8]} intensity={0.8} color="#00F5FF" distance={2} />
    </group>
  )
}

// ============ Particle Field ============
function Particles({ count = 80 }) {
  const mesh = useRef()
  const positions = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 8
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8
  }

  useFrame((state) => {
    if (!mesh.current) return
    mesh.current.rotation.y = state.clock.getElapsedTime() * 0.03
    mesh.current.rotation.x = state.clock.getElapsedTime() * 0.015
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#00F5FF"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  )
}

// ============ Main Canvas Component ============
export default function MochiCanvas({ size = 420, className = '' }) {
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)

  const handleClick = () => {
    setClicked(true)
    setTimeout(() => setClicked(false), 800)
  }

  return (
    <div
      className={`canvas-wrapper ${className}`}
      style={{ width: size, height: size, cursor: hovered ? 'pointer' : 'grab' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      title={hovered ? 'Click to make Mochi jump! 🐱' : 'Interactive 3D Mochi'}
    >
      <Canvas
        camera={{ position: [0, 0.3, 2.5], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-3, 3, 2]} intensity={0.4} color="#8B5CF6" />
        <pointLight position={[0, 2, 3]} intensity={0.5} color="#EC4899" />

        <Float
          speed={2}
          rotationIntensity={0.1}
          floatIntensity={0.3}
        >
          <MochiModel hovered={hovered} clicked={clicked} />
        </Float>

        <Particles count={60} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.8}
          autoRotate={!hovered}
          autoRotateSpeed={0.8}
        />
      </Canvas>

      {/* Hover tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)',
          color: '#00F5FF',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
          border: '1px solid rgba(0,245,255,0.3)',
          backdropFilter: 'blur(8px)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          🐱 Click to make Mochi jump!
        </div>
      )}
    </div>
  )
}
