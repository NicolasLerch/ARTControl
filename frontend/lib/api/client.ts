'use client'

import { Appointment, AppointmentStatus, AttendanceRecord, AuthUser, Medication, Patient, PatientTimelineItem } from '@/lib/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// const API_BASE_URL = 'https://artcontrol.fly.dev'

type ApiErrorPayload = {
  message?: string
  code?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export class ApiError extends Error {
  status: number
  code?: string
  fieldErrors?: Record<string, string[] | undefined>
  retryAfterSeconds?: number

  constructor(status: number, payload: ApiErrorPayload, retryAfterSeconds?: number) {
    super(payload.message ?? 'Request failed')
    this.status = status
    this.code = payload.code
    this.fieldErrors = payload.fieldErrors
    this.retryAfterSeconds = retryAfterSeconds
  }
}

function parseRetryAfterSeconds(response: Response) {
  const retryAfter = response.headers.get('retry-after')
  if (retryAfter) {
    const asNumber = Number(retryAfter)
    if (!Number.isNaN(asNumber) && asNumber > 0) {
      return Math.ceil(asNumber)
    }

    const asDate = Date.parse(retryAfter)
    if (!Number.isNaN(asDate)) {
      const diffSeconds = Math.ceil((asDate - Date.now()) / 1000)
      if (diffSeconds > 0) {
        return diffSeconds
      }
    }
  }

  const rateLimitReset = response.headers.get('ratelimit-reset')
  if (rateLimitReset) {
    const asNumber = Number(rateLimitReset)
    if (!Number.isNaN(asNumber) && asNumber > 0) {
      return Math.ceil(asNumber)
    }
  }

  return undefined
}

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined | null>
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`)

  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  const response = await fetch(url.toString(), {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(response.status, data, parseRetryAfterSeconds(response))
  }

  return data as T
}

function isoDateOnly(value: string) {
  return value.slice(0, 10)
}

function mapStatusFromApi(status: 'PENDIENTE' | 'ASISTIO' | 'NO_ASISTIO' | 'CANCELADO'): AppointmentStatus {
  return status.toLowerCase() as AppointmentStatus
}

function mapStatusToApi(status: AppointmentStatus) {
  return status.toUpperCase() as 'PENDIENTE' | 'ASISTIO' | 'NO_ASISTIO' | 'CANCELADO'
}

function mapPatient(patient: {
  id: string
  nombre: string
  apellido: string
  dni: string
  createdAt: string
  updatedAt: string
}): Patient {
  return patient
}

function mapAppointment(appointment: {
  id: string
  patientId: string
  patient?: {
    id: string
    nombre: string
    apellido: string
    dni: string
    createdAt: string
    updatedAt: string
  }
  fecha: string
  hora: string
  estado: 'PENDIENTE' | 'ASISTIO' | 'NO_ASISTIO' | 'CANCELADO'
  observaciones?: string | null
  createdAt: string
  updatedAt: string
  cancelledAt?: string | null
}): Appointment {
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    patient: appointment.patient ? mapPatient(appointment.patient) : undefined,
    fecha: isoDateOnly(appointment.fecha),
    hora: appointment.hora,
    estado: mapStatusFromApi(appointment.estado),
    observaciones: appointment.observaciones ?? '',
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    cancelledAt: appointment.cancelledAt ?? null,
  }
}

function mapAttendance(attendance: {
  id: string
  patientId: string
  appointmentId?: string | null
  fechaAtencion: string
  observaciones?: string | null
  createdAt: string
  updatedAt: string
  patient?: {
    id: string
    nombre: string
    apellido: string
    dni: string
  }
}): AttendanceRecord {
  return {
    id: attendance.id,
    patientId: attendance.patientId,
    appointmentId: attendance.appointmentId ?? null,
    fechaAtencion: attendance.fechaAtencion,
    observaciones: attendance.observaciones ?? '',
    createdAt: attendance.createdAt,
    updatedAt: attendance.updatedAt,
    patient: attendance.patient,
  }
}

function mapMedication(item: {
  id: string
  droga?: string | null
  nombreComercial?: string | null
  dosis?: string | null
  laboratorio?: string | null
  presentacion?: string | null
  indicaciones?: string | null
  drug?: string | null
  commercialName?: string | null
  dose?: string | null
  lab?: string | null
  presentation?: string | null
  description?: string | null
}): Medication {
  return {
    id: item.id,
    droga: item.droga ?? item.drug ?? '',
    nombreComercial: item.nombreComercial ?? item.commercialName ?? '',
    dosis: item.dosis ?? item.dose ?? '',
    laboratorio: item.laboratorio ?? item.lab ?? '',
    presentacion: item.presentacion ?? item.presentation ?? '',
    indicaciones: item.indicaciones ?? item.description ?? '',
  }
}

export async function getCurrentUser() {
  const data = await request<{ user: AuthUser }>('/auth/me')
  return data.user
}

export async function login(email: string, password: string) {
  return request<{ requires2fa?: boolean; challengeId?: string; user?: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function verifyTwoFactor(challengeId: string, token: string) {
  return request<{ user: AuthUser }>('/auth/verify-2fa', {
    method: 'POST',
    body: JSON.stringify({ challengeId, token }),
  })
}

export async function logout() {
  return request<void>('/auth/logout', {
    method: 'POST',
  })
}

export async function setupTwoFactor() {
  return request<{ secret: string; otpauthUrl: string; qrCodeDataUrl: string }>('/auth/setup-2fa', {
    method: 'POST',
  })
}

export async function confirmTwoFactor(token: string) {
  return request<{ user: AuthUser }>('/auth/confirm-2fa', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export async function listPatients(params: {
  q?: string
  dni?: string
  apellido?: string
  page?: number
  pageSize?: number
} = {}) {
  const data = await request<{
    items: Array<{
      id: string
      nombre: string
      apellido: string
      dni: string
      createdAt: string
      updatedAt: string
    }>
    total: number
    page: number
    pageSize: number
  }>('/patients', { query: params })

  return {
    ...data,
    items: data.items.map(mapPatient),
  }
}

export async function createPatient(payload: Pick<Patient, 'nombre' | 'apellido' | 'dni'>) {
  const data = await request<{
    patient: {
      id: string
      nombre: string
      apellido: string
      dni: string
      createdAt: string
      updatedAt: string
    }
  }>('/patients', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return mapPatient(data.patient)
}

export async function updatePatient(patientId: string, payload: Partial<Pick<Patient, 'nombre' | 'apellido' | 'dni'>>) {
  const data = await request<{
    patient: {
      id: string
      nombre: string
      apellido: string
      dni: string
      createdAt: string
      updatedAt: string
    }
  }>(`/patients/${patientId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return mapPatient(data.patient)
}

export async function deletePatient(patientId: string) {
  return request<void>(`/patients/${patientId}`, {
    method: 'DELETE',
  })
}

export async function getPatientDetail(patientId: string) {
  const data = await request<{
    patient: {
      id: string
      nombre: string
      apellido: string
      dni: string
      createdAt: string
      updatedAt: string
    }
    timeline: PatientTimelineItem[]
  }>(`/patients/${patientId}`)

  return {
    patient: mapPatient(data.patient),
    timeline: data.timeline,
  }
}

export async function listAppointments(params: {
  date?: string
  from?: string
  to?: string
  status?: AppointmentStatus
  patientId?: string
} = {}) {
  const data = await request<{ items: Array<Parameters<typeof mapAppointment>[0]> }>('/appointments', {
    query: {
      ...params,
      status: params.status ? mapStatusToApi(params.status) : undefined,
    },
  })

  return data.items.map(mapAppointment)
}

export async function createAppointment(payload: {
  patientId: string
  fecha: string
  hora: string
  observaciones?: string
}) {
  const data = await request<{ appointment: Parameters<typeof mapAppointment>[0] }>('/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return mapAppointment(data.appointment)
}

export async function updateAppointmentStatus(id: string, estado: AppointmentStatus) {
  const data = await request<{ appointment: Parameters<typeof mapAppointment>[0] }>(`/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ estado: mapStatusToApi(estado) }),
  })

  return mapAppointment(data.appointment)
}

export async function listTodayAttendances() {
  const data = await request<{ items: Array<Parameters<typeof mapAttendance>[0]> }>('/attendances/today')
  return data.items.map(mapAttendance)
}

export async function listAttendances(params: { date?: string; today?: boolean; patientId?: string } = {}) {
  const data = await request<{ items: Array<Parameters<typeof mapAttendance>[0]> }>('/attendances', {
    query: params,
  })

  return data.items.map(mapAttendance)
}

export async function createAttendance(payload: {
  patientId: string
  fechaAtencion: string
  observaciones?: string
  appointmentId?: string | null
}) {
  const data = await request<{ attendance: Parameters<typeof mapAttendance>[0] }>('/attendances', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return mapAttendance(data.attendance)
}

export async function deleteAttendance(attendanceId: string) {
  return request<void>(`/attendances/${attendanceId}`, {
    method: 'DELETE',
  })
}

export async function listMedications(params: {
  q?: string
  type?: 'MEDICAMENTO' | 'INSUMO' | 'KIT' | 'OTRO'
  isActive?: boolean
  page?: number
  pageSize?: number
} = {}) {
  const data = await request<{
    items: Array<Parameters<typeof mapMedication>[0]>
    total: number
    page: number
    pageSize: number
  }>('/vademecum', {
    query: params,
  })

  return {
    ...data,
    items: data.items.map(mapMedication),
  }
}

export async function createMedication(payload: {
  drug: string
  commercialName: string
  dose?: string
  lab?: string
  presentation?: string
  description?: string
}) {
  const data = await request<{ item: Parameters<typeof mapMedication>[0] }>('/vademecum', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return mapMedication(data.item)
}

export async function updateMedication(id: string, payload: {
  drug?: string
  commercialName?: string
  dose?: string
  lab?: string
  presentation?: string
  description?: string
}) {
  const data = await request<{ item: Parameters<typeof mapMedication>[0] }>(`/vademecum/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return mapMedication(data.item)
}

export async function deleteMedication(id: string) {
  return request<void>(`/vademecum/${id}`, {
    method: 'DELETE',
  })
}
