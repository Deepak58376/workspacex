'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import gsap from 'gsap'
import ProjectsSection from '@/components/ui/ProjectsSection'
import HeroOverlay from '@/components/ui/HeroOverlay'

const BlackHoleScene = dynamic(
  () => import('@/components/scene/BlackHoleScene'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          background: '#000000',
          width: '100vw',
          height: '100vh',
        }}
      />
    ),
  }
)

export default function HomePage() {
  const [activeSection, setActiveSection] = useState(0)
  const activeSectionRef = useRef(0)
  const isAnimating = useRef(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)

  // Keep ref synchronized with state to prevent stale closures in event listeners
  useEffect(() => {
    activeSectionRef.current = activeSection
  }, [activeSection])

  // Reset scroll progress on mount to prevent 3D scene distortion when returning from dashboard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as typeof window & { workspacex_scrollProgress?: number }).workspacex_scrollProgress = 0.0
    }
  }, [])

  const scrollProgress = useRef({ value: 0 })

  const handleScrollDown = () => {
    if (isAnimating.current || activeSectionRef.current === 1) return
    isAnimating.current = true
    
    gsap.to(wrapperRef.current, {
      y: '-100vh',
      duration: 1.1,
      ease: 'power3.inOut',
      onComplete: () => {
        isAnimating.current = false
        setActiveSection(1)
      },
    })

    gsap.to(scrollProgress.current, {
      value: 1.0,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => {
        if (typeof window !== 'undefined') {
          (window as typeof window & { workspacex_scrollProgress?: number }).workspacex_scrollProgress = scrollProgress.current.value
        }
      }
    })
  }

  const handleScrollUp = () => {
    if (isAnimating.current || activeSectionRef.current === 0) return
    isAnimating.current = true

    gsap.to(wrapperRef.current, {
      y: '0vh',
      duration: 1.1,
      ease: 'power3.inOut',
      onComplete: () => {
        isAnimating.current = false
        setActiveSection(0)
      },
    })

    gsap.to(scrollProgress.current, {
      value: 0.0,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => {
        if (typeof window !== 'undefined') {
          (window as typeof window & { workspacex_scrollProgress?: number }).workspacex_scrollProgress = scrollProgress.current.value
        }
      }
    })
  }

  useEffect(() => {
    const mainEl = mainRef.current
    if (!mainEl) return

    const handleWheel = (e: WheelEvent) => {
      const currentSec = activeSectionRef.current

      if (isAnimating.current) {
        e.preventDefault()
        return
      }

      const delta = e.deltaY

      if (currentSec === 0) {
        // If on Hero page and user scrolls down
        if (delta > 15) {
          e.preventDefault()
          handleScrollDown()
        }
      } else {
        // If on Projects page and user scrolls up
        const projEl = document.getElementById('projects')
        const scrollTop = projEl ? projEl.scrollTop : 0

        // If user is at the top of the Projects page scroll, slide back to Hero
        if (delta < -15 && scrollTop <= 3) {
          e.preventDefault()
          handleScrollUp()
        }
      }
    }

    // Touch swipe support for trackpads and mobile devices
    let touchStartY = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      const currentSec = activeSectionRef.current
      if (isAnimating.current) {
        e.preventDefault()
        return
      }

      if (currentSec === 0) {
        e.preventDefault() // lock default scroll bounce on home
      } else {
        const projEl = document.getElementById('projects')
        const scrollTop = projEl ? projEl.scrollTop : 0
        const touchCurrentY = e.touches[0].clientY
        const diffY = touchStartY - touchCurrentY

        // Lock default scrolling if trying to scroll up past projects boundary
        if (diffY < 0 && scrollTop <= 3) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const currentSec = activeSectionRef.current
      if (isAnimating.current) return

      const touchEndY = e.changedTouches[0].clientY
      const diffY = touchStartY - touchEndY

      // Trigger page transitions only on solid swipes (>50px)
      if (Math.abs(diffY) > 50) {
        if (diffY > 0 && currentSec === 0) {
          handleScrollDown()
        } else if (diffY < 0 && currentSec === 1) {
          const projEl = document.getElementById('projects')
          const scrollTop = projEl ? projEl.scrollTop : 0
          if (scrollTop <= 5) {
            handleScrollUp()
          }
        }
      }
    }

    // Listeners are added with passive: false to allow preventing default scroll bounce
    mainEl.addEventListener('wheel', handleWheel, { passive: false })
    mainEl.addEventListener('touchstart', handleTouchStart, { passive: true })
    mainEl.addEventListener('touchmove', handleTouchMove, { passive: false })
    mainEl.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      mainEl.removeEventListener('wheel', handleWheel)
      mainEl.removeEventListener('touchstart', handleTouchStart)
      mainEl.removeEventListener('touchmove', handleTouchMove)
      mainEl.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  return (
    <main
      ref={mainRef}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#000000',
        position: 'relative',
      }}
    >
      {/* 3D Canvas Background fixed behind the slides */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <BlackHoleScene />
      </div>

      <div
        ref={wrapperRef}
        style={{
          width: '100%',
          height: '200vh',
          position: 'absolute',
          top: 0,
          left: 0,
          willChange: 'transform',
          zIndex: 2,
        }}
      >
        {/* 1. Hero Section (Home / Hero Overlay) */}
        <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
          <HeroOverlay onScrollDown={handleScrollDown} />
        </div>

        {/* 2. Projects Section Container */}
        <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
          <ProjectsSection />
        </div>
      </div>
    </main>
  )
}
