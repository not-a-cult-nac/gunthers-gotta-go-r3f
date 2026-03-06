import { Terrain } from './Terrain'
import { Vehicle } from './Vehicle'
import { Player } from './Player'
import { Gunther } from './Gunther'
import { Enemy } from './Enemy'
import { Goal } from './Goal'
import { Hazards } from './Hazards'
import { useGame } from '../state/GameContext'

export function Game() {
  const { enemies } = useGame()
  
  return (
    <>
      <Terrain />
      <Vehicle />
      <Player />
      <Gunther />
      <Goal position={[0, 1, 100]} />
      <Hazards />
      {enemies.map(enemy => (
        <Enemy key={enemy.id} id={enemy.id} initialPosition={enemy.position} />
      ))}
    </>
  )
}
