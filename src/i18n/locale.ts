import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

// Lecture du locale cote serveur (build / runtime) de facon defensive.
// En export statique, le cookie n'est pas disponible au build -> defaultLocale.
export async function getLocale(): Promise<Locale> {
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const value = store.get(LOCALE_COOKIE)?.value;
    return isLocale(value) ? value : defaultLocale;
  } catch {
    return defaultLocale;
  }
}
