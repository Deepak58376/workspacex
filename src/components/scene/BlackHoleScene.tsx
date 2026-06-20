'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useRef, useEffect } from 'react'
import * as THREE from 'three'
import BlackHole from './BlackHole'
import AccretionDisk from './AccretionDisk'
import StarField from './StarField'

function InteractiveGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)
  const { size } = useThree()

  useFrame(() => {
    if (typeof window !== 'undefined' && groupRef.current) {
      const progress = (window as typeof window & { workspacex_scrollProgress?: number }).workspacex_scrollProgress || 0

      // Smooth parallax shifts
      groupRef.current.position.y = progress * 1.5
      groupRef.current.position.z = -progress * 0.4

      // Calculate perfect responsive scale based on viewport width & height
      // size.width / size.height gives the exact canvas aspect ratio
      const aspect = size.height > 0 ? size.width / size.height : 1.0

      // 1. Fit horizontally: outer radius is 4.2 (total width 8.4). Viewport width is 5.77 * aspect.
      const maxScaleX = (5.77 * aspect * 0.85) / 8.4
      // 2. Fit vertically: total height is ~4.0. Viewport height is constant at 5.77.
      const maxScaleY = (5.77 * 0.8) / 4.0

      // Base scale fits in both dimensions
      const baseScale = Math.min(maxScaleY, maxScaleX)

      // Shrink and fade the black hole to 0 before snapping to projects section (at progress ~0.77)
      const scrollFactor = Math.max(0, 1.0 - progress * 1.3)
      const scale = baseScale * scrollFactor

      groupRef.current.scale.set(scale, scale, scale)
      groupRef.current.visible = scrollFactor > 0.01
    }
  })

  return <group ref={groupRef}>{children}</group>
}
 
export default function BlackHoleScene() {
  useEffect(() => {
    // Reset scroll progress on mount to ensure aligned 3D parameters
    if (typeof window !== 'undefined') {
      (window as typeof window & { workspacex_scrollProgress?: number }).workspacex_scrollProgress = 0.0
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={1.0} // Keep DPR at 1.0 for absolute WebGL stability on M1 Mac full screen
        style={{ background: '#000000' }}
      >
        <Suspense fallback={null}>
          <StarField />
          <InteractiveGroup>
            <BlackHole />
            <AccretionDisk />
          </InteractiveGroup>
        </Suspense>
      </Canvas>
    </div>
  )
}
