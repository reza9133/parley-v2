import { useCallback, useRef } from 'react'

// Generates a short beep using Web Audio API — no external files needed
function createBeep(frequency = 440, duration = 80, volume = 0.05, type = 'sine') {
  return () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = frequency
      oscillator.type = type
      gainNode.gain.setValueAtTime(volume, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration / 1000)

      oscillator.onended = () => ctx.close()
    } catch (e) {
      // Silent fail — some browsers block AudioContext without user gesture
    }
  }
}

const sounds = {
  click: createBeep(600, 60, 0.04, 'sine'),
  hover: createBeep(800, 40, 0.02, 'sine'),
  success: createBeep(880, 120, 0.05, 'sine'),
  error: createBeep(220, 150, 0.05, 'sawtooth'),
  connect: createBeep(660, 200, 0.04, 'sine'),
  submit: createBeep(740, 100, 0.04, 'triangle'),
}

export function useSound() {
  const enabled = useRef(true)

  const play = useCallback((name) => {
    if (!enabled.current) return
    const fn = sounds[name]
    if (fn) fn()
  }, [])

  const toggle = useCallback(() => {
    enabled.current = !enabled.current
  }, [])

  return { play, toggle }
}
