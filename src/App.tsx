import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Sky } from '@react-three/drei'
import { Suspense } from 'react'
import { Game } from './components/Game'
import { UI } from './components/UI'
import { GameProvider } from './state/GameContext'

export default function App() {
  return (
    <GameProvider>
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas shadows camera={{ position: [0, 10, 20], fov: 60 }}>
          <Suspense fallback={null}>
            <Sky sunPosition={[100, 50, 100]} />
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[50, 50, 25]}
              intensity={1.2}
              castShadow
              shadow-mapSize={[2048, 2048]}
            />
            <Physics gravity={[0, -20, 0]}>
              <Game />
            </Physics>
          </Suspense>
        </Canvas>
        <UI />
      </div>
    </GameProvider>
  )
}
