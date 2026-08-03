import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteShell } from "./components/site-shell";
import {
  absoluteSiteUrl,
  siteDescription,
  siteName,
  siteUrl,
} from "./lib/site-config";
import { getStoreProducts } from "./lib/catalog-repository";
import { getShippingSettings } from "./lib/shipping-repository";
import { getStoreProfile } from "./lib/store-profile-repository";
import { getAccountViewer } from "./lib/account-auth";
import {
  getHeroSettings,
  resolveActiveHero,
} from "./lib/hero-settings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Lumânări artizanale`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ro_RO",
    siteName,
    title: `${siteName} | Lumânări artizanale`,
    description: siteDescription,
    url: "/",
    images: [
      {
        url: "/images/hero-ritual-nocturn.webp",
        alt: "Lumânare artizanală La Lumina Lumânării",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Lumânări artizanale`,
    description: siteDescription,
    images: ["/images/hero-ritual-nocturn.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [
    products,
    shippingSettings,
    storeProfile,
    accountViewer,
    heroSettings,
  ] = await Promise.all([
    getStoreProducts(),
    getShippingSettings(),
    getStoreProfile(),
    getAccountViewer(),
    getHeroSettings(),
  ]);
  const activeTheme = resolveActiveHero(heroSettings);
  const themeStyle = {
    "--ink": activeTheme.backgroundColor,
    "--ink-soft": `color-mix(in srgb, ${activeTheme.backgroundColor} 78%, ${activeTheme.surfaceColor})`,
    "--surface": activeTheme.surfaceColor,
    "--surface-2": `color-mix(in srgb, ${activeTheme.surfaceColor} 82%, ${activeTheme.accentColor})`,
    "--plum": `color-mix(in srgb, ${activeTheme.backgroundColor} 55%, ${activeTheme.accentColor})`,
    "--plum-light": activeTheme.accentColor,
    "--cream": activeTheme.textColor,
    "--cream-muted": `color-mix(in srgb, ${activeTheme.textColor} 72%, ${activeTheme.surfaceColor})`,
    "--gold": activeTheme.accentColor,
    "--gold-light": activeTheme.accentSoftColor,
    "--line": `color-mix(in srgb, ${activeTheme.accentColor} 34%, transparent)`,
    "--line-soft": `color-mix(in srgb, ${activeTheme.textColor} 13%, transparent)`,
    "--theme-header": `color-mix(in srgb, ${activeTheme.backgroundColor} 88%, transparent)`,
    "--theme-deep": `color-mix(in srgb, ${activeTheme.backgroundColor} 88%, black)`,
  } as React.CSSProperties;
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: storeProfile.brandName || siteName,
    url: siteUrl,
    logo: absoluteSiteUrl("/favicon.svg"),
    ...(storeProfile.legalName ? { legalName: storeProfile.legalName } : {}),
    ...(storeProfile.contactEmail
      ? { email: storeProfile.contactEmail }
      : {}),
    ...(storeProfile.phone ? { telephone: storeProfile.phone } : {}),
  };
  return (
    <html lang="ro">
      <body
        className={`${geistSans.variable} antialiased`}
        data-store-theme={activeTheme.id}
        style={themeStyle}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(
              /</g,
              "\\u003c",
            ),
          }}
        />
        <SiteShell
          freeShippingThreshold={shippingSettings.freeShippingThreshold}
          products={products}
          storeProfile={storeProfile}
          accountViewer={accountViewer}
        >
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
