import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { Vector3 } from 'three'
import { useGame } from '../state/GameContext'

interface EnemyProps {
  id: string
  initialPosition: Vector3
}

export function Enemy({ id, initialPosition }: EnemyProps) {
  const bodyRef = useRef<RapierRigidBody>(null)
  const { 
    guntherPosition, guntherSecured, 
    setGuntherSecured, setHasGunther, setEnemyHasGunther,
    enemies, setGameStatus
  } = useGame()
  
  const enemy = enemies.find(e => e.id === id)
  if (!enemy) return null

  useFrame(() => {
    if (!bodyRef.current) return
    
    const body = bodyRef.current
    const pos = body.translation()
    
    // Update enemy position in state
    enemy.position.set(pos.x, pos.y, pos.z)
    
    // If Gunther is not secured, chase him
    if (!guntherSecured) {
      const toGunther = guntherPosition.clone().sub(new Vector3(pos.x, pos.y, pos.z))
      toGunther.y = 0
      
      if (toGunther.length() > 2) {
        toGunther.normalize().multiplyScalar(4)
        body.setLinvel({ x: toGunther.x, y: body.linvel().y, z: toGunther.z }, true)
      } else if (toGunther.length() < 2 && !enemy.hasGunther) {
        // Grab Gunther!
        setEnemyHasGunther(id, true)
        setHasGunther(false)
      }
    }
    
    // If enemy has Gunther, run away
    if (enemy.hasGunther) {
      const escapeDir = new Vector3(pos.x, 0, pos.z).normalize()
      body.setLinvel({ x: escapeDir.x * 5, y: body.linvel().y, z: escapeDir.z * 5 }, true)
      
      // Check if escaped
      if (Math.abs(pos.x) > 90 || Math.abs(pos.z) > 90) {
        setGameStatus('lost', 'Ze enemy escaped vith Gunther!')
      }
    }
  })

  return (
    <RigidBody
      ref={bodyRef}
      position={[initialPosition.x, initialPosition.y, initialPosition.z]}
      lockRotations
    >
      <group>
        {/* Body - Dark uniform */}
        <mesh castShadow>
          <capsuleGeometry args={[0.3, 0.5, 8, 16]} />
          <meshStandardMaterial color="#3a3a3a" />
        </mesh>
        {/* Head */}
        <mesh castShadow position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#cc9977" />
        </mesh>
        {/* Helmet */}
        <mesh castShadow position={[0, 0.85, 0]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        {/* Candy bag */}
        <mesh position={[0.3, 0, 0]}>
          <boxGeometry args={[0.2, 0.3, 0.15]} />
          <meshStandardMaterial color="#ff69b4" />
        </mesh>
        {/* Health indicator */}
        <mesh position={[0, 1.3, 0]}>
          <boxGeometry args={[0.5 * enemy.health / 2, 0.1, 0.1]} />
          <meshStandardMaterial color={enemy.health > 1 ? "#00ff00" : "#ff0000"} />
        </mesh>
      </group>
    </RigidBody>
  )
}
