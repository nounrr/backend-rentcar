"use client"

import * as React from "react"
import { NextIntlClientProvider } from "next-intl"

import { defaultLocale, isLocale, LOCALE_COOKIE, localeMeta, type Locale } from "@/i18n/config"
import frMessages from "@/i18n/messages/fr.json"
import arMessages from "@/i18n/messages/ar.json"

type Messages = typeof frMessages

const MESSAGES: Record<Locale, Messages> = {
  fr: frMessages,
  ar: arMessages as Messages,
}

function readLocaleFromCookie(): Locale {
  if (typeof document === "undefined") return defaultLocale
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${LOCALE_COOKIE}=`))
  const value = match?.split("=")[1]
  return isLocale(value) ? value : defaultLocale
}

export function IntlProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = React.useState<Locale>(defaultLocale)

  React.useEffect(() => {
    const next = readLocaleFromCookie()
    setLocale(next)
    // Applique la langue + direction sur <html>.
    document.documentElement.lang = next
    document.documentElement.dir = localeMeta[next].dir
  }, [])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      timeZone="Africa/Casablanca"
      now={new Date()}
      onError={() => {}}
    >
      {children}
    </NextIntlClientProvider>
  )
}
