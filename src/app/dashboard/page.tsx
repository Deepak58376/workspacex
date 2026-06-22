'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Calendar as CalendarIcon, ArrowLeft, Plus, ChevronLeft, ChevronRight, User, Trash2, FileText, X, Upload, Menu, Globe } from 'lucide-react'
import { logoutUser } from '@/lib/actions/auth'

interface Event {
  id: string
  date: string // YYYY-MM-DD
  title: string
}


const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

const dataURLtoBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',')
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

const platformIcons: Record<string, React.FC<{ size?: number }>> = {
  Linkedin: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  Instagram: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  Facebook: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  X: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  Youtube: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  )
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const projectTitle = searchParams.get('title') || 'Workspace'

  // User session state
  const [user, setUser] = useState<{ name?: string | null; email?: string | null } | null>(null)

  // Calendar State (Initialized to June 2026 matching current date June 19, 2026)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 19)) // June is index 5
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 5, 19))
  const [events, setEvents] = useState<Event[]>([])
  const [newEventTitle, setNewEventTitle] = useState('')
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<{ id: string; name: string; size: string; date: string; url?: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Platform selection dropdown state
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const platformDropdownRef = useRef<HTMLDivElement>(null)

  // Logout confirmation modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Google connection state
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)

  // Check Google Calendar connection status
  useEffect(() => {
    if (user) {
      const checkGoogleStatus = async () => {
        try {
          const res = await fetch('/api/auth/google-calendar/status')
          if (res.ok) {
            const data = await res.json()
            setIsGoogleConnected(data.connected)
          }
        } catch (err) {
          console.error('Failed to check Google connection status:', err)
        }
      }
      checkGoogleStatus()
    }
  }, [user])

  const handleGoogleConnect = () => {
    window.location.href = `/api/auth/google-calendar/connect?projectTitle=${encodeURIComponent(projectTitle)}`
  }

  const handleGoogleDisconnect = async () => {
    try {
      const res = await fetch('/api/auth/google-calendar/status', { method: 'POST' })
      if (res.ok) {
        setIsGoogleConnected(false)
        alert('Google Calendar disconnected successfully')
      } else {
        alert('Failed to disconnect Google Calendar')
      }
    } catch (err) {
      console.error('Failed to disconnect Google Calendar:', err)
      alert('An error occurred during disconnection')
    }
  }

  // Load session on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const session = await res.json()
          if (session?.user) {
            setUser(session.user)
          }
        }
      } catch (err) {
        console.error('Failed to fetch session:', err)
      }
    }
    fetchSession()
  }, [])

  // Load events and documents from DB on mount / projectTitle change
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`/api/calendar?projectTitle=${encodeURIComponent(projectTitle)}`)
        if (res.ok) {
          const data = await res.json()
          setEvents(data)
        }
      } catch (err) {
        console.error('Failed to load events:', err)
      }
    }

    const fetchDocs = async () => {
      try {
        const res = await fetch(`/api/documents?projectTitle=${encodeURIComponent(projectTitle)}`)
        if (res.ok) {
          const data = await res.json()
          setUploadedDocs(data)
        }
      } catch (err) {
        console.error('Failed to load documents:', err)
      }
    }

    fetchEvents()
    fetchDocs()
  }, [projectTitle])

  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/calendar?id=${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setEvents(events.filter((e) => e.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete event:', err)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Enforce 3MB file size limit client-side due to Vercel's serverless payload limit
      if (file.size > 3 * 1024 * 1024) {
        alert(`Upload failed: "${file.name}" exceeds the maximum upload limit of 3MB. Please compress or select a smaller file.`)
        continue
      }

      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      const sizeStr = `${sizeMB} MB`

      try {
        const fileUrl = await fileToBase64(file)
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            size: sizeStr,
            date: selectedDateStr,
            url: fileUrl,
            projectTitle
          })
        })

        if (res.ok) {
          const savedDoc = await res.json()
          setUploadedDocs(prev => [savedDoc, ...prev])
        } else {
          let errorMessage = 'Server error occurred'
          if (res.status === 413) {
            errorMessage = 'File size is too large for the server to process. Please select a file smaller than 3MB.'
          } else {
            try {
              const errData = await res.json()
              if (errData && errData.error) {
                errorMessage = errData.error
              }
            } catch (jsonErr) {
              // Non-JSON response (e.g. gateway HTML error page)
              if (res.status === 504) {
                errorMessage = 'Server timed out. Please try again.'
              }
            }
          }
          alert(`Upload failed: ${errorMessage}`)
        }
      } catch (err) {
        console.error('Failed to upload file:', err)
        alert(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeleteDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/documents?id=${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setUploadedDocs(prev => prev.filter(d => d.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete document:', err)
    }
  }

  const openSimulatedPreview = (doc: { id: string; name: string; size: string; date: string; url?: string }) => {
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${doc.name} - Viewer</title>
            <style>
              body {
                background: #000000;
                color: #ffffff;
                font-family: 'Inter', system-ui, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
              }
              .viewer-card {
                background: #0c0c0c;
                border: 1px solid rgba(255,255,255,0.15);
                padding: 3rem;
                border-radius: 6px;
                text-align: center;
                max-width: 500px;
                box-shadow: 0 0 30px rgba(255,255,255,0.05);
              }
              h1 {
                font-size: 1.4rem;
                font-weight: 300;
                letter-spacing: 0.05em;
                margin-bottom: 0.5rem;
              }
              p {
                color: rgba(255,255,255,0.4);
                font-size: 0.85rem;
                margin: 0 0 2rem 0;
              }
              .doc-content {
                border-top: 1px solid rgba(255,255,255,0.1);
                padding-top: 2rem;
                display: flex;
                flex-direction: column;
                gap: 12px;
                text-align: left;
              }
              .line {
                height: 8px;
                background: rgba(255,255,255,0.1);
                border-radius: 4px;
              }
              .line.short { width: 60%; }
              .line.medium { width: 85%; }
              .line.long { width: 100%; }
            </style>
          </head>
          <body>
            <div class="viewer-card">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: rgba(255,255,255,0.5); margin-bottom: 1.5rem;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
              <h1>${doc.name}</h1>
              <p>${doc.size} &bull; Uploaded on ${doc.date}</p>
              <div class="doc-content">
                <div style="font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-bottom: 8px; font-weight: 500;">DOCUMENT CONTENTS (SIMULATED PREVIEW)</div>
                <div class="line long"></div>
                <div class="line medium"></div>
                <div class="line short"></div>
                <div class="line long"></div>
                <div class="line medium"></div>
                <div style="color: rgba(255,255,255,0.25); font-size: 0.75rem; text-align: center; margin-top: 1.5rem;">[ End of Preview ]</div>
              </div>
            </div>
          </body>
        </html>
      `)
      newWindow.document.close()
    }
  }

  const handleOpenDoc = (doc: { id: string; name: string; size: string; date: string; url?: string }) => {
    if (doc.url) {
      if (doc.url.startsWith('blob:')) {
        window.open(doc.url, '_blank')
      } else if (doc.url.startsWith('data:')) {
        try {
          const blob = dataURLtoBlob(doc.url)
          const blobUrl = URL.createObjectURL(blob)
          window.open(blobUrl, '_blank')
        } catch (err) {
          console.error('Failed to parse data URL:', err)
          openSimulatedPreview(doc)
        }
      } else {
        openSimulatedPreview(doc)
      }
    } else {
      openSimulatedPreview(doc)
    }
  }

  // Calendar Math helper
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    // 0 = Sunday, 1 = Monday, etc. Adjusting so 0 = Monday, 6 = Sunday
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayIndex = getFirstDayOfMonth(year, month)

  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ]

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getFormattedDateString = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const selectedDateStr = getFormattedDateString(selectedDate)
  const selectedDateEvents = events.filter(e => e.date === selectedDateStr)

  // Persistence of selected platforms (date and project specific)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = `platforms_${projectTitle}_${selectedDateStr}`
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          setSelectedPlatforms(JSON.parse(saved))
        } catch (e) {
          setSelectedPlatforms([])
        }
      } else {
        setSelectedPlatforms([])
      }
    }
  }, [projectTitle, selectedDateStr])

  const handleTogglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => {
      const next = prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
      if (typeof window !== 'undefined') {
        const key = `platforms_${projectTitle}_${selectedDateStr}`
        localStorage.setItem(key, JSON.stringify(next))
      }
      return next
    })
  }

  // Click outside handler for closing the platform dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (platformDropdownRef.current && !platformDropdownRef.current.contains(event.target as Node)) {
        setShowPlatformDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      setUser(null)
      setShowLogoutModal(false)
      await logoutUser()
    } finally {
      router.push('/')
      router.refresh()
    }
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventTitle.trim()) return

    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEventTitle.trim(),
          date: selectedDateStr,
          projectTitle
        })
      })

      if (res.ok) {
        const createdEvent = await res.json()
        setEvents(prev => [...prev, createdEvent])
      }
    } catch (err) {
      console.error('Failed to add event:', err)
    }

    setNewEventTitle('')
    setShowAddEvent(false)
  }

  // Generate calendar grid slots
  const renderCalendarDays = () => {
    const daySlots = []

    // Blank slots for alignment
    for (let i = 0; i < firstDayIndex; i++) {
      daySlots.push(<div key={`blank-${i}`} className="calendar-cell blank" />)
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const thisDate = new Date(year, month, day)
      const thisDateStr = getFormattedDateString(thisDate)
      const hasEvents = events.some(e => e.date === thisDateStr)
      const isToday = year === 2026 && month === 5 && day === 19
      const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year

      daySlots.push(
        <div
          key={`day-${day}`}
          onClick={() => setSelectedDate(thisDate)}
          className={`calendar-cell day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
        >
          <span className="day-number">{day}</span>
          {hasEvents && <div className="event-dot" />}
        </div>
      )
    }

    return daySlots
  }

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        background: '#000000',
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      <style>{`
        /* Sidebar Styling */
        .sidebar {
          width: 260px;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          background: #050505;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2rem 1.5rem;
        }

        .logo-text {
          font-size: 1.2rem;
          font-weight: 300;
          letter-spacing: 0.25em;
          color: #ffffff;
          margin: 0 0 3rem 0;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: opacity 0.2s, text-shadow 0.2s;
        }
        .logo-text:hover {
          opacity: 0.8;
          text-shadow: 0 0 12px rgba(255, 255, 255, 0.65);
        }

        .tab-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.06);
          border-left: 2px solid #ffffff;
          font-size: 0.9rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: background 0.2s;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0.5rem 0;
        }
        .back-btn:hover {
          color: #ffffff;
        }

        /* Calendar Grid Styles */
        .calendar-container {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem 3rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .calendar-body {
          flex-grow: 1;
          display: flex;
          padding: 3rem;
          gap: 3rem;
          overflow-y: auto;
        }

        .calendar-grid-section {
          flex: 1.5;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .month-selector {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
        }

        .month-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .month-btn:hover {
          color: #ffffff;
        }

        .weekdays-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.1em;
          font-weight: 600;
        }

        .grid-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }

        .calendar-cell {
          aspect-ratio: 1.2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          font-size: 0.95rem;
          position: relative;
          cursor: pointer;
          transition: border-color 0.2s, background-color 0.2s;
        }

        .calendar-cell.blank {
          cursor: default;
          opacity: 0;
        }

        .calendar-cell.day {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.85);
        }

        .calendar-cell.day:hover {
          border-color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.05);
        }

        .calendar-cell.day.selected {
          border-color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .calendar-cell.day.today {
          border-color: rgba(255, 255, 255, 0.4);
          color: #ffffff;
          background: rgba(255, 255, 255, 0.06);
        }

        .calendar-cell.day.today::after {
          content: '';
          position: absolute;
          width: 5px;
          height: 5px;
          background: #ffffff;
          border-radius: 50%;
          bottom: 6px;
        }

        .event-dot {
          width: 6px;
          height: 6px;
          background: #ffffff;
          box-shadow: 0 0 8px #ffffff;
          border-radius: 50%;
          position: absolute;
          bottom: 12px;
        }
        .calendar-cell.day.today .event-dot {
          bottom: 16px; /* Offset so it doesn't overlap today dot */
        }

        /* Event Panel Styles */
        .events-panel {
          flex: 1;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: fit-content;
        }

        .event-item {
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.04);
          border-left: 2px solid rgba(255, 255, 255, 0.35);
          border-radius: 0 3px 3px 0;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.9);
          transition: border-color 0.2s, background-color 0.2s;
        }
        .event-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-left-color: #ffffff;
        }

        .add-event-input:focus {
          border-color: rgba(255, 255, 255, 0.6) !important;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.1) !important;
        }
        .task-delete-btn {
          opacity: 0.6;
          transition: opacity 0.2s, background-color 0.2s;
        }
        .task-delete-btn:hover {
          opacity: 1 !important;
          background-color: rgba(239, 68, 68, 0.15) !important;
        }
        .doc-btn:hover {
          color: #ffffff !important;
          background-color: rgba(255, 255, 255, 0.08) !important;
        }
        .platform-dropdown-item:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff !important;
        }
        .platform-dropdown-item:hover span {
          color: #ffffff !important;
        }
        .platform-active-badge {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .platform-active-badge:hover {
          border-color: rgba(255, 255, 255, 0.35) !important;
          background: rgba(255, 255, 255, 0.06) !important;
          color: #ffffff !important;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.03);
          transform: translateY(-1px);
        }
        .btn-signout-dash:hover {
          border-color: rgba(255, 255, 255, 0.6) !important;
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .logout-cancel-btn:hover {
          border-color: rgba(255, 255, 255, 0.6) !important;
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .logout-confirm-btn:hover {
          background: rgba(255, 255, 255, 0.85) !important;
          border-color: rgba(255, 255, 255, 0.85) !important;
        }
        .btn-google-connect:hover {
          border-color: rgba(255, 255, 255, 0.6) !important;
          background: rgba(255, 255, 255, 0.05) !important;
          color: #ffffff !important;
        }
        .btn-google-disconnect:hover {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.1) !important;
          color: #ef4444 !important;
        }
        .close-modal-btn:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .upload-dropzone:hover {
          border-color: rgba(255, 255, 255, 0.7) !important;
          background-color: rgba(255, 255, 255, 0.04) !important;
        }
        .upload-dropzone:hover .upload-icon {
          stroke: #ffffff !important;
          transform: scale(1.08);
        }
        .doc-delete-btn {
          opacity: 0.6;
          transition: opacity 0.2s, background-color 0.2s;
        }
        .doc-delete-btn:hover {
          opacity: 1 !important;
          background-color: rgba(239, 68, 68, 0.15) !important;
        }
        .doc-item-click {
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .doc-item-click:hover {
          opacity: 0.85;
        }
        .doc-item-click:hover .doc-name-text {
          color: #ffffff !important;
          text-decoration: underline;
        }

        /* Collapsible close button in sidebar header */
        .close-sidebar-btn {
          display: none;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 4px;
          transition: background 0.2s, color 0.2s;
        }
        .close-sidebar-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        /* Sidebar Responsive Overlay & Transition */
        .sidebar {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (max-width: 1023px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 260px;
            z-index: 150;
            transform: translateX(-100%);
            box-shadow: 20px 0 35px rgba(0, 0, 0, 0.8);
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 140;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
          }
          .sidebar-overlay.open {
            opacity: 1;
            pointer-events: auto;
          }
          .close-sidebar-btn {
            display: flex;
          }
          
          .calendar-body {
            flex-direction: column;
            padding: 1.5rem !important;
            gap: 2rem !important;
            overflow-y: auto;
          }
          .calendar-grid-section {
            width: 100%;
          }
          .events-panel {
            width: 100%;
          }
          .calendar-header {
            padding: 1.5rem !important;
          }
        }

        @media (max-width: 640px) {
          .calendar-header {
            padding: 1.25rem 1rem !important;
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .calendar-header .mobile-logo-title {
            order: -2 !important;
            display: block !important;
            margin: 0 auto 0.5rem auto !important;
            text-align: center;
            width: 100%;
          }
          .calendar-header .dashboard-title {
            font-size: 1.4rem !important;
            order: -1;
          }
          .calendar-header > div:first-of-type {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .calendar-header > div:last-of-type {
            width: 100%;
            justify-content: center;
          }
          .active-workspace-label {
            font-size: 0.7rem !important;
          }
          .calendar-header h2 {
            font-size: 1.1rem !important;
          }

          .calendar-body {
            padding: 1rem !important;
            gap: 1.5rem !important;
          }
          .calendar-cell {
            aspect-ratio: 1.1 !important;
            font-size: 0.82rem !important;
          }
          .month-selector h3 {
            font-size: 0.95rem !important;
          }
          
          .modal-container {
            padding: 1.25rem !important;
            gap: 1rem !important;
          }
          .modal-container h3 {
            font-size: 0.95rem !important;
          }
          .upload-dropzone {
            padding: 1.25rem !important;
          }
          
          .smartphone-footer {
            display: flex !important;
            justify-content: center;
            align-items: center;
            padding: 1.25rem 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            background: #050505;
            width: 100%;
          }
          .smartphone-back-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.85rem;
            letter-spacing: 0.05em;
            cursor: pointer;
            transition: color 0.2s;
          }
          .smartphone-back-btn:hover {
            color: #ffffff;
          }
        }

        .smartphone-footer {
          display: none;
        }
      `}</style>

      {/* Sidebar Overlay for Mobile */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Left Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div>
          <div className="sidebar-brand-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
            <h1 onClick={() => router.push('/')} className="logo-text" style={{ margin: 0 }}>WORKSPACEX</h1>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="close-sidebar-btn"
            >
              <X size={20} />
            </button>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="tab-item">
              <CalendarIcon size={18} />
              <span>Calendar</span>
            </div>
          </nav>

          <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.35)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Integrations
            </span>
            {isGoogleConnected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(74, 222, 128, 0.85)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
                  Google Calendar Active
                </span>
                <button
                  onClick={handleGoogleDisconnect}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: 'rgba(239, 68, 68, 0.8)',
                    borderRadius: '4px',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                    transition: 'all 0.2s',
                    width: '100%',
                    textAlign: 'center',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}
                  className="btn-google-disconnect"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleConnect}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '4px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  marginTop: '0.75rem',
                  transition: 'all 0.2s',
                  width: '100%',
                  textAlign: 'center',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}
                className="btn-google-connect"
              >
                Connect Google Calendar
              </button>
            )}
          </div>
        </div>

        <button onClick={() => router.push('/')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to Projects</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="calendar-container">
        {/* Header */}
        <header className="calendar-header">
          <h1
            onClick={() => router.push('/')}
            className="mobile-logo-title"
            style={{
              display: 'none',
              fontSize: '1.1rem',
              fontWeight: 300,
              letterSpacing: '0.25em',
              color: '#ffffff',
              cursor: 'pointer',
              textShadow: '0 0 8px rgba(255, 255, 255, 0.4)',
              transition: 'opacity 0.2s',
            }}
          >
            WORKSPACEX
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="menu-toggle-btn"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '4px',
                transition: 'background 0.2s'
              }}
            >
              <Menu size={22} />
            </button>
            <div>
              <span
                className="active-workspace-label"
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.78rem',
                  letterSpacing: '0.15em',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                }}
              >
                Active Workspace
              </span>
              <h2
                style={{
                  color: '#ffffff',
                  fontSize: '1.4rem',
                  fontWeight: 300,
                  margin: '4px 0 0 0',
                  letterSpacing: '0.03em',
                }}
              >
                {projectTitle}
              </h2>
            </div>
          </div>
          <h1
            className="dashboard-title"
            style={{
              fontSize: '1.8rem',
              fontWeight: 300,
              letterSpacing: '0.15em',
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            Dashboard
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} className="operator-profile-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.5rem 1rem', borderRadius: '4px' }}>
              <User size={16} color="rgba(255,255,255,0.6)" />
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>
                {user?.name || user?.email || 'Operator'}
              </span>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: 'rgba(255, 255, 255, 0.7)',
                padding: '0.5rem 1rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
                transition: 'all 0.2s',
              }}
              className="btn-signout-dash"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Body Content */}
        <div className="calendar-body">
          {/* Calendar Grid Section */}
          <div className="calendar-grid-section">
            {/* Month Header Controller */}
            <div className="month-selector">
              <button onClick={handlePrevMonth} className="month-btn">
                <ChevronLeft size={20} />
              </button>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 400, letterSpacing: '0.15em' }}>
                {monthNames[month]} {year}
              </h3>
              <button onClick={handleNextMonth} className="month-btn">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Weekdays Row */}
            <div className="weekdays-header">
              <div>MON</div>
              <div>TUE</div>
              <div>WED</div>
              <div>THU</div>
              <div>FRI</div>
              <div>SAT</div>
              <div>SUN</div>
            </div>

            {/* Days Grid */}
            <div className="grid-days">
              {renderCalendarDays()}
            </div>
          </div>

          {/* Events Panel Section */}
          <div className="events-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 500, letterSpacing: '0.05em' }}>
                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {/* Platform Dropdown Container */}
                <div ref={platformDropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: showPlatformDropdown ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px',
                      borderRadius: '4px',
                      transition: 'background 0.2s, color 0.2s',
                      backgroundColor: showPlatformDropdown ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
                    }}
                    className="doc-btn"
                    title="Select Platforms"
                  >
                    <Globe size={16} />
                  </button>

                  {/* Dropdown Menu */}
                  {showPlatformDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '8px',
                        width: '180px',
                        background: 'rgba(12, 12, 12, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        padding: '8px 0',
                        zIndex: 100,
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      {Object.keys(platformIcons).map(platform => {
                        const Icon = platformIcons[platform]
                        const isChecked = selectedPlatforms.includes(platform)
                        return (
                          <label
                            key={platform}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              transition: 'background 0.2s',
                              userSelect: 'none',
                              color: isChecked ? '#ffffff' : 'rgba(255, 255, 255, 0.65)'
                            }}
                            className="platform-dropdown-item"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePlatform(platform)}
                              style={{
                                accentColor: '#ffffff',
                                cursor: 'pointer',
                                width: '14px',
                                height: '14px'
                              }}
                            />
                            <span style={{ display: 'flex', alignItems: 'center', color: isChecked ? '#ffffff' : 'rgba(255,255,255,0.45)' }}>
                              <Icon size={14} />
                            </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 400 }}>
                              {platform === 'Linkedin' ? 'LinkedIn' : platform === 'Youtube' ? 'YouTube' : platform}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowDocModal(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px',
                    borderRadius: '4px',
                    transition: 'background 0.2s, color 0.2s'
                  }}
                  className="doc-btn"
                  title="Open Documents Upload"
                >
                  <FileText size={16} />
                </button>
                <button
                  onClick={() => setShowAddEvent(!showAddEvent)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px',
                    borderRadius: '4px',
                    transition: 'background 0.2s, color 0.2s'
                  }}
                  title="Add Task/Event"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Platform Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em' }}>
                PLATFORM
              </span>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {selectedPlatforms.length > 0 ? (
                  selectedPlatforms.map(platform => {
                    const Icon = platformIcons[platform]
                    return (
                      <div
                        key={platform}
                        title={platform === 'Linkedin' ? 'LinkedIn' : platform === 'Youtube' ? 'YouTube' : platform}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          color: 'rgba(255, 255, 255, 0.85)',
                          transition: 'all 0.2s',
                          cursor: 'default'
                        }}
                        className="platform-active-badge"
                      >
                        <Icon size={16} />
                      </div>
                    )
                  })
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    No platforms selected.
                  </span>
                )}
              </div>
            </div>

            {/* Divider separating Platforms and Scheduled Operations */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '0.5rem 0' }} />

            {/* Event Form */}
            {showAddEvent && (
              <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Task title..."
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  style={{
                    background: '#050505',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '4px',
                    color: '#ffffff',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.85rem',
                    outline: 'none',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}
                  className="add-event-input"
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddEvent(false)
                      setNewEventTitle('')
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: '#ffffff',
                      border: 'none',
                      color: '#000000',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                </div>
              </form>
            )}

            {/* Event List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map(event => (
                  <div
                    key={event.id}
                    className="event-item"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{event.title}</span>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                      }}
                      className="task-delete-btn"
                      title="Delete Task"
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.5rem 0', textAlign: 'center' }}>
                  No operations scheduled.
                </div>
              )}
            </div>

            {/* Divider separating Tasks and Documents */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '1.25rem 0' }} />

            {/* Documents List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em' }}>
                DOCUMENTS
              </span>
              
              {uploadedDocs.filter(d => d.date === selectedDateStr).length > 0 ? (
                uploadedDocs.filter(d => d.date === selectedDateStr).map(doc => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '4px'
                    }}
                  >
                    <div
                      onClick={() => handleOpenDoc(doc)}
                      className="doc-item-click"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden', flexGrow: 1 }}
                    >
                      <FileText size={14} color="rgba(255,255,255,0.5)" />
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: 'rgba(255, 255, 255, 0.85)',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            maxWidth: '160px',
                            transition: 'color 0.2s'
                          }}
                          className="doc-name-text"
                          title={doc.name}
                        >
                          {doc.name}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>
                          {doc.size}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      className="doc-delete-btn"
                      title="Delete Document"
                    >
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontStyle: 'italic', padding: '0.5rem 0', textAlign: 'center' }}>
                  No documents attached.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Smartphone Footer */}
        <footer className="smartphone-footer">
          <button onClick={() => router.push('/')} className="smartphone-back-btn">
            <ArrowLeft size={14} />
            <span>Back to Projects</span>
          </button>
        </footer>
      </main>

      {/* Upload Documents Modal Overlay */}
      {showDocModal && (
        <div
          onClick={() => setShowDocModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Modal Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#0c0c0c',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: '0 0 35px rgba(255, 255, 255, 0.08)',
            }}
            className="modal-container"
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,0.1)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 400, letterSpacing: '0.05em' }}>
                WORKSPACE DOCUMENTS
              </h3>
              <button
                onClick={() => setShowDocModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                  transition: 'color 0.2s, background 0.2s'
                }}
                className="close-modal-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drag & Drop / Click Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '1px dashed rgba(255, 255, 255, 0.25)',
                borderRadius: '4px',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'border-color 0.3s, background 0.3s'
              }}
              className="upload-dropzone"
            >
              <Upload size={24} color="rgba(255,255,255,0.4)" className="upload-icon" />
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>
                  Upload from Device
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  Select PDF, XLSX, DOCX or images (Max 3MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            {/* Uploaded Documents List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em' }}>
                UPLOADED ITEMS
              </span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}
                className="custom-scrollbar"
              >
                {uploadedDocs.length > 0 ? (
                  uploadedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '4px'
                      }}
                      className="doc-list-item"
                    >
                    <div
                      onClick={() => handleOpenDoc(doc)}
                      className="doc-item-click"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden', flexGrow: 1 }}
                    >
                      <FileText size={16} color="rgba(255,255,255,0.5)" />
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span
                          style={{
                            fontSize: '0.82rem',
                            color: 'rgba(255, 255, 255, 0.85)',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            transition: 'color 0.2s'
                          }}
                          className="doc-name-text"
                          title={doc.name}
                        >
                          {doc.name}
                        </span>
                          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
                            {doc.size} • {doc.date}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '4px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        className="doc-delete-btn"
                        title="Delete Document"
                      >
                        <Trash2 size={13} color="#ef4444" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontStyle: 'italic', padding: '1.5rem 0', textAlign: 'center' }}>
                    No documents uploaded.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ background: '#000000', width: '100vw', height: '100vh' }} />}>
      <DashboardContent />
    </Suspense>
  )
}
