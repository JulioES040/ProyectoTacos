import { MenuManagement } from '@/features/menu/components/menu-management';
import { AuthGate } from '@/features/auth/auth-gate';

export default function MenuPage() { return <AuthGate><MenuManagement /></AuthGate>; }
