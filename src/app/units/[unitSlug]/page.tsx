import { ContactLine } from "@/components/detail/contact-line";
import { DetailDateSwitcher } from "@/components/detail/detail-date-switcher";
import { buildDepartmentAnchorId } from "@/lib/anchor";
import { getUnitDetailData } from "@/lib/repositories/duty-repository";

type UnitDetailPageProps = {
  params: Promise<{
    unitSlug: string;
  }>;
  searchParams?: Promise<{
    date?: string;
    mode?: string;
    unitName?: string;
  }>;
};

function formatChineseDate(date?: string) {
  if (!date) {
    return "未指定日期";
  }

  const [year, month, day] = date.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function getChinaTodayIsoDate() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    return "1970-01-01";
  }
  return `${year}-${month}-${day}`;
}

export default async function UnitDetailPage({ params, searchParams }: UnitDetailPageProps) {
  const routeParams = await params;
  const query = searchParams ? await searchParams : undefined;
  const { detail, availableDates } = await getUnitDetailData({
    unitSlug: routeParams.unitSlug,
    date: query?.date,
    forceMode: query?.mode,
  });
  const displayUnitName = detail?.unitName ?? query?.unitName ?? "该单位";
  const currentDate = /^\d{4}-\d{2}-\d{2}$/.test(query?.date ?? "")
    ? (query?.date as string)
    : detail?.date ?? getChinaTodayIsoDate();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-[0_24px_60px_rgba(18,31,41,0.08)]">
          <div className="space-y-2">
            <DetailDateSwitcher
              unitSlug={routeParams.unitSlug}
              unitName={query?.unitName}
              mode={query?.mode}
              currentDate={currentDate}
              availableDates={availableDates}
            />
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">{`${displayUnitName}值班详情`}</h1>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">{formatChineseDate(currentDate)}</p>
            </div>
          </div>
        </section>

        {detail ? (
          detail.groups.map((group) => (
            <section
              key={group.departmentName}
              id={buildDepartmentAnchorId(group.departmentName)}
              className="search-hit-target rounded-[24px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-[0_20px_50px_rgba(25,35,45,0.06)]"
            >
              <h2 className="text-sm font-semibold tracking-[0.08em] text-[var(--muted)]">{group.departmentName}</h2>
              <div className="mt-2">
                {group.contacts.some((contact) => contact.statusTag === "shutdown") ? (
                  <p className="py-2 text-base font-bold text-orange-600">关停</p>
                ) : (
                  group.contacts.map((contact) => (
                    <ContactLine
                      key={contact.id}
                      personName={contact.personName}
                      mobilePhone={contact.mobilePhone || contact.phone}
                      landlineType={contact.landlineType}
                      landlinePhone={contact.landlinePhone}
                    />
                  ))
                )}
              </div>
            </section>
          ))
        ) : (
          <section className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--card)] px-5 py-8 text-center text-[var(--muted)]">
            该单位本月没有报送更多的值班详情
          </section>
        )}
      </div>
    </main>
  );
}
