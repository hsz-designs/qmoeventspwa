import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { parseUserRole, USER_ROLES } from '../lib/userRoles'
import type { AppUser } from '../types'

interface AuthContextValue {
  user: AppUser | null
  isLoading: boolean
  isDemoMode: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const DEMO_STORAGE_KEY = 'qmo-demo-user'

function makeDisplayName(email: string) {
  return email
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function mapSupabaseUser(user: User): AppUser {
  return {
    id: user.id,
    email: user.email ?? '',
    fullName: user.user_metadata.full_name ?? user.user_metadata.name ?? makeDisplayName(user.email ?? 'NU User'),
    role: null,
    studentNumber: user.user_metadata.student_number,
    program: user.user_metadata.program,
    userQrCode: user.id,
  }
}

interface NuUserProfileRow {
  username: string | null
  email: string | null
  role: number | null
  firstname: string | null
  lastname: string | null
  middlename: string | null
  ext: string | null
  user_qr_code: string | null
}

function getNuUserDisplayName(profile: NuUserProfileRow) {
  const middleInitial = profile.middlename?.trim().charAt(0)
  return [profile.firstname?.trim(), middleInitial ? `${middleInitial}.` : null, profile.lastname?.trim(), profile.ext?.trim()]
    .filter(Boolean)
    .join(' ')
}

async function mapSupabaseUserWithProfile(user: User): Promise<AppUser> {
  const appUser = mapSupabaseUser(user)
  if (!supabase) return appUser

  const { data, error } = await supabase
    .from('nu_users')
    .select('username,email,role,firstname,lastname,middlename,ext,user_qr_code')
    .eq('userID', user.id)
    .limit(1)
    .maybeSingle()

  if (error || !data) return appUser

  const profile = data as NuUserProfileRow
  const profileName = getNuUserDisplayName(profile)

  return {
    ...appUser,
    email: profile.email?.trim() || appUser.email,
    fullName: profileName || appUser.fullName,
    role: parseUserRole(profile.role),
    studentNumber: profile.username?.trim() || appUser.studentNumber,
    userQrCode: profile.user_qr_code?.trim() || user.id,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      const storedUser = window.localStorage.getItem(DEMO_STORAGE_KEY)
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as Partial<AppUser>
          setUser({ ...parsedUser, role: parseUserRole(parsedUser.role) ?? USER_ROLES.ATTENDEE } as AppUser)
        } catch {
          window.localStorage.removeItem(DEMO_STORAGE_KEY)
        }
      }
      setIsLoading(false)
      return
    }

    let isMounted = true

    const syncUser = async (authUser: User | null) => {
      if (!authUser) {
        if (isMounted) {
          setUser(null)
          setIsLoading(false)
        }
        return
      }

      const appUser = await mapSupabaseUserWithProfile(authUser)
      if (isMounted) {
        setUser(appUser)
        setIsLoading(false)
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      void syncUser(data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isDemoMode: !isSupabaseConfigured,
      signIn: async (email, password) => {
        if (supabase) {
          setIsLoading(true)
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) {
            setIsLoading(false)
            throw error
          }
          if (!data.user) {
            setIsLoading(false)
            throw new Error('Supabase did not return a user for this account.')
          }
          const appUser = await mapSupabaseUserWithProfile(data.user)
          setUser(appUser)
          setIsLoading(false)
          return
        }

        if (!email.trim() || password.length < 6) {
          throw new Error('Enter a valid email and a password with at least 6 characters.')
        }
        const demoUser: AppUser = {
          id: 'demo-user',
          email: email.trim(),
          fullName: makeDisplayName(email.trim()) || 'NU User',
          role: USER_ROLES.ATTENDEE,
          studentNumber: '2026-000000',
          program: 'Nationalian',
          userQrCode: `QMO-USER-${email.trim().toLowerCase()}`,
        }
        window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser))
        setUser(demoUser)
      },
      signOut: async () => {
        if (supabase) {
          const { error } = await supabase.auth.signOut()
          if (error) throw error
          setUser(null)
        } else {
          window.localStorage.removeItem(DEMO_STORAGE_KEY)
          setUser(null)
        }
      },
      resetPassword: async (email) => {
        if (!supabase) {
          throw new Error('Password reset becomes available after Supabase is connected.')
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        })
        if (error) throw error
      },
    }),
    [user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
