import { prisma } from "@/lib/db";
import {
  dutyDayRecords,
  getDutyDayRecord,
  getDutyUnitDetailRecord,
  type DutyDayRecord,
  type DutyOverviewItem,
  type DutyUnitDetailRecord,
} from "@/lib/mock/duty-home-data";

const accentColors = ["#2c7fb8", "#d47b2a", "#5c8a5b", "#7f5ca8", "#2f7f6b"];

type HomeOverviewData = {
  days: DutyDayRecord[];
  initialDay: DutyDayRecord;
  sourceMode: "mock" | "database";
};

export async function getHomeOverviewData(input: {
  date?: string;
  forceMode?: string;
}): Promise<HomeOverviewData> {
  const preferDatabase = input.forceMode === "database" || process.env.USE_MOCK_DATA === "false";

  if (preferDatabase) {
    const fromDb = await readHomeOverviewFromDatabase(input.date);
    if (fromDb) {
      return fromDb;
    }
  }

  return {
    days: dutyDayRecords,
    initialDay: getDutyDayRecord(input.date),
    sourceMode: "mock",
  };
}

export async function getUnitDetailData(input: {
  unitSlug: string;
  date?: string;
  forceMode?: string;
}): Promise<{
  detail: DutyUnitDetailRecord | null;
  availableDates: string[];
  sourceMode: "mock" | "database";
}> {
  const preferDatabase = input.forceMode === "database" || process.env.USE_MOCK_DATA === "false";
  if (preferDatabase) {
    const fromDb = await readUnitDetailFromDatabase(input.unitSlug, input.date);
    const detail = fromDb?.detail ?? null;
    if (detail) {
      return {
        detail,
        availableDates: fromDb?.availableDates ?? [],
        sourceMode: "database",
      };
    }
  }

  const mockDetail = getDutyUnitDetailRecord(input.unitSlug, input.date);
  const mockDates = dutyDayRecords
    .filter((item) => item.overviewItems.some((overview) => overview.unitSlug === input.unitSlug))
    .map((item) => item.date);

  return {
    detail: mockDetail,
    availableDates: mockDates,
    sourceMode: "mock",
  };
}

async function readHomeOverviewFromDatabase(date?: string): Promise<HomeOverviewData | null> {
  const requestedDate = normalizeDate(date);
  let activeDate = requestedDate ?? getChinaTodayIsoDate();
  let rows = await listDutyOverviewRowsByMonth(activeDate);

  if (!requestedDate && rows.length === 0) {
    const latest = await prisma.dutyOverview.findFirst({
      orderBy: {
        dutyDate: "desc",
      },
      select: {
        dutyDate: true,
      },
    });
    if (!latest) {
      return null;
    }
    activeDate = formatDateOnly(latest.dutyDate);
    rows = await listDutyOverviewRowsByMonth(activeDate);
  }

  if (rows.length === 0) {
    return null;
  }

  const map = new Map<string, DutyOverviewItem[]>();
  for (const row of rows) {
    const day = formatDateOnly(row.dutyDate);
    const list = map.get(day) ?? [];
    list.push({
      id: row.id,
      unitName: row.unit.name,
      unitSlug: row.unit.code ?? `unit-${row.unitId}`,
      leaderName: row.leaderName ?? "待补充",
      leaderPhone: row.leaderPhone ?? "",
      middleManagerName: row.middleManagerName ?? "待补充",
      middleManagerPhone: row.middleManagerPhone ?? "",
      staffName: row.staffName ?? "待补充",
      staffPhone: row.staffPhone ?? "",
      accentColor: accentColors[(list.length + row.unitId) % accentColors.length],
    });
    map.set(day, list);
  }

  const days = [...map.entries()].map(([day, items]) => ({
    date: day,
    label: toChineseDate(day),
    monthLabel: toMonthLabel(day),
    overviewItems: items,
  }));
  days.sort((a, b) => (a.date < b.date ? -1 : 1));

  const initialDay =
    days.find((item) => item.date === activeDate) ??
    ({
      date: activeDate,
      label: toChineseDate(activeDate),
      monthLabel: toMonthLabel(activeDate),
      overviewItems: [],
    } satisfies DutyDayRecord);
  if (!initialDay) {
    return null;
  }

  return {
    days,
    initialDay,
    sourceMode: "database",
  };
}

