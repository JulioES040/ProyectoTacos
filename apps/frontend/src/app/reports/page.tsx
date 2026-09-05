import { AuthGate } from '@/features/auth/auth-gate';
import { ComingSoon } from '@/components/coming-soon';

export default function ReportsPage() { return <AuthGate roles={['CASHIER']}><ComingSoon title="Reportes" description="Ventas, productos y rendimiento de la operacion." /></AuthGate>; }
