import { HomeOverview } from "@/components/home/home-overview";
import { getHomeOverviewData } from "@/lib/repositories/duty-repository";

type HomePageProps = {
  searchParams?: Promise<{
    mode?: string;
    date?: string;
  }>;
};

function resolveModeLabel(mode?: string) {
  return mode === "database" ? "连接远程 MySQL" : "模拟数据模式";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const data = await getHomeOverviewData({
    date: params?.date,
    forceMode: params?.mode,
  });
  const modeLabel = params?.mode ? resolveModeLabel(params.mode) : resolveModeLabel(data.sourceMode);

  return (
    <HomeOverview
      currentModeLabel={modeLabel}
      days={data.days}
      initialDay={data.initialDay}
    />
  );
}
