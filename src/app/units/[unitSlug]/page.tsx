import Link from "next/link";

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

function ContactLine({
  departmentName,
  personName,
  phone,
}: {
  departmentName: string;
  personName: string;
  phone?: string;
}) {
  const content = phone ? `${departmentName} ${personName} ${phone}` : `${departmentName} ${personName} 电话待补充`;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-[var(--line-soft)] py-2 last:border-b-0">
      <p className="min-w-0 truncate text-sm font-medium text-[var(--foreground)]">{content}</p>
      {phone ? (
        <a
          href={`tel:${phone}`}
          aria-label={`拨打 ${phone}`}
          className="shrink-0 rounded-full border border-[var(--line-soft)] bg-white px-3 py-1 text-xs text-[var(--foreground)]"
        >
          拨号
        </a>
      ) : (
        <span className="shrink-0 rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs text-[var(--muted)]">
          待补充
        </span>
      )}
    </div>
  );
}

export default async function UnitDetailPage({ params, searchParams }: UnitDetailPageProps) {
  const routeParams = await params;
  const query = searchParams ? await searchParams : undefined;
  const { detail } = await getUnitDetailData({
    unitSlug: routeParams.unitSlug,
    date: query?.date,
    forceMode: query?.mode,
  });
  const displayUnitName = detail?.unitName ?? query?.unitName ?? "该单位";

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-[0_24px_60px_rgba(18,31,41,0.08)]">
          <div className="space-y-2">
            <div className="flex justify-end">
              <Link
                href="/"
                className="shrink-0 rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[0_8px_24px_rgba(18,31,41,0.08)] transition hover:-translate-y-0.5"
              >
                返回
              </Link>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">{`${displayUnitName}值班详情`}</h1>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">{formatChineseDate(query?.date)}</p>
            </div>
          </div>
        </section>

        {detail ? (
          detail.groups.map((group) => (
            <section
              key={group.departmentName}
              className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-[0_20px_50px_rgba(25,35,45,0.06)]"
            >
              <h2 className="text-sm font-semibold tracking-[0.08em] text-[var(--muted)]">{group.departmentName}</h2>
              <div className="mt-2">
                {group.contacts.map((contact) => (
                  <ContactLine
                    key={contact.id}
                    departmentName={contact.departmentName}
                    personName={contact.personName}
                    phone={contact.phone}
                  />
                ))}
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
