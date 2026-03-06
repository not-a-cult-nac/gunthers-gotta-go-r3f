import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { Vector3 } from 'three'

interface GameState {
  inVehicle: boolean
  hasGunther: boolean
  guntherSecured: boolean
  guntherPosition: Vector3
  playerPosition: Vector3
  vehiclePosition: Vector3
  enemies: { id: string; position: Vector3; health: number; hasGunther: boolean }[]
  gameStatus: 'playing' | 'won' | 'lost'
  message: string
  autoplay: boolean
}

interface GameContextType extends GameState {
  setInVehicle: (v: boolean) => void
  setHasGunther: (v: boolean) => void
  setGuntherSecured: (v: boolean) => void
  setGuntherPosition: (pos: Vector3) => void
  setPlayerPosition: (pos: Vector3) => void
  setVehiclePosition: (pos: Vector3) => void
  damageEnemy: (id: string) => void
  setEnemyHasGunther: (id: string, has: boolean) => void
  setGameStatus: (status: 'playing' | 'won' | 'lost', message?: string) => void
  resetGame: () => void
  setAutoplay: (v: boolean) => void
}

const initialState: GameState = {
  inVehicle: true,
  hasGunther: true,
  guntherSecured: true,
  guntherPosition: new Vector3(0, 1, 0),
  playerPosition: new Vector3(0, 1, 0),
  vehiclePosition: new Vector3(0, 1, 0),
  enemies: [
    { id: 'enemy1', position: new Vector3(30, 1, 20), health: 2, hasGunther: false },
    { id: 'enemy2', position: new Vector3(-25, 1, 40), health: 2, hasGunther: false },
    { id: 'enemy3', position: new Vector3(15, 1, 60), health: 2, hasGunther: false },
  ],
  gameStatus: 'playing',
  message: '',
  autoplay: false,
}

const GameContext = createContext<GameContextType | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>({ ...initialState, 
    guntherPosition: new Vector3(0, 1, 0),
    playerPosition: new Vector3(0, 1, 0),
    vehiclePosition: new Vector3(0, 1, 0),
  })

  const setInVehicle = useCallback((v: boolean) => setState(s => ({ ...s, inVehicle: v })), [])
  const setHasGunther = useCallback((v: boolean) => setState(s => ({ ...s, hasGunther: v })), [])
  const setGuntherSecured = useCallback((v: boolean) => setState(s => ({ ...s, guntherSecured: v })), [])
  const setGuntherPosition = useCallback((pos: Vector3) => setState(s => ({ ...s, guntherPosition: pos.clone() })), [])
  const setPlayerPosition = useCallback((pos: Vector3) => setState(s => ({ ...s, playerPosition: pos.clone() })), [])
  const setVehiclePosition = useCallback((pos: Vector3) => setState(s => ({ ...s, vehiclePosition: pos.clone() })), [])
  
  const damageEnemy = useCallback((id: string) => {
    setState(s => ({
      ...s,
      enemies: s.enemies.map(e => 
        e.id === id ? { ...e, health: e.health - 1 } : e
      ).filter(e => e.health > 0)
    }))
  }, [])

  const setEnemyHasGunther = useCallback((id: string, has: boolean) => {
    setState(s => ({
      ...s,
      enemies: s.enemies.map(e => 
        e.id === id ? { ...e, hasGunther: has } : e
      )
    }))
  }, [])

  const setGameStatus = useCallback((status: 'playing' | 'won' | 'lost', message = '') => {
    setState(s => ({ ...s, gameStatus: status, message }))
  }, [])

  const resetGame = useCallback(() => {
    setState(s => ({
      ...initialState,
      guntherPosition: new Vector3(0, 1, 0),
      playerPosition: new Vector3(0, 1, 0),
      vehiclePosition: new Vector3(0, 1, 0),
      enemies: initialState.enemies.map(e => ({ ...e, position: e.position.clone() })),
      autoplay: s.autoplay, // preserve autoplay setting on reset
    }))
  }, [])

  const setAutoplay = useCallback((v: boolean) => setState(s => ({ ...s, autoplay: v })), [])

  return (
    <GameContext.Provider value={{
      ...state,
      setInVehicle,
      setHasGunther,
      setGuntherSecured,
      setGuntherPosition,
      setPlayerPosition,
      setVehiclePosition,
      damageEnemy,
      setEnemyHasGunther,
      setGameStatus,
      resetGame,
      setAutoplay,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
