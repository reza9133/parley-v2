import { useState, useEffect, useRef } from 'react'

export function useAnimatedCounter(target, duration = 2000, start = 0) {
  const [count, setCount] = useState(start)
  const frameRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    const targetNum = parseFloat(String(target).replace(/,/g, ''))
    if (isNaN(targetNum)) return

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)
      // Easing: ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + (targetNum - start) * eased

      // Format with commas if original had them
      if (String(target).includes(',')) {
        setCount(Math.floor(current).toLocaleString())
      } else if (String(target).includes('.')) {
        setCount(current.toFixed(1))
      } else {
        setCount(Math.floor(current))
      }

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration, start])

  return count
}
