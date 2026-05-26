'use client'

import { useEffect, useState } from 'react'
import { MoreVertical, Pencil, Plus, Search, ShieldCheck, Trash2, UserCog } from 'lucide-react'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ApiError, createUser, deleteUser, listUsers, updateUser } from '@/lib/api/client'
import { emitDataChanged, subscribeDataChanged } from '@/lib/api/events'
import { getFormErrorState, type FormFieldErrors } from '@/lib/forms'
import { ManagedUser, UserRole } from '@/lib/types'
import { toast } from '@/hooks/use-toast'

type UserFormState = {
  nombre: string
  apellido: string
  email: string
  password: string
  role: UserRole
  isActive: 'true' | 'false'
}

const emptyForm: UserFormState = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  role: 'USER',
  isActive: 'true',
}

interface UsersDashboardProps {
  currentUserId: string
}

export function UsersDashboard({ currentUserId }: UsersDashboardProps) {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({})
  const [form, setForm] = useState<UserFormState>(emptyForm)

  const resetForm = () => {
    setForm(emptyForm)
    setFieldErrors({})
  }

  useEffect(() => {
    let active = true

    const loadUsers = async () => {
      setLoading(true)
      setError(null)

      try {
        const items = await listUsers({ q: searchQuery || undefined })

        if (active) {
          setUsers(items)
        }
      } catch (err) {
        if (!active) {
          return
        }

        setUsers([])

        if (err instanceof ApiError && err.status === 401) {
          setError('Tu sesion vencio. Vuelve a iniciar sesion.')
          return
        }

        if (err instanceof ApiError && err.status === 403) {
          setError('No tienes permisos para administrar usuarios.')
          return
        }

        setError('No se pudo cargar el listado de usuarios.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    const timeoutId = window.setTimeout(loadUsers, 250)
    const unsubscribe = subscribeDataChanged(loadUsers)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
      unsubscribe()
    }
  }, [searchQuery])

  const updateField = (field: keyof UserFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev
      }

      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const openCreateModal = () => {
    setEditingUser(null)
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (user: ManagedUser) => {
    setEditingUser(user)
    setFieldErrors({})
    setForm({
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive ? 'true' : 'false',
    })
    setIsModalOpen(true)
  }

  const handleSaveUser = async () => {
    setSaving(true)
    setFieldErrors({})

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          role: form.role,
          isActive: form.isActive === 'true',
        })
      } else {
        await createUser({
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          password: form.password,
          role: form.role,
        })
      }

      setIsModalOpen(false)
      resetForm()
      emitDataChanged()
      toast({
        title: editingUser ? 'Usuario actualizado' : 'Usuario creado',
        description: editingUser
          ? 'Los datos del usuario se guardaron correctamente.'
          : 'El usuario se creo correctamente.',
      })
    } catch (error) {
      const formError = getFormErrorState(error, {
        validationMessage: 'Revisa los datos ingresados',
        conflictMessage: 'Ya existe un usuario con ese email',
        conflictField: 'email',
        fallbackMessage: editingUser ? 'No se pudo actualizar el usuario' : 'No se pudo crear el usuario',
      })

      setFieldErrors(formError.fieldErrors)
      toast({
        variant: 'destructive',
        title: editingUser ? 'No se pudo actualizar el usuario' : 'No se pudo crear el usuario',
        description: formError.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return

    setSaving(true)
    try {
      await deleteUser(deletingUser.id)
      setIsDeleteOpen(false)
      setDeletingUser(null)
      emitDataChanged()
      toast({
        title: 'Usuario desactivado',
        description: 'El usuario se marco como inactivo y ya no podra iniciar sesion.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo desactivar el usuario',
        description: error instanceof ApiError ? error.message : 'No se pudo desactivar el usuario',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Usuarios</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Administracion de accesos. Solo los administradores pueden crear, editar y desactivar usuarios.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <UserCog className="mr-1 h-3 w-3" />
                {loading ? 'Cargando...' : `${users.length} usuarios`}
              </Badge>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Nuevo usuario
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por nombre, apellido o email..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Spinner className="mr-2 h-4 w-4" />
              Cargando usuarios...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <ShieldCheck className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium">{error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <UserCog className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios cargados'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Apellido</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-24 text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nombre}</TableCell>
                      <TableCell>{user.apellido}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'outline'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'secondary' : 'outline'}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Opciones de ${user.email}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(user)}>
                              <Pencil className="h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => {
                                setDeletingUser(user)
                                setIsDeleteOpen(true)
                              }}
                              disabled={user.id === currentUserId || !user.isActive}
                            >
                              <Trash2 className="h-4 w-4" /> Desactivar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) {
            resetForm()
            setEditingUser(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Modifica los datos basicos, el rol y el estado del usuario.'
                : 'Carga los datos minimos y una password inicial para crear el acceso.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={fieldErrors.nombre?.length ? true : undefined}>
                <FieldLabel htmlFor="user-nombre">Nombre *</FieldLabel>
                <Input
                  id="user-nombre"
                  value={form.nombre}
                  onChange={(event) => updateField('nombre', event.target.value)}
                  aria-invalid={fieldErrors.nombre?.length ? true : undefined}
                />
                <FieldError errors={fieldErrors.nombre?.map((message) => ({ message }))} />
              </Field>

              <Field data-invalid={fieldErrors.apellido?.length ? true : undefined}>
                <FieldLabel htmlFor="user-apellido">Apellido *</FieldLabel>
                <Input
                  id="user-apellido"
                  value={form.apellido}
                  onChange={(event) => updateField('apellido', event.target.value)}
                  aria-invalid={fieldErrors.apellido?.length ? true : undefined}
                />
                <FieldError errors={fieldErrors.apellido?.map((message) => ({ message }))} />
              </Field>
            </div>

            <Field data-invalid={fieldErrors.email?.length ? true : undefined}>
              <FieldLabel htmlFor="user-email">Email *</FieldLabel>
              <Input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                aria-invalid={fieldErrors.email?.length ? true : undefined}
              />
              <FieldError errors={fieldErrors.email?.map((message) => ({ message }))} />
            </Field>

            {!editingUser ? (
              <Field data-invalid={fieldErrors.password?.length ? true : undefined}>
                <FieldLabel htmlFor="user-password">Password inicial *</FieldLabel>
                <Input
                  id="user-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  aria-invalid={fieldErrors.password?.length ? true : undefined}
                />
                <FieldError errors={fieldErrors.password?.map((message) => ({ message }))} />
              </Field>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Rol *</FieldLabel>
                <Select value={form.role} onValueChange={(value) => updateField('role', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {editingUser ? (
                <Field data-invalid={fieldErrors.isActive?.length ? true : undefined}>
                  <FieldLabel>Estado *</FieldLabel>
                  <Select value={form.isActive} onValueChange={(value) => updateField('isActive', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={fieldErrors.isActive?.map((message) => ({ message }))} />
                </Field>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleSaveUser()}
              disabled={
                saving ||
                !form.nombre.trim() ||
                !form.apellido.trim() ||
                !form.email.trim() ||
                (!editingUser && !form.password.trim())
              }
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open)
          if (!open) {
            setDeletingUser(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion desactivara el acceso del usuario. El registro permanecera en la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void handleDeleteUser()}
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
