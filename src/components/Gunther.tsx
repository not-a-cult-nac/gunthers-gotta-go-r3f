import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import { Vector3 } from 'three'
import { useGame } from '../state/GameContext'

const GUNTHER_QUOTES = [
  "Please pop pop, I vant to see ze bear traps!",
  "Ze lava looks so varm and cozy!",
  "Zat man has candy! I go say hello!",
  "Vhy are ve running? Ze cliff looks fun!",
  "I vonder vhat happens if I touch ze spiky zings...",
  "Ze enemy soldiers seem nice!",
]

export function Gunther() {
  const bodyRef = useRef<RapierRigidBody>(null)
  const { 
    guntherSecured, vehiclePosition, setGuntherPosition,
    setGuntherSecured, setHasGunther, setGameStatus,
    holdingHands, setHoldingHands, strain, setStrain,
    playerPosition, inVehicle
  } = useGame()
  const [quote, setQuote] = useState('')
  const [showQuote, setShowQuote] = useState(false)
  const wanderTarget = useRef(new Vector3())
  const lastQuoteTime = useRef(0)

  // Random quotes
  useFrame((state) => {
    if (!guntherSecured && state.clock.elapsedTime - lastQuoteTime.current > 5) {
      lastQuoteTime.current = state.clock.elapsedTime
      setQuote(GUNTHER_QUOTES[Math.floor(Math.random() * GUNTHER_QUOTES.length)])
      setShowQuote(true)
      setTimeout(() => setShowQuote(false), 3000)
    }
  })

  // Hazard positions
  const hazards = [
    new Vector3(40, 0, 50),  // Lava
    new Vector3(-30, 0, 70), // Cliff
    new Vector3(20, 0, 30),  // Bear traps
  ]

  useFrame((state, delta) => {
    if (!bodyRef.current) return
    
    const body = bodyRef.current
    const pos = body.translation()
    const currentPos = new Vector3(pos.x, pos.y, pos.z)
    setGuntherPosition(currentPos)
    
    // If secured in vehicle, follow vehicle
    if (guntherSecured) {
      body.setTranslation({
        x: vehiclePosition.x,
        y: vehiclePosition.y + 1.5,
        z: vehiclePosition.z - 1
      }, true)
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      return
    }
    
    // HOLDING HANDS: Follow player but strain toward danger
    if (holdingHands) {
      // Find nearest hazard
      let nearestHazard = hazards[0]
      let nearestDist = currentPos.distanceTo(hazards[0])
      hazards.forEach(h => {
        const d = currentPos.distanceTo(h)
        if (d < nearestDist) {
          nearestDist = d
          nearestHazard = h
        }
      })
      
      // Calculate pull strength
      const pullStrength = Math.max(0, 100 - nearestDist * 2)
      
      // Follow player
      const toPlayer = playerPosition.clone().sub(currentPos)
      toPlayer.y = 0
      const followDist = toPlayer.length()
      
      if (followDist > 2) {
        toPlayer.normalize()
        const followSpeed = Math.min(6, followDist)
        body.setLinvel({ 
          x: toPlayer.x * followSpeed, 
          y: body.linvel().y, 
          z: toPlayer.z * followSpeed 
        }, true)
        
        // Also pull toward hazard based on strain
        if (pullStrength > 20) {
          const toHazard = nearestHazard.clone().sub(currentPos).normalize()
          const pullVel = body.linvel()
          body.setLinvel({
            x: pullVel.x + toHazard.x * pullStrength * 0.02,
            y: pullVel.y,
            z: pullVel.z + toHazard.z * pullStrength * 0.02
          }, true)
        }
      } else {
        // Stay at arm's length
        body.setLinvel({ x: 0, y: body.linvel().y, z: 0 }, true)
      }
      
      // Update strain
      const newStrain = Math.min(100, strain + pullStrength * 0.3 * delta)
      const decayedStrain = Math.max(0, newStrain - 10 * delta)
      setStrain(decayedStrain)
      
      // Break free if strain too high!
      if (strain >= 100) {
        setHoldingHands(false)
        setStrain(0)
        // Sprint toward danger!
        const toHazard = nearestHazard.clone().sub(currentPos).normalize()
        body.setLinvel({ x: toHazard.x * 8, y: body.linvel().y, z: toHazard.z * 8 }, true)
        setQuote("HAHA! You cannot hold GUNTHER!")
        setShowQuote(true)
        setTimeout(() => setShowQuote(false), 3000)
      }
      
      return
    }
    
    // WANDERING: Move toward danger!
    // Pick new target occasionally
    if (Math.random() < 0.01 || wanderTarget.current.length() === 0) {
      wanderTarget.current = hazards[Math.floor(Math.random() * hazards.length)]
    }
    
    // Move toward target
    const dir = wanderTarget.current.clone().sub(currentPos)
    dir.y = 0
    if (dir.length() > 1) {
      dir.normalize().multiplyScalar(3)
      body.setLinvel({ x: dir.x, y: body.linvel().y, z: dir.z }, true)
    }
    
    // Check if reached hazard (lose condition)
    if (currentPos.distanceTo(new Vector3(40, pos.y, 50)) < 5) {
      setGameStatus('lost', 'Gunther fell in ze lava!')
    }
    if (currentPos.distanceTo(new Vector3(-30, pos.y, 70)) < 5) {
      setGameStatus('lost', 'Gunther jumped off ze cliff!')
    }
  })

  return (
    <RigidBody
      ref={bodyRef}
      position={[0, 2, -2]}
      lockRotations
    >
      <group>
        {/* Body - BRIGHT ORANGE */}
        <mesh castShadow>
          <capsuleGeometry args={[0.25, 0.4, 8, 16]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff3300" emissiveIntensity={0.3} />
        </mesh>
        {/* Head */}
        <mesh castShadow position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#ffcc99" />
        </mesh>
        {/* Blonde hair */}
        <mesh castShadow position={[0, 0.75, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#ffdd44" />
        </mesh>
        {/* Lollipop */}
        <mesh position={[0.15, 0.5, 0.15]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#ff0066" emissive="#ff0066" emissiveIntensity={0.5} />
        </mesh>
        {/* Arrow marker */}
        {!guntherSecured && (
          <mesh position={[0, 1.5, 0]}>
            <coneGeometry args={[0.2, 0.4, 8]} />
            <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.8} />
          </mesh>
        )}
        {/* Quote bubble */}
        {showQuote && (
          <Text
            position={[0, 2, 0]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.02}
            outlineColor="black"
          >
            {quote}
          </Text>
        )}
      </group>
    </RigidBody>
  )
}
