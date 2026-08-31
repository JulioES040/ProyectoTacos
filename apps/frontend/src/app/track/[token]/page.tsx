import { OrderTracking } from '@/features/tracking/components/order-tracking';

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <OrderTracking token={token} />;
}
