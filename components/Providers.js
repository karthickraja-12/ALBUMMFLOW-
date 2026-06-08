'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

export default function Providers({ children }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('AlbumFlow Service Worker registered:', registration.scope);
      }).catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    }
  }, []);

  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
