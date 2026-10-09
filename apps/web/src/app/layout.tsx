import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppShell } from '../components/app-shell.tsx';
import './globals.css';

export const metadata: Metadata = {
  title: 'Devora Sales Engine',
  description: 'The CRM that runs the outbound sales process for Devora, a PR firm.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
