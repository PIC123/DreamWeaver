import type { Metadata, Viewport } from 'next';
import Onboarding from '@/components/account/Onboarding';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import './globals.css';
import './Landing.css';

export const metadata: Metadata = {
  title: 'DreamWeaver',
  description: 'Interactive illustrated stories. Infinite stories, infinite possibilities.',
  manifest: '/manifest.json',
  icons: { icon: '/dream-weaver-ico.ico', apple: '/dream-weaver-logo-192.png' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#302b63',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <Onboarding />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
