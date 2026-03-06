import { useMemo } from 'react'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

export function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(300, 300, 100, 100)
    const positions = geo.attributes.position.array as Float32Array
    
    // Create more dramatic rolling hills
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      
      // Multi-layered noise for natural-looking hills
      const bigHills = Math.sin(x * 0.02) * Math.cos(y * 0.015) * 8
      const mediumHills = Math.sin(x * 0.05 + 1) * Math.cos(y * 0.04) * 4
      const smallBumps = Math.sin(x * 0.1) * Math.sin(y * 0.12) * 1.5
      const variation = Math.sin((x + y) * 0.03) * 2
      
      // Combine all frequencies
      let height = bigHills + mediumHills + smallBumps + variation
      
      // Keep a flat path down the center for the road
      const centerFlatness = Math.exp(-(x * x) / 800)
      height *= (1 - centerFlatness * 0.8)
      
      // Ensure minimum height of 0
      positions[i + 2] = Math.max(0, height)
    }
    
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh 
        receiveShadow 
        rotation={[-Math.PI / 2, 0, 0]} 
        geometry={geometry}
      >
        <meshStandardMaterial color="#4a7c23" />
      </mesh>
    </RigidBody>
  )
}
