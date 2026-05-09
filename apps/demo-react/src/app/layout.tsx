import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import ThemeProviderWrapper from './ThemeProviderWrapper';

export const metadata: Metadata = {
  title: '@nice-tools/isoframe Demo',
  description: 'Dashboard: isoframe + MUI 9 + AG Grid 35',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <AppRouterCacheProvider>
          <ThemeProviderWrapper>{children}</ThemeProviderWrapper>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
