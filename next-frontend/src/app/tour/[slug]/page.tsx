import { TourDetailClient } from "@/components/tour/TourDetailClient";

export default async function TourPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TourDetailClient slug={slug} />;
}

