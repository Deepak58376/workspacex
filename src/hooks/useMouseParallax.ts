'use client'
 
import { useEffect, useRef } from 'react'
 
export function useMouseParallax() {
  const mouse = useRef({ x: 0, y: 0 })
 
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 0.3
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 0.15
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])
 
  return { mouse }
}
