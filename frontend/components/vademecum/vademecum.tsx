'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { listMedications, ApiError, createMedication, updateMedication, deleteMedication } from '@/lib/api/client'
import { subscribeDataChanged } from '@/lib/api/events'
import { Medication, UserRole } from '@/lib/types'
import { Search, Pill, Building, FlaskConical, Copy, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react'

export function Vademecum({ userRole }: { userRole: UserRole }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [medications, setMedications] = useState<Medication[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [deletingMedication, setDeletingMedication] = useState<Medication | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ droga: '', nombreComercial: '', dosis: '', laboratorio: '', presentacion: '', indicaciones: '' })

  const handleCopyRecipe = async (medication: Medication) => {
    const recipeText = `${medication.droga} ${medication.dosis} ${medication.nombreComercial} ${medication.presentacion}`
      .replace(/\s+/g, ' ')
      .trim()

    try {
      await navigator.clipboard.writeText(recipeText)
    } catch {
      // no-op: no interrumpir la UX si el navegador bloquea el portapapeles
    }
  }

  const resetForm = () => setForm({ droga: '', nombreComercial: '', dosis: '', laboratorio: '', presentacion: '', indicaciones: '' })
  const isAdmin = userRole === 'ADMIN'
  const openCreateModal = () => { setEditingMedication(null); resetForm(); setIsModalOpen(true) }
  const openEditModal = (med: Medication) => { setEditingMedication(med); setForm(med); setIsModalOpen(true) }
  const handleSaveMedication = async () => {
    if (!isAdmin || !form.nombreComercial.trim()) return
    setSaving(true)
    try {
      const payload = { drug: form.droga, commercialName: form.nombreComercial, dose: form.dosis, lab: form.laboratorio, presentation: form.presentacion, description: form.indicaciones }
      if (editingMedication) await updateMedication(editingMedication.id, payload)
      else await createMedication(payload)
      setIsModalOpen(false)
      resetForm()
      window.dispatchEvent(new CustomEvent('artcontrol:data-changed'))
    } finally { setSaving(false) }
  }
  const handleDeleteMedication = async () => {
    if (!isAdmin || !deletingMedication) return
    setSaving(true)
    try {
      await deleteMedication(deletingMedication.id)
      setIsDeleteOpen(false)
      setDeletingMedication(null)
      window.dispatchEvent(new CustomEvent('artcontrol:data-changed'))
    } finally { setSaving(false) }
  }

  useEffect(() => {
    let active = true

    const loadMedications = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await listMedications({
          q: searchQuery || undefined,
          pageSize: 100,
        })

        if (active) {
          setMedications(response.items)
          setTotal(response.total)
        }
      } catch (err) {
        if (!active) {
          return
        }

        setMedications([])
        setTotal(0)

        if (err instanceof ApiError && err.status === 401) {
          setError('Tu sesión venció. Volvé a iniciar sesión.')
          return
        }

        setError('No se pudo cargar el vademécum.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    const timeoutId = window.setTimeout(loadMedications, 250)
    const unsubscribe = subscribeDataChanged(loadMedications)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
      unsubscribe()
    }
  }, [searchQuery])

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Vademécum</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Medicamentos de uso frecuente en medicina laboral
            </p>
          </div>
          <Badge variant="secondary">
            <Pill className="mr-1 h-3 w-3" />
            {loading ? 'Cargando...' : `${total} medicamentos`}
          </Badge>
        </div>
        {isAdmin && (
          <div className="mt-3">
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              Nuevo medicamento
            </Button>
          </div>
        )}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por droga, nombre comercial o laboratorio..."
            className="pl-9"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Spinner className="mr-2 h-4 w-4" />
            Cargando vademécum...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <Pill className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium">{error}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Verificá la conexión con el backend y la sesión activa.
            </p>
          </div>
        ) : medications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <Pill className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {searchQuery ? 'No se encontraron medicamentos' : 'No hay medicamentos cargados'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Droga</TableHead>
                  <TableHead>Nombre comercial</TableHead>
                  <TableHead>Dosis</TableHead>
                  <TableHead>Laboratorio</TableHead>
                  <TableHead>Presentación</TableHead>
                  <TableHead className="w-24 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {medications.map((med) => (
                  <TableRow key={med.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FlaskConical className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{med.droga || med.nombreComercial}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{med.nombreComercial}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {med.dosis}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building className="h-3 w-3" />
                        <span className="text-sm">{med.laboratorio}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {med.presentacion}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label={`Copiar receta de ${med.nombreComercial}`} title="Copiar receta" onClick={() => void handleCopyRecipe(med)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label={`Opciones de ${med.nombreComercial}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditModal(med)}>
                                <Pencil className="h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onClick={() => { setDeletingMedication(med); setIsDeleteOpen(true) }}>
                                <Trash2 className="h-4 w-4" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Usage info */}
        <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="text-sm font-medium">Nota importante</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Este vademécum es una referencia rápida. Consulte siempre el prospecto oficial 
            y verifique contraindicaciones antes de prescribir.
          </p>
        </div>
      </CardContent>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editingMedication ? 'Editar medicamento' : 'Nuevo medicamento'}</DialogTitle>
            <DialogDescription>Completá los datos para guardar en el vademécum.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Droga</Label><Input value={form.droga} onChange={(e) => setForm((s) => ({ ...s, droga: e.target.value }))} /></div>
            <div><Label>Nombre comercial *</Label><Input value={form.nombreComercial} onChange={(e) => setForm((s) => ({ ...s, nombreComercial: e.target.value }))} /></div>
            <div><Label>Dosis</Label><Input value={form.dosis} onChange={(e) => setForm((s) => ({ ...s, dosis: e.target.value }))} /></div>
            <div><Label>Laboratorio</Label><Input value={form.laboratorio} onChange={(e) => setForm((s) => ({ ...s, laboratorio: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Presentación</Label><Input value={form.presentacion} onChange={(e) => setForm((s) => ({ ...s, presentacion: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Indicaciones</Label><Textarea value={form.indicaciones} onChange={(e) => setForm((s) => ({ ...s, indicaciones: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => void handleSaveMedication()} disabled={saving || !form.nombreComercial.trim()}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar medicamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará {deletingMedication?.nombreComercial}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => void handleDeleteMedication()}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
