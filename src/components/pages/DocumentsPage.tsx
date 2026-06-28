"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  FileText,
  FilePlus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  Download,
  Plus,
  RefreshCcw,
  FileCheck,
  Star,
} from "lucide-react"
import { toast } from "sonner"

import { ListPageShell } from "@/components/admin/list-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { DocumentTemplate, DocumentType, GeneratedDocument } from "@/store/api/documents"
import {
  useCreateTemplateMutation,
  useDeleteGeneratedDocumentMutation,
  useDeleteTemplateMutation,
  useGetGeneratedDocumentsQuery,
  useGetTemplatesQuery,
  useUpdateTemplateMutation,
} from "@/store/api/documents"

function getErrorMessage(error: unknown, fallback = "Une erreur est survenue.") {
  if (error && typeof error === "object") {
    const c = error as { data?: { message?: unknown }; error?: string }
    if (typeof c.data?.message === "string") return c.data.message
    if (typeof c.error === "string") return c.error
  }
  return fallback
}

function formatDate(v?: string | null) {
  if (!v) return "—"
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v))
}

const TYPE_STYLES: Record<DocumentType, string> = {
  contract: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  invoice: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
}

// ─── New template dialog ──────────────────────────────────────────────────────

function NewTemplateDialog({
  open,
  type,
  isSaving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  type: DocumentType | null
  isSaving: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (name: string, type: DocumentType) => Promise<void>
}) {
  const t = useTranslations("Documents")
  const tc = useTranslations("Common")
  const [name, setName] = useState("")
  const isContract = type === "contract"

  useEffect(() => {
    if (!open) setName("")
  }, [open])

  if (!type) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus className="size-4 text-primary" />
            {isContract ? t("newTemplateDialogContract") : t("newTemplateDialogInvoice")}
          </DialogTitle>
          <DialogDescription>
            {isContract ? t("newTemplateDescContract") : t("newTemplateDescInvoice")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("nameLabel")}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isContract ? t("placeholderContract") : t("placeholderInvoice")}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>{tc("cancel")}</Button>
          <Button onClick={() => onSubmit(name, type)} disabled={isSaving || !name.trim()}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {t("createAndOpen")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open, title, description, isLoading, onOpenChange, onConfirm,
}: {
  open: boolean; title: string; description: string; isLoading: boolean
  onOpenChange: (v: boolean) => void; onConfirm: () => Promise<void>
}) {
  const tc = useTranslations("Common")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>{tc("cancel")}</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            {tc("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onEdit,
  onDelete,
  onSetDefault,
  isSettingDefault,
}: {
  template: DocumentTemplate
  onEdit: (t: DocumentTemplate) => void
  onDelete: (t: DocumentTemplate) => void
  onSetDefault: (t: DocumentTemplate) => void
  isSettingDefault: boolean
}) {
  const t = useTranslations("Documents")
  return (
    <Card className="group border-border/70 transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("rounded-xl p-2.5", template.type === "contract" ? "bg-blue-500/10" : "bg-violet-500/10")}>
              <FileText className={cn("size-5", template.type === "contract" ? "text-blue-600" : "text-violet-600")} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{template.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("rounded-full px-2 py-0 text-[10px] font-semibold", TYPE_STYLES[template.type])}>
                  {t(template.type)}
                </Badge>
                {template.is_default && (
                  <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px] font-semibold border-emerald-500/20 bg-emerald-500/10 text-emerald-700">
                    {t("default")}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-8", template.is_default ? "text-amber-500" : "text-muted-foreground")}
              onClick={() => onSetDefault(template)}
              disabled={isSettingDefault || template.is_default}
              title={template.is_default ? t("favoriteTemplate") : t("setAsFavorite")}
            >
              <Star className={cn("size-3.5", template.is_default && "fill-current")} />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(template)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => onDelete(template)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("editedOn", { date: formatDate(template.updated_at) })}</span>
          <Button size="sm" className="h-7 px-3 text-xs" onClick={() => onEdit(template)}>
            <Pencil className="size-3" />
            {t("edit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Generated doc card ───────────────────────────────────────────────────────

function GeneratedDocCard({
  doc,
  onDelete,
  onView,
}: {
  doc: GeneratedDocument
  onDelete: (d: GeneratedDocument) => void
  onView: (d: GeneratedDocument) => void
}) {
  const t = useTranslations("Documents")
  return (
    <Card className="border-border/70">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted p-2">
            <FileCheck className="size-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {doc.reservation?.client?.full_name ?? "—"} — {doc.reservation?.vehicle?.brand} {doc.reservation?.vehicle?.model}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className={cn("rounded-full px-2 py-0 text-[10px] font-semibold", TYPE_STYLES[doc.type])}>
                {t(doc.type)}
              </Badge>
              <span className="text-xs text-muted-foreground">{doc.template?.name}</span>
              <span className="text-xs text-muted-foreground">· {formatDate(doc.created_at)}</span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => onView(doc)} title={t("view")}>
              <Eye className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => onDelete(doc)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function DocumentsPage() {
  const router = useRouter()
  const t = useTranslations("Documents")
  const [tab, setTab] = useState<"templates" | "generated">("templates")
  const [creatingType, setCreatingType] = useState<DocumentType | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<DocumentTemplate | null>(null)
  const [deletingDoc, setDeletingDoc] = useState<GeneratedDocument | null>(null)
  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const { data: templates = [], isLoading: loadingTemplates, refetch: refetchTemplates } = useGetTemplatesQuery()
  const { data: generatedDocs = [], isLoading: loadingDocs, refetch: refetchDocs } = useGetGeneratedDocumentsQuery()
  const [createTemplate, { isLoading: isCreating }] = useCreateTemplateMutation()
  const [updateTemplate, { isLoading: isSettingDefault }] = useUpdateTemplateMutation()
  const [deleteTemplate, { isLoading: isDeletingTemplate }] = useDeleteTemplateMutation()
  const [deleteDoc, { isLoading: isDeletingDoc }] = useDeleteGeneratedDocumentMutation()

  const handleCreate = async (name: string, type: DocumentType) => {
    try {
      const result = await createTemplate({
        name,
        type,
        canvas: { sections: [] },
        settings: {
          pageSize: "A4",
          fontFamily: "Arial, sans-serif",
          primaryColor: "#2563eb",
          textColor: "#111827",
          bgColor: "#ffffff",
        },
      }).unwrap()
      toast.success(t("toastTemplateCreated"))
      setCreatingType(null)
      router.push(`/documents/editor?id=${result.template.id}`)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return
    try {
      await deleteTemplate(deletingTemplate.id).unwrap()
      toast.success(t("toastTemplateDeleted"))
      setDeletingTemplate(null)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const handleSetDefaultTemplate = async (template: DocumentTemplate) => {
    try {
      await updateTemplate({ id: template.id, is_default: true }).unwrap()
      toast.success(t("toastFavoriteUpdated"))
    } catch (e) {
      toast.error(getErrorMessage(e, t("toastFavoriteError")))
    }
  }

  const handleDeleteDoc = async () => {
    if (!deletingDoc) return
    try {
      await deleteDoc(deletingDoc.id).unwrap()
      toast.success(t("toastDocumentDeleted"))
      setDeletingDoc(null)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const handleDownloadPdf = async (doc: GeneratedDocument) => {
    setDownloadingPdf(true)
    try {
      const res = await fetch(`/api/admin/generated-documents/${doc.id}/download`)
      if (!res.ok) throw new Error(t("toastDownloadError"))
      const html = await res.text()

      // Conteneur hors-ecran pour le rendu
      const container = document.createElement("div")
      container.style.position = "fixed"
      container.style.left = "-10000px"
      container.style.top = "0"
      container.style.width = "210mm"
      container.innerHTML = html
      document.body.appendChild(container)

      const { default: html2pdf } = await import("html2pdf.js")
      const pdfName = doc.filename.replace(/\.html?$/i, "") + ".pdf"

      await html2pdf()
        .set({
          margin: 0,
          filename: pdfName,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(container)
        .save()

      document.body.removeChild(container)
    } catch (e) {
      toast.error(getErrorMessage(e, t("toastPdfError")))
    } finally {
      setDownloadingPdf(false)
    }
  }

  const stats = useMemo(() => ({
    contracts: templates.filter((t) => t.type === "contract").length,
    invoices: templates.filter((t) => t.type === "invoice").length,
    generated: generatedDocs.length,
  }), [templates, generatedDocs])

  return (
    <ListPageShell
      badge={t("badge")}
      title={t("title")}
      description={t("description")}
      action={
        <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto">
          <Button onClick={() => setCreatingType("contract")} className="w-full md:w-auto">
            <FileText className="size-4" />
            {t("newContract")}
          </Button>
          <Button onClick={() => setCreatingType("invoice")} variant="outline" className="w-full md:w-auto">
            <FileCheck className="size-4" />
            {t("newInvoice")}
          </Button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t("contracts"), value: stats.contracts, icon: FileText, color: "text-blue-600" },
          { label: t("invoices"), value: stats.invoices, icon: FileText, color: "text-violet-600" },
          { label: t("generated"), value: stats.generated, icon: FileCheck, color: "text-emerald-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border/70">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("rounded-lg bg-muted p-2", color)}><Icon className="size-4" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/70">
        <CardHeader className="border-b border-border/70 pb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-primary" />
                {tab === "templates" ? t("templates") : t("generatedDocuments")}
              </CardTitle>
              <CardDescription>
                {tab === "templates" ? t("templatesCount", { count: templates.length }) : t("generatedCount", { count: generatedDocs.length })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={tab} onValueChange={(v) => setTab(v as "templates" | "generated")}>
                <TabsList>
                  <TabsTrigger value="templates">{t("templates")}</TabsTrigger>
                  <TabsTrigger value="generated">{t("generated")}</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="outline"
                size="icon"
                onClick={() => tab === "templates" ? refetchTemplates() : refetchDocs()}
              >
                <RefreshCcw className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {tab === "templates" ? (
            loadingTemplates ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="rounded-full bg-muted p-4">
                  <FilePlus className="size-8 text-muted-foreground" />
                </div>
                <p className="font-medium">{t("noTemplate")}</p>
                <p className="text-sm text-muted-foreground">{t("noTemplateHint")}</p>
                <Button onClick={() => setCreatingType("contract")}>
                  <Plus className="size-4" />
                  {t("newContract")}
                </Button>
                <Button variant="outline" onClick={() => setCreatingType("invoice")}>
                  <FileCheck className="size-4" />
                  {t("newInvoice")}
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {templates.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    onEdit={(t) => router.push(`/documents/editor?id=${t.id}`)}
                    onDelete={setDeletingTemplate}
                    onSetDefault={handleSetDefaultTemplate}
                    isSettingDefault={isSettingDefault}
                  />
                ))}
              </div>
            )
          ) : (
            loadingDocs ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : generatedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="rounded-full bg-muted p-4">
                  <FileCheck className="size-8 text-muted-foreground" />
                </div>
                <p className="font-medium">{t("noGenerated")}</p>
                <p className="text-sm text-muted-foreground">{t("noGeneratedHint")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {generatedDocs.map((d) => (
                  <GeneratedDocCard
                    key={d.id}
                    doc={d}
                    onDelete={setDeletingDoc}
                    onView={setPreviewDoc}
                  />
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      <NewTemplateDialog
        open={Boolean(creatingType)}
        type={creatingType}
        isSaving={isCreating}
        onOpenChange={(open) => { if (!open) setCreatingType(null) }}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        open={Boolean(deletingTemplate)}
        title={t("deleteTemplate")}
        description={deletingTemplate ? t("deleteTemplateConfirm", { name: deletingTemplate.name }) : ""}
        isLoading={isDeletingTemplate}
        onOpenChange={(v) => { if (!v) setDeletingTemplate(null) }}
        onConfirm={handleDeleteTemplate}
      />

      <ConfirmDialog
        open={Boolean(deletingDoc)}
        title={t("deleteDocument")}
        description={t("deleteDocumentConfirm")}
        isLoading={isDeletingDoc}
        onOpenChange={(v) => { if (!v) setDeletingDoc(null) }}
        onConfirm={handleDeleteDoc}
      />

      {/* Preview modal */}
      {previewDoc && (
        <Dialog open={Boolean(previewDoc)} onOpenChange={(v) => { if (!v) setPreviewDoc(null) }}>
          <DialogContent className="flex max-h-[95dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
            <DialogHeader className="shrink-0 border-b border-border/70 px-6 py-4">
              <DialogTitle className="flex items-center gap-2">
                <Eye className="size-4 text-primary" />
                {t("preview", { filename: previewDoc.filename })}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              <p className="text-sm text-muted-foreground text-center py-8">
                {t("generatedOn", { date: formatDate(previewDoc.created_at) })}
                <br />
                <Button
                  className="mt-3"
                  disabled={downloadingPdf}
                  onClick={() => handleDownloadPdf(previewDoc)}
                >
                  {downloadingPdf ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  {t("downloadPdf")}
                </Button>
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </ListPageShell>
  )
}
