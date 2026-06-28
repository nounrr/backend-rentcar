// ─── Widget types ─────────────────────────────────────────────────────────────

export type WidgetType =
  | "heading"
  | "text"
  | "image"
  | "divider"
  | "spacer"
  | "table"
  | "signature"
  | "info-grid"
  | "total-box"

export interface HeadingProps {
  text: string
  level: "h1" | "h2" | "h3"
  align: "left" | "center" | "right"
  color?: string
  fontSize?: string
}

export interface TextProps {
  content: string
  align: "left" | "center" | "right"
  fontSize?: string
  color?: string
}

export interface ImageProps {
  src: string
  alt?: string
  width?: string
  align: "left" | "center" | "right"
}

export interface DividerProps {}
export interface SpacerProps { height: number }

export interface TableProps {
  tableType: "payments" | "custom"
  headers?: string[]
  rows?: string[][]
}

export interface SignatureProps {
  label: string
  name?: string
}

export interface InfoGridField {
  label: string
  value: string
}

export interface InfoGridProps {
  title?: string
  columns: number
  fields: InfoGridField[]
}

export interface TotalBoxProps {
  label: string
  value: string
  subtext?: string
}

export type WidgetProps =
  | HeadingProps
  | TextProps
  | ImageProps
  | DividerProps
  | SpacerProps
  | TableProps
  | SignatureProps
  | InfoGridProps
  | TotalBoxProps

// ─── Canvas structure ─────────────────────────────────────────────────────────

export interface CanvasWidget {
  id: string
  type: WidgetType
  props: Record<string, unknown>
}

export interface CanvasSection {
  id: string
  columns: number
  gap: number
  background: string
  padding: string
  widgets: CanvasWidget[]
}

export interface CanvasState {
  sections: CanvasSection[]
}

// ─── Template settings ────────────────────────────────────────────────────────

export interface TemplateSettings {
  pageSize: "A4" | "Letter"
  fontFamily: string
  primaryColor: string
  textColor: string
  bgColor: string
}

// ─── Models ───────────────────────────────────────────────────────────────────

export type DocumentType = "contract" | "invoice"
export type TemplateId = number | string
export type DocumentId = number | string

export interface DocumentTemplate {
  id: TemplateId
  name: string
  type: DocumentType
  canvas: CanvasState
  settings: TemplateSettings | null
  is_default: boolean
  created_by: number | null
  created_at: string
  updated_at: string
  created_by_user?: { id: number; name: string } | null
}

export interface GeneratedDocument {
  id: DocumentId
  template_id: TemplateId
  reservation_id: number
  type: DocumentType
  filename: string
  created_by: number | null
  created_at: string
  template?: { id: TemplateId; name: string } | null
  reservation?: {
    id: number
    client?: { full_name: string } | null
    vehicle?: { brand: string; model: string } | null
  } | null
  created_by_user?: { id: number; name: string } | null
}

// ─── Request / Response ───────────────────────────────────────────────────────

export interface CreateTemplateRequest {
  name: string
  type: DocumentType
  canvas: CanvasState
  settings?: TemplateSettings
  is_default?: boolean
}

export interface UpdateTemplateRequest {
  name?: string
  canvas?: CanvasState
  settings?: TemplateSettings
  is_default?: boolean
}

export interface GenerateDocumentRequest {
  reservation_id: number
}

export interface GenerateDocumentResponse {
  message: string
  document: GeneratedDocument
  html: string
}

export type CreateTemplateResponse = { message: string; template: DocumentTemplate }
export type UpdateTemplateResponse = { message: string; template: DocumentTemplate }
