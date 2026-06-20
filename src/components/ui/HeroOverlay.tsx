'use client'

import { ChevronDown } from 'lucide-react'

export default function HeroOverlay({ onScrollDown }: { onScrollDown?: () => void }) {
  const scrollToProjects = () => {
    if (onScrollDown) {
      onScrollDown()
    } else {
      const section = document.getElementById('projects')
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <div className="hero-overlay-container">
      <style>{`
        .hero-overlay-container {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding-top: clamp(2.5rem, 7vh, 4.5rem);
          z-index: 10;
          pointer-events: none;
        }

        @keyframes glow-pulse {
          0% {
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.85), 0 0 20px rgba(255, 255, 255, 0.35);
          }
          100% {
            text-shadow: 0 0 15px rgba(255, 255, 255, 1.0), 0 0 30px rgba(255, 255, 255, 0.5);
          }
        }


        .glitch-title {
          position: relative;
          color: #ffffff;
          font-size: clamp(2rem, 5vw, 4rem);
          font-weight: 300;
          letter-spacing: 0.3em;
          margin: 0;
          font-family: 'Inter', system-ui, sans-serif;
          text-align: center;
          animation: glow-pulse 3s infinite alternate ease-in-out;
        }

        /* Pseudo-elements for chromatic aberration glitching */
        .glitch-title::before,
        .glitch-title::after {
          content: 'WORKSPACEX';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
          color: #ffffff;
          overflow: hidden;
          pointer-events: none;
        }

        /* Glitch Layer 1 - Lavender/Purple */
        .glitch-title::before {
          text-shadow: -2px 0 #7a5cff, 0 0 8px rgba(255, 255, 255, 0.4);
          animation: glitch-anim-1 4.5s infinite linear;
        }

        /* Glitch Layer 2 - Electric Cyan */
        .glitch-title::after {
          text-shadow: 2px 0 #00d8ff, 0 0 8px rgba(255, 255, 255, 0.4);
          animation: glitch-anim-2 5.2s infinite linear;
        }

        /* Erratic keyframes with long periods of calm (dormant) and short spikes of glitching */
        @keyframes glitch-anim-1 {
          0%, 75%, 80%, 100% {
            clip-path: inset(100% 0 0 0);
            transform: translate(0);
            opacity: 0;
          }
          76% {
            clip-path: inset(12% 0 82% 0);
            transform: translate(-5px, -1px);
            opacity: 1;
          }
          77% {
            clip-path: inset(78% 0 8% 0);
            transform: translate(4px, 2px);
            opacity: 1;
          }
          78% {
            clip-path: inset(45% 0 45% 0);
            transform: translate(-2px, -3px);
            opacity: 1;
          }
          79% {
            clip-path: inset(3% 0 92% 0);
            transform: translate(3px, 1px);
            opacity: 1;
          }
        }

        @keyframes glitch-anim-2 {
          0%, 60%, 65%, 100% {
            clip-path: inset(100% 0 0 0);
            transform: translate(0);
            opacity: 0;
          }
          61% {
            clip-path: inset(28% 0 68% 0);
            transform: translate(5px, 2px);
            opacity: 1;
          }
          62% {
            clip-path: inset(58% 0 38% 0);
            transform: translate(-4px, -1px);
            opacity: 1;
          }
          63% {
            clip-path: inset(84% 0 4% 0);
            transform: translate(2px, 3px);
            opacity: 1;
          }
          64% {
            clip-path: inset(10% 0 85% 0);
            transform: translate(-3px, -2px);
            opacity: 1;
          }
        }

        /* Scroll indicator animations and hover states */
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(6px);
          }
        }

        .scroll-indicator:hover .scroll-text {
          color: #ffffff !important;
        }
        .scroll-indicator:hover .scroll-arrow-icon {
          stroke: #ffffff !important;
        }

        .scroll-arrow-icon {
          animation: bounce 2s infinite ease-in-out;
          transition: stroke 0.3s;
        }

        @media (max-width: 640px) {
          .hero-overlay-container {
            padding-top: 8.5rem !important;
          }
          .glitch-title {
            letter-spacing: 0.15em !important;
            font-size: 1.75rem !important;
          }
          .scroll-indicator {
            bottom: 4rem !important;
          }
          .scroll-text {
            font-size: 0.62rem !important;
            letter-spacing: 0.18em !important;
          }
        }
      `}</style>


      <h1 className="glitch-title">
        WORKSPACEX
      </h1>

      <p
        style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: 'clamp(0.75rem, 1.5vw, 1rem)',
          fontWeight: 300,
          letterSpacing: '0.2em',
          marginTop: '0.5rem',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        Content Operations Center
      </p>

      {/* Scroll indicator pointing to projects section */}
      <div
        onClick={scrollToProjects}
        style={{
          position: 'absolute',
          bottom: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          pointerEvents: 'all',
          gap: '0.5rem',
        }}
        className="scroll-indicator"
      >
        <span
          style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: '0.7rem',
            letterSpacing: '0.25em',
            fontWeight: 400,
            fontFamily: 'Inter, system-ui, sans-serif',
            transition: 'color 0.3s',
          }}
          className="scroll-text"
        >
          SCROLL TO PROJECTS
        </span>
        <ChevronDown
          size={20}
          color="rgba(255,255,255,0.35)"
          className="scroll-arrow-icon"
        />
      </div>
    </div>
  )
}