async function readUnitDetailFromDatabase(
  unitSlug: string,
  date?: string,
): Promise<{ detail: DutyUnitDetailRecord | null; availableDates: string[] } | null> {
  const unit = await resolveUnitBySlug(unitSlug);
  if (!unit) {
    return null;
  }

  let targetDate = normalizeDate(date);
  if (!targetDate) {
    const latest = await prisma.dutyContact.findFirst({
      where: {
        unitId: unit.id,
      },
      orderBy: {
        dutyDate: "desc",
      },
      select: {
        dutyDate: true,
      },
    });
    targetDate = latest ? formatDateOnly(latest.dutyDate) : null;
  }

  const availableRows = await prisma.dutyContact.findMany({
    where: {
      unitId: unit.id,
    },
    select: {
      dutyDate: true,
    },
    distinct: ["dutyDate"],
    orderBy: {
      dutyDate: "asc",
    },
  });
  const availableDates = availableRows.map((row) => formatDateOnly(row.dutyDate));

  if (!targetDate) {
    return {
      detail: null,
      availableDates,
    };
  }

  const dayStart = new Date(`${targetDate}T00:00:00+08:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const contacts = await prisma.dutyContact.findMany({
    where: {
      unitId: unit.id,
      dutyDate: {
        gte: dayStart,
        lt: dayEnd,
      },
    },
    orderBy: [{ departmentName: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
  });

  if (contacts.length === 0) {
    return {
      detail: null,
      availableDates,
    };
  }

  const groupMap = new Map<
    string,
    {
      departmentName: string;
      contacts: {
        id: number;
        departmentName: string;
        personName: string;
        phone?: string;
      }[];
    }
  >();
  for (const row of contacts) {
    const group = groupMap.get(row.departmentName) ?? {
      departmentName: row.departmentName,
      contacts: [],
    };
    group.contacts.push({
      id: row.id,
      departmentName: row.departmentName,
      personName: row.personName,
      phone: row.phone ?? "",
    });
    groupMap.set(row.departmentName, group);
  }

  return {
    detail: {
      date: targetDate,
      unitSlug: unit.code ?? `unit-${unit.id}`,
      unitName: unit.name,
      groups: [...groupMap.values()],
    },
    availableDates,
  };
}

async function resolveUnitBySlug(unitSlug: string) {
  if (unitSlug.startsWith("unit-")) {
    const id = Number(unitSlug.slice(5));
    if (Number.isFinite(id)) {
      return prisma.unit.findUnique({
        where: { id },
      });
    }
  }
  return prisma.unit.findFirst({
    where: {
      code: unitSlug,
    },
  });
}

function normalizeDate(input?: string) {
  if (!input) {
    return null;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(input) ? input : null;
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function listDutyOverviewRowsByMonth(activeDate: string) {
  const monthStart = new Date(`${activeDate}T00:00:00+08:00`);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1, 1);
  monthEnd.setHours(0, 0, 0, 0);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  return prisma.dutyOverview.findMany({
    where: {
      dutyDate: {
        gte: monthStart,
        lt: monthEnd,
      },
    },
    include: {
      unit: true,
    },
    orderBy: [{ dutyDate: "asc" }, { unit: { sortOrder: "asc" } }, { unitId: "asc" }],
  });
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

function toChineseDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function toMonthLabel(isoDate: string) {
  const [year, month] = isoDate.split("-");
  return `${year}年${Number(month)}月`;
}
