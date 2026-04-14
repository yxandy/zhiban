"use client";

import Link from "next/link";
import { useState } from "react";

type DetailDateSwitcherProps = {
  unitSlug: string;
  unitName?: string;
  mode?: string;
  currentDate: string;
  availableDates: string[];
};

const weekdayLabels = ["一", "二", "三", "四", "五", "六", "日"];

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

function buildDetailHref(params: {
  unitSlug: string;
  date: string;
  unitName?: string;
  mode?: string;
}) {
  const query = new URLSearchParams();
  query.set("date", params.date);
  if (params.unitName) {
    query.set("unitName", params.unitName);
  }
  if (params.mode) {
    query.set("mode", params.mode);
  }
  return `/units/${params.unitSlug}?${query.toString()}`;
}

export function DetailDateSwitcher(props: DetailDateSwitcherProps) {
  const { unitSlug, unitName, mode, currentDate, availableDates } = props;
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const baseDate = /^\d{4}-\d{2}-\d{2}$/.test(currentDate) ? new Date(`${currentDate}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(baseDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(baseDate.getMonth());
  const datesWithData = new Set(availableDates);
  const monthGrid = buildMonthGrid(viewYear, viewMonth, currentDate, datesWithData);
  const yearSet = new Set(availableDates.map((item) => Number(item.slice(0, 4))));
  yearSet.add(viewYear);
  const yearOptions = [...yearSet].filter((item) => Number.isFinite(item)).sort((a, b) => a - b);
  const todayIsoDate = getChinaTodayIsoDate();
  const todayHref = buildDetailHref({
    unitSlug,
    date: todayIsoDate,
    unitName,
    mode,
  });

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="shrink-0 rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[0_8px_24px_rgba(18,31,41,0.08)] transition hover:-translate-y-0.5"
          >
            返回
          </Link>
          <button
            type="button"
            aria-expanded={isCalendarOpen}
            aria-label={isCalendarOpen ? "收起日期选择" : "展开日期选择"}
            onClick={() => setIsCalendarOpen((value) => !value)}
            className="shrink-0 rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[0_8px_24px_rgba(18,31,41,0.08)] transition hover:-translate-y-0.5"
          >
            {isCalendarOpen ? "收起" : "切换日期"}
          </button>
          <Link
            href={todayHref}
            className="shrink-0 rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[0_8px_24px_rgba(18,31,41,0.08)] transition hover:-translate-y-0.5"
          >
            返回当天
          </Link>
        </div>
      </div>

      {isCalendarOpen ? (
        <div className="rounded-[22px] border border-[var(--line-soft)] bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--foreground)]">日期选择</p>
            <button
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs text-white"
            >
              收起日历
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <label className="text-xs text-[var(--muted)]" htmlFor="detail-year-select">
              年份
            </label>
            <select
              id="detail-year-select"
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

            <label className="ml-2 text-xs text-[var(--muted)]" htmlFor="detail-month-select">
              月份
            </label>
            <select
              id="detail-month-select"
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
              <Link
                key={cell.isoDate}
                href={buildDetailHref({
                  unitSlug,
                  date: cell.isoDate,
                  unitName,
                  mode,
                })}
                aria-label={`选择 ${toChineseDateLabel(cell.isoDate)}`}
                className={`flex aspect-square items-center justify-center rounded-2xl border text-sm transition ${
                  !cell.isCurrentMonth
                    ? "pointer-events-none border-transparent bg-transparent text-[#c7beb3]"
                    : cell.isSelected
                      ? "border-transparent bg-[var(--accent)] text-white shadow-[0_10px_30px_rgba(37,95,133,0.28)]"
                      : cell.hasData
                        ? "border-[var(--line-soft)] bg-[var(--surface-soft)] text-[var(--foreground)]"
                        : "border-[var(--line-soft)] bg-white text-[var(--foreground)]"
                }`}
              >
                {cell.dayLabel}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
