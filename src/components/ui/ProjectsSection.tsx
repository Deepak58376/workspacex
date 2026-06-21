'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Folder, Sparkles } from 'lucide-react'
import { logoutUser } from '@/lib/actions/auth'

interface Project {
  id: string
  title: string
  createdAt: string
}

const formatRelativeTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return 'Recently'
  }
}

export default function ProjectsSection() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [session, setSession] = useState<{ user?: { name?: string | null; email?: string | null } } | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Load session and projects from database APIs on mount
  useEffect(() => {
    const fetchSessionAndProjects = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session')
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json()
          setSession(sessionData)
          
          if (sessionData?.user) {
            const res = await fetch('/api/projects')
            if (res.ok) {
              const data = await res.json()
              setProjects(data)
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize workspace data:', err)
      } finally {
        setLoadingSession(false)
      }
    }
    fetchSessionAndProjects()
  }, [])

  // Auto-focus input when entering create mode
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAdding])

  const handleAddProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newTitle.trim()) return

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTitle.trim() })
      })

      if (res.ok) {
        const newProj = await res.json()
        setProjects(prev => [newProj, ...prev])
        setNewTitle('')
        setIsAdding(false)
      } else {
        const errData = await res.json()
        alert(errData.error || 'Failed to create project')
      }
    } catch (err) {
      console.error('Failed to add project:', err)
      alert('An error occurred while creating the project')
    }
  }

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering any card actions
    
    const confirmed = confirm('Are you sure you want to delete this project? Deleting it will permanently delete all associated calendar events and documents.')
    if (!confirmed) return

    try {
      const res = await fetch(`/api/projects?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setProjects(prev => prev.filter((p) => p.id !== id))
      } else {
        const errData = await res.json()
        alert(errData.error || 'Failed to delete project')
      }
    } catch (err) {
      console.error('Failed to delete project:', err)
      alert('An error occurred while deleting the project')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddProject()
    } else if (e.key === 'Escape') {
      setIsAdding(false)
      setNewTitle('')
    }
  }

  if (loadingSession) {
    return (
      <section
        id="projects"
        className="projects-section-container"
        style={{
          width: '100%',
          height: '100vh',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', letterSpacing: '0.15em', fontFamily: 'Inter, system-ui, sans-serif' }}>
          INITIALIZING SECURE LINK...
        </div>
      </section>
    )
  }

  const handleLogout = async () => {
    try {
      setSession(null)
      setShowLogoutModal(false)
      await logoutUser()
    } finally {
      router.refresh()
    }
  }

  return (
    <section
      id="projects"
      className="projects-section-container"
      style={{
        width: '100%',
        height: '100vh',
        overflowY: 'auto',
        background: 'transparent',
        padding: '6rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 5,
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {styleTag}

      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Title Section */}
        <div
          className="projects-header"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '1.5rem',
            marginBottom: '3rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            width: '100%',
          }}
        >
          <div>
            <h2
              style={{
                color: '#ffffff',
                fontSize: '2.2rem',
                fontWeight: 300,
                letterSpacing: '0.2em',
                margin: 0,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              PROJECTS
            </h2>
            <p
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.9rem',
                marginTop: '0.5rem',
                fontFamily: 'Inter, system-ui, sans-serif',
                letterSpacing: '0.05em',
                margin: '0.5rem 0 0 0',
              }}
            >
              Manage and launch your active operations workspaces.
            </p>
          </div>
          {session?.user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '0.2rem' }} className="user-profile-header">
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
                Signed in as <strong style={{ color: '#ffffff' }}>{session.user.name || session.user.email}</strong>
              </span>
              <button
                onClick={() => setShowLogoutModal(true)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  padding: '0.4rem 1rem',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'all 0.2s',
                }}
                className="btn-signout"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        {session?.user ? (
          <div
            className="projects-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '2rem',
              width: '100%',
            }}
          >
          {/* Add Project Card */}
          {isAdding ? (
            <div
              className="card-input"
              style={{
                height: '180px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '4px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  New Project Title
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="e.g. Project Orion..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '3px',
                    color: '#ffffff',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    transition: 'border-color 0.2s ease',
                  }}
                  className="project-input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setIsAdding(false)
                    setNewTitle('')
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    padding: '0.4rem 1rem',
                    fontSize: '0.8rem',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                 <button
                   onClick={() => handleAddProject()}
                   disabled={!newTitle.trim()}
                   style={{
                     background: '#ffffff',
                     border: '1px solid #ffffff',
                     color: '#000000',
                     padding: '0.4rem 1rem',
                     fontSize: '0.8rem',
                     fontWeight: 600,
                     borderRadius: '3px',
                     cursor: newTitle.trim() ? 'pointer' : 'not-allowed',
                     opacity: newTitle.trim() ? 1 : 0.5,
                     fontFamily: 'Inter, system-ui, sans-serif',
                     transition: 'opacity 0.2s, cursor 0.2s',
                   }}
                   className="btn-create"
                 >
                   Create
                 </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsAdding(true)}
              className="add-card"
              style={{
                height: '180px',
                border: '1px dashed rgba(255,255,255,0.25)',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                gap: '0.75rem',
                transition: 'border-color 0.3s, background-color 0.3s, transform 0.3s',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  transition: 'border-color 0.3s, background-color 0.3s',
                }}
                className="add-icon-container"
              >
                <Plus size={18} color="rgba(255,255,255,0.6)" className="plus-icon" />
              </div>
              <span
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.9rem',
                  letterSpacing: '0.05em',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'color 0.3s',
                }}
                className="add-text"
              >
                Add Project
              </span>
            </div>
          )}

          {/* Project List Cards */}
          {projects.map((project) => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => router.push(`/dashboard?title=${encodeURIComponent(project.title)}`)}
              style={{
                height: '180px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '4px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                position: 'relative',
                transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.3s',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Folder size={20} color="rgba(255,255,255,0.35)" className="folder-icon" />
                <button
                  onClick={(e) => handleDeleteProject(project.id, e)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s',
                  }}
                  className="delete-btn"
                  title="Delete Project"
                >
                  <Trash2 size={16} color="rgba(255,255,255,0.4)" className="trash-icon" />
                </button>
              </div>

              {/* Card Body */}
              <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                <h3
                  style={{
                    color: '#ffffff',
                    fontSize: '1.15rem',
                    fontWeight: 400,
                    margin: 0,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    letterSpacing: '0.02em',
                    lineHeight: '1.4',
                  }}
                >
                  {project.title}
                </h3>
              </div>

              {/* Card Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: '0.78rem',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  {formatRelativeTime(project.createdAt)}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'rgba(255,255,255,0.25)',
                    fontSize: '0.75rem',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                  className="active-indicator"
                >
                  <Sparkles size={10} /> Active
                </span>
              </div>
            </div>
          ))}
        </div>
        ) : (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              borderRadius: '8px',
              padding: '4rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '2rem auto 0 auto',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.03)',
                marginBottom: '1.5rem',
              }}
            >
              <Sparkles size={24} color="rgba(255,255,255,0.7)" />
            </div>
            <h3
              style={{
                color: '#ffffff',
                fontSize: '1.4rem',
                fontWeight: 300,
                letterSpacing: '0.15em',
                margin: '0 0 1rem 0',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              SECURE OPERATION PORTAL
            </h3>
            <p
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                maxWidth: '450px',
                margin: '0 0 2.5rem 0',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              Sign in to access your secure project workspaces, schedule mission-critical tasks, and securely upload project documents.
            </p>
            <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '360px' }}>
              <button
                onClick={() => router.push('/login')}
                style={{
                  flex: 1,
                  background: '#ffffff',
                  color: '#000000',
                  border: '1px solid #ffffff',
                  borderRadius: '4px',
                  padding: '0.8rem 1.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'opacity 0.2s, box-shadow 0.2s',
                }}
                className="btn-login-cta"
              >
                LOG IN
              </button>
              <button
                onClick={() => router.push('/signup')}
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  padding: '0.8rem 1.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                className="btn-signup-cta"
              >
                SIGN UP
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal Overlay */}
      {showLogoutModal && (
        <div
          onClick={() => setShowLogoutModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: '380px',
              background: '#0c0c0c',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: '0 0 35px rgba(255, 255, 255, 0.08)',
              textAlign: 'center',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 400, letterSpacing: '0.05em', color: '#ffffff' }}>
              LOG OUT
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
              Do you want to log out?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '3px',
                  color: 'rgba(255,255,255,0.7)',
                  padding: '0.5rem 1.5rem',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s',
                }}
                className="logout-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: '#ffffff',
                  border: '1px solid #ffffff',
                  borderRadius: '3px',
                  color: '#000000',
                  padding: '0.5rem 1.5rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s',
                }}
                className="logout-confirm-btn"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// Embedded css styling for rich premium micro-interactions and animations
const styleTag = (
  <style>{`
    /* Add Card Hover Styles */
    .add-card:hover {
      border-color: rgba(255, 255, 255, 0.85) !important;
      background-color: rgba(255, 255, 255, 0.05) !important;
      transform: translateY(-4px);
    }
    .add-card:hover .add-icon-container {
      border-color: rgba(255, 255, 255, 0.8) !important;
      background-color: rgba(255, 255, 255, 0.08) !important;
    }
    .add-card:hover .plus-icon {
      color: #ffffff !important;
      transform: scale(1.1);
    }
    .add-card:hover .add-text {
      color: #ffffff !important;
    }

    /* Project Card Hover Styles */
    .project-card:hover {
      border-color: rgba(255, 255, 255, 0.7) !important;
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.12) !important;
      transform: translateY(-4px);
      background-color: rgba(255, 255, 255, 0.04) !important;
    }
    .project-card:hover .folder-icon {
      color: rgba(255, 255, 255, 0.85) !important;
    }
    .project-card:hover .active-indicator {
      color: rgba(255, 255, 255, 0.6) !important;
    }

    /* Delete Button Hover Styles */
    .delete-btn:hover {
      background-color: rgba(239, 68, 68, 0.15) !important;
    }
    .delete-btn:hover .trash-icon {
      color: #ef4444 !important;
    }

    /* Input Field Focus Styles */
    .project-input-field:focus {
      border-color: rgba(255, 255, 255, 0.7) !important;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.15) !important;
    }

    /* Cancel and Create Button Hover Styles */
    .btn-cancel:hover {
      border-color: rgba(255, 255, 255, 0.6) !important;
      background: rgba(255, 255, 255, 0.05) !important;
    }
    .btn-create:hover {
      opacity: 0.9 !important;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.3) !important;
    }
    
    .btn-signout:hover {
      border-color: rgba(255, 255, 255, 0.6) !important;
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.05) !important;
    }
    .logout-cancel-btn:hover {
      border-color: rgba(255,255,255,0.6) !important;
      color: #ffffff !important;
      background: rgba(255,255,255,0.05) !important;
    }
    .logout-confirm-btn:hover {
      background: rgba(255,255,255,0.85) !important;
      border-color: rgba(255,255,255,0.85) !important;
    }
    
    .btn-login-cta:hover {
      opacity: 0.9 !important;
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.35) !important;
    }
    
    .btn-signup-cta:hover {
      border-color: rgba(255, 255, 255, 0.8) !important;
      background: rgba(255, 255, 255, 0.04) !important;
    }

    @media (max-width: 768px) {
      .projects-section-container {
        padding: 4rem 1.5rem !important;
      }
      .projects-header h2 {
        font-size: 1.8rem !important;
      }
      .projects-header p {
        font-size: 0.82rem !important;
      }
    }

    @media (max-width: 480px) {
      .projects-section-container {
        padding: 3rem 1rem !important;
      }
      .projects-header h2 {
        font-size: 1.45rem !important;
        letter-spacing: 0.15em !important;
      }
      .projects-grid {
        grid-template-columns: 1fr !important;
        gap: 1.25rem !important;
      }
    }
  `}</style>
)
