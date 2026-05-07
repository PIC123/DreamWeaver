import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'DreamWeaver',
  description: 'Infinite stories, infinite possibilities.',
  manifest: '/manifest.json',
  icons: {
    icon: '/dream-weaver-ico.ico',
    apple: '/dream-weaver-logo-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#302b63',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
