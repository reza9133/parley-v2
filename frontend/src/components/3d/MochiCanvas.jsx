import React, { useRef, useEffect, useState, Component } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float } from '@react-three/drei'
import * as THREE from 'three'

// ============ WebGL Detection ============
function isWebGLSupported() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return Boolean(window.WebGLRenderingContext && gl)
  } catch {
    return false
  }
}

// ============ Error Boundary for Canvas ============
class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.warn('[MochiCanvas] WebGL render error, falling back to 2D mascot:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// ============ Mochi 3D Model (built from Three.js primitives) ============
function MochiModel({ hovered, clicked }) {
  const groupRef = useRef()
  const headRef = useRef()
  const rightArmRef = useRef()
  const tailRef = useRef()
  const leftEyeRef = useRef()
  const rightEyeRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()

    // Idle floating
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.08

    // Head tilt
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.5) * 0.1
      headRef.current.rotation.z = Math.sin(t * 0.3) * 0.05
    }

    // Arm wave when hovered
    if (rightArmRef.current) {
      if (hovered) {
        rightArmRef.current.rotation.z = Math.sin(t * 4) * 0.4 - 0.3
      } else {
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z, -0.3, 0.05
        )
      }
    }

    // Click jump
    if (clicked && groupRef.current) {
      groupRef.current.position.y = Math.abs(Math.sin(t * 8)) * 0.3
    }

    // Eye glow pulse
    if (leftEyeRef.current?.material && rightEyeRef.current?.material) {
      const pulse = (Math.sin(t * 2) + 1) / 2
      const col = new THREE.Color(0, 0.5 + pulse * 0.5, 0.9)
      leftEyeRef.current.material.emissive = col
      rightEyeRef.current.material.emissive = col
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

      {/* Chest plaque */}
      <mesh position={[0, -0.05, 0.34]}>
        <planeGeometry args={[0.18, 0.18]} />
        <meshStandardMaterial color="#111111" roughness={0.8} />
      </mesh>
      {/* Triangle logo */}
      <mesh position={[0, -0.04, 0.341]}>
        <coneGeometry args={[0.06, 0.1, 3]} />
        <meshStandardMaterial color="#00F5FF" roughness={0.5} emissive="#00F5FF" emissiveIntensity={0.4} />
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

      {/* Belt buckles */}
      <mesh position={[-0.2, -0.25, 0.25]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#EC4899" roughness={0.2} metalness={0.6} emissive="#EC4899" emissiveIntensity={0.3} />
      </mesh>
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
        {/* Hand */}
        <mesh position={[0, -0.28, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#6B7280" roughness={0.5} metalness={0.2} />
        </mesh>
      </group>

      {/* === LEGS === */}
      <group position={[-0.16, -0.52, 0]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.1, 0.4, 12]} />
          <meshStandardMaterial color="#F8F9FA" roughness={0.3} />
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

      <group position={[0.16, -0.52, 0]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.1, 0.4, 12]} />
          <meshStandardMaterial color="#F8F9FA" roughness={0.3} />
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

      {/* Point light for chest glow */}
      <pointLight position={[0, 0, 0.8]} intensity={0.8} color="#00F5FF" distance={2} />
    </group>
  )
}

