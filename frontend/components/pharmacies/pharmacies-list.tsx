'use client'

import { useEffect, useState } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ApiError, createPharmacyCoverage, deletePharmacyCoverage, getPharmacyOptions, listPharmacyCoverages, updatePharmacyCoverage } from '@/lib/api/client'
import { emitDataChanged, subscribeDataChanged } from '@/lib/api/events'
import { getFormErrorState, type FormFieldErrors } from '@/lib/forms'
import { ArtPharmacyCoverage, UserRole } from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { Building2, MapPin, MoreVertical, Pencil, Plus, Search, Shield, Trash2 } from 'lucide-react'

type CoverageFormState = {
  artNombre: string
  pharmacyNombre: string
  direccion: string
}

const emptyForm: CoverageFormState = {
  artNombre: '',
  pharmacyNombre: '',
  direccion: '',
}

export function PharmaciesList({ userRole }: { userRole: UserRole }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [coverages, setCoverages] = useState<ArtPharmacyCoverage[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingCoverage, setEditingCoverage] = useState<ArtPharmacyCoverage | null>(null)
  const [deletingCoverage, setDeletingCoverage] = useState<ArtPharmacyCoverage | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({})
  const [form, setForm] = useState<CoverageFormState>(emptyForm)
  const [artSuggestions, setArtSuggestions] = useState<string[]>([])
  const [pharmacySuggestions, setPharmacySuggestions] = useState<string[]>([])
  const isAdmin = userRole === 'ADMIN'

  const resetForm = () => {
    setForm(emptyForm)
    setFieldErrors({})
  }

  useEffect(() => {
    let active = true

    const loadCoverages = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await listPharmacyCoverages({
          q: searchQuery || undefined,
          pageSize: 100,
        })

        if (active) {
          setCoverages(response.items)
          setTotal(response.total)
        }
      } catch (err) {
        if (!active) {
          return
        }

        setCoverages([])
        setTotal(0)

        if (err instanceof ApiError && err.status === 401) {
          setError('Tu sesion vencio. Vuelve a iniciar sesion.')
          return
        }

        setError('No se pudo cargar la cartelera de farmacias.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    const timeoutId = window.setTimeout(loadCoverages, 250)
    const unsubscribe = subscribeDataChanged(loadCoverages)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
      unsubscribe()
    }
  }, [searchQuery])

  useEffect(() => {
    let active = true

    const loadOptions = async () => {
      try {
        const data = await getPharmacyOptions({ limit: 100 })

        if (active) {
          setArtSuggestions(data.arts.map((item) => item.nombre))
          setPharmacySuggestions(data.pharmacies.map((item) => item.nombre))
        }
      } catch {
        if (active) {
          setArtSuggestions([])
          setPharmacySuggestions([])
        }
      }
    }

    void loadOptions()

    return () => {
      active = false
    }
  }, [])

  const openCreateModal = () => {
    setEditingCoverage(null)
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (coverage: ArtPharmacyCoverage) => {
    setEditingCoverage(coverage)
    setFieldErrors({})
    setForm({
      artNombre: coverage.artNombre,
      pharmacyNombre: coverage.pharmacyNombre,
      direccion: coverage.direccion,
    })
    setIsModalOpen(true)
  }

  const updateField = (field: keyof CoverageFormState, value: string) => {
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

  const handleSaveCoverage = async () => {
    if (!isAdmin) return

    setSaving(true)
    setFieldErrors({})

    try {
      if (editingCoverage) {
        await updatePharmacyCoverage(editingCoverage.id, form)
      } else {
        await createPharmacyCoverage(form)
      }

      setIsModalOpen(false)
      resetForm()
      emitDataChanged()
      toast({
        title: editingCoverage ? 'Cobertura actualizada' : 'Cobertura creada',
        description: 'La relacion ART, farmacia y direccion se guardo correctamente.',
      })
    } catch (error) {
      const formError = getFormErrorState(error, {
        validationMessage: 'Revisa los datos ingresados',
        conflictMessage: 'Esa cobertura ya existe',
        fallbackMessage: 'No se pudo guardar la cobertura',
      })

      setFieldErrors(formError.fieldErrors)
      toast({
        variant: 'destructive',
        title: 'No se pudo guardar la cobertura',
        description: formError.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCoverage = async () => {
    if (!isAdmin || !deletingCoverage) return

    setSaving(true)
    try {
      await deletePharmacyCoverage(deletingCoverage.id)
      setIsDeleteOpen(false)
      setDeletingCoverage(null)
      emitDataChanged()
      toast({
        title: 'Cobertura eliminada',
        description: 'La relacion ART-farmacia se elimino correctamente.',
      })
    } catch (error) {
      const formError = getFormErrorState(error, {
        fallbackMessage: 'No se pudo eliminar la cobertura',
      })

      toast({
        variant: 'destructive',
        title: 'No se pudo eliminar la cobertura',
        description: formError.message,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Farmacias por ART</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Consulta rapida de coberturas por ART para derivar al paciente a la farmacia correcta.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Building2 className="mr-1 h-3 w-3" />
              {loading ? 'Cargando...' : `${total} coberturas`}
            </Badge>
            {!isAdmin ? (
              <Badge variant="outline">
                <Shield className="mr-1 h-3 w-3" />
                Solo lectura
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar por ART, farmacia o direccion..."
              className="pl-9"
            />
          </div>
          {isAdmin ? (
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              Nueva cobertura
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Spinner className="mr-2 h-4 w-4" />
            Cargando coberturas...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium">{error}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Verifica la conexion con el backend y la sesion activa.
            </p>
          </div>
        ) : coverages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {searchQuery ? 'No se encontraron coberturas' : 'No hay coberturas cargadas'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>ART</TableHead>
                  <TableHead>Farmacia</TableHead>
                  <TableHead>Direccion</TableHead>
                  <TableHead className="w-24 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {coverages.map((coverage) => (
                  <TableRow key={coverage.id}>
                    <TableCell className="font-medium">{coverage.artNombre}</TableCell>
                    <TableCell>{coverage.pharmacyNombre}</TableCell>
                    <TableCell className="text-muted-foreground">{coverage.direccion}</TableCell>
                    <TableCell className="text-right">
                      {isAdmin ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Opciones de ${coverage.artNombre}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(coverage)}>
                              <Pencil className="h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => {
                                setDeletingCoverage(coverage)
                                setIsDeleteOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) {
            resetForm()
            setEditingCoverage(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editingCoverage ? 'Editar cobertura' : 'Nueva cobertura'}</DialogTitle>
            <DialogDescription>
              Carga la ART, la farmacia y la direccion. Si no existen, se crean automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field data-invalid={fieldErrors.artNombre?.length ? true : undefined}>
              <FieldLabel htmlFor="artNombre">ART *</FieldLabel>
              <Input
                id="artNombre"
                list="art-options"
                value={form.artNombre}
                onChange={(event) => updateField('artNombre', event.target.value)}
                placeholder="Ej. Provincia ART"
                aria-invalid={fieldErrors.artNombre?.length ? true : undefined}
              />
              <FieldError errors={fieldErrors.artNombre?.map((message) => ({ message }))} />
            </Field>
            <Field data-invalid={fieldErrors.pharmacyNombre?.length ? true : undefined}>
              <FieldLabel htmlFor="pharmacyNombre">Farmacia *</FieldLabel>
              <Input
                id="pharmacyNombre"
                list="pharmacy-options"
                value={form.pharmacyNombre}
                onChange={(event) => updateField('pharmacyNombre', event.target.value)}
                placeholder="Ej. Farmacity"
                aria-invalid={fieldErrors.pharmacyNombre?.length ? true : undefined}
              />
              <FieldError errors={fieldErrors.pharmacyNombre?.map((message) => ({ message }))} />
            </Field>
            <Field data-invalid={fieldErrors.direccion?.length ? true : undefined}>
              <FieldLabel htmlFor="direccion">Direccion *</FieldLabel>
              <Input
                id="direccion"
                value={form.direccion}
                onChange={(event) => updateField('direccion', event.target.value)}
                placeholder="Ej. Av. Corrientes 1234"
                aria-invalid={fieldErrors.direccion?.length ? true : undefined}
              />
              <FieldError errors={fieldErrors.direccion?.map((message) => ({ message }))} />
            </Field>
          </div>
          <datalist id="art-options">
            {artSuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          <datalist id="pharmacy-options">
            {pharmacySuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleSaveCoverage()}
              disabled={saving || !form.artNombre.trim() || !form.pharmacyNombre.trim() || !form.direccion.trim()}
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
            setDeletingCoverage(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cobertura</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara la relacion entre ART, farmacia y direccion, pero no borrara las entidades base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void handleDeleteCoverage()}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
