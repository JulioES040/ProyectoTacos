import { redirect } from 'next/navigation';

type LegacyTrackingPageProps = {
  params: Promise<{ token: string }>;
};

export default async function LegacyTrackingPage({ params }: LegacyTrackingPageProps) {
  const { token } = await params;
  redirect(`/track/${encodeURIComponent(token)}`);
}
