import type { Metadata } from "next";
import "./globals.css";

import { getAuthUser } from "@/lib/auth/session";
import { ThemeProvider } from "@/components/theme-provider";
import { inter } from "@/lib/fonts";
import { StoreProvider } from "@/store/provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Tanger Stylo Back Office",
  description: "Tableau de bord d'administration pour les operations e-commerce de Tanger Stylo.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUser = await getAuthUser();

  return (
    <html lang="fr" className={`${inter.variable} antialiased`}>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="nextjs-ui-theme">
          <StoreProvider initialUser={initialUser}>{children}</StoreProvider>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
