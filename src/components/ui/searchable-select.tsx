"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type SearchableSelectOption = {
  value: string
  label: string
  description?: string
  badge?: string
  searchText?: string
  disabled?: boolean
}

type SearchableSelectProps = {
  value?: string
  options: SearchableSelectOption[]
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  renderOption?: (option: SearchableSelectOption, selected: boolean) => React.ReactNode
  renderSelected?: (option: SearchableSelectOption) => React.ReactNode
}

export function SearchableSelect({
  value,
  options,
  onValueChange,
  placeholder = "Selectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun resultat.",
  disabled,
  className,
  renderOption,
  renderSelected,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("h-auto min-h-10 w-full justify-between gap-2 px-3 py-2 font-normal", className)}
        >
          <span className={cn("min-w-0 flex-1 truncate text-left", !selectedOption && "text-muted-foreground")}>
            {selectedOption ? (renderSelected ? renderSelected(selectedOption) : selectedOption.label) : placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const selected = option.value === value
                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.description ?? ""} ${option.badge ?? ""} ${option.searchText ?? ""}`}
                    disabled={option.disabled}
                    onSelect={() => {
                      onValueChange(option.value)
                      setOpen(false)
                    }}
                    className="items-start"
                  >
                    <Check className={cn("mt-0.5 size-4", selected ? "opacity-100" : "opacity-0")} />
                    <div className="min-w-0 flex-1">
                      {renderOption ? (
                        renderOption(option, selected)
                      ) : (
                        <>
                          <p className="truncate">{option.label}</p>
                          {option.description ? <p className="truncate text-xs text-muted-foreground">{option.description}</p> : null}
                        </>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
