"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Columns2,
  Columns3,
  Download,
  Eye,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Info,
  Layers,
  LayoutTemplate,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Save,
  Settings2,
  Signature,
  Square,
  Table2,
  Trash2,
  Type,
  ZoomIn,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type {
  CanvasSection,
  CanvasState,
  CanvasWidget,
  TemplateSettings,
  WidgetType,
} from "@/store/api/documents"
import {
  useGenerateDocumentMutation,
  useGetTemplateQuery,
  useUpdateTemplateMutation,
} from "@/store/api/documents"
import { useGetReservationsQuery } from "@/store/api/reservations"

// ─── Variable groups ──────────────────────────────────────────────────────────

const VARIABLE_GROUPS = [
  {
    label: "Reservation",
    vars: [
      { key: "reservation.id", label: "N° Reservation" },
      { key: "reservation.start_date", label: "Date debut" },
      { key: "reservation.end_date", label: "Date fin" },
      { key: "reservation.pickup_time", label: "Heure prise en charge" },
      { key: "reservation.return_time", label: "Heure retour" },
      { key: "reservation.pickup_location", label: "Lieu prise en charge" },
      { key: "reservation.return_location", label: "Lieu retour" },
      { key: "reservation.total_days", label: "Nombre de jours" },
      { key: "reservation.price_per_day", label: "Prix par jour" },
      { key: "reservation.total_amount", label: "Montant total" },
      { key: "reservation.deposit_amount", label: "Acompte" },
      { key: "reservation.notes", label: "Notes" },
      { key: "reservation.created_at", label: "Date creation" },
    ],
  },
  {
    label: "Client",
    vars: [
      { key: "client.full_name", label: "Nom complet" },
      { key: "client.phone", label: "Telephone" },
      { key: "client.email", label: "Email" },
      { key: "client.address", label: "Adresse" },
      { key: "client.city", label: "Ville" },
      { key: "client.nationality", label: "Nationalite" },
      { key: "client.cin", label: "CIN" },
      { key: "client.passport", label: "Passeport" },
      { key: "client.driving_license_number", label: "N° Permis" },
    ],
  },
  {
    label: "Vehicule",
    vars: [
      { key: "vehicle.brand", label: "Marque" },
      { key: "vehicle.model", label: "Modele" },
      { key: "vehicle.registration_number", label: "Immatriculation" },
      { key: "vehicle.year", label: "Annee" },
      { key: "vehicle.color", label: "Couleur" },
    ],
  },
  {
    label: "Paiements",
    vars: [
      { key: "payments.total_paid", label: "Total paye" },
      { key: "payments.remaining", label: "Restant du" },
    ],
  },
  {
    label: "Date",
    vars: [
      { key: "date.today", label: "Aujourd'hui" },
      { key: "date.year", label: "Annee en cours" },
    ],
  },
]

// ─── Widget palette ───────────────────────────────────────────────────────────

const WIDGET_PALETTE: {
  type: WidgetType
  label: string
  icon: React.ElementType
  defaultProps: Record<string, unknown>
}[] = [
  {
    type: "heading",
    label: "Titre",
    icon: Type,
    defaultProps: {
      text: "Mon titre", level: "h1", align: "left", color: "",
      fontSize: "", fontWeight: "700", fontStyle: "normal",
      lineHeight: "1.3", letterSpacing: "0px",
      marginTop: "0px", marginBottom: "8px", paddingTop: "0px", paddingBottom: "0px",
      paddingLeft: "0px", paddingRight: "0px",
      bgColor: "", borderWidth: "0px", borderColor: "", borderRadius: "0px", borderStyle: "solid",
    },
  },
  {
    type: "text",
    label: "Texte",
    icon: FileText,
    defaultProps: {
      content: "Votre texte ici. Utilisez {{client.full_name}} pour les variables.",
      align: "left", fontSize: "13px", fontWeight: "400", fontStyle: "normal",
      lineHeight: "1.6", letterSpacing: "0px", color: "",
      marginTop: "0px", marginBottom: "8px", paddingTop: "0px", paddingBottom: "0px",
      paddingLeft: "0px", paddingRight: "0px",
      bgColor: "", borderWidth: "0px", borderColor: "", borderRadius: "0px", borderStyle: "solid",
    },
  },
  {
    type: "image",
    label: "Image / Logo",
    icon: ImageIcon,
    defaultProps: {
      src: "", alt: "Logo", width: "120px", align: "left",
      marginTop: "0px", marginBottom: "8px", paddingTop: "0px", paddingBottom: "0px",
      paddingLeft: "0px", paddingRight: "0px",
      bgColor: "", borderWidth: "0px", borderColor: "", borderRadius: "0px", borderStyle: "solid",
    },
  },
  {
    type: "divider",
    label: "Separateur",
    icon: Minus,
    defaultProps: {
      color: "#e5e7eb", thickness: "1px", marginTop: "12px", marginBottom: "12px",
    },
  },
  {
    type: "spacer",
    label: "Espace",
    icon: Square,
    defaultProps: { height: 24 },
  },
  {
    type: "info-grid",
    label: "Grille info",
    icon: Info,
    defaultProps: {
      title: "Informations client",
      columns: 2,
      fields: [
        { label: "Nom", value: "{{client.full_name}}" },
        { label: "Telephone", value: "{{client.phone}}" },
        { label: "CIN", value: "{{client.cin}}" },
        { label: "Ville", value: "{{client.city}}" },
      ],
      marginTop: "0px", marginBottom: "12px", paddingTop: "0px", paddingBottom: "0px",
      paddingLeft: "0px", paddingRight: "0px",
      bgColor: "", borderWidth: "1px", borderColor: "#e5e7eb", borderRadius: "6px", borderStyle: "solid",
      labelFontSize: "11px", valueFontSize: "13px", labelColor: "#6b7280", valueColor: "",
    },
  },
  {
    type: "table",
    label: "Tableau paiements",
    icon: Table2,
    defaultProps: {
      tableType: "payments",
      marginTop: "0px", marginBottom: "12px",
      headerBg: "", headerColor: "#ffffff",
      fontSize: "13px", borderColor: "#e5e7eb",
    },
  },
  {
    type: "total-box",
    label: "Total",
    icon: CircleDollarSign,
    defaultProps: {
      label: "Montant total", value: "{{reservation.total_amount}}", subtext: "",
      bgColor: "", textColor: "#ffffff", align: "right",
      fontSize: "22px", labelFontSize: "11px",
      marginTop: "0px", marginBottom: "12px",
      paddingTop: "16px", paddingBottom: "16px", paddingLeft: "20px", paddingRight: "20px",
      borderRadius: "8px",
    },
  },
  {
    type: "signature",
    label: "Signature",
    icon: Signature,
    defaultProps: {
      label: "Signature client", name: "{{client.full_name}}",
      marginTop: "32px", lineColor: "#6b7280",
      labelFontSize: "12px", nameFontSize: "13px",
    },
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10) }

function getErrorMessage(error: unknown, fallback = "Une erreur est survenue.") {
  if (error && typeof error === "object") {
    const c = error as { data?: { message?: unknown }; error?: string }
    if (typeof c.data?.message === "string") return c.data.message
    if (typeof c.error === "string") return c.error
  }
  return fallback
}

