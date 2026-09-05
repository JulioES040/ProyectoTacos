import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'El Buen Taco',
  description: 'Punto de venta, cocina y seguimiento de pedidos de El Buen Taco.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><Providers>{children}</Providers></body></html>;
}
