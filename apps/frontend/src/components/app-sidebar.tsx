'use client';

import { FiArchive as Archive, FiBarChart2 as BarChart3, FiBookOpen as BookOpen, FiLogOut as LogOut, FiShoppingCart as ShoppingCart } from 'react-icons/fi';
import { MdKitchen as ChefHat } from 'react-icons/md';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';

const navigation = [
  { href: '/pos', label: 'POS', description: 'Punto de venta', icon: ShoppingCart },
  { href: '/kitchen', label: 'Cocina', description: 'Panel de cocina', icon: ChefHat },
  { href: '/menu', label: 'Menu', description: 'Control de menu', icon: BookOpen },
  { href: '/inventory', label: 'Inventario', description: 'Proximamente', icon: Archive },
  { href: '/reports', label: 'Reportes', description: 'Reportes', icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const endSession = async () => { await logout(); router.replace('/login'); };

  return (
    <aside className="app-sidebar">
      <Link className="sidebar-brand" href="/pos" aria-label="El Buen Taco">
        <Image src="/brands/el-buen-taco-logo.png" alt="El Buen Taco" width={54} height={54} priority />
        <span>EBT</span>
      </Link>
      <nav aria-label="Navegacion principal">
        {navigation.map(({ href, label, description, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return <Link key={href} href={href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} title={description}>
            <Icon size={23} aria-hidden="true" />
            <span>{label}</span>
          </Link>;
        })}
      </nav>
      <button type="button" className="sidebar-logout" onClick={() => void endSession()} title="Cerrar sesion" aria-label="Cerrar sesion"><LogOut size={21} /><span>Salir</span></button>
    </aside>
  );
}
