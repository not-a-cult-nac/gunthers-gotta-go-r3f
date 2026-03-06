import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { useRef } from 'react'
import { Vector3 } from 'three'
import { useGame } from '../state/GameContext'

interface GoalProps {
  position: [number, number, number]
}

export function Goal({ position }: GoalProps) {
  const { vehiclePosition, hasGunther, guntherSecured, setGameStatus, inVehicle } = useGame()
  const goalPos = new Vector3(...position)
  
  useFrame(() => {
    // Win condition: vehicle at goal with Gunther secured
    if (inVehicle && hasGunther && guntherSecured) {
      const dist = vehiclePosition.distanceTo(goalPos)
      if (dist < 8) {
        setGameStatus('won', 'Gunther has been delivered safely! (Somehow...)')
      }
    }
  })

  return (
    <RigidBody type="fixed" position={position}>
      <mesh receiveShadow>
        <cylinderGeometry args={[6, 6, 0.5, 32]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffa500" emissiveIntensity={0.3} />
      </mesh>
      {/* Flag pole */}
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 6, 8]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      {/* Flag */}
      <mesh position={[1, 5, 0]} castShadow>
        <boxGeometry args={[2, 1, 0.1]} />
        <meshStandardMaterial color="#00ff00" />
      </mesh>
    </RigidBody>
  )
}
