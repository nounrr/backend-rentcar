"use client";

import * as React from "react";
import { Languages, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocaleAction } from "@/actions/locale";
import { locales, localeMeta, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  variant = "outline",
}: {
  variant?: "outline" | "ghost" | "default";
}) {
  const current = useLocale() as Locale;
  const t = useTranslations("Common");
  const [pending, startTransition] = React.useTransition();

  const handleSelect = (locale: Locale) => {
    if (locale === current) return;
    startTransition(async () => {
      await setLocaleAction(locale);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          aria-label={t("language")}
          disabled={pending}
          className="cursor-pointer relative"
        >
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span
            aria-hidden
            className="absolute -bottom-0.5 -right-0.5 rounded-full bg-primary px-1 text-[8px] font-bold text-primary-foreground leading-tight"
          >
            {current.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locales.map((locale) => {
          const meta = localeMeta[locale];
          const isActive = locale === current;
          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => handleSelect(locale)}
              className={cn("cursor-pointer justify-between gap-2", isActive && "bg-accent/50")}
            >
              <span className="flex flex-col">
                <span className="text-sm font-medium">{meta.nativeLabel}</span>
                <span className="text-[10px] text-muted-foreground">{meta.label}</span>
              </span>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
