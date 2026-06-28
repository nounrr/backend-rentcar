"use client";

import { isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";

// SPA statique : on ecrit le cookie cote navigateur puis on recharge la page
// pour que next-intl re-evalue le locale.
export async function setLocaleAction(locale: Locale) {
  if (!isLocale(locale)) return;
  if (typeof document === "undefined") return;

  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${oneYear}; samesite=lax`;

  // Recharge pour appliquer la nouvelle langue (messages + direction).
  window.location.reload();
}
