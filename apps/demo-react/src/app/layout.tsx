import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '@nice-tools/isoframe Demo',
  description: 'Dashboard demo: isoframe + AG Grid',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
