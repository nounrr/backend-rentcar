"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          // Base — dark card en mode clair, clair en mode sombre
          toast: [
            "group toast !rounded-xl !border !shadow-xl",
            // mode clair : fond sombre, texte clair
            "group-[.toaster]:bg-zinc-900 group-[.toaster]:text-zinc-50 group-[.toaster]:border-zinc-700/80",
            // mode sombre : fond clair, texte sombre
            "dark:group-[.toaster]:bg-zinc-50 dark:group-[.toaster]:text-zinc-900 dark:group-[.toaster]:border-zinc-200",
          ].join(" "),

          title:
            "group-[.toast]:text-[13px] group-[.toast]:font-semibold group-[.toast]:leading-snug",

          description:
            "group-[.toast]:text-xs group-[.toast]:opacity-75 group-[.toast]:leading-relaxed",

          closeButton: [
            "group-[.toaster]:bg-zinc-700 group-[.toaster]:text-zinc-300 group-[.toaster]:border-zinc-600",
            "dark:group-[.toaster]:bg-zinc-200 dark:group-[.toaster]:text-zinc-600 dark:group-[.toaster]:border-zinc-300",
            "hover:group-[.toaster]:opacity-80",
          ].join(" "),

          actionButton:
            "group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-900 group-[.toast]:rounded-md group-[.toast]:font-medium",

          cancelButton:
            "group-[.toast]:bg-zinc-700 group-[.toast]:text-zinc-300 group-[.toast]:rounded-md",

          // Succes — vert profond clair / vert pastel sombre
          success: [
            "group-[.toaster]:!bg-emerald-700 group-[.toaster]:!text-white group-[.toaster]:!border-emerald-600",
            "dark:group-[.toaster]:!bg-emerald-100 dark:group-[.toaster]:!text-emerald-950 dark:group-[.toaster]:!border-emerald-300",
            "[&>[data-icon]]:!text-emerald-200 dark:[&>[data-icon]]:!text-emerald-600",
          ].join(" "),

          // Erreur — rouge profond clair / rose pastel sombre
          error: [
            "group-[.toaster]:!bg-rose-700 group-[.toaster]:!text-white group-[.toaster]:!border-rose-600",
            "dark:group-[.toaster]:!bg-rose-100 dark:group-[.toaster]:!text-rose-950 dark:group-[.toaster]:!border-rose-300",
            "[&>[data-icon]]:!text-rose-200 dark:[&>[data-icon]]:!text-rose-600",
          ].join(" "),

          // Avertissement — ambre profond clair / ambre pastel sombre
          warning: [
            "group-[.toaster]:!bg-amber-600 group-[.toaster]:!text-white group-[.toaster]:!border-amber-500",
            "dark:group-[.toaster]:!bg-amber-100 dark:group-[.toaster]:!text-amber-950 dark:group-[.toaster]:!border-amber-300",
            "[&>[data-icon]]:!text-amber-200 dark:[&>[data-icon]]:!text-amber-600",
          ].join(" "),

          // Information — bleu profond clair / bleu pastel sombre
          info: [
            "group-[.toaster]:!bg-sky-700 group-[.toaster]:!text-white group-[.toaster]:!border-sky-600",
            "dark:group-[.toaster]:!bg-sky-100 dark:group-[.toaster]:!text-sky-950 dark:group-[.toaster]:!border-sky-300",
            "[&>[data-icon]]:!text-sky-200 dark:[&>[data-icon]]:!text-sky-600",
          ].join(" "),
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
