import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier'
import { Vector3 } from 'three'
import { useGame } from '../state/GameContext'

// Direct keyboard state
const humanKeys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  interact: false,
  grab: false,
  shoot: false,
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') humanKeys.forward = true
    if (e.code === 'KeyS' || e.code === 'ArrowDown') humanKeys.backward = true
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') humanKeys.left = true
    if (e.code === 'KeyD' || e.code === 'ArrowRight') humanKeys.right = true
    if (e.code === 'KeyE') humanKeys.interact = true
    if (e.code === 'Space') humanKeys.grab = true
  })
  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') humanKeys.forward = false
    if (e.code === 'KeyS' || e.code === 'ArrowDown') humanKeys.backward = false
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') humanKeys.left = false
    if (e.code === 'KeyD' || e.code === 'ArrowRight') humanKeys.right = false
    if (e.code === 'KeyE') humanKeys.interact = false
    if (e.code === 'Space') humanKeys.grab = false
  })
  window.addEventListener('mousedown', () => { humanKeys.shoot = true })
  window.addEventListener('mouseup', () => { humanKeys.shoot = false })
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
    grab: humanKeys.grab || ai.grab,
    shoot: humanKeys.shoot || ai.shoot,
  }
}

export function Player() {
  const bodyRef = useRef<RapierRigidBody>(null)
  const { camera } = useThree()
  const { 
    inVehicle, setInVehicle, 
    vehiclePosition, setPlayerPosition,
    guntherPosition, guntherSecured, setGuntherSecured, setHasGunther,
    holdingHands, setHoldingHands, setStrain,
    damageEnemy, enemies
  } = useGame()
  
  const lastInteract = useRef(0)
  const lastShoot = useRef(0)
  const lastGrab = useRef(0)
  const wasInVehicle = useRef(true)

  useFrame((state) => {
    if (!bodyRef.current) return
    
    const body = bodyRef.current
    const pos = body.translation()
    setPlayerPosition(new Vector3(pos.x, pos.y, pos.z))
    
    const now = state.clock.elapsedTime
    const keys = getKeys()
    
    // Spawn near vehicle when exiting
    if (wasInVehicle.current && !inVehicle) {
      body.setTranslation({
        x: vehiclePosition.x + 4,
        y: vehiclePosition.y + 2,
        z: vehiclePosition.z
      }, true)
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }
    wasInVehicle.current = inVehicle
    
    // If in vehicle, follow vehicle and control camera
    if (inVehicle) {
      body.setTranslation({
        x: vehiclePosition.x,
        y: vehiclePosition.y + 3,
        z: vehiclePosition.z
      }, true)
      camera.position.set(
        vehiclePosition.x - Math.sin(state.clock.elapsedTime * 0.1) * 0.5,
        vehiclePosition.y + 10,
        vehiclePosition.z + 18
      )
      camera.lookAt(vehiclePosition.x, vehiclePosition.y, vehiclePosition.z)
      return
    }
    
    // On foot: camera follows player
    camera.position.set(pos.x, pos.y + 5, pos.z + 12)
    camera.lookAt(pos.x, pos.y + 1, pos.z)
    
    // Get movement direction relative to camera
    const forward = new Vector3(0, 0, -1)
    const right = new Vector3(1, 0, 0)
    
    // Movement
    const moveDir = new Vector3()
    if (keys.forward) moveDir.add(forward)
    if (keys.backward) moveDir.sub(forward)
    if (keys.left) moveDir.sub(right)
    if (keys.right) moveDir.add(right)
    
    if (moveDir.length() > 0) {
      moveDir.normalize().multiplyScalar(10)
      body.setLinvel({ x: moveDir.x, y: body.linvel().y, z: moveDir.z }, true)
    } else {
      // Friction when not moving
      const vel = body.linvel()
      body.setLinvel({ x: vel.x * 0.9, y: vel.y, z: vel.z * 0.9 }, true)
    }
    
    // Enter vehicle
    if (keys.interact && now - lastInteract.current > 0.5) {
      lastInteract.current = now
      const dist = new Vector3(pos.x, pos.y, pos.z).distanceTo(vehiclePosition)
      if (dist < 6) {
        // If holding hands, bring Gunther into the car
        if (holdingHands) {
          setGuntherSecured(true)
          setHasGunther(true)
          setHoldingHands(false)
          setStrain(0)
        }
        setInVehicle(true)
      }
    }
    
    // SPACE: Hold/release Gunther's hand
    if (keys.grab && now - lastGrab.current > 0.3) {
      lastGrab.current = now
      const gDist = new Vector3(pos.x, pos.y, pos.z).distanceTo(guntherPosition)
      
      if (holdingHands) {
        // Release hand
        setHoldingHands(false)
        setStrain(0)
      } else if (!guntherSecured && gDist < 4) {
        // Grab hand
        setHoldingHands(true)
        setStrain(0)
      }
    }
    
    // Shooting
    if (keys.shoot && now - lastShoot.current > 0.4) {
      lastShoot.current = now
      const playerPos = new Vector3(pos.x, pos.y, pos.z)
      enemies.forEach(enemy => {
        const dist = playerPos.distanceTo(enemy.position)
        if (dist < 25) {
          // Hit enemies in front of us (simplified)
          const toEnemy = enemy.position.clone().sub(playerPos)
          toEnemy.y = 0
          // Check if enemy is roughly in front (z direction)
          if (toEnemy.z < 0 && Math.abs(toEnemy.x) < 10) {
            damageEnemy(enemy.id)
          }
        }
      })
    }
  })

  return (
    <RigidBody
      ref={bodyRef}
      position={[0, 5, 0]}
      lockRotations
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider args={[0.5, 0.4]} />
      {!inVehicle && (
        <group>
          {/* Body */}
          <mesh castShadow position={[0, 0.5, 0]}>
            <capsuleGeometry args={[0.35, 0.7, 8, 16]} />
            <meshStandardMaterial color="#3366aa" />
          </mesh>
          {/* Head */}
          <mesh castShadow position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.28, 16, 16]} />
            <meshStandardMaterial color="#ffcc99" />
          </mesh>
          {/* Helmet */}
          <mesh castShadow position={[0, 1.35, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#2d5a1d" />
          </mesh>
        </group>
      )}
    </RigidBody>
  )
}
