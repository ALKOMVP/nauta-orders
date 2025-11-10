import './globals.css';
import { ReactQueryProvider } from './queryClient';

export const metadata = { title: 'Orders', description: 'Nauta Orders' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
