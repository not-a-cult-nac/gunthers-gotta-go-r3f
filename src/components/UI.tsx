import { useGame } from '../state/GameContext'
import { useEffect, useState } from 'react'

// Debug: show which keys are pressed
const pressedKeys = new Set<string>()
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => pressedKeys.add(e.code))
  window.addEventListener('keyup', (e) => pressedKeys.delete(e.code))
}

export function UI() {
  const { 
    inVehicle, hasGunther, guntherSecured, 
    gameStatus, message, resetGame 
  } = useGame()
  
  const [debug, setDebug] = useState('')
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDebug(Array.from(pressedKeys).join(', ') || 'none')
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      fontFamily: 'Arial, sans-serif',
    }}>
      {/* Debug panel */}
      <div style={{
        position: 'absolute',
        bottom: 80,
        right: 20,
        background: 'rgba(255,0,0,0.8)',
        color: 'white',
        padding: '10px 15px',
        borderRadius: 8,
        fontSize: 14,
      }}>
        <div>DEBUG - Keys: {debug}</div>
      </div>

      {/* Status bar */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '15px 20px',
        borderRadius: 10,
      }}>
        <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          🎮 Gunther's Gotta Go (R3F)
        </div>
        <div>
          🚗 Vehicle: {inVehicle ? '✅ Inside' : '🚶 On foot'}
        </div>
        <div>
          👶 Gunther: {
            guntherSecured ? '✅ Secured' : 
            hasGunther ? '⚠️ Loose!' : '❌ Lost!'
          }
        </div>
      </div>

      {/* Controls */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '15px 20px',
        borderRadius: 10,
        fontSize: 14,
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Controls:</div>
        {inVehicle ? (
          <>
            <div>W/S - Drive forward/back</div>
            <div>A/D - Turn</div>
            <div>E - Exit vehicle</div>
          </>
        ) : (
          <>
            <div>WASD - Move</div>
            <div>Click - Shoot</div>
            <div>Space - Grab Gunther</div>
            <div>E - Enter vehicle (when close)</div>
          </>
        )}
      </div>

      {/* Objective */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '15px 20px',
        borderRadius: 10,
        maxWidth: 250,
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8 }}>🎯 Objective:</div>
        <div>Deliver Gunther to the gold platform!</div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#aaa' }}>
          Warning: Gunther runs toward danger and enemies want to steal him!
        </div>
      </div>

      {/* Game over overlay */}
      {gameStatus !== 'playing' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: gameStatus === 'won' ? 'rgba(0,100,0,0.8)' : 'rgba(100,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        }}>
          <div style={{ 
            fontSize: 48, 
            fontWeight: 'bold', 
            color: 'white',
            marginBottom: 20,
          }}>
            {gameStatus === 'won' ? '🎉 YOU WIN!' : '💀 GAME OVER'}
          </div>
          <div style={{ 
            fontSize: 24, 
            color: 'white',
            marginBottom: 30,
          }}>
            {message}
          </div>
          <button
            onClick={resetGame}
            style={{
              fontSize: 20,
              padding: '15px 40px',
              cursor: 'pointer',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: 8,
            }}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}