function formatAmount(v?: number | string | null) {
  if (v === undefined || v === null) return "—"
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", minimumFractionDigits: 0 }).format(Number(v))
}

function formatDate(v?: string | null) {
  if (!v) return "—"
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v))
}

function px(v: unknown, fallback = "0px") {
  const s = String(v ?? "").trim()
  return s || fallback
}

// ─── Reusable sub-components for the property panel ──────────────────────────

function PropLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{children}</label>
}

function PropSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 border-b border-border/40 pb-1">{title}</p>
      {children}
    </div>
  )
}

function ColorRow({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <PropLabel>{label}</PropLabel>
      <div className="flex gap-1.5">
        <input type="color" value={value || "#ffffff"} onChange={(e) => onChange(e.target.value)} className="h-7 w-8 shrink-0 cursor-pointer rounded border border-border/60 p-0.5" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "#000000"} className="h-7 flex-1 font-mono text-[11px]" />
      </div>
    </div>
  )
}

function SpacingGrid({
  label,
  topKey, rightKey, bottomKey, leftKey,
  values, onChange,
}: {
  label: string
  topKey: string; rightKey: string; bottomKey: string; leftKey: string
  values: Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}) {
  const fields = [
    { key: topKey, placeholder: "haut" },
    { key: rightKey, placeholder: "droite" },
    { key: bottomKey, placeholder: "bas" },
    { key: leftKey, placeholder: "gauche" },
  ]
  return (
    <div className="space-y-1">
      <PropLabel>{label}</PropLabel>
      <div className="grid grid-cols-4 gap-1">
        {fields.map((f) => (
          <Input
            key={f.key}
            value={(values[f.key] as string) || "0px"}
            onChange={(e) => onChange({ [f.key]: e.target.value })}
            className="h-7 text-center text-[11px] font-mono px-1"
            placeholder={f.placeholder}
            title={f.placeholder}
          />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1 text-[9px] text-center text-muted-foreground/60">
        <span>Haut</span><span>Droite</span><span>Bas</span><span>Gauche</span>
      </div>
    </div>
  )
}

function AlignBtns({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1">
      {(["left", "center", "right"] as const).map((a) => {
        const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight
        return (
          <button
            key={a}
            className={cn("rounded border p-1.5 transition-colors", value === a ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted")}
            onClick={() => onChange(a)}
          >
            <Icon className="size-3.5" />
          </button>
        )
      })}
    </div>
  )
}

// ─── Widget preview ───────────────────────────────────────────────────────────

function WidgetPreview({ widget, primaryColor }: { widget: CanvasWidget; primaryColor: string }) {
  const p = widget.props as Record<string, unknown>

  const boxStyle: React.CSSProperties = {
    marginTop: px(p.marginTop),
    marginBottom: px(p.marginBottom),
    marginLeft: px(p.marginLeft),
    marginRight: px(p.marginRight),
    paddingTop: px(p.paddingTop),
    paddingBottom: px(p.paddingBottom),
    paddingLeft: px(p.paddingLeft),
    paddingRight: px(p.paddingRight),
    backgroundColor: (p.bgColor as string) || "transparent",
    borderWidth: px(p.borderWidth, "0px"),
    borderColor: (p.borderColor as string) || "transparent",
    borderRadius: px(p.borderRadius, "0px"),
    borderStyle: (p.borderStyle as string) || "solid",
  }

  switch (widget.type) {
    case "heading": {
      const Tag = ((p.level as string) || "h2") as "h1" | "h2" | "h3"
      return (
        <div style={boxStyle}>
          <Tag style={{
            textAlign: (p.align as "left") || "left",
            color: (p.color as string) || primaryColor,
            fontSize: (p.fontSize as string) || (Tag === "h1" ? "22px" : Tag === "h2" ? "17px" : "14px"),
            fontWeight: (p.fontWeight as string) || "700",
            fontStyle: (p.fontStyle as string) || "normal",
            lineHeight: (p.lineHeight as string) || "1.3",
            letterSpacing: (p.letterSpacing as string) || "0px",
            margin: 0,
          }}>
            {(p.text as string) || "Titre"}
          </Tag>
        </div>
      )
    }
    case "text":
      return (
        <div style={boxStyle}>
          <p style={{
            textAlign: (p.align as "left") || "left",
            fontSize: (p.fontSize as string) || "13px",
            color: (p.color as string) || "inherit",
            fontWeight: (p.fontWeight as string) || "400",
            fontStyle: (p.fontStyle as string) || "normal",
            lineHeight: (p.lineHeight as string) || "1.6",
            letterSpacing: (p.letterSpacing as string) || "0px",
            margin: 0,
            whiteSpace: "pre-wrap",
          }}>
            {(p.content as string) || "Texte..."}
          </p>
        </div>
      )
    case "image":
      return (
        <div style={{ ...boxStyle, textAlign: (p.align as "left") || "left" }}>
          {p.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.src as string} alt={(p.alt as string) || ""} style={{ width: (p.width as string) || "120px", display: "inline-block" }} />
          ) : (
            <div className="flex h-12 items-center justify-center rounded border-2 border-dashed border-border/50 text-xs text-muted-foreground gap-1.5">
              <ImageIcon className="size-3.5" /> URL image requise
            </div>
          )}
        </div>
      )
    case "divider":
      return (
        <hr style={{
          borderColor: (p.color as string) || "#e5e7eb",
          borderTopWidth: (p.thickness as string) || "1px",
          marginTop: px(p.marginTop, "12px"),
          marginBottom: px(p.marginBottom, "12px"),
          borderStyle: "solid",
        }} />
      )
    case "spacer":
      return <div style={{ height: `${(p.height as number) || 24}px` }} />
    case "info-grid": {
      const fields = (p.fields as { label: string; value: string }[]) || []
      const cols = (p.columns as number) || 2
      return (
        <div style={boxStyle}>
          {Boolean(p.title) && (
            <p style={{ fontWeight: "700", color: primaryColor, marginBottom: "8px", fontSize: "12px", textTransform: "uppercase", letterSpacing: ".05em" }}>
              {p.title as string}
            </p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, border: "1px solid #e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
            {fields.map((f, i) => (
              <div key={i} style={{ padding: "6px 10px", borderBottom: "1px solid #e5e7eb", borderRight: i % cols !== cols - 1 ? "1px solid #e5e7eb" : "none" }}>
                <p style={{ fontSize: (p.labelFontSize as string) || "10px", color: (p.labelColor as string) || "#6b7280", margin: 0 }}>{f.label}</p>
                <p style={{ fontSize: (p.valueFontSize as string) || "12px", fontWeight: "600", color: (p.valueColor as string) || "inherit", margin: 0 }}>{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "table":
      return (
        <div style={{ marginTop: px(p.marginTop), marginBottom: px(p.marginBottom) }}>
          <div style={{ border: `1px solid ${(p.borderColor as string) || "#e5e7eb"}`, borderRadius: "4px", overflow: "hidden", fontSize: (p.fontSize as string) || "13px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", background: (p.headerBg as string) || primaryColor, color: (p.headerColor as string) || "#fff", fontWeight: "600", fontSize: "11px" }}>
              {["Date", "Type", "Methode", "Montant", "Reference"].map((h) => (
                <div key={h} style={{ padding: "6px 8px" }}>{h}</div>
              ))}
            </div>
            <div style={{ padding: "8px", color: "#9ca3af", fontStyle: "italic", textAlign: "center" }}>Paiements de la reservation</div>
          </div>
        </div>
      )
    case "total-box":
      return (
        <div style={{
          background: (p.bgColor as string) || primaryColor,
          color: (p.textColor as string) || "#fff",
          textAlign: (p.align as "right") || "right",
          borderRadius: px(p.borderRadius, "8px"),
          paddingTop: px(p.paddingTop, "16px"),
          paddingBottom: px(p.paddingBottom, "16px"),
          paddingLeft: px(p.paddingLeft, "20px"),
          paddingRight: px(p.paddingRight, "20px"),
          marginTop: px(p.marginTop),
          marginBottom: px(p.marginBottom),
        }}>
          <p style={{ fontSize: (p.labelFontSize as string) || "11px", opacity: .8, margin: 0 }}>{(p.label as string) || "Total"}</p>
          <p style={{ fontSize: (p.fontSize as string) || "22px", fontWeight: "700", margin: 0 }}>{(p.value as string) || "{{reservation.total_amount}}"} MAD</p>
          {Boolean(p.subtext) && <p style={{ fontSize: "10px", opacity: .7, margin: 0 }}>{p.subtext as string}</p>}
        </div>
      )
    case "signature":
      return (
        <div style={{ marginTop: px(p.marginTop, "32px") }}>
          <div style={{ borderTop: `1px solid ${(p.lineColor as string) || "#6b7280"}`, paddingTop: "8px" }}>
            <p style={{ fontWeight: "600", fontSize: (p.labelFontSize as string) || "12px", margin: 0 }}>{(p.label as string) || "Signature"}</p>
            <p style={{ color: "#9ca3af", fontSize: (p.nameFontSize as string) || "12px", margin: 0 }}>{(p.name as string) || ""}</p>
          </div>
        </div>
      )
    default:
      return null
  }
}

// ─── Sortable widget ──────────────────────────────────────────────────────────

function SortableWidget({
  widget, sectionId, isSelected, primaryColor, colIndex, onSelect, onDelete,
}: {
  widget: CanvasWidget; sectionId: string; isSelected: boolean; primaryColor: string
  colIndex: number; onSelect: () => void; onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    data: { type: "widget", sectionId, colIndex },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      className={cn(
        "group relative rounded-lg border-2 transition-colors cursor-pointer",
        isSelected ? "border-primary/70 bg-primary/5" : "border-transparent hover:border-border/60"
      )}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab opacity-0 group-hover:opacity-100 z-10 text-muted-foreground p-0.5 rounded hover:bg-muted"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-3.5" />
      </div>
      <button
        className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 z-10 rounded p-0.5 text-rose-500 hover:bg-rose-50"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
      >
        <Trash2 className="size-3" />
      </button>
      <div className="px-6 py-1">
        <WidgetPreview widget={widget} primaryColor={primaryColor} />
      </div>
    </div>
  )
}

// ─── Section block ────────────────────────────────────────────────────────────

function CanvasSectionBlock({
  section, selectedWidgetId, selectedSectionId, primaryColor,
  onSelectWidget, onSelectSection, onDeleteWidget, onAddWidget,
  onDeleteSection, onMoveSection, canMoveUp, canMoveDown,
}: {
  section: CanvasSection; selectedWidgetId: string | null; selectedSectionId: string | null
  primaryColor: string
  onSelectWidget: (sectionId: string, widgetId: string, colIdx: number) => void
  onSelectSection: (id: string) => void
  onDeleteWidget: (sectionId: string, widgetId: string, colIdx: number) => void
  onAddWidget: (sectionId: string, type: WidgetType, colIdx: number) => void
  onDeleteSection: (id: string) => void
  onMoveSection: (id: string, dir: "up" | "down") => void
  canMoveUp: boolean; canMoveDown: boolean
}) {
  const cols = section.columns ?? 1
  const isSelectedSection = selectedSectionId === section.id

  // columns is now an array of widgets-arrays — we stored them flat in widgets[] for col=1
  // For multi-col we use widgetColumns: CanvasWidget[][] stored in section
  const widgetColumns: CanvasWidget[][] = (section as CanvasSection & { widgetColumns?: CanvasWidget[][] }).widgetColumns
    ?? (cols === 1 ? [section.widgets] : Array.from({ length: cols }, (_, ci) => section.widgets.filter((w) => (w as CanvasWidget & { colIndex?: number }).colIndex === ci)))

  const sectionStyle: React.CSSProperties = {
    backgroundColor: section.background || "transparent",
    padding: section.padding || "0",
    borderWidth: (section as unknown as Record<string, unknown>).borderWidth as string || "0px",
    borderColor: (section as unknown as Record<string, unknown>).borderColor as string || "transparent",
    borderRadius: (section as unknown as Record<string, unknown>).borderRadius as string || "0px",
    borderStyle: "solid",
  }

  return (
    <div
      className={cn(
        "group/section relative rounded-xl border-2 p-3 transition-colors",
        isSelectedSection ? "border-violet-400/70 bg-violet-50/30" : "border-border/50 hover:border-border"
      )}
      style={sectionStyle}
      onClick={(e) => { e.stopPropagation(); onSelectSection(section.id) }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {cols === 1 && <Square className="size-3 text-muted-foreground/50" />}
          {cols === 2 && <Columns2 className="size-3 text-muted-foreground/50" />}
          {cols === 3 && <Columns3 className="size-3 text-muted-foreground/50" />}
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
            Section · {cols} col{cols > 1 ? "." : ""}
          </span>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover/section:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="size-5" disabled={!canMoveUp} onClick={(e) => { e.stopPropagation(); onMoveSection(section.id, "up") }}>
            <ChevronUp className="size-3" />
          </Button>
          <Button variant="ghost" size="icon" className="size-5" disabled={!canMoveDown} onClick={(e) => { e.stopPropagation(); onMoveSection(section.id, "down") }}>
            <ChevronDown className="size-3" />
          </Button>
          <Button variant="ghost" size="icon" className="size-5 text-rose-500 hover:bg-rose-50" onClick={(e) => { e.stopPropagation(); onDeleteSection(section.id) }}>
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>

      {/* Columns */}
      <div className="flex gap-2" style={{ gap: `${section.gap ?? 16}px` }}>
        {Array.from({ length: cols }).map((_, ci) => {
          const colWidgets = widgetColumns[ci] ?? []
          const colItemIds = colWidgets.map((w) => `${w.id}-col${ci}`)
          return (
            <div
              key={ci}
              className="flex-1 min-w-0 space-y-1"
              onClick={(e) => e.stopPropagation()}
            >
              <SortableContext items={colWidgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
                {colWidgets.length === 0 ? (
                  <div
                    className="flex h-12 items-center justify-center rounded border-2 border-dashed border-border/40 text-[10px] text-muted-foreground cursor-pointer hover:border-primary/40"
                    onClick={() => onAddWidget(section.id, "text", ci)}
                  >
                    + Widget
                  </div>
                ) : (
                  colWidgets.map((widget) => (
                    <SortableWidget
                      key={widget.id}
                      widget={widget}
                      sectionId={section.id}
                      isSelected={selectedWidgetId === widget.id}
                      primaryColor={primaryColor}
                      colIndex={ci}
                      onSelect={() => onSelectWidget(section.id, widget.id, ci)}
                      onDelete={() => onDeleteWidget(section.id, widget.id, ci)}
                    />
                  ))
                )}
              </SortableContext>

              {/* Quick-add for this column */}
              <div className="flex flex-wrap gap-1 pt-0.5">
                {WIDGET_PALETTE.slice(0, 4).map((w) => (
                  <button
                    key={w.type}
                    className="flex items-center gap-0.5 rounded border border-border/40 px-1.5 py-0.5 text-[9px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    onClick={(e) => { e.stopPropagation(); onAddWidget(section.id, w.type, ci) }}
                  >
                    <w.icon className="size-2.5" />{w.label}
                  </button>
                ))}
                <button
                  className="flex items-center gap-0.5 rounded border border-border/40 px-1.5 py-0.5 text-[9px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  onClick={(e) => { e.stopPropagation(); onAddWidget(section.id, "info-grid", ci) }}
                >
                  <Info className="size-2.5" />Grille
                </button>
                <button
                  className="flex items-center gap-0.5 rounded border border-border/40 px-1.5 py-0.5 text-[9px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  onClick={(e) => { e.stopPropagation(); onAddWidget(section.id, "signature", ci) }}
                >
                  <Signature className="size-2.5" />Sig.
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Widget props panel ───────────────────────────────────────────────────────

function WidgetPropsPanel({ widget, settings, onChange }: {
  widget: CanvasWidget; settings: TemplateSettings; onChange: (props: Record<string, unknown>) => void
}) {
  const p = widget.props as Record<string, unknown>
  const set = (patch: Record<string, unknown>) => onChange({ ...p, ...patch })
  const [varSearch, setVarSearch] = useState("")

  const filteredGroups = VARIABLE_GROUPS.map((g) => ({
    ...g,
    vars: g.vars.filter((v) => !varSearch || v.label.toLowerCase().includes(varSearch.toLowerCase()) || v.key.toLowerCase().includes(varSearch.toLowerCase())),
  })).filter((g) => g.vars.length > 0)

  return (
    <div className="space-y-5">
      {/* ── Heading ── */}
      {widget.type === "heading" && (
        <PropSection title="Contenu">
          <div className="space-y-1">
            <PropLabel>Texte</PropLabel>
            <Input value={(p.text as string) || ""} onChange={(e) => set({ text: e.target.value })} className="h-8" />
          </div>
          <div className="space-y-1">
            <PropLabel>Niveau</PropLabel>
            <Select value={(p.level as string) || "h2"} onValueChange={(v) => set({ level: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="h1">H1 — Grand titre</SelectItem>
                <SelectItem value="h2">H2 — Sous-titre</SelectItem>
                <SelectItem value="h3">H3 — Petit titre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <PropLabel>Alignement</PropLabel>
            <AlignBtns value={(p.align as string) || "left"} onChange={(v) => set({ align: v })} />
          </div>
        </PropSection>
      )}

      {/* ── Text ── */}
      {widget.type === "text" && (
        <PropSection title="Contenu">
          <div className="space-y-1">
            <PropLabel>Texte</PropLabel>
            <Textarea rows={4} value={(p.content as string) || ""} onChange={(e) => set({ content: e.target.value })} className="text-xs resize-none" placeholder="{{variable}} pour données dynamiques" />
          </div>
          <div className="space-y-1">
            <PropLabel>Alignement</PropLabel>
            <AlignBtns value={(p.align as string) || "left"} onChange={(v) => set({ align: v })} />
          </div>
        </PropSection>
      )}

      {/* ── Image ── */}
      {widget.type === "image" && (
        <PropSection title="Image">
          <div className="space-y-1">
            <PropLabel>URL</PropLabel>
            <Input value={(p.src as string) || ""} onChange={(e) => set({ src: e.target.value })} className="h-8 text-xs" placeholder="https://..." />
          </div>
          <div className="space-y-1">
            <PropLabel>Largeur</PropLabel>
            <Input value={(p.width as string) || "120px"} onChange={(e) => set({ width: e.target.value })} className="h-8" placeholder="120px" />
          </div>
          <div className="space-y-1">
            <PropLabel>Alignement</PropLabel>
            <AlignBtns value={(p.align as string) || "left"} onChange={(v) => set({ align: v })} />
          </div>
        </PropSection>
      )}

      {/* ── Divider ── */}
      {widget.type === "divider" && (
        <PropSection title="Separateur">
          <ColorRow label="Couleur" value={(p.color as string) || "#e5e7eb"} onChange={(v) => set({ color: v })} />
          <div className="space-y-1">
            <PropLabel>Epaisseur</PropLabel>
            <Input value={(p.thickness as string) || "1px"} onChange={(e) => set({ thickness: e.target.value })} className="h-8" placeholder="1px" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <PropLabel>Marge haut</PropLabel>
              <Input value={(p.marginTop as string) || "12px"} onChange={(e) => set({ marginTop: e.target.value })} className="h-8" />
            </div>
            <div className="space-y-1">
              <PropLabel>Marge bas</PropLabel>
              <Input value={(p.marginBottom as string) || "12px"} onChange={(e) => set({ marginBottom: e.target.value })} className="h-8" />
            </div>
          </div>
        </PropSection>
      )}

      {/* ── Spacer ── */}
      {widget.type === "spacer" && (
        <PropSection title="Espace">
          <div className="space-y-1">
            <PropLabel>Hauteur (px)</PropLabel>
            <Input type="number" value={(p.height as number) || 24} onChange={(e) => set({ height: Number(e.target.value) })} className="h-8" />
          </div>
        </PropSection>
      )}

      {/* ── Info grid ── */}
      {widget.type === "info-grid" && (
        <PropSection title="Grille info">
          <div className="space-y-1">
            <PropLabel>Titre section</PropLabel>
            <Input value={(p.title as string) || ""} onChange={(e) => set({ title: e.target.value })} className="h-8" />
          </div>
          <div className="space-y-1">
            <PropLabel>Colonnes</PropLabel>
            <Select value={String((p.columns as number) || 2)} onValueChange={(v) => set({ columns: Number(v) })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 colonne</SelectItem>
                <SelectItem value="2">2 colonnes</SelectItem>
                <SelectItem value="3">3 colonnes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <PropLabel>Taille label</PropLabel>
              <Input value={(p.labelFontSize as string) || "11px"} onChange={(e) => set({ labelFontSize: e.target.value })} className="h-8" />
            </div>
            <div className="space-y-1">
              <PropLabel>Taille valeur</PropLabel>
              <Input value={(p.valueFontSize as string) || "13px"} onChange={(e) => set({ valueFontSize: e.target.value })} className="h-8" />
            </div>
          </div>
          <ColorRow label="Couleur label" value={(p.labelColor as string) || "#6b7280"} onChange={(v) => set({ labelColor: v })} />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <PropLabel>Champs</PropLabel>
              <button className="text-[10px] text-primary hover:underline" onClick={() => set({ fields: [...((p.fields as { label: string; value: string }[]) || []), { label: "Champ", value: "" }] })}>
                + Ajouter
              </button>
            </div>
            {((p.fields as { label: string; value: string }[]) || []).map((f, i) => (
              <div key={i} className="flex gap-1 items-center">
                <Input value={f.label} onChange={(e) => { const fs = [...((p.fields as { label: string; value: string }[]) || [])]; fs[i] = { ...fs[i], label: e.target.value }; set({ fields: fs }) }} className="h-7 text-xs" placeholder="Label" />
                <Input value={f.value} onChange={(e) => { const fs = [...((p.fields as { label: string; value: string }[]) || [])]; fs[i] = { ...fs[i], value: e.target.value }; set({ fields: fs }) }} className="h-7 text-xs" placeholder="{{var}}" />
                <button className="text-rose-500 p-0.5" onClick={() => set({ fields: ((p.fields as { label: string; value: string }[]) || []).filter((_, j) => j !== i) })}>
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </PropSection>
      )}

      {/* ── Table ── */}
      {widget.type === "table" && (
        <PropSection title="Tableau">
          <ColorRow label="Fond en-tete" value={(p.headerBg as string) || settings.primaryColor} onChange={(v) => set({ headerBg: v })} />
          <ColorRow label="Couleur en-tete" value={(p.headerColor as string) || "#ffffff"} onChange={(v) => set({ headerColor: v })} />
          <ColorRow label="Bordures" value={(p.borderColor as string) || "#e5e7eb"} onChange={(v) => set({ borderColor: v })} />
          <div className="space-y-1">
            <PropLabel>Taille police</PropLabel>
            <Input value={(p.fontSize as string) || "13px"} onChange={(e) => set({ fontSize: e.target.value })} className="h-8" />
          </div>
        </PropSection>
      )}

      {/* ── Total box ── */}
      {widget.type === "total-box" && (
        <PropSection title="Total">
          <div className="space-y-1">
            <PropLabel>Label</PropLabel>
            <Input value={(p.label as string) || ""} onChange={(e) => set({ label: e.target.value })} className="h-8" />
          </div>
          <div className="space-y-1">
            <PropLabel>Valeur</PropLabel>
            <Input value={(p.value as string) || ""} onChange={(e) => set({ value: e.target.value })} className="h-8" placeholder="{{reservation.total_amount}}" />
          </div>
          <div className="space-y-1">
            <PropLabel>Sous-texte</PropLabel>
            <Input value={(p.subtext as string) || ""} onChange={(e) => set({ subtext: e.target.value })} className="h-8" />
          </div>
          <div className="space-y-1">
            <PropLabel>Alignement</PropLabel>
            <AlignBtns value={(p.align as string) || "right"} onChange={(v) => set({ align: v })} />
          </div>
          <ColorRow label="Fond" value={(p.bgColor as string) || settings.primaryColor} onChange={(v) => set({ bgColor: v })} />
          <ColorRow label="Texte" value={(p.textColor as string) || "#ffffff"} onChange={(v) => set({ textColor: v })} />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><PropLabel>Taille valeur</PropLabel><Input value={(p.fontSize as string) || "22px"} onChange={(e) => set({ fontSize: e.target.value })} className="h-8" /></div>
            <div className="space-y-1"><PropLabel>Taille label</PropLabel><Input value={(p.labelFontSize as string) || "11px"} onChange={(e) => set({ labelFontSize: e.target.value })} className="h-8" /></div>
          </div>
        </PropSection>
      )}

      {/* ── Signature ── */}
      {widget.type === "signature" && (
        <PropSection title="Signature">
          <div className="space-y-1">
            <PropLabel>Label</PropLabel>
            <Input value={(p.label as string) || ""} onChange={(e) => set({ label: e.target.value })} className="h-8" />
          </div>
          <div className="space-y-1">
            <PropLabel>Nom</PropLabel>
            <Input value={(p.name as string) || ""} onChange={(e) => set({ name: e.target.value })} className="h-8" placeholder="{{client.full_name}}" />
          </div>
          <ColorRow label="Couleur ligne" value={(p.lineColor as string) || "#6b7280"} onChange={(v) => set({ lineColor: v })} />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><PropLabel>Taille label</PropLabel><Input value={(p.labelFontSize as string) || "12px"} onChange={(e) => set({ labelFontSize: e.target.value })} className="h-8" /></div>
            <div className="space-y-1"><PropLabel>Taille nom</PropLabel><Input value={(p.nameFontSize as string) || "12px"} onChange={(e) => set({ nameFontSize: e.target.value })} className="h-8" /></div>
          </div>
        </PropSection>
      )}

      {/* ── Typography (for heading, text, total-box) ── */}
      {["heading", "text"].includes(widget.type) && (
        <PropSection title="Typographie">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <PropLabel>Taille police</PropLabel>
              <Input value={(p.fontSize as string) || "13px"} onChange={(e) => set({ fontSize: e.target.value })} className="h-8" placeholder="13px" />
            </div>
            <div className="space-y-1">
              <PropLabel>Graisse</PropLabel>
              <Select value={(p.fontWeight as string) || "400"} onValueChange={(v) => set({ fontWeight: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light 300</SelectItem>
                  <SelectItem value="400">Normal 400</SelectItem>
                  <SelectItem value="500">Medium 500</SelectItem>
                  <SelectItem value="600">SemiBold 600</SelectItem>
                  <SelectItem value="700">Bold 700</SelectItem>
                  <SelectItem value="800">ExtraBold 800</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <PropLabel>Style</PropLabel>
              <Select value={(p.fontStyle as string) || "normal"} onValueChange={(v) => set({ fontStyle: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="italic">Italique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <PropLabel>Interligne</PropLabel>
              <Input value={(p.lineHeight as string) || "1.6"} onChange={(e) => set({ lineHeight: e.target.value })} className="h-8" placeholder="1.6" />
            </div>
            <div className="space-y-1 col-span-2">
              <PropLabel>Espacement lettres</PropLabel>
              <Input value={(p.letterSpacing as string) || "0px"} onChange={(e) => set({ letterSpacing: e.target.value })} className="h-8" placeholder="0px" />
            </div>
          </div>
          <ColorRow label="Couleur" value={(p.color as string) || ""} onChange={(v) => set({ color: v })} placeholder="Couleur par defaut" />
        </PropSection>
      )}

      {/* ── Spacing (margin + padding) for most widgets ── */}
      {!["divider", "spacer"].includes(widget.type) && (
        <PropSection title="Espacement">
          <SpacingGrid
            label="Marges (margin)"
            topKey="marginTop" rightKey="marginRight" bottomKey="marginBottom" leftKey="marginLeft"
            values={p} onChange={set}
          />
          <SpacingGrid
            label="Rembourrage (padding)"
            topKey="paddingTop" rightKey="paddingRight" bottomKey="paddingBottom" leftKey="paddingLeft"
            values={p} onChange={set}
          />
        </PropSection>
      )}

      {/* ── Background & Border for most widgets ── */}
      {!["divider", "spacer", "signature", "total-box"].includes(widget.type) && (
        <PropSection title="Fond & Bordure">
          <ColorRow label="Couleur de fond" value={(p.bgColor as string) || ""} onChange={(v) => set({ bgColor: v })} placeholder="transparent" />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <PropLabel>Epaisseur bordure</PropLabel>
              <Input value={(p.borderWidth as string) || "0px"} onChange={(e) => set({ borderWidth: e.target.value })} className="h-8" placeholder="0px" />
            </div>
            <div className="space-y-1">
              <PropLabel>Rayon</PropLabel>
              <Input value={(p.borderRadius as string) || "0px"} onChange={(e) => set({ borderRadius: e.target.value })} className="h-8" placeholder="0px" />
            </div>
          </div>
          <ColorRow label="Couleur bordure" value={(p.borderColor as string) || ""} onChange={(v) => set({ borderColor: v })} />
          <div className="space-y-1">
            <PropLabel>Style bordure</PropLabel>
            <Select value={(p.borderStyle as string) || "solid"} onValueChange={(v) => set({ borderStyle: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solide</SelectItem>
                <SelectItem value="dashed">Tirets</SelectItem>
                <SelectItem value="dotted">Points</SelectItem>
                <SelectItem value="double">Double</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PropSection>
      )}

      {/* ── Variables ── */}
      <PropSection title="Variables">
        <Input value={varSearch} onChange={(e) => setVarSearch(e.target.value)} placeholder="Rechercher..." className="h-7 text-xs" />
        <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
          {filteredGroups.map((g) => (
            <div key={g.label}>
              <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{g.label}</p>
              <div className="flex flex-wrap gap-1">
                {g.vars.map((v) => (
                  <button
                    key={v.key}
                    className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono hover:bg-primary/10 hover:text-primary transition-colors"
                    title={v.label}
                    onClick={() => { navigator.clipboard.writeText(`{{${v.key}}}`); toast.success(`{{${v.key}}} copie !`) }}
                  >
                    {`{{${v.key}}}`}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PropSection>
    </div>
  )
}

// ─── Section props panel ──────────────────────────────────────────────────────

function SectionPropsPanel({ section, onChange }: {
  section: CanvasSection
  onChange: (patch: Partial<CanvasSection & Record<string, unknown>>) => void
}) {
  const s = section as CanvasSection & Record<string, unknown>

  return (
    <div className="space-y-5">
      <PropSection title="Mise en page">
        <div className="space-y-1">
          <PropLabel>Nombre de colonnes</PropLabel>
          <div className="flex gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                className={cn("flex-1 rounded border py-2 flex flex-col items-center gap-1 transition-colors text-xs",
                  section.columns === n ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted")}
                onClick={() => onChange({ columns: n })}
              >
                {n === 1 && <Square className="size-4" />}
                {n === 2 && <Columns2 className="size-4" />}
                {n === 3 && <Columns3 className="size-4" />}
                {n} col.
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <PropLabel>Espace entre colonnes (px)</PropLabel>
          <Input type="number" value={section.gap ?? 16} onChange={(e) => onChange({ gap: Number(e.target.value) })} className="h-8" />
        </div>
      </PropSection>

      <PropSection title="Fond & Bordure">
        <ColorRow label="Couleur de fond" value={(s.background as string) || ""} onChange={(v) => onChange({ background: v })} placeholder="transparent" />
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <PropLabel>Epaisseur bordure</PropLabel>
            <Input value={(s.borderWidth as string) || "0px"} onChange={(e) => onChange({ borderWidth: e.target.value })} className="h-8" placeholder="0px" />
          </div>
          <div className="space-y-1">
            <PropLabel>Rayon</PropLabel>
            <Input value={(s.borderRadius as string) || "0px"} onChange={(e) => onChange({ borderRadius: e.target.value })} className="h-8" placeholder="0px" />
          </div>
        </div>
        <ColorRow label="Couleur bordure" value={(s.borderColor as string) || ""} onChange={(v) => onChange({ borderColor: v })} />
      </PropSection>

      <PropSection title="Espacement interne">
        <div className="space-y-1">
          <PropLabel>Padding (ex: 16px 24px)</PropLabel>
          <Input value={(s.padding as string) || "0"} onChange={(e) => onChange({ padding: e.target.value })} className="h-8" placeholder="0" />
          <p className="text-[10px] text-muted-foreground">Format CSS: haut droite bas gauche</p>
        </div>
      </PropSection>
    </div>
  )
}

// ─── Page settings panel ──────────────────────────────────────────────────────

function SettingsPanel({ settings, name, onChange, onNameChange }: {
  settings: TemplateSettings; name: string
  onChange: (s: TemplateSettings) => void; onNameChange: (n: string) => void
}) {
  const set = (patch: Partial<TemplateSettings>) => onChange({ ...settings, ...patch })

  const FONTS = [
    "Arial, sans-serif",
    "Georgia, serif",
    "Times New Roman, serif",
    "Courier New, monospace",
    "Trebuchet MS, sans-serif",
    "Verdana, sans-serif",
    "Helvetica, sans-serif",
  ]

  return (
    <div className="space-y-5">
      <PropSection title="Document">
        <div className="space-y-1">
          <PropLabel>Nom</PropLabel>
          <Input value={name} onChange={(e) => onNameChange(e.target.value)} className="h-8" />
        </div>
        <div className="space-y-1">
          <PropLabel>Format page</PropLabel>
          <Select value={settings.pageSize} onValueChange={(v: "A4" | "Letter") => set({ pageSize: v })}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4 (210×297 mm)</SelectItem>
              <SelectItem value="Letter">Letter (216×279 mm)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PropSection>

      <PropSection title="Typographie globale">
        <div className="space-y-1">
          <PropLabel>Police principale</PropLabel>
          <Select value={settings.fontFamily} onValueChange={(v) => set({ fontFamily: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => <SelectItem key={f} value={f} className="text-xs">{f.split(",")[0]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <ColorRow label="Couleur texte" value={settings.textColor} onChange={(v) => set({ textColor: v })} />
      </PropSection>

      <PropSection title="Couleurs">
        <ColorRow label="Couleur principale" value={settings.primaryColor} onChange={(v) => set({ primaryColor: v })} />
        <ColorRow label="Fond du document" value={settings.bgColor || "#ffffff"} onChange={(v) => set({ bgColor: v })} />
      </PropSection>
    </div>
  )
}

// ─── Generate dialog ──────────────────────────────────────────────────────────

function GenerateDialog({ open, isSaving, onOpenChange, onGenerate }: {
  open: boolean; isSaving: boolean
  onOpenChange: (v: boolean) => void; onGenerate: (rid: number) => Promise<void>
}) {
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState("")
  const { data: reservations = [] } = useGetReservationsQuery({ search: search.trim() || undefined })

  useEffect(() => { if (!open) { setSearch(""); setSelectedId("") } }, [open])

  const selected = reservations.find((r) => String(r.id) === selectedId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ZoomIn className="size-4 text-primary" />Generer un document</DialogTitle>
          <DialogDescription>Choisissez la reservation source.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input placeholder="Rechercher par client ou vehicule..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger><SelectValue placeholder="Selectionner une reservation..." /></SelectTrigger>
            <SelectContent>
              {reservations.map((r) => (
                <SelectItem key={String(r.id)} value={String(r.id)}>
                  {r.client?.full_name ?? "—"} — {r.vehicle?.brand} {r.vehicle?.model} ({r.start_date} → {r.end_date})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected && (
            <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs space-y-1">
              <p><span className="text-muted-foreground">Client :</span> {selected.client?.full_name}</p>
              <p><span className="text-muted-foreground">Vehicule :</span> {selected.vehicle?.brand} {selected.vehicle?.model} ({selected.vehicle?.registration_number})</p>
              <p><span className="text-muted-foreground">Periode :</span> {formatDate(selected.start_date)} → {formatDate(selected.end_date)}</p>
              <p><span className="text-muted-foreground">Total :</span> {formatAmount(selected.total_amount)}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Annuler</Button>
          <Button onClick={() => selected && onGenerate(Number(selected.id))} disabled={isSaving || !selectedId}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
            Generer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Default settings ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: TemplateSettings = {
  pageSize: "A4",
  fontFamily: "Arial, sans-serif",
  primaryColor: "#2563eb",
  textColor: "#111827",
  bgColor: "#ffffff",
}

// ─── Selection state ──────────────────────────────────────────────────────────

type Selection =
  | { kind: "widget"; sectionId: string; widgetId: string; colIndex: number }
  | { kind: "section"; sectionId: string }
  | null

// ─── Editor page ──────────────────────────────────────────────────────────────

export function DocumentEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get("id")

  const { data: template, isLoading } = useGetTemplateQuery(templateId!, { skip: !templateId })
  const [updateTemplate, { isLoading: isSaving }] = useUpdateTemplateMutation()
  const [generateDocument, { isLoading: isGenerating }] = useGenerateDocumentMutation()

  const [canvas, setCanvas] = useState<CanvasState>({ sections: [] })
  const [settings, setSettings] = useState<TemplateSettings>(DEFAULT_SETTINGS)
  const [name, setName] = useState("")
  const [selection, setSelection] = useState<Selection>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<"element" | "section" | "page">("page")
  const [generateOpen, setGenerateOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!template) return
    setCanvas(template.canvas ?? { sections: [] })
    setSettings(template.settings ?? DEFAULT_SETTINGS)
    setName(template.name)
  }, [template])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const dirty = () => setIsDirty(true)

  // ── Section mutations ───────────────────────────────────────────────────────

  const addSection = (cols = 1) => {
    const section: CanvasSection = { id: uid(), columns: cols, gap: 16, background: "transparent", padding: "0", widgets: [] }
    setCanvas((c) => ({ sections: [...c.sections, section] }))
    setSelection({ kind: "section", sectionId: section.id })
    setRightTab("section")
    dirty()
  }

  const deleteSection = (id: string) => {
    setCanvas((c) => ({ sections: c.sections.filter((s) => s.id !== id) }))
    setSelection(null)
    dirty()
  }

  const moveSection = (id: string, dir: "up" | "down") => {
    setCanvas((c) => {
      const idx = c.sections.findIndex((s) => s.id === id)
      if (idx < 0) return c
      const next = [...c.sections]
      const swap = dir === "up" ? idx - 1 : idx + 1
      if (swap < 0 || swap >= next.length) return c
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return { sections: next }
    })
    dirty()
  }

  const updateSection = (id: string, patch: Partial<CanvasSection & Record<string, unknown>>) => {
    setCanvas((c) => ({
      sections: c.sections.map((s) => s.id === id ? { ...s, ...patch } : s),
    }))
    dirty()
  }

  // ── Widget mutations ────────────────────────────────────────────────────────

  const addWidget = (sectionId: string, type: WidgetType, colIndex = 0) => {
    const palette = WIDGET_PALETTE.find((w) => w.type === type)
    if (!palette) return
    const widget = { id: uid(), type, colIndex, props: { ...palette.defaultProps } } as CanvasWidget & { colIndex: number }
    setCanvas((c) => ({
      sections: c.sections.map((s) =>
        s.id === sectionId ? { ...s, widgets: [...s.widgets, widget] } : s
      ),
    }))
    setSelection({ kind: "widget", sectionId, widgetId: widget.id, colIndex })
    setRightTab("element")
    dirty()
  }

  const deleteWidget = (sectionId: string, widgetId: string, _colIndex: number) => {
    setCanvas((c) => ({
      sections: c.sections.map((s) =>
        s.id === sectionId ? { ...s, widgets: s.widgets.filter((w) => w.id !== widgetId) } : s
      ),
    }))
    if (selection?.kind === "widget" && selection.widgetId === widgetId) setSelection(null)
    dirty()
  }

  const updateWidgetProps = useCallback((widgetId: string, props: Record<string, unknown>) => {
    setCanvas((c) => ({
      sections: c.sections.map((s) => ({
        ...s,
        widgets: s.widgets.map((w) => w.id === widgetId ? { ...w, props } : w),
      })),
    }))
    setIsDirty(true)
  }, [])

  // ── Drag & Drop ─────────────────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string)

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    setCanvas((c) => ({
      sections: c.sections.map((s) => {
        const oldIdx = s.widgets.findIndex((w) => w.id === active.id)
        const newIdx = s.widgets.findIndex((w) => w.id === over.id)
        if (oldIdx >= 0 && newIdx >= 0) return { ...s, widgets: arrayMove(s.widgets, oldIdx, newIdx) }
        return s
      }),
    }))
    dirty()
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  const save = useCallback(async (showToast = true) => {
    if (!templateId) return
    try {
      await updateTemplate({ id: templateId, name, canvas, settings }).unwrap()
      setIsDirty(false)
      if (showToast) toast.success("Template sauvegarde.")
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }, [templateId, name, canvas, settings, updateTemplate])

  useEffect(() => {
    if (!isDirty) return
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => save(false), 3000)
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  }, [isDirty, save])

  // ── Generate ────────────────────────────────────────────────────────────────

  const handleGenerate = async (reservationId: number) => {
    if (!templateId) return
    await save(false)
    try {
      const result = await generateDocument({ templateId, reservation_id: reservationId }).unwrap()
      toast.success("Document genere.")
      setGenerateOpen(false)
      setPreviewHtml(result.html)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  const selectedWidget = selection?.kind === "widget"
    ? canvas.sections.flatMap((s) => s.widgets).find((w) => w.id === selection.widgetId) ?? null
    : null

  const selectedSection = selection?.kind === "section" || selection?.kind === "widget"
    ? canvas.sections.find((s) => s.id === (selection as { sectionId: string }).sectionId) ?? null
    : null

  const activeWidget = canvas.sections.flatMap((s) => s.widgets).find((w) => w.id === activeId) ?? null

  if (!templateId) return <div className="flex h-screen items-center justify-center"><p className="text-muted-foreground">Aucun template selectionne.</p></div>
  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>

  return (
    <>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        {/* Toolbar */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/70 bg-card px-4 py-2 gap-3">
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="sm" onClick={() => router.push("/documents")} className="gap-1.5 h-8">
              <ArrowLeft className="size-4" />Retour
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <FileText className="size-4 text-primary" />
            <span className="font-semibold text-sm max-w-48 truncate">{name}</span>
            {isDirty && <span className="text-[10px] text-amber-500 font-medium">• Modifie</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setGenerateOpen(true)} className="gap-1.5 h-8">
              <Eye className="size-3.5" />Generer
            </Button>
            <Button size="sm" onClick={() => save()} disabled={isSaving} className="gap-1.5 h-8">
              {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Sauvegarder
            </Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left: widget palette */}
          <div className="w-48 shrink-0 border-r border-border/70 bg-card overflow-y-auto">
            <div className="p-2.5 space-y-0.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 pb-2 pt-1">Elements</p>
              {WIDGET_PALETTE.map((w) => (
                <button
                  key={w.type}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted transition-colors text-left"
                  onClick={() => {
                    const lastSection = canvas.sections[canvas.sections.length - 1]
                    if (lastSection) {
                      addWidget(lastSection.id, w.type, 0)
                    } else {
                      const section: CanvasSection = { id: uid(), columns: 1, gap: 16, background: "transparent", padding: "0", widgets: [] }
                      setCanvas((c) => ({ sections: [...c.sections, section] }))
                      setTimeout(() => addWidget(section.id, w.type, 0), 10)
                    }
                  }}
                >
                  <w.icon className="size-3.5 shrink-0 text-muted-foreground" />
                  {w.label}
                </button>
              ))}

              <Separator className="my-2 opacity-50" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 pb-1">Sections</p>
              {[
                { cols: 1, label: "1 colonne", Icon: Square },
                { cols: 2, label: "2 colonnes", Icon: Columns2 },
                { cols: 3, label: "3 colonnes", Icon: Columns3 },
              ].map(({ cols, label, Icon }) => (
                <button
                  key={cols}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted transition-colors text-left border border-dashed border-border/40 mt-0.5"
                  onClick={() => addSection(cols)}
                >
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div
            className="flex-1 overflow-y-auto bg-muted/40 p-6"
            onClick={() => setSelection(null)}
          >
            <div
              className="mx-auto shadow-xl rounded-lg min-h-210.5 p-8"
              style={{
                maxWidth: "794px",
                fontFamily: settings.fontFamily,
                color: settings.textColor,
                backgroundColor: settings.bgColor || "#ffffff",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                {canvas.sections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                    <div className="rounded-full bg-muted p-5"><LayoutTemplate className="size-8 text-muted-foreground" /></div>
                    <div>
                      <p className="font-semibold">Canvas vide</p>
                      <p className="text-sm text-muted-foreground mt-1">Ajoutez une section depuis le panneau gauche.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => addSection(1)}><Square className="size-3.5" />1 col.</Button>
                      <Button variant="outline" size="sm" onClick={() => addSection(2)}><Columns2 className="size-3.5" />2 col.</Button>
                      <Button variant="outline" size="sm" onClick={() => addSection(3)}><Columns3 className="size-3.5" />3 col.</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {canvas.sections.map((section, i) => (
                      <CanvasSectionBlock
                        key={section.id}
                        section={section}
                        selectedWidgetId={selection?.kind === "widget" ? selection.widgetId : null}
                        selectedSectionId={selection?.kind === "section" ? selection.sectionId : selection?.kind === "widget" ? selection.sectionId : null}
                        primaryColor={settings.primaryColor}
                        onSelectWidget={(sectionId, widgetId, colIndex) => { setSelection({ kind: "widget", sectionId, widgetId, colIndex }); setRightTab("element") }}
                        onSelectSection={(id) => { setSelection({ kind: "section", sectionId: id }); setRightTab("section") }}
                        onDeleteWidget={deleteWidget}
                        onAddWidget={addWidget}
                        onDeleteSection={deleteSection}
                        onMoveSection={moveSection}
                        canMoveUp={i > 0}
                        canMoveDown={i < canvas.sections.length - 1}
                      />
                    ))}
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/30 py-3 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                      onClick={() => addSection(1)}
                    >
                      <Plus className="size-3.5" />Ajouter une section
                    </button>
                  </div>
                )}
                <DragOverlay>
                  {activeWidget && (
                    <Card className="p-3 opacity-90 shadow-xl">
                      <WidgetPreview widget={activeWidget} primaryColor={settings.primaryColor} />
                    </Card>
                  )}
                </DragOverlay>
              </DndContext>
            </div>
          </div>

          {/* Right: properties */}
          <div className="w-72 shrink-0 border-l border-border/70 bg-card flex flex-col overflow-hidden">
            <div className="shrink-0 border-b border-border/70 p-1.5">
              <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as "element" | "section" | "page")}>
                <TabsList className="w-full h-8">
                  <TabsTrigger value="element" className="flex-1 text-[11px] gap-1 h-7" disabled={!selectedWidget}>
                    <Layers className="size-3" />Element
                  </TabsTrigger>
                  <TabsTrigger value="section" className="flex-1 text-[11px] gap-1 h-7" disabled={!selectedSection}>
                    <LayoutTemplate className="size-3" />Section
                  </TabsTrigger>
                  <TabsTrigger value="page" className="flex-1 text-[11px] gap-1 h-7">
                    <Settings2 className="size-3" />Page
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              {rightTab === "page" && (
                <SettingsPanel settings={settings} name={name} onChange={(s) => { setSettings(s); dirty() }} onNameChange={(n) => { setName(n); dirty() }} />
              )}
              {rightTab === "section" && selectedSection && (
                <SectionPropsPanel
                  section={selectedSection}
                  onChange={(patch) => updateSection(selectedSection.id, patch)}
                />
              )}
              {rightTab === "element" && selectedWidget && (
                <WidgetPropsPanel
                  key={selectedWidget.id}
                  widget={selectedWidget}
                  settings={settings}
                  onChange={(props) => updateWidgetProps(selectedWidget.id, props)}
                />
              )}
              {rightTab === "element" && !selectedWidget && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
                  <Layers className="size-8 opacity-20" />
                  <p className="text-xs">Cliquez sur un element du canvas.</p>
                </div>
              )}
              {rightTab === "section" && !selectedSection && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
                  <LayoutTemplate className="size-8 opacity-20" />
                  <p className="text-xs">Cliquez sur une section.</p>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-border/70 p-2.5 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{template?.type === "contract" ? "Contrat" : "Facture"}</span>
              <Badge variant="outline" className="text-[9px] rounded-full px-2">{canvas.sections.length} section(s)</Badge>
            </div>
          </div>
        </div>
      </div>

      <GenerateDialog open={generateOpen} isSaving={isGenerating} onOpenChange={setGenerateOpen} onGenerate={handleGenerate} />

      {previewHtml && (
        <Dialog open onOpenChange={(v) => { if (!v) setPreviewHtml(null) }}>
          <DialogContent className="flex max-h-[95dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
            <DialogHeader className="shrink-0 border-b border-border/70 px-6 py-4">
              <DialogTitle className="flex items-center gap-2"><Eye className="size-4 text-primary" />Apercu du document</DialogTitle>
              <DialogDescription>Retrouvez-le dans Documents &gt; Generes.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-hidden">
              <iframe srcDoc={previewHtml} className="w-full h-full border-0" style={{ minHeight: "600px" }} title="Apercu" />
            </div>
            <DialogFooter className="shrink-0 border-t border-border/70 px-6 py-3">
              <Button variant="outline" onClick={() => setPreviewHtml(null)}>Fermer</Button>
              <Button onClick={() => {
                const blob = new Blob([previewHtml], { type: "text/html" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a"); a.href = url; a.download = `document_${Date.now()}.html`; a.click()
                URL.revokeObjectURL(url)
              }}>
                <Download className="size-4" />Telecharger HTML
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
