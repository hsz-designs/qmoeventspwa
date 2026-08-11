import type { UserRole } from '../types'

export const USER_ROLES = {
  ATTENDEE: 1,
  ADMIN: 2,
} as const satisfies Record<string, UserRole>

export function parseUserRole(value: unknown): UserRole | null {
  if (value === USER_ROLES.ATTENDEE || value === USER_ROLES.ADMIN) return value
  return null
}

export function getUserRoleLabel(role: UserRole | null | undefined) {
  if (role === USER_ROLES.ADMIN) return 'Admin'
  if (role === USER_ROLES.ATTENDEE) return 'Attendee'
  return 'Role not assigned'
}

export function isAdminRole(role: UserRole | null | undefined) {
  return role === USER_ROLES.ADMIN
}
