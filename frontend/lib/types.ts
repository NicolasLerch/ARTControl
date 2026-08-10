export type AppointmentStatus = 'pendiente' | 'asistio' | 'no_asistio' | 'cancelado'
export type UserRole = 'ADMIN' | 'USER'

export interface AuthUser {
  id: string
  nombre: string
  apellido: string
  email: string
  role: UserRole
  totpEnabled: boolean
}

export interface ManagedUser {
  id: string
  nombre: string
  apellido: string
  email: string
  role: UserRole
  totpEnabled: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Patient {
  id: string
  nombre: string
  apellido: string
  dni: string
  createdAt: string
  updatedAt?: string
}

export interface PatientCase {
  id: string
  patientId: string
  art: string
  numeroSiniestro: string
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: string
  patientId: string
  patient?: Patient
  fecha: string
  hora: string
  estado: AppointmentStatus
  observaciones: string
  tipoControl?: 'inicial' | 'seguimiento' | 'alta'
  createdAt: string
  updatedAt?: string
  cancelledAt?: string | null
}

export interface AttendanceRecord {
  id: string
  patientId: string
  appointmentId?: string | null
  fechaAtencion?: string
  observaciones: string
  createdAt?: string
  updatedAt?: string
  fecha?: string
  hora?: string
  tipo?: 'atencion_inicial' | 'control' | 'alta' | 'ausencia'
  medico?: string
  patient?: Pick<Patient, 'id' | 'nombre' | 'apellido' | 'dni'>
}

export interface PatientTimelineItem {
  id: string
  type: 'appointment' | 'attendance'
  dateTime: string
  title: string
  observaciones?: string | null
  estado?: 'PENDIENTE' | 'ASISTIO' | 'NO_ASISTIO' | 'CANCELADO'
  fecha?: string
  hora?: string
  fechaAtencion?: string
  appointmentId?: string | null
  ownerUserId?: string
  ownerNombre?: string
  ownerApellido?: string
  ownerDisplayName?: string
}

export interface Medication {
  id: string
  droga: string
  nombreComercial: string
  dosis: string
  laboratorio: string
  presentacion: string
  indicaciones: string
}

export interface Pharmacy {
  id: string
  nombre: string
}

export interface Art {
  id: string
  nombre: string
}

export interface PharmacyBranch {
  id: string
  pharmacyId: string
  pharmacyNombre: string
  direccion: string
}

export interface ArtPharmacyCoverage {
  id: string
  artId: string
  artNombre: string
  pharmacyId: string
  pharmacyNombre: string
  pharmacyBranchId: string
  direccion: string
}

export interface Specialist {
  id: string
  nombre: string
  especialidad: string
  matricula: string
  telefono: string
  email: string
  direccion: string
  diasAtencion: string[]
}
