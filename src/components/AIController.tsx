import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Vector3 } from 'three'
import { useGame } from '../state/GameContext'

// Reference to the shared key state (from Vehicle.tsx and Player.tsx)
// We'll inject our AI inputs here
declare global {
  interface Window {
    aiKeys: {
      forward: boolean
      backward: boolean
      left: boolean
      right: boolean
      interact: boolean
      grab: boolean
      shoot: boolean
    }
  }
}

// Initialize AI keys
if (typeof window !== 'undefined') {
  window.aiKeys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    interact: false,
    grab: false,
    shoot: false,
  }
}

const GOAL_Z = 100
const GRAB_DISTANCE = 5
const VEHICLE_ENTER_DISTANCE = 6
const SHOOT_DISTANCE = 20

export function AIController() {
  const {
    autoplay,
    inVehicle,
    vehiclePosition,
    playerPosition,
    guntherPosition,
    guntherSecured,
    hasGunther,
    enemies,
    gameStatus,
  } = useGame()

  const lastActionTime = useRef(0)
  const aiState = useRef<'driving' | 'exiting' | 'chasing' | 'grabbing' | 'returning' | 'entering'>('driving')

  useFrame((state) => {
    if (!autoplay || gameStatus !== 'playing') {
      // Clear AI inputs when not in autoplay
      if (typeof window !== 'undefined' && window.aiKeys) {
        Object.keys(window.aiKeys).forEach(k => {
          (window.aiKeys as any)[k] = false
        })
      }
      return
    }

    const now = state.clock.elapsedTime
    const ai = window.aiKeys

    // Reset all keys each frame
    ai.forward = false
    ai.backward = false
    ai.left = false
    ai.right = false
    ai.interact = false
    ai.grab = false
    ai.shoot = false

    // Determine AI state
    if (inVehicle && guntherSecured) {
      aiState.current = 'driving'
    } else if (inVehicle && !guntherSecured) {
      aiState.current = 'exiting'
    } else if (!inVehicle && !guntherSecured) {
      const distToGunther = playerPosition.distanceTo(guntherPosition)
      if (distToGunther > GRAB_DISTANCE) {
        aiState.current = 'chasing'
      } else {
        aiState.current = 'grabbing'
      }
    } else if (!inVehicle && guntherSecured) {
      const distToVehicle = playerPosition.distanceTo(vehiclePosition)
      if (distToVehicle > VEHICLE_ENTER_DISTANCE) {
        aiState.current = 'returning'
      } else {
        aiState.current = 'entering'
      }
    }

    // Execute AI behavior based on state
    switch (aiState.current) {
      case 'driving': {
        // Drive toward goal
        const distToGoal = GOAL_Z - vehiclePosition.z
        
        if (distToGoal > 5) {
          ai.forward = true
          
          // Steer toward center (x = 0) and forward
          if (vehiclePosition.x > 3) {
            ai.left = true
          } else if (vehiclePosition.x < -3) {
            ai.right = true
          }
        }
        
        // Shoot at nearby enemies
        enemies.forEach(enemy => {
          const dist = vehiclePosition.distanceTo(enemy.position)
          if (dist < SHOOT_DISTANCE) {
            ai.shoot = true
          }
        })
        break
      }

      case 'exiting': {
        // Exit vehicle to chase Gunther
        ai.interact = true
        break
      }

      case 'chasing': {
        // Move toward Gunther
        const toGunther = guntherPosition.clone().sub(playerPosition)
        toGunther.y = 0
        
        if (toGunther.z < -1) ai.forward = true
        if (toGunther.z > 1) ai.backward = true
        if (toGunther.x < -1) ai.left = true
        if (toGunther.x > 1) ai.right = true
        
        // Shoot enemies while chasing
        enemies.forEach(enemy => {
          const dist = playerPosition.distanceTo(enemy.position)
          if (dist < SHOOT_DISTANCE && enemy.position.z < playerPosition.z) {
            ai.shoot = true
          }
        })
        break
      }

      case 'grabbing': {
        // Grab Gunther
        ai.grab = true
        break
      }

      case 'returning': {
        // Move back to vehicle
        const toVehicle = vehiclePosition.clone().sub(playerPosition)
        toVehicle.y = 0
        
        if (toVehicle.z < -1) ai.forward = true
        if (toVehicle.z > 1) ai.backward = true
        if (toVehicle.x < -1) ai.left = true
        if (toVehicle.x > 1) ai.right = true
        break
      }

      case 'entering': {
        // Enter vehicle
        ai.interact = true
        break
      }
    }
  })

  return null // This component doesn't render anything
}
