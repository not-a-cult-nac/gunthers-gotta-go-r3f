import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { Vector3, Quaternion, Euler } from 'three'
import { useGame } from '../state/GameContext'

// Direct keyboard state (more reliable than KeyboardControls)
const humanKeys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  interact: false,
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') humanKeys.forward = true
    if (e.code === 'KeyS' || e.code === 'ArrowDown') humanKeys.backward = true
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') humanKeys.left = true
    if (e.code === 'KeyD' || e.code === 'ArrowRight') humanKeys.right = true
    if (e.code === 'KeyE') humanKeys.interact = true
  })
  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') humanKeys.forward = false
    if (e.code === 'KeyS' || e.code === 'ArrowDown') humanKeys.backward = false
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') humanKeys.left = false
    if (e.code === 'KeyD' || e.code === 'ArrowRight') humanKeys.right = false
    if (e.code === 'KeyE') humanKeys.interact = false
  })
}

// Merge human and AI inputs
function getKeys() {
  const ai = (typeof window !== 'undefined' && (window as any).aiKeys) || {}
  return {
    forward: humanKeys.forward || ai.forward,
    backward: humanKeys.backward || ai.backward,
    left: humanKeys.left || ai.left,
    right: humanKeys.right || ai.right,
    interact: humanKeys.interact || ai.interact,
  }
}

export function Vehicle() {
  const bodyRef = useRef<RapierRigidBody>(null)
  const { inVehicle, setVehiclePosition, setInVehicle, setGuntherSecured, hasGunther } = useGame()
  
  const lastInteract = useRef(0)

  useFrame((state) => {
    if (!bodyRef.current) return
    
    const body = bodyRef.current
    const pos = body.translation()
    setVehiclePosition(new Vector3(pos.x, pos.y, pos.z))
    
    const now = state.clock.elapsedTime
    const keys = getKeys()
    
    // Handle exit/enter
    if (keys.interact && now - lastInteract.current > 0.5) {
      lastInteract.current = now
      if (inVehicle) {
        setInVehicle(false)
        // Gunther might escape when we exit!
        if (hasGunther && Math.random() < 0.3) {
          setGuntherSecured(false)
        }
      }
    }
    
    if (!inVehicle) return
    
    // Driving controls
    const rot = body.rotation()
    const quat = new Quaternion(rot.x, rot.y, rot.z, rot.w)
    const forward = new Vector3(0, 0, -1).applyQuaternion(quat)
    
    const velocity = body.linvel()
    const speed = new Vector3(velocity.x, 0, velocity.z).length()
    
    // Acceleration
    if (keys.forward) {
      body.applyImpulse({ x: forward.x * 20, y: 0, z: forward.z * 20 }, true)
    }
    if (keys.backward) {
      body.applyImpulse({ x: -forward.x * 12, y: 0, z: -forward.z * 12 }, true)
    }
    
    // Turning (only when moving)
    if (speed > 0.5) {
      const turnStrength = 3
      if (keys.left) {
        body.applyTorqueImpulse({ x: 0, y: turnStrength, z: 0 }, true)
      }
      if (keys.right) {
        body.applyTorqueImpulse({ x: 0, y: -turnStrength, z: 0 }, true)
      }
    }
    
    // Damping
    body.setLinearDamping(1.5)
    body.setAngularDamping(3)
  })

  return (
    <RigidBody
      ref={bodyRef}
      position={[0, 3, 0]}
      colliders="cuboid"
      mass={500}
      linearDamping={1.5}
      angularDamping={3}
    >
      {/* Main body */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[2.5, 1.5, 4]} />
        <meshStandardMaterial color={inVehicle ? "#3d5c1f" : "#2a4015"} />
      </mesh>
      {/* Cabin */}
      <mesh castShadow position={[0, 1.3, -0.3]}>
        <boxGeometry args={[2, 0.8, 2]} />
        <meshStandardMaterial color="#2d4a16" />
      </mesh>
      {/* Wheels */}
      {[[-1, -0.2, 1.3], [1, -0.2, 1.3], [-1, -0.2, -1.3], [1, -0.2, -1.3]].map((pos, i) => (
        <mesh key={i} castShadow position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
    </RigidBody>
  )
}
