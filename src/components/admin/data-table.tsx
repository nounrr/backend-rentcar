"use client"

import { useEffect, useMemo, useState } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  emptyMessage?: string
  className?: string
  pageSize?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "Aucune donnee disponible.",
  className,
  pageSize = 10,
}: DataTableProps<TData, TValue>) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(data.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [data, pageSize])

  const visibleData = useMemo(() => {
    const start = (page - 1) * pageSize
    return data.slice(start, start + pageSize)
  }, [data, page, pageSize])

  const table = useReactTable({
    data: visibleData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className={cn("space-y-3", className)}>
      <div className="w-full overflow-hidden rounded-md border border-border/70">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-muted-foreground h-10 px-4 text-sm font-medium"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-border/60 hover:bg-muted/25">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-24 px-4 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data.length > pageSize ? (
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Affichage {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, data.length)} sur {data.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
            >
              Precedent
            </Button>
            <span className="min-w-16 text-center">
              {page} / {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={page >= pageCount}
            >
              Suivant
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
