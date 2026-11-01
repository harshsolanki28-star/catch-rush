import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Crush Rush | Reflex-Based Speed Dating & Hookup platform',
  description: 'Reflex-Based Speed Dating & Hookup platform. We match your nervous system in 45 seconds of raw cognitive dopamine stimulation.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Crush Rush',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ff2d55',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/assets/logo-badge.png" />
      </head>
      <body className="antialiased bg-[#0b0b0e] text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
