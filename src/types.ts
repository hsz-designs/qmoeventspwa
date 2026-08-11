export type EventCategory = 'Training' | 'Seminar' | 'Workshop' | 'Orientation' | 'Community'

export type UserRole = 1 | 2

export interface QmoEvent {
  id: string
  title: string
  description: string
  category: EventCategory
  date: string
  sessionDates?: string[]
  time: string
  venue: string
  capacity: number
  registered: number
  imageTone: 'blue' | 'gold' | 'teal' | 'violet' | 'coral'
  featured?: boolean
  status?: 'registered' | 'attended' | 'completed' | 'missed'
  sessionCount?: number
  qrCodeValue?: string
}

export interface QmoEventSession {
  id: string
  eventId: string
  title: string
  eventTitle: string
  description: string
  category: EventCategory
  date: string
  time: string
  venue: string
  capacity: number
  status?: string
  imageTone: QmoEvent['imageTone']
}

export interface Certificate {
  id: string
  createdAt: string
  eventId: string
  recipientName: string
  recipientEmail: string
  verificationCode: string
  filePath?: string
  issuedAt: string
  revokedAt?: string
  status?: string
}

export interface AppUser {
  id: string
  email: string
  fullName: string
  role: UserRole | null
  studentNumber?: string
  program?: string
  userQrCode?: string
}

export interface AttendanceLog {
  id: string
  eventId: string
  sessionId?: string
  occurredAt: string
  type: 'login' | 'logout' | 'activity'
}
