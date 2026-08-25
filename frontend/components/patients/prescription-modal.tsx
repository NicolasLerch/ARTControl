'use client'

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type FormFieldErrors } from '@/lib/forms'
import { listMedications } from '@/lib/api/client'
import { Medication, Patient, PatientCase } from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { FileText, Pill, Plus, RefreshCcw, Search, X } from 'lucide-react'
import { PatientCaseModal } from './patient-case-modal'

interface PrescriptionPreviewData {
  patient: Patient
  patientCase: PatientCase
  texto: string
  diagnostico: string
  fecha: string
  logoPath: string
}

interface PrescriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: Patient
  cases: PatientCase[]
  onCasesChanged: () => Promise<void> | void
}

interface SelectedMedicationSlot {
  slot: 0 | 1
  medicationId: string
  label: string
  recipeLine: string
  lineIndex: number
  isChecked: boolean
}

function formatMedicationLine(medication: Medication) {
  return `${medication.droga} ${medication.dosis} ${medication.nombreComercial} ${medication.presentacion}`
    .replace(/\s+/g, ' ')
    .trim()
}

function formatMedicationSearchTitle(medication: Medication) {
  const baseName = medication.nombreComercial || medication.droga
  return medication.laboratorio ? `${baseName} (${medication.laboratorio})` : baseName
}

function buildRecipeBlock(preview: PrescriptionPreviewData, absoluteLogoPath: string) {
  const fecha = format(new Date(preview.fecha), "d 'de' MMMM 'de' yyyy", { locale: es })
  const textoHtml = preview.texto
    .split('\n')
    .map((line) => line.trim() || '&nbsp;')
    .join('<br />')

  return `
    <section class="recipe">
      <div class="header">
        <img class="logo" src="${absoluteLogoPath}" alt="RPC" />
        <div class="company-data">
          <div class="company-name">Red Prestacional Cordoba SRL</div>
          <div>Humberto Primo 843 - 2do Piso - Oficina B</div>
          <div>Tel: 0351 - 5711234</div>
          <div>Email: info@rpcsrlweb.com.ar - Web: www.rpcsrlweb.com.ar</div>
        </div>
      </div>
      <div class="meta">
        <div><span class="label">Paciente:</span> ${preview.patient.apellido}, ${preview.patient.nombre}</div>
        <div><span class="label">DNI:</span> ${preview.patient.dni}</div>
        <div><span class="label">ART:</span> ${preview.patientCase.art}</div>
        <div><span class="label">Nro de siniestro:</span> ${preview.patientCase.numeroSiniestro}</div>
      </div>
      <div class="content">${textoHtml}</div>
      <div class="diagnosis"><span class="diagnosis-label">Diagnostico:</span> ${preview.diagnostico}</div>
      <div class="footer">
        <div class="footer-block">
          <div class="footer-value">${fecha}</div>
          <div class="footer-line">
            <div class="footer-label">Fecha</div>
          </div>
        </div>
        <div class="footer-block signature">
          <div class="footer-value">&nbsp;</div>
          <div class="footer-line">
            <div class="footer-label">Firma y sello</div>
          </div>
        </div>
      </div>
    </section>
  `
}