// ============ Particle Field ============
function Particles({ count = 60 }) {
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

// ============ Interactive 2D/SVG Mascot Fallback ============
function MochiFallback({ size = 420, hovered, clicked }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: 260,
          height: 280,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: clicked ? 'translateY(-20px) scale(1.05)' : hovered ? 'translateY(-8px)' : 'translateY(0)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <svg viewBox="0 0 200 220" width="100%" height="100%" style={{ filter: 'drop-shadow(0 12px 30px rgba(0, 245, 255, 0.25))' }}>
          <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient id="earPink" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F5FF" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
          </defs>

          {/* Cat Ears */}
          <polygon points="45,55 30,10 70,35" fill="url(#bodyGrad)" stroke="#CBD5E1" strokeWidth="2" />
          <polygon points="47,48 36,20 65,36" fill="url(#earPink)" />
          <polygon points="155,55 170,10 130,35" fill="url(#bodyGrad)" stroke="#CBD5E1" strokeWidth="2" />
          <polygon points="153,48 164,20 135,36" fill="url(#earPink)" />

          {/* Headphones Band */}
          <path d="M 28 85 A 72 72 0 0 1 172 85" fill="none" stroke="#7C3AED" strokeWidth="8" strokeLinecap="round" />
          {/* Headphone Cups */}
          <rect x="20" y="70" width="16" height="32" rx="8" fill="#EC4899" />
          <rect x="164" y="70" width="16" height="32" rx="8" fill="#EC4899" />

          {/* Head Helmet */}
          <rect x="35" y="35" width="130" height="110" rx="45" fill="url(#bodyGrad)" stroke="#E2E8F0" strokeWidth="2" />

          {/* Visor */}
          <rect x="48" y="55" width="104" height="65" rx="28" fill="#0A0E1A" stroke="#1E293B" strokeWidth="2" />

          {/* Cyan Glowing Eyes */}
          <ellipse cx="78" cy="88" rx="14" ry="9" fill="url(#cyanGlow)">
            <animate attributeName="ry" values="9;1;9" dur="4s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="122" cy="88" rx="14" ry="9" fill="url(#cyanGlow)">
            <animate attributeName="ry" values="9;1;9" dur="4s" repeatCount="indefinite" />
          </ellipse>

          {/* Eye Sparkles */}
          <circle cx="82" cy="85" r="3" fill="#FFFFFF" />
          <circle cx="126" cy="85" r="3" fill="#FFFFFF" />

          {/* Body */}
          <rect x="60" y="140" width="80" height="60" rx="22" fill="url(#bodyGrad)" stroke="#CBD5E1" strokeWidth="2" />

          {/* GenLayer Chest Triangle */}
          <polygon points="100,152 88,172 112,172" fill="#00F5FF">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
          </polygon>

          {/* Pink Belt */}
          <rect x="62" y="180" width="76" height="8" rx="4" fill="#EC4899" />
          <circle cx="80" cy="184" r="5" fill="#7C3AED" />
          <circle cx="120" cy="184" r="5" fill="#7C3AED" />

          {/* Arms */}
          <rect x="36" y="145" width="20" height="42" rx="10" fill="url(#bodyGrad)" stroke="#CBD5E1" strokeWidth="2" />
          <rect x="144" y="145" width="20" height="42" rx="10" fill="url(#bodyGrad)" stroke="#CBD5E1" strokeWidth="2"
            transform={hovered ? "rotate(-30 144 145)" : "rotate(0 144 145)"}
            style={{ transformOrigin: '144px 145px', transition: 'transform 0.3s ease' }}
          />

          {/* Paws */}
          <ellipse cx="75" cy="205" rx="14" ry="10" fill="url(#bodyGrad)" stroke="#CBD5E1" strokeWidth="1.5" />
          <ellipse cx="125" cy="205" rx="14" ry="10" fill="url(#bodyGrad)" stroke="#CBD5E1" strokeWidth="1.5" />
        </svg>
      </div>

      <div style={{
        marginTop: 10,
        padding: '6px 14px',
        borderRadius: 20,
        background: 'rgba(0,245,255,0.08)',
        border: '1px solid rgba(0,245,255,0.3)',
        fontSize: 12,
        fontWeight: 600,
        color: '#00F5FF',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span>🐾</span>
        <span>Meet Mochi · GenLayer Mascot</span>
      </div>
    </div>
  )
}

// ============ Main MochiCanvas Export ============
export default function MochiCanvas({ size = 420, className = '' }) {
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [webGLOk, setWebGLOk] = useState(true)

  useEffect(() => {
    setWebGLOk(isWebGLSupported())
  }, [])

  const handleClick = () => {
    setClicked(true)
    setTimeout(() => setClicked(false), 800)
  }

  const fallbackElement = (
    <MochiFallback size={size} hovered={hovered} clicked={clicked} />
  )

  return (
    <div
      className={`canvas-wrapper ${className}`}
      style={{
        width: size,
        height: size,
        cursor: hovered ? 'pointer' : 'grab',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      title={hovered ? 'Click to make Mochi jump! 🐱' : 'Interactive Mochi Mascot'}
    >
      <CanvasErrorBoundary fallback={fallbackElement}>
        {webGLOk ? (
          <Canvas
            camera={{ position: [0, 0.3, 2.5], fov: 45 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
            style={{ background: 'transparent', width: '100%', height: '100%' }}
          >
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} />
            <directionalLight position={[-3, 3, 2]} intensity={0.5} color="#8B5CF6" />
            <pointLight position={[0, 2, 3]} intensity={0.6} color="#EC4899" />

            <Float
              speed={2}
              rotationIntensity={0.1}
              floatIntensity={0.3}
            >
              <MochiModel hovered={hovered} clicked={clicked} />
            </Float>

            <Particles count={50} />

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 1.8}
              autoRotate={!hovered}
              autoRotateSpeed={0.8}
            />
          </Canvas>
        ) : (
          fallbackElement
        )}
      </CanvasErrorBoundary>

      {/* Hover tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(5,7,20,0.85)',
          color: '#00F5FF',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
          border: '1px solid rgba(0,245,255,0.4)',
          backdropFilter: 'blur(8px)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          🐱 Click to make Mochi jump!
        </div>
      )}
    </div>
  )
}
