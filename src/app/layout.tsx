import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { cn } from '@/lib/utils';
import { PWARegister } from '@/components/pwa-register';
import Script from 'next/script';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Talent Graph',
  description:
    'Your professional identity in sports. Verified data, structured profiles, and long-term performance tracking.',
  verification: {
    google: 'd90b589de29c6d38',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Talent Graph',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#000000',
    'msapplication-TileImage': '/icons/icon-144x144.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head suppressHydrationWarning>
        {/*
          suppressHydrationWarning on <head> prevents React hydration errors caused
          by the Replit dev proxy injecting its own <script> tags server-side that
          React never rendered. This is safe — <head> content is not reactive.

          Firebase SDK internal assertion errors are suppressed via the inline script
          below. Firebase throws "INTERNAL ASSERTION FAILED (ID: ca9)" on stream
          resets — a recoverable connection glitch. Running this FIRST in <head>
          ensures our capture-phase handler wins the registration race vs Next.js.
        */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/firebase-suppress.js" suppressHydrationWarning />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Talent Graph" />
        <meta name="application-name" content="Talent Graph" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-DH7JN1PKKJ"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-DH7JN1PKKJ');
        `}
      </Script>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable
      )}>
        <FirebaseClientProvider>
          <PWARegister />
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
