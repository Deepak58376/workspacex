export type UserRole = 'ADMIN' | 'EDITOR' | 'MEMBER'
 
export type ContentStatus =
  | 'IDEA'
  | 'PLANNED'
  | 'WRITING'
  | 'REVIEW'
  | 'SCHEDULED'
  | 'PUBLISHED'
 
export interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  role: UserRole
  createdAt: Date
}
 
export interface Platform {
  id: string
  name: string
  logoUrl?: string
  createdAt: Date
}
 
export interface CalendarEvent {
  id: string
  title: string
  description?: string
  date: Date
  status: ContentStatus
  platformId?: string
  platform?: Platform
  assignedId?: string
  assignedTo?: User
  createdAt: Date
  updatedAt: Date
}
 
export const STATUS_COLORS: Record<ContentStatus, string> = {
  IDEA: '#888780',
  PLANNED: '#378ADD',
  WRITING: '#7F77DD',
  REVIEW: '#EF9F27',
  SCHEDULED: '#1D9E75',
  PUBLISHED: '#639922',
}
 
export const STATUS_LABELS: Record<ContentStatus, string> = {
  IDEA: 'Idea',
  PLANNED: 'Planned',
  WRITING: 'Writing',
  REVIEW: 'Review',
  SCHEDULED: 'Scheduled',
  PUBLISHED: 'Published',
}
