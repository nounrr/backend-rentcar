import type { NextConfig } from "next";

// Note: l'i18n est gere 100% cote client (voir src/components/intl-provider.tsx),
// donc on n'utilise plus le plugin next-intl (pas de contexte serveur requis).

// Sous-chemin de deploiement (ex: "/location"). Vide en local.
// Defini via NEXT_PUBLIC_BASE_PATH dans .env.production.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Active l'export statique (SPA) quand NEXT_OUTPUT=export (build de prod).
// Laisse le mode serveur (avec /api/*) en developpement local.
const isStaticExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  // SPA: genere des fichiers statiques dans ./out (pas de serveur Node).
  ...(isStaticExport ? { output: "export" as const } : {}),

  // Sert l'app sous 2mcrafters.com/location
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,

  // Genere des URLs avec slash final -> compatible hebergement statique.
  trailingSlash: true,

  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  turbopack: {},

  // Image optimization
  images: {
    // L'optimiseur d'images Next exige un serveur: on le desactive pour l'export statique.
    unoptimized: isStaticExport,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui.shadcn.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // headers() et redirects() ne sont PAS appliques en export statique
  // (pas de serveur Node). On les conserve uniquement en mode serveur.
  ...(isStaticExport
    ? {}
    : {
        async headers() {
          return [
            {
              source: '/(.*)',
              headers: [
                { key: 'X-Frame-Options', value: 'DENY' },
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
              ],
            },
          ];
        },
        async redirects() {
          return [
            { source: '/home', destination: '/dashboard', permanent: true },
          ];
        },
      }),
};

export default nextConfig;