function buildPrintHtml(preview: PrescriptionPreviewData, absoluteLogoPath: string, withDuplicate: boolean) {
  const recipeBlock = buildRecipeBlock(preview, absoluteLogoPath)
  const recipeCount = withDuplicate ? `${recipeBlock}${recipeBlock}` : recipeBlock

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Receta - ${preview.patient.apellido}, ${preview.patient.nombre}</title>
    <style>
      @page { size: A4 landscape; margin: 10mm; }
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
      .page { display: grid; grid-template-columns: ${withDuplicate ? '1fr 1fr' : '1fr'}; gap: 10mm; }
      .recipe { height: 190mm; max-width: ${withDuplicate ? 'none' : '138mm'}; padding: 8mm 10mm; display: flex; flex-direction: column; }
      .header { display: flex; flex-direction: column; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #d1d5db; text-align: center; }
      .logo { width: 210px; height: auto; }
      .company-data { margin-top: 10px; font-size: 14px; line-height: 1.45; }
      .company-name { font-size: 16px; font-weight: 700; }
      .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 1px solid #d1d5db; font-size: 15px; }
      .label { font-weight: 700; }
      .content { flex: 1; padding-top: 4px; font-size: 17px; line-height: 1.65; white-space: pre-wrap; }
      .diagnosis { margin-top: 18px; margin-bottom: 20px; font-size: 16px; line-height: 1.5; }
      .diagnosis-label { font-weight: 700; }
      .footer { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-top: auto; padding-top: 24px; }
      .footer-block { min-width: 180px; text-align: center; }
      .footer-value { padding-bottom: 8px; }
      .footer-line { border-top: 1px solid #9ca3af; padding-top: 6px; }
      .footer-label { font-size: 14px; }
      .signature { min-width: 220px; }
    </style>
  </head>
  <body>
    <div class="page">${recipeCount}</div>
  </body>
</html>`
}

function PrescriptionPreview({ preview }: { preview: PrescriptionPreviewData }) {
  return (
    <div className="flex min-h-[680px] flex-col rounded-2xl border border-border bg-white p-8 text-slate-900 shadow-sm">
      <div className="border-b border-slate-200 pb-6 text-center">
        <img src={preview.logoPath} alt="RPC" className="mx-auto block h-auto w-[220px]" />
        <div className="mt-3 space-y-1 text-sm leading-6 text-slate-700">
          <p className="text-base font-semibold text-slate-900">Red Prestacional Cordoba SRL</p>
          <p>Humberto Primo 843 - 2do Piso - Oficina B</p>
          <p>Tel: 0351 - 5711234</p>
          <p>Email: info@rpcsrlweb.com.ar - Web: www.rpcsrlweb.com.ar</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 border-b border-slate-200 pb-5 text-sm sm:grid-cols-2 sm:text-base">
        <p><span className="font-semibold">Paciente:</span> {preview.patient.apellido}, {preview.patient.nombre}</p>
        <p><span className="font-semibold">DNI:</span> {preview.patient.dni}</p>
        <p><span className="font-semibold">ART:</span> {preview.patientCase.art}</p>
        <p><span className="font-semibold">Nro de siniestro:</span> {preview.patientCase.numeroSiniestro}</p>
      </div>

      <div className="mt-6 flex-1 px-1 text-base leading-7 whitespace-pre-wrap">
        {preview.texto.trim() ? (
          preview.texto
        ) : (
          <span className="text-muted-foreground">El texto de la receta aparecera aquí.</span>
        )}
      </div>

      <div className="mt-6 mb-5 px-1 text-base leading-7">
        {preview.diagnostico.trim() ? (
          <p><span className="font-semibold">Diagnóstico:</span> {preview.diagnostico}</p>
        ) : (
          <p className="text-muted-foreground">
            <span className="font-semibold">Diagnóstico:</span> Completa el diagnóstico para habilitar la impresión.
          </p>
        )}
      </div>

      <div className="mt-12 flex items-end justify-between gap-8 text-sm sm:mt-auto sm:text-base">
        <div className="min-w-[180px] text-center">
          <div className="pb-2">{format(new Date(preview.fecha), "d 'de' MMMM 'de' yyyy", { locale: es })}</div>
          <div className="border-t border-slate-400 pt-1 text-sm">Fecha</div>
        </div>
        <div className="min-w-[220px] text-center">
          <div className="pb-2">&nbsp;</div>
          <div className="border-t border-slate-400 pt-1 text-sm">Firma y sello</div>
        </div>
      </div>
    </div>
  )
}

export function PrescriptionModal({
  open,
  onOpenChange,
  patient,
  cases,
  onCasesChanged,
}: PrescriptionModalProps) {
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [texto, setTexto] = useState('')
  const [diagnostico, setDiagnostico] = useState('')
  const [withDuplicate, setWithDuplicate] = useState(false)
  const [showCaseModal, setShowCaseModal] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Medication[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedMedications, setSelectedMedications] = useState<SelectedMedicationSlot[]>([])
  const [replacementSlot, setReplacementSlot] = useState<0 | 1 | null>(null)
  const searchTimeoutRef = useRef<number | null>(null)

  const selectedCase = cases.find((patientCase) => patientCase.id === selectedCaseId) ?? null
  const hasPreviewData = Boolean(selectedCase)
  const canPrint = Boolean(selectedCase && texto.trim() && diagnostico.trim())
  const hasAvailableMedicationSlot = selectedMedications.length < 2 || replacementSlot !== null
  const preview: PrescriptionPreviewData | null = selectedCase
    ? {
        patient,
        patientCase: selectedCase,
        texto,
        diagnostico,
        fecha: new Date().toISOString(),
        logoPath: '/RPC-logo.jpg',
      }
    : null

  useEffect(() => {
    if (!open) {
      return
    }

    setSelectedCaseId(cases[0]?.id ?? '')
    setTexto('')
    setDiagnostico('')
    setWithDuplicate(false)
    setFieldErrors({})
    setSearchQuery('')
    setSearchResults([])
    setSearchLoading(false)
    setSelectedMedications([])
    setReplacementSlot(null)
  }, [open, cases])

  useEffect(() => {
    if (!open) {
      return
    }

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = null
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    setSearchLoading(true)
    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        const response = await listMedications({
          q: searchQuery.trim(),
          pageSize: 8,
          isActive: true,
        })
        setSearchResults(response.items)
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 250)

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current)
        searchTimeoutRef.current = null
      }
    }
  }, [open, searchQuery])

  const syncMedicationLinesWithText = (nextText: string) => {
    const lines = nextText.split('\n')

    setSelectedMedications((current) => {
      const nextSlots: SelectedMedicationSlot[] = []
      const sorted = [...current].sort((a, b) => a.lineIndex - b.lineIndex)

      for (const slot of sorted) {
        const line = lines[slot.lineIndex]
        if (line === undefined || line.trim() === '') {
          continue
        }

        nextSlots.push({
          ...slot,
          recipeLine: line,
        })
      }

      return nextSlots
    })
  }

  const updateText = (value: string) => {
    setTexto(value)
    syncMedicationLinesWithText(value)
  }

  const replaceLineAtIndex = (value: string, lineIndex: number, nextLine: string) => {
    const lines = value.split('\n')
    lines[lineIndex] = nextLine
    return lines.join('\n')
  }

  const appendMedicationLine = (value: string, nextLine: string) => {
    if (!value.trim()) {
      return { nextText: nextLine, lineIndex: 0 }
    }

    const lines = value.split('\n')
    return {
      nextText: `${value}\n${nextLine}`,
      lineIndex: lines.length,
    }
  }

  const removeMedicationSlot = (slotToRemove: SelectedMedicationSlot) => {
    const lines = texto.split('\n')
    if (slotToRemove.lineIndex < lines.length) {
      lines.splice(slotToRemove.lineIndex, 1)
    }

    const nextText = lines.join('\n')
    setTexto(nextText)
    setSelectedMedications((current) =>
      current
        .filter((slot) => slot.slot !== slotToRemove.slot)
        .map((slot) => ({
          ...slot,
          lineIndex: slot.lineIndex > slotToRemove.lineIndex ? slot.lineIndex - 1 : slot.lineIndex,
        })),
    )
    if (replacementSlot === slotToRemove.slot) {
      setReplacementSlot(null)
    }
  }

  const handleMedicationSelect = (medication: Medication) => {
    const recipeLine = formatMedicationLine(medication)
    const existingSlot = selectedMedications.find((slot) => slot.medicationId === medication.id)

    if (existingSlot) {
      toast({
        title: 'Medicamento ya seleccionado',
        description: 'Ese medicamento ya esta cargado en la receta.',
      })
      return
    }

    const targetSlot = replacementSlot ?? ([0, 1].find((slot) => !selectedMedications.some((item) => item.slot === slot)) as 0 | 1 | undefined)

    if (targetSlot === undefined) {
      toast({
        variant: 'destructive',
        title: 'Limite alcanzado',
        description: 'Solo puedes seleccionar hasta 2 medicamentos.',
      })
      return
    }

    const slotToReplace = selectedMedications.find((slot) => slot.slot === targetSlot)

    if (slotToReplace) {
      const nextText = replaceLineAtIndex(texto, slotToReplace.lineIndex, recipeLine)
      setTexto(nextText)
      setSelectedMedications((current) =>
        current.map((slot) =>
          slot.slot === targetSlot
            ? {
                ...slot,
                medicationId: medication.id,
                label: medication.nombreComercial || medication.droga,
                recipeLine,
                isChecked: true,
              }
            : slot,
        ),
      )
    } else {
      const { nextText, lineIndex } = appendMedicationLine(texto, recipeLine)
      setTexto(nextText)
      setSelectedMedications((current) =>
        [...current, {
          slot: targetSlot,
          medicationId: medication.id,
          label: medication.nombreComercial || medication.droga,
          recipeLine,
          lineIndex,
          isChecked: true,
        }].sort((a, b) => a.slot - b.slot),
      )
    }

    setReplacementSlot(null)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleMedicationToggle = (slot: SelectedMedicationSlot, checked: boolean) => {
    if (checked) {
      return
    }

    removeMedicationSlot(slot)
  }

  const handlePrint = () => {
    if (!preview || !hasPreviewData) {
      return
    }

    const absoluteLogoPath = new URL(preview.logoPath, window.location.origin).toString()
    const printHtml = buildPrintHtml(preview, absoluteLogoPath, withDuplicate)
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.setAttribute('aria-hidden', 'true')
    iframe.setAttribute('sandbox', 'allow-modals allow-same-origin')

    const cleanup = () => {
      window.setTimeout(() => {
        iframe.remove()
      }, 500)
    }

    iframe.onload = () => {
      const iframeWindow = iframe.contentWindow
      if (!iframeWindow) {
        cleanup()
        toast({
          variant: 'destructive',
          title: 'No se pudo abrir la impresion',
          description: 'No se pudo inicializar la vista de impresion.',
        })
        return
      }

      window.setTimeout(() => {
        iframeWindow.focus()
        iframeWindow.print()
        cleanup()
      }, 250)
    }

    document.body.appendChild(iframe)
    iframe.srcdoc = printHtml
  }

  const handleCaseSaved = async (savedCase: PatientCase) => {
    await onCasesChanged()
    setSelectedCaseId(savedCase.id)
    setShowCaseModal(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[min(92vh,980px)] w-[98vw] max-w-none flex-col overflow-hidden p-0 sm:max-w-[98vw] xl:w-[96vw] xl:sm:max-w-[96vw] 2xl:w-[94vw] 2xl:sm:max-w-[94vw]">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle>Generar receta</DialogTitle>
            <DialogDescription>
              Selecciona un siniestro, busca medicamentos del vademecum, redacta la receta y completa el diagnóstico.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden px-6 py-5">
            <div className="grid h-full min-h-0 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
              <div className="min-h-0 overflow-hidden rounded-2xl border border-border bg-muted/10">
                <ScrollArea className="h-full">
                  <div className="space-y-5 p-4">
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="font-medium">{patient.apellido}, {patient.nombre}</p>
                      <p className="mt-1 text-sm text-muted-foreground">DNI: {patient.dni}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label>Número de siniestro</Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowCaseModal(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Nuevo
                        </Button>
                      </div>

                      {cases.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                          El paciente no tiene siniestros cargados. Agrega uno para continuar.
                        </div>
                      ) : (
                        <ScrollArea className="h-[220px] rounded-xl border border-border">
                          <div className="space-y-2 p-3">
                            {cases.map((patientCase) => (
                              <button
                                key={patientCase.id}
                                type="button"
                                onClick={() => setSelectedCaseId(patientCase.id)}
                                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                  selectedCaseId === patientCase.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/40'
                                }`}
                              >
                                <p className="font-medium">{patientCase.art}</p>
                                <p className="mt-1 text-sm text-muted-foreground">Siniestro: {patientCase.numeroSiniestro}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Cargado el {format(new Date(patientCase.createdAt), 'd/MM/yyyy', { locale: es })}
                                </p>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                      {fieldErrors.patientCaseId?.length ? <p className="text-sm text-destructive">{fieldErrors.patientCaseId[0]}</p> : null}
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
                      <Checkbox
                        id="with-duplicate"
                        checked={withDuplicate}
                        onCheckedChange={(checked) => setWithDuplicate(checked === true)}
                      />
                      <Label htmlFor="with-duplicate" className="cursor-pointer">
                        Con duplicado
                      </Label>
                    </div>
                  </div>
                </ScrollArea>
              </div>

              <div className="min-h-0 overflow-hidden rounded-2xl border border-border bg-background">
                <div className="grid h-full min-h-0 gap-6 p-4 2xl:grid-cols-[minmax(0,1fr)_minmax(460px,620px)]">
                  <div className="min-h-0 overflow-hidden rounded-xl border border-border bg-muted/10">
                    <ScrollArea className="h-full">
                      <div className="space-y-5 p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <Label>Buscar en vademecum</Label>
                            <p className="text-xs text-muted-foreground">Hasta 2 medicamentos</p>
                          </div>
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              value={searchQuery}
                              onChange={(event) => setSearchQuery(event.target.value)}
                              placeholder="Droga, marca o laboratorio..."
                              className="pl-9"
                            />
                            {searchQuery.trim().length >= 3 ? (
                              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                                {searchLoading ? (
                                  <div className="p-4 text-sm text-muted-foreground">Buscando medicamentos...</div>
                                ) : searchResults.length === 0 ? (
                                  <div className="p-4 text-sm text-muted-foreground">No se encontraron medicamentos.</div>
                                ) : (
                                  <ScrollArea className="h-[220px]">
                                    <div>
                                      {searchResults.map((medication, index) => {
                                        const isSelected = selectedMedications.some((slot) => slot.medicationId === medication.id)
                                        const actionDisabled = isSelected || !hasAvailableMedicationSlot
                                        return (
                                          <div
                                            key={medication.id}
                                            className={`px-4 py-3 ${index > 0 ? 'border-t border-border' : ''}`}
                                          >
                                            <div className="flex items-start justify-between gap-3">
                                              <div className="min-w-0">
                                                <p className="font-medium">{formatMedicationSearchTitle(medication)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {[medication.droga, medication.dosis, medication.presentacion].filter(Boolean).join(' - ')}
                                                </p>
                                              </div>
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                disabled={actionDisabled}
                                                onClick={() => handleMedicationSelect(medication)}
                                              >
                                                {isSelected ? 'Seleccionado' : replacementSlot !== null ? 'Reemplazar' : 'Agregar'}
                                              </Button>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </ScrollArea>
                                )}
                              </div>
                            ) : null}
                          </div>

                          {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 ? (
                            <p className="text-sm text-muted-foreground">
                              Escribe al menos 3 caracteres para buscar medicamentos.
                            </p>
                          ) : null}

                          {selectedMedications.length === 2 && replacementSlot === null ? (
                            <p className="text-xs text-muted-foreground">
                              Ya seleccionaste 2 medicamentos. Usa "Cambiar" o destilda uno para elegir otro.
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">Medicamentos seleccionados</p>
                          </div>

                          {selectedMedications.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                              Aún no hay medicamentos seleccionados.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {selectedMedications
                                .sort((a, b) => a.slot - b.slot)
                                .map((slot) => (
                                  <div key={slot.slot} className="rounded-xl border border-border bg-background p-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex min-w-0 items-start gap-3">
                                        <Checkbox
                                          checked={slot.isChecked}
                                          onCheckedChange={(checked) => handleMedicationToggle(slot, checked === true)}
                                        />
                                        <div className="min-w-0">
                                          <p className="truncate font-medium">{slot.label}</p>
                                          <p className="mt-1 text-sm text-muted-foreground">{slot.recipeLine}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          type="button"
                                          variant={replacementSlot === slot.slot ? 'default' : 'outline'}
                                          size="sm"
                                          onClick={() => setReplacementSlot(slot.slot)}
                                        >
                                          <RefreshCcw className="mr-2 h-4 w-4" />
                                          Cambiar
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeMedicationSlot(slot)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}

                          {replacementSlot !== null ? (
                            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
                              Selecciona un medicamento del buscador para reemplazar el slot {replacementSlot + 1}.
                            </div>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="prescription-text">Texto de la receta</Label>
                          <Textarea
                            id="prescription-text"
                            value={texto}
                            onChange={(event) => updateText(event.target.value)}
                            placeholder="Indique aquí el contenido de la receta..."
                            rows={10}
                            className="min-h-[14rem] field-sizing-fixed"
                            aria-invalid={fieldErrors.texto?.length ? true : undefined}
                          />
                          {fieldErrors.texto?.length ? <p className="text-sm text-destructive">{fieldErrors.texto[0]}</p> : null}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="prescription-diagnosis">Diagnóstico</Label>
                          <Textarea
                            id="prescription-diagnosis"
                            value={diagnostico}
                            onChange={(event) => setDiagnostico(event.target.value)}
                            placeholder="Ingrese el diagnóstico..."
                            rows={4}
                            required
                          />
                        </div>
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="min-h-0 overflow-hidden rounded-xl border border-border bg-muted/10">
                    <div className="flex h-full min-h-0 flex-col p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Vista previa imprimible</p>
                        <Button type="button" onClick={handlePrint} disabled={!canPrint}>
                          Imprimir / Guardar PDF
                        </Button>
                      </div>

                      <ScrollArea className="min-h-0 flex-1 rounded-2xl border border-border bg-muted/20">
                        {hasPreviewData && preview ? (
                          <div className="flex min-h-full items-start justify-center px-4 py-4">
                            <div className="w-full max-w-[760px]">
                              <PrescriptionPreview preview={preview} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-full min-h-[520px] flex-col items-center justify-center text-center text-muted-foreground">
                            <div className="rounded-full bg-background p-4 shadow-sm">
                              <FileText className="h-8 w-8" />
                            </div>
                            <p className="mt-4 text-sm">
                              Selecciona un siniestro y comienza a escribir.
                            </p>
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PatientCaseModal
        open={showCaseModal}
        onOpenChange={setShowCaseModal}
        patientId={patient.id}
        onSaved={(savedCase) => void handleCaseSaved(savedCase)}
      />
    </>
  )
}
