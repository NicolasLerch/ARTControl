'use client'

import { useEffect, useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type FormFieldErrors } from '@/lib/forms'
import { Patient, PatientCase } from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { FileText, Plus } from 'lucide-react'
import { PatientCaseModal } from './patient-case-modal'

interface PrescriptionPreviewData {
  patient: Patient
  patientCase: PatientCase
  texto: string
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
        <div class="title">RECETA</div>
      </div>
      <div class="meta">
        <div><span class="label">Paciente:</span> ${preview.patient.apellido}, ${preview.patient.nombre}</div>
        <div><span class="label">DNI:</span> ${preview.patient.dni}</div>
        <div><span class="label">ART:</span> ${preview.patientCase.art}</div>
        <div><span class="label">N° de siniestro:</span> ${preview.patientCase.numeroSiniestro}</div>
      </div>
      <div class="content">${textoHtml}</div>
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
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #d1d5db; }
      .logo { width: 160px; height: auto; }
      .title { font-size: 26px; font-weight: 700; letter-spacing: 0.04em; }
      .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 1px solid #d1d5db; font-size: 15px; }
      .label { font-weight: 700; }
      .content { flex: 1; padding-top: 4px; font-size: 17px; line-height: 1.65; }
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
      <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
        <img src={preview.logoPath} alt="RPC" className="block h-auto w-[180px]" />
        <div className="text-right text-2xl font-bold tracking-[0.18em]">RECETA</div>
      </div>

      <div className="mt-6 grid gap-3 border-b border-slate-200 pb-5 text-sm sm:grid-cols-2 sm:text-base">
        <p><span className="font-semibold">Paciente:</span> {preview.patient.apellido}, {preview.patient.nombre}</p>
        <p><span className="font-semibold">DNI:</span> {preview.patient.dni}</p>
        <p><span className="font-semibold">ART:</span> {preview.patientCase.art}</p>
        <p><span className="font-semibold">N° de siniestro:</span> {preview.patientCase.numeroSiniestro}</p>
      </div>

      <div className="mt-6 flex-1 px-1 text-base leading-7 whitespace-pre-wrap">
        {preview.texto.trim() ? (
          preview.texto
        ) : (
          <span className="text-muted-foreground">El texto de la receta aparecerá aquí.</span>
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
  const [withDuplicate, setWithDuplicate] = useState(false)
  const [showCaseModal, setShowCaseModal] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({})

  const selectedCase = cases.find((patientCase) => patientCase.id === selectedCaseId) ?? null
  const hasPreviewData = Boolean(selectedCase)
  const canPrint = Boolean(selectedCase && texto.trim())
  const preview: PrescriptionPreviewData | null = selectedCase
    ? {
        patient,
        patientCase: selectedCase,
        texto,
        fecha: new Date().toISOString(),
        logoPath: '/RPC-logo.png',
      }
    : null

  useEffect(() => {
    if (!open) {
      return
    }

    setSelectedCaseId(cases[0]?.id ?? '')
    setTexto('')
    setWithDuplicate(false)
    setFieldErrors({})
  }, [open, cases])

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
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Generar receta</DialogTitle>
            <DialogDescription>
              Selecciona un siniestro del paciente, redacta el texto y genera una vista previa lista para imprimir o guardar como PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-medium">{patient.apellido}, {patient.nombre}</p>
                <p className="mt-1 text-sm text-muted-foreground">DNI: {patient.dni}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Número de siniestro</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowCaseModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo siniestro
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

              <div className="space-y-2">
                <Label htmlFor="prescription-text">Texto de la receta</Label>
                <Textarea
                  id="prescription-text"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Indique aqui el contenido de la receta..."
                  rows={12}
                  aria-invalid={fieldErrors.texto?.length ? true : undefined}
                />
                {fieldErrors.texto?.length ? <p className="text-sm text-destructive">{fieldErrors.texto[0]}</p> : null}
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

            <div className="flex min-h-0 flex-col">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Vista previa imprimible</p>
                <Button type="button" onClick={handlePrint} disabled={!canPrint}>
                  Imprimir / Guardar PDF
                </Button>
              </div>

              <ScrollArea className="min-h-0 flex-1 rounded-2xl border border-border bg-muted/20 p-4">
                {hasPreviewData && preview ? (
                  <PrescriptionPreview preview={preview} />
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

          <DialogFooter>
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
