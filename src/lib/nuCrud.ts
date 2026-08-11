import { supabase } from './supabase'

export const nuTableColumns = {
  nu_attendees: ['id', 'created_at', 'user_id', 'event_id', 'date_time_first_in', 'date_time_last_out', 'date_index', 'status', 'session_id'],
  nu_attendees_log: ['id', 'created_at', 'event_id', 'user_id', 'date_time', 'date_index', 'session_id', 'log_type'],
  nu_buildings: ['id', 'created_at', 'building_name', 'address', 'created_by', 'date_time_last_updated', 'last_updated_by'],
  nu_departments: ['id', 'created_at', 'department_name', 'created_by', 'last_updated_date_time', 'last_updated_by'],
  nu_event_attendees_log: ['id', 'created_at', 'event_id', 'user_id', 'date_time', 'date_index', 'session_id', 'log_type'],
  nu_event_attendees: ['id', 'created_at', 'user_id', 'event_id', 'date_time_first_in', 'date_time_last_out', 'date_index', 'status', 'session_id', 'certificate_url'],
  nu_event_question: ['id', 'created_at', 'event_id', 'date_index', 'question', 'user_id', 'status', 'reply_by_speaker_handler', 'speaker_id'],
  nu_event_sessions: ['id', 'created_at', 'session_topic', 'session_speaker_id', 'session_date', 'session_start_time', 'session_end_time', 'session_building_id', 'session_floor_id', 'session_room_id', 'session_event_id', 'session_type', 'session_max_capacity', 'status'],
  nu_events: ['id', 'created_at', 'event_name', 'created_by', 'event_description', 'event_theme', 'schedule_id', 'theme_colors', 'qrcode_value', 'event_head_organizer_id', 'event_topics', 'event_host_user_id', 'start_datetime', 'end_datetime', 'place_id', 'status'],
  nu_floors: ['id', 'created_at', 'building_id', 'created_by', 'date_time_last_updated', 'last_updated_by', 'floor_name'],
  nu_places: ['id', 'created_at', 'place_name', 'room_id', 'created_by', 'last_updated_by', 'date_time_last_updated', 'direction', 'department_id'],
  nu_rooms: ['id', 'created_at', 'room_no', 'building_id', 'floor_id', 'created_by', 'last_updated_by', 'date_time_last_updated', 'room_max_capacity'],
  nu_user_note: ['id', 'created_at', 'user_id', 'note_content', 'for_event_id', 'date_index', 'session_id'],
  nu_users: ['id', 'created_at', 'username', 'email', 'role', 'firstname', 'lastname', 'middlename', 'ext', 'phone', 'is_active', 'date_time_email_confirmed', 'admin_confirmed_by', 'admin_confirmed_date_time', 'user_qr_code', 'userID', 'salutation', 'current_points', 'supabaseProfileImageUrl', 'bio note'],
} as const

export type NuTableName = keyof typeof nuTableColumns
export type NuRecord = Record<string, string | number | boolean | null>

interface ListOptions {
  select?: string
  limit?: number
  orderBy?: string
  ascending?: boolean
  equals?: Record<string, string | number | boolean | null>
}

function getClient() {
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  return supabase
}

export async function listNuRecords<T extends NuRecord = NuRecord>(table: NuTableName, options: ListOptions = {}) {
  const client = getClient()
  let query = client.from(table).select(options.select ?? '*') as any

  Object.entries(options.equals ?? {}).forEach(([column, value]) => {
    query = value === null ? query.is(column, null) : query.eq(column, value)
  })

  if (options.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? true })
  if (options.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as T[]
}

export async function getNuRecord<T extends NuRecord = NuRecord>(table: NuTableName, id: string | number) {
  const client = getClient()
  const { data, error } = await client.from(table).select('*').eq('id', id).single()
  if (error) throw error
  return data as unknown as T
}

export async function createNuRecord<T extends NuRecord = NuRecord>(table: NuTableName, values: Partial<T>) {
  const client = getClient()
  const { data, error } = await (client.from(table) as any).insert(values).select().single()
  if (error) throw error
  return data as unknown as T
}

export async function updateNuRecord<T extends NuRecord = NuRecord>(table: NuTableName, id: string | number, values: Partial<T>) {
  const client = getClient()
  const { data, error } = await (client.from(table) as any).update(values).eq('id', id).select().single()
  if (error) throw error
  return data as unknown as T
}

export async function deleteNuRecord(table: NuTableName, id: string | number) {
  const client = getClient()
  const { error } = await client.from(table).delete().eq('id', id)
  if (error) throw error
}
