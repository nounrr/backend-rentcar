"use client"

import { useCallback, useMemo, useState } from "react"
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import {
  ChevronRight,
  FolderOpen,
  FolderTree,
  GripVertical,
  ImageIcon,
  Pencil,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { AdminCategory } from "@/store/api/categories"
import { useUpdateCategoryParentMutation } from "@/store/api/categories"

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const candidate = error as { data?: { message?: unknown }; error?: string }
    if (typeof candidate.data?.message === "string") return candidate.data.message
    if (typeof candidate.error === "string") return candidate.error
  }
  return fallback
}

function DraggableTreeNode({
  category,
  depth,
  isExpanded,
  onToggle,
  canManage,
  onEdit,
  onDelete,
}: {
  category: AdminCategory
  depth: number
  isExpanded: boolean
  onToggle: (id: string) => void
  canManage: boolean
  onEdit: (category: AdminCategory) => void
  onDelete: (category: AdminCategory) => void
}) {
  const id = String(category.id)
  const hasChildren = (category.children ?? []).length > 0

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `drag-${id}`,
    data: { category },
  })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${id}`,
    data: { category },
  })

  return (
    <div ref={setDropRef}>
      <div
        ref={setDragRef}
        className={cn(
          "group flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 transition-all",
          isDragging && "opacity-40",
          isOver && "border-primary/40 bg-primary/5",
          !isDragging && !isOver && "hover:bg-muted/40"
        )}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        <button
          type="button"
          className="flex size-5 shrink-0 items-center justify-center"
          onClick={() => hasChildren && onToggle(id)}
        >
          {hasChildren ? (
            <ChevronRight
              className={cn(
                "size-3.5 text-muted-foreground transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          ) : (
            <span className="size-1.5 rounded-full bg-border" />
          )}
        </button>

        <span
          className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="size-3.5" />
        </span>

        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.name}
            className="size-7 shrink-0 rounded border border-border/50 object-cover"
          />
        ) : (
          <div className="flex size-7 shrink-0 items-center justify-center rounded border border-dashed border-border/70 bg-muted/30">
            <ImageIcon className="size-3 text-muted-foreground" />
          </div>
        )}

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-medium">{category.name}</span>
          {hasChildren ? (
            <Badge variant="outline" className="shrink-0 rounded-full px-1.5 py-0 text-[10px]">
              {(category.children ?? []).length}
            </Badge>
          ) : null}
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 rounded-full px-1.5 py-0 text-[10px] font-semibold",
              category.is_active
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
            )}
          >
            {category.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        {canManage ? (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => onEdit(category)}
                  >
                    <Pencil className="size-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Modifier</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    onClick={() => onDelete(category)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Supprimer</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function RootDropZone() {
  const { setNodeRef, isOver } = useDroppable({
    id: "drop-root",
    data: { category: null },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-dashed px-4 py-2.5 text-sm transition-colors",
        isOver
          ? "border-primary/50 bg-primary/5 text-primary"
          : "border-border/50 text-muted-foreground"
      )}
    >
      <FolderOpen className="size-4" />
      Glisser ici pour en faire une categorie racine
    </div>
  )
}

function DragOverlayContent({ category }: { category: AdminCategory }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-background px-4 py-2 shadow-lg">
      {category.image_url ? (
        <img
          src={category.image_url}
          alt={category.name}
          className="size-6 rounded border border-border/50 object-cover"
        />
      ) : (
        <div className="flex size-6 items-center justify-center rounded border border-dashed border-border/70 bg-muted/30">
          <ImageIcon className="size-3 text-muted-foreground" />
        </div>
      )}
      <span className="text-sm font-medium">{category.name}</span>
    </div>
  )
}

export function CategoryTreeView({
  tree,
  canManage,
  onEdit,
  onDelete,
}: {
  tree: AdminCategory[]
  canManage: boolean
  onEdit: (category: AdminCategory) => void
  onDelete: (category: AdminCategory) => void
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>()
    tree.forEach((cat) => ids.add(String(cat.id)))
    return ids
  })
  const [activeDragCategory, setActiveDragCategory] = useState<AdminCategory | null>(null)
  const [updateParent] = useUpdateCategoryParentMutation()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const allCategoriesMap = useMemo(() => {
    const map = new Map<string, AdminCategory>()
    function walk(categories: AdminCategory[]) {
      categories.forEach((cat) => {
        map.set(String(cat.id), cat)
        if (cat.children) walk(cat.children)
      })
    }
    walk(tree)
    return map
  }, [tree])

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    const cat = event.active.data.current?.category as AdminCategory | undefined
    setActiveDragCategory(cat ?? null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragCategory(null)
    const { active, over } = event
    if (!over) return

    const draggedCategory = active.data.current?.category as AdminCategory | undefined
    if (!draggedCategory) return

    const dropId = String(over.id)

    let newParentId: number | string | null = null

    if (dropId === "drop-root") {
      newParentId = null
    } else if (dropId.startsWith("drop-")) {
      const targetCategory = over.data.current?.category as AdminCategory | undefined
      if (!targetCategory) return
      if (String(targetCategory.id) === String(draggedCategory.id)) return
      newParentId = targetCategory.id
    } else {
      return
    }

    const currentParentId = draggedCategory.parent_id ?? null
    if (String(currentParentId ?? "") === String(newParentId ?? "")) return

    try {
      await updateParent({
        categoryId: draggedCategory.id,
        parent_id: newParentId,
      }).unwrap()
      toast.success(`${draggedCategory.name} deplacee avec succes.`)

      if (newParentId) {
        setExpandedIds((prev) => new Set([...prev, String(newParentId)]))
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Impossible de deplacer la categorie."))
    }
  }

  function renderTree(categories: AdminCategory[], depth: number) {
    return categories.map((category) => {
      const id = String(category.id)
      const isExpanded = expandedIds.has(id)
      const children = category.children ?? []

      return (
        <div key={id}>
          <DraggableTreeNode
            category={category}
            depth={depth}
            isExpanded={isExpanded}
            onToggle={toggleExpand}
            canManage={canManage}
            onEdit={onEdit}
            onDelete={onDelete}
          />
          {isExpanded && children.length > 0 ? renderTree(children, depth + 1) : null}
        </div>
      )
    })
  }

  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <FolderTree className="size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Aucune categorie.</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-0.5 py-2">
        <RootDropZone />
        {renderTree(tree, 0)}
      </div>
      <DragOverlay>
        {activeDragCategory ? <DragOverlayContent category={activeDragCategory} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
