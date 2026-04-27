import { HomeOverview } from "@/components/home/home-overview";
import { getHomeOverviewData } from "@/lib/repositories/duty-repository";

type HomePageProps = {
  searchParams?: Promise<{
    mode?: string;
    date?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const data = await getHomeOverviewData({
    date: params?.date,
    forceMode: params?.mode,
  });

  return <HomeOverview days={data.days} initialDay={data.initialDay} mode={params?.mode} />;
}
