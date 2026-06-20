'use client'
 
import { useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
 
export default function StarField() {
  const pointsRef = useRef<THREE.Points>(null)
 
  const positions = useMemo(() => {
    const count     = 3000
    const positions = new Float32Array(count * 3)
 
    let seed = 12345
    const seededRandom = () => {
      const x = Math.sin(seed++) * 10000
      return x - Math.floor(x)
    }

    for (let i = 0; i < count; i++) {
      const theta = seededRandom() * Math.PI * 2
      const phi   = Math.acos(2 * seededRandom() - 1)
      const r     = 40 + seededRandom() * 40
 
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
 
    return positions
  }, [])
 
  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.00008
    }
  })
 
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.08}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.85}
      />
    </points>
  )
}
