import { RigidBody } from '@react-three/rapier'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Hazards() {
  return (
    <>
      <LavaPit position={[40, 0, 50]} />
      <Cliff position={[-30, 0, 70]} />
      <BearTraps position={[20, 0.1, 30]} />
    </>
  )
}

function LavaPit({ position }: { position: [number, number, number] }) {
  const lavaRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (lavaRef.current) {
      // Pulsing lava effect
      const mat = lavaRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3
    }
  })

  return (
    <RigidBody type="fixed" position={position}>
      <mesh ref={lavaRef} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[8, 32]} />
        <meshStandardMaterial 
          color="#ff3300" 
          emissive="#ff6600" 
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Rocks around edge */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2
        return (
          <mesh 
            key={i} 
            position={[Math.cos(angle) * 7, 0.5, Math.sin(angle) * 7]}
            castShadow
          >
            <dodecahedronGeometry args={[0.8]} />
            <meshStandardMaterial color="#4a4a4a" />
          </mesh>
        )
      })}
    </RigidBody>
  )
}

function Cliff({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" position={position}>
      {/* Cliff edge platform */}
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[15, 1, 15]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>
      {/* Warning signs */}
      {[-5, 0, 5].map((x, i) => (
        <group key={i} position={[x, 1, -7]}>
          <mesh castShadow>
            <boxGeometry args={[0.1, 2, 0.1]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          <mesh castShadow position={[0, 1.5, 0]}>
            <boxGeometry args={[1, 0.8, 0.1]} />
            <meshStandardMaterial color="#ffff00" />
          </mesh>
        </group>
      ))}
      {/* The void below */}
      <mesh position={[0, -10, 10]} receiveShadow>
        <boxGeometry args={[20, 0.5, 20]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    </RigidBody>
  )
}

function BearTraps({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" position={position}>
      {Array.from({ length: 5 }).map((_, i) => (
        <group key={i} position={[(i - 2) * 2, 0, Math.sin(i) * 2]}>
          {/* Trap base */}
          <mesh castShadow>
            <cylinderGeometry args={[0.4, 0.5, 0.2, 16]} />
            <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Teeth */}
          {Array.from({ length: 8 }).map((_, j) => {
            const angle = (j / 8) * Math.PI * 2
            return (
              <mesh 
                key={j} 
                position={[Math.cos(angle) * 0.35, 0.2, Math.sin(angle) * 0.35]}
                rotation={[0, 0, angle + Math.PI / 2]}
                castShadow
              >
                <coneGeometry args={[0.05, 0.3, 4]} />
                <meshStandardMaterial color="#999999" metalness={0.9} />
              </mesh>
            )
          })}
        </group>
      ))}
    </RigidBody>
  )
}
