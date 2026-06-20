'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import StarField from './StarField'

export default function StarfieldBackground() {
  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 0, 
        pointerEvents: 'none' 
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: '#000000', width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <StarField />
        </Suspense>
      </Canvas>
    </div>
  )
}
