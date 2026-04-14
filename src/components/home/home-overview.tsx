"use client";

import Link from "next/link";
import { useState } from "react";

import type { DutyDayRecord, DutyOverviewItem } from "@/lib/mock/duty-home-data";

type HomeOverviewProps = {
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
  const hasPhone = Boolean(phone);

  return (
    <div className="grid grid-cols-[76px_1fr] gap-3 border-b border-dashed border-[var(--line-soft)] py-3 last:border-b-0">
      <span className="text-sm font-medium tracking-[0.08em] text-[var(--muted)]">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <span className="truncate">{name}</span>
          <span className="ml-auto shrink-0 text-right tabular-nums">{phone || "待补充"}</span>
        </div>
        {hasPhone ? (
          <a
            href={`tel:${phone}`}
            aria-label={`拨打 ${phone}`}
            className="shrink-0 rounded-full border border-[var(--line-soft)] bg-white px-3 py-1 text-xs text-[var(--foreground)]"
          >
            拨号
          </a>
        ) : null}
      </div>
    </div>
  );
}

function buildMonthGrid(year: number, month: number, selectedDate: string, datesWithData: Set<string>) {
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
      isSelected: isoDate === selectedDate,
      hasData: datesWithData.has(isoDate),
    };
  });
}

const weekdayLabels = ["一", "二", "三", "四", "五", "六", "日"];

function toChineseDateLabel(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
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

function UnitOverviewCard({ item, date }: { item: DutyOverviewItem; date: string }) {
  const detailHref = {
    pathname: `/units/${item.unitSlug}`,
    query: {
      date,
      unitName: item.unitName,
    },
  } as const;

  return (
    <article className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)] shadow-[0_20px_50px_rgba(25,35,45,0.08)]">
      <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[linear-gradient(180deg,#fffdfa_0%,#f8f1e8_100%)] px-5 py-4">
        <Link
          href={detailHref}
          className="text-lg font-semibold tracking-[0.02em] text-[var(--foreground)] underline-offset-4 transition hover:text-[var(--accent)] hover:underline"
        >
          {item.unitName}
        </Link>
        <Link
          href={detailHref}
          aria-label={`查看${item.unitName}详情`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold text-[var(--muted)] transition hover:bg-white/70 hover:text-[var(--foreground)]"
        >
          <span aria-hidden>›</span>
        </Link>
      </div>

      <div className="px-5 py-1">
        <SummaryLine label="值班领导" name={item.leaderName} phone={item.leaderPhone} />
        <SummaryLine label="值班中层" name={item.middleManagerName} phone={item.middleManagerPhone} />
        <SummaryLine label="值班人员" name={item.staffName} phone={item.staffPhone} />
      </div>
    </article>
  );
}

export function HomeOverview({ days, initialDay }: HomeOverviewProps) {
  const [selectedDate, setSelectedDate] = useState(initialDay.date);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date(`${initialDay.date}T00:00:00`).getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date(`${initialDay.date}T00:00:00`).getMonth());

  const currentDay = days.find((item) => item.date === selectedDate);
  const activeDate = currentDay?.date ?? selectedDate;
  const activeDateLabel = currentDay?.label ?? toChineseDateLabel(selectedDate);
  const activeOverviewItems = currentDay?.overviewItems ?? [];
  const daysWithData = new Set(days.map((item) => item.date));
  const monthGrid = buildMonthGrid(viewYear, viewMonth, selectedDate, daysWithData);
  const yearSet = new Set(days.map((item) => Number(item.date.slice(0, 4))));
  yearSet.add(viewYear);
  const yearOptions = [...yearSet].sort((a, b) => a - b);

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
                  <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">{activeDateLabel}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    aria-expanded={isCalendarOpen}
                    aria-label={isCalendarOpen ? "收起日期选择" : "展开日期选择"}
                    onClick={() => setIsCalendarOpen((value) => !value)}
                    className="rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[0_8px_24px_rgba(18,31,41,0.08)] transition hover:-translate-y-0.5"
                  >
                    {isCalendarOpen ? "收起" : "切换日期"}
                  </button>
                  <button
                    type="button"
                    aria-label="返回当天"
                    onClick={() => {
                      const todayDate = getChinaTodayIsoDate();
                      setSelectedDate(todayDate);
                      const baseDate = new Date(`${todayDate}T00:00:00`);
                      setViewYear(baseDate.getFullYear());
                      setViewMonth(baseDate.getMonth());
                      setIsCalendarOpen(false);
                    }}
                    className="rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[0_8px_24px_rgba(18,31,41,0.08)] transition hover:-translate-y-0.5"
                  >
                    返回当天
                  </button>
                </div>
              </div>

              {isCalendarOpen ? (
                <div className="mt-4 rounded-[22px] border border-[var(--line-soft)] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{viewMonth + 1}月日历面板</p>
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(false)}
                      className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs text-white"
                    >
                      收起日历
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <label className="text-xs text-[var(--muted)]" htmlFor="year-select">
                      年份
                    </label>
                    <select
                      id="year-select"
                      aria-label="切换年份"
                      value={viewYear}
                      onChange={(event) => setViewYear(Number(event.target.value))}
                      className="rounded-lg border border-[var(--line-soft)] bg-white px-2 py-1 text-sm text-[var(--foreground)]"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}年
                        </option>
                      ))}
                    </select>

                    <label className="ml-2 text-xs text-[var(--muted)]" htmlFor="month-select">
                      月份
                    </label>
                    <select
                      id="month-select"
                      aria-label="切换月份"
                      value={viewMonth}
                      onChange={(event) => setViewMonth(Number(event.target.value))}
                      className="rounded-lg border border-[var(--line-soft)] bg-white px-2 py-1 text-sm text-[var(--foreground)]"
                    >
                      {Array.from({ length: 12 }, (_, index) => (
                        <option key={index} value={index}>
                          {index + 1}月
                        </option>
                      ))}
                    </select>
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
          {activeOverviewItems.map((item) => (
            <UnitOverviewCard key={item.id} item={item} date={activeDate} />
          ))}
        </section>
      </div>
    </main>
  );
}
