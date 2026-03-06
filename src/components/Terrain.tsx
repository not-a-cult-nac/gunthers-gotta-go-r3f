import { useMemo } from 'react'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

export function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(200, 200, 64, 64)
    const positions = geo.attributes.position.array as Float32Array
    
    // Create rolling hills
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      // Perlin-ish noise approximation
      const height = 
        Math.sin(x * 0.05) * 2 +
        Math.cos(y * 0.03) * 3 +
        Math.sin((x + y) * 0.02) * 1.5
      positions[i + 2] = Math.max(0, height) // Z becomes height when rotated
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
