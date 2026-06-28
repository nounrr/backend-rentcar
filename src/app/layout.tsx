import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { inter } from "@/lib/fonts";
import { StoreProvider } from "@/store/provider";
import { Toaster } from "@/components/ui/sonner";
import { ArabicRuntimeTranslator } from "@/components/arabic-runtime-translator";
import { IntlProvider } from "@/components/intl-provider";
import { defaultLocale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "smartLocation Back Office",
  description: "Tableau de bord d'administration pour les operations de smartLocation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // En SPA statique, le locale reel est determine cote client (cookie) par IntlProvider.
  return (
    <html lang={defaultLocale} className={`${inter.variable} antialiased`}>
      <body className={inter.className}>
        <IntlProvider>
          <ThemeProvider defaultTheme="system" storageKey="nextjs-ui-theme">
            <StoreProvider>{children}</StoreProvider>
            <ArabicRuntimeTranslator />
            <Toaster position="top-right" />
          </ThemeProvider>
        </IntlProvider>
      </body>
    </html>
  );
}
