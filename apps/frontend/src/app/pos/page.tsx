import { PosWorkspace } from '@/features/pos/components/pos-workspace';
import { AuthGate } from '@/features/auth/auth-gate';

export default function PosPage() {
  return <AuthGate roles={['CASHIER']}><PosWorkspace /></AuthGate>;
}
