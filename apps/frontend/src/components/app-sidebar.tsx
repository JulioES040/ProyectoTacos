'use client';

import { FiBarChart2 as BarChart3, FiShoppingCart as ShoppingCart, FiZap as Flame } from 'react-icons/fi';
import { MdKitchen as ChefHat } from 'react-icons/md';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/pos', label: 'POS', description: 'Punto de venta', icon: ShoppingCart },
  { href: '/kitchen', label: 'Cocina', description: 'Panel de cocina', icon: ChefHat },
  { href: '/reports', label: 'Reportes', description: 'Reportes', icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar">
      <Link className="sidebar-brand" href="/pos" aria-label="El Taquero">
        <Flame size={25} />
        <span>ET</span>
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
    </aside>
  );
}
