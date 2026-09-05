import { AuthGate } from '@/features/auth/auth-gate';
import { ComingSoon } from '@/components/coming-soon';

export default function InventoryPage() { return <AuthGate roles={['CASHIER']}><ComingSoon title="Inventario" description="Control de existencias y alertas de insumos." /></AuthGate>; }
