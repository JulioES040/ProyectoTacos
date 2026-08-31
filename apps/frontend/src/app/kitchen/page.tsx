import { KitchenBoard } from '@/features/kitchen/components/kitchen-board';
import { AuthGate } from '@/features/auth/auth-gate';

export default function KitchenPage() {
  return <AuthGate><KitchenBoard /></AuthGate>;
}
