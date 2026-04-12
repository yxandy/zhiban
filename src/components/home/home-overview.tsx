"use client";

import Link from "next/link";
import { useState } from "react";

import type { DutyDayRecord, DutyOverviewItem } from "@/lib/mock/duty-home-data";

type HomeOverviewProps = {
  currentModeLabel: string;
  days: DutyDayRecord[];
  initialDay: DutyDayRecord;
};

function SummaryLine({
  label,
  name,
  phone,
}: {
  label: string;
  name: string;
  phone?: string;
}) {
  return (
    <div className="grid grid-cols-[76px_1fr] gap-3 border-b border-dashed border-[var(--line-soft)] py-3 last:border-b-0">
      <span className="text-sm font-medium tracking-[0.08em] text-[var(--muted)]">{label}</span>
      <p className="truncate text-sm font-semibold text-[var(--foreground)]">
        {phone ? `${name} ${phone}` : `${name} 电话待补充`}
      </p>
    </div>
  );
}

function buildMonthGrid(activeDate: string, datesWithData: Set<string>) {
  const baseDate = new Date(`${activeDate}T00:00:00`);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((leadingDays + lastDay.getDate()) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - leadingDays + 1;
    const cellDate = new Date(year, month, dayNumber);
    const isCurrentMonth = cellDate.getMonth() === month;
    const isoDate = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, "0")}-${String(
      cellDate.getDate(),
    ).padStart(2, "0")}`;

    return {
      isoDate,
      dayLabel: String(cellDate.getDate()),
      isCurrentMonth,
      isSelected: isoDate === activeDate,
      hasData: datesWithData.has(isoDate),
    };
  });
}

const weekdayLabels = ["一", "二", "三", "四", "五", "六", "日"];

function toChineseDateLabel(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function UnitOverviewCard({ item, date }: { item: DutyOverviewItem; date: string }) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)] shadow-[0_20px_50px_rgba(25,35,45,0.08)]">
      <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[linear-gradient(180deg,#fffdfa_0%,#f8f1e8_100%)] px-5 py-4">
        <Link
          href={`/units/${item.unitSlug}?date=${date}`}
          className="text-lg font-semibold tracking-[0.02em] text-[var(--foreground)] underline-offset-4 transition hover:text-[var(--accent)] hover:underline"
        >
          {item.unitName}
        </Link>
        <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--muted)] shadow-[inset_0_0_0_1px_var(--line-soft)]">
          点单位看详情
        </span>
      </div>

      <div className="px-5 py-1">
        <SummaryLine label="值班领导" name={item.leaderName} phone={item.leaderPhone} />
        <SummaryLine label="值班中层" name={item.middleManagerName} phone={item.middleManagerPhone} />
        <SummaryLine label="值班人员" name={item.staffName} phone={item.staffPhone} />
      </div>
    </article>
  );
}

export function HomeOverview({ currentModeLabel, days, initialDay }: HomeOverviewProps) {
  const [selectedDate, setSelectedDate] = useState(initialDay.date);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const currentDay = days.find((item) => item.date === selectedDate) ?? initialDay;
  const daysWithData = new Set(days.map((item) => item.date));
  const monthGrid = buildMonthGrid(currentDay.date, daysWithData);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <section className="relative overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--card)] shadow-[0_30px_80px_rgba(18,31,41,0.12)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(50,112,146,0.14),transparent_60%),radial-gradient(circle_at_top_right,rgba(209,134,57,0.12),transparent_42%)]" />

          <div className="relative px-5 pb-5 pt-5 sm:px-7">
            <div className="rounded-[26px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,#f9f3ea_0%,#fffdfa_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs tracking-[0.18em] text-[var(--muted)]">当前日期</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">{currentDay.label}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">{`当前模式：${currentModeLabel}`}</p>
                </div>

                <button
                  type="button"
                  aria-expanded={isCalendarOpen}
                  aria-label={isCalendarOpen ? "收起日期选择" : "展开日期选择"}
                  onClick={() => setIsCalendarOpen((value) => !value)}
                  className="rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[0_8px_24px_rgba(18,31,41,0.08)] transition hover:-translate-y-0.5"
                >
                  {isCalendarOpen ? "收起" : "切换日期"}
                </button>
              </div>

              {isCalendarOpen ? (
                <div className="mt-4 rounded-[22px] border border-[var(--line-soft)] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--foreground)]">4月日历面板</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(initialDay.date);
                        setIsCalendarOpen(false);
                      }}
                      className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs text-white"
                    >
                      回到今天
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-[var(--muted)]">
                    {weekdayLabels.map((label) => (
                      <span key={label} className="py-1">
                        {label}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2 grid grid-cols-7 gap-2">
                    {monthGrid.map((cell) => (
                      <button
                        key={cell.isoDate}
                        type="button"
                        aria-label={`选择 ${toChineseDateLabel(cell.isoDate)}`}
                        disabled={!cell.isCurrentMonth}
                        onClick={() => {
                          if (!cell.isCurrentMonth) {
                            return;
                          }

                          setSelectedDate(cell.isoDate);
                          setIsCalendarOpen(false);
                        }}
                        className={`flex aspect-square items-center justify-center rounded-2xl border text-sm transition ${
                          !cell.isCurrentMonth
                            ? "border-transparent bg-transparent text-[#c7beb3]"
                            : cell.isSelected
                              ? "border-transparent bg-[var(--accent)] text-white shadow-[0_10px_30px_rgba(37,95,133,0.28)]"
                              : cell.hasData
                                ? "border-[var(--line-soft)] bg-[var(--surface-soft)] text-[var(--foreground)]"
                                : "border-[var(--line-soft)] bg-white text-[var(--foreground)]"
                        }`}
                      >
                        {cell.dayLabel}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          {currentDay.overviewItems.map((item) => (
            <UnitOverviewCard key={item.id} item={item} date={currentDay.date} />
          ))}
        </section>
      </div>
    </main>
  );
}
