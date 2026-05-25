import { ApiError } from '@/lib/api/client'

export type FormFieldErrors = Partial<Record<string, string[]>>

type FormErrorOptions = {
  validationMessage?: string
  conflictMessage?: string
  conflictField?: string
  unauthorizedMessage?: string
  rateLimitMessage?: string
  fallbackMessage?: string
}

type FormErrorState = {
  message: string
  fieldErrors: FormFieldErrors
}

function normalizeFieldErrors(fieldErrors?: Record<string, string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(fieldErrors ?? {}).filter(([, value]) => Array.isArray(value) && value.length > 0),
  ) as FormFieldErrors
}

export function getFormErrorState(error: unknown, options: FormErrorOptions = {}): FormErrorState {
  const {
    validationMessage = 'Revisa los datos ingresados',
    conflictMessage = 'Ya existe un registro con esos datos',
    conflictField,
    unauthorizedMessage = 'Tu sesion vencio. Volve a iniciar sesion.',
    rateLimitMessage = 'Demasiados intentos. Espera un momento e intenta de nuevo.',
    fallbackMessage = 'No se pudo completar la operacion',
  } = options

  if (!(error instanceof ApiError)) {
    return {
      message: fallbackMessage,
      fieldErrors: {},
    }
  }

  const fieldErrors = normalizeFieldErrors(error.fieldErrors)

  if (error.code === 'VALIDATION_ERROR' || error.status === 400) {
    return {
      message: validationMessage,
      fieldErrors,
    }
  }

  if (error.code === 'CONFLICT' || error.status === 409) {
    const nextFieldErrors = { ...fieldErrors }

    if (conflictField && !nextFieldErrors[conflictField]?.length) {
      nextFieldErrors[conflictField] = [conflictMessage]
    }

    return {
      message: conflictMessage,
      fieldErrors: nextFieldErrors,
    }
  }

  if (error.status === 401) {
    return {
      message: unauthorizedMessage,
      fieldErrors,
    }
  }

  if (error.status === 429) {
    return {
      message: error.retryAfterSeconds
        ? `Demasiados intentos. Reintenta en ${error.retryAfterSeconds}s.`
        : rateLimitMessage,
      fieldErrors,
    }
  }

  return {
    message: error.message || fallbackMessage,
    fieldErrors,
  }
}
