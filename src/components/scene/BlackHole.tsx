'use client'
 
import { useRef } from 'react'
import * as THREE from 'three'
 
export default function BlackHole() {
  const meshRef = useRef<THREE.Mesh>(null)
 
  return (
    <mesh ref={meshRef} renderOrder={1}>
      <sphereGeometry args={[1.0, 64, 64]} />
      <meshBasicMaterial
        color="#000000"
        depthWrite={true}
      />
    </mesh>
  )
}
