import * as XLSX from "xlsx";

export type DutyOverviewImportRecord = {
  unitName: string;
  dutyDate: string;
  leaderName: string;
  leaderPhone: string | null;
  middleManagerName: string;
  middleManagerPhone: string | null;
  staffName: string;
  staffPhone: string | null;
};

export type DutyContactImportRecord = {
  unitName: string;
  dutyDate: string;
  departmentName: string;
  personName: string;
  role: string | null;
  phone: string | null;
  mobilePhone: string | null;
  landlineType: "internal" | "landline" | "none" | null;
  landlinePhone: string | null;
  statusTag: "shutdown" | null;
};

export type LevelOneParseResult = {
  records: DutyOverviewImportRecord[];
  skippedTemplateOnlyUnits: string[];
  warnings: string[];
};

export type LevelTwoParseOptions = {
  sourceMonth: string;
  unitAliasMap?: Record<string, string>;
};

export type LevelTwoParseResult = {
  records: DutyContactImportRecord[];
  filteredStatusRows: number;
  warnings: string[];
};

export function splitNameAndPhone(input: unknown): {
  name: string;
  phone: string | null;
} {
  const raw = normalizeCell(input);
  if (!raw) {
    return { name: "", phone: null };
  }

  const mobileMatch = raw.match(/(1\d{10})/);
  if (mobileMatch) {
    const phone = mobileMatch[1];
    const name = raw.replace(phone, "").replace(/\s+/g, "");
    return { name, phone };
  }

  const tailDigitsMatch = raw.match(/(\d{7,})$/);
  if (tailDigitsMatch) {
    const phone = tailDigitsMatch[1];
    const name = raw.slice(0, raw.length - phone.length).replace(/\s+/g, "");
    return { name, phone };
  }

  return { name: raw.replace(/\s+/g, ""), phone: null };
}

export function parseLevelOneWorkbook(filePath: string): LevelOneParseResult {
  const workbook = readWorkbookFromSource(filePath);
  return parseLevelOneWorkbookInternal(workbook);
}

export function parseLevelOneWorkbookFromBuffer(buffer: Buffer): LevelOneParseResult {
  const workbook = readWorkbookFromSource(buffer);
  return parseLevelOneWorkbookInternal(workbook);
}

export function parseLevelTwoWorkbook(
  filePath: string,
  options: LevelTwoParseOptions,
): LevelTwoParseResult {
  const workbook = readWorkbookFromSource(filePath);
  return parseLevelTwoWorkbookInternal(workbook, options);
}

export function parseLevelTwoWorkbookFromBuffer(
  buffer: Buffer,
  options: LevelTwoParseOptions,
): LevelTwoParseResult {
  const workbook = readWorkbookFromSource(buffer);
  return parseLevelTwoWorkbookInternal(workbook, options);
}

export function detectSourceMonthFromLevelTwoWorkbook(filePath: string): string | null {
  const workbook = readWorkbookFromSource(filePath);
  return detectSourceMonthFromLevelTwoWorkbookInternal(workbook);
}

export function detectSourceMonthFromLevelTwoWorkbookBuffer(buffer: Buffer): string | null {
  const workbook = readWorkbookFromSource(buffer);
  return detectSourceMonthFromLevelTwoWorkbookInternal(workbook);
}

function parseLevelOneWorkbookInternal(workbook: XLSX.WorkBook): LevelOneParseResult {

  const records: DutyOverviewImportRecord[] = [];
  const skippedTemplateOnlyUnits: string[] = [];
  const warnings: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      continue;
    }

    const rows = XLSX.utils.sheet_to_json<(string | number | Date)[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    if (rows.length <= 1) {
      skippedTemplateOnlyUnits.push(sheetName);
      continue;
    }

    let hasDataRow = false;
    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i];
      const rawDate = normalizeCell(row[0]);

      if (!rawDate || rawDate === "值班时间") {
        continue;
      }

      const dutyDate = normalizeDateString(rawDate);
      if (!dutyDate) {
        warnings.push(`一级 ${sheetName} 第 ${i + 1} 行日期无法识别: ${rawDate}`);
        continue;
      }

      hasDataRow = true;
      const leader = splitNameAndPhone(row[1]);
      const middle = splitNameAndPhone(row[2]);
      const staff = splitNameAndPhone(row[3]);

      records.push({
        unitName: sheetName,
        dutyDate,
        leaderName: leader.name,
        leaderPhone: leader.phone,
        middleManagerName: middle.name,
        middleManagerPhone: middle.phone,
        staffName: staff.name,
        staffPhone: staff.phone,
      });
    }

    if (!hasDataRow) {
      skippedTemplateOnlyUnits.push(sheetName);
    }
  }

  return {
    records,
    skippedTemplateOnlyUnits,
    warnings,
  };
}

function parseLevelTwoWorkbookInternal(
  workbook: XLSX.WorkBook,
  options: LevelTwoParseOptions,
): LevelTwoParseResult {
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return {
      records: [],
      filteredStatusRows: 0,
      warnings: ["二级工作簿没有可用工作表"],
    };
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | Date)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  const month = parseSourceMonth(options.sourceMonth);
  const aliasMap = options.unitAliasMap ?? {};
  const records: DutyContactImportRecord[] = [];
  const warnings: string[] = [];
  let filteredStatusRows = 0;
  const headerRow = rows[1] ?? [];
  const centerColumnIndex = findColumnIndex(headerRow, /^运管中心$/);
  const stationColumnIndex = findColumnIndex(headerRow, /^收费站$/);
  const dayColumns = readDayColumns(headerRow);

  if (centerColumnIndex < 0 || stationColumnIndex < 0 || dayColumns.length === 0) {
    return {
      records: [],
      filteredStatusRows: 0,
      warnings: ["二级工作簿表头缺少必要列（运管中心/收费站/日期列）"],
    };
  }

  // 二级真实文件从第3行开始是数据，运管中心列需要前向填充。
  let currentCenter = "";
  for (let i = 2; i < rows.length; i += 1) {
    const row = rows[i];
    const centerCandidateRaw = normalizeCell(row[centerColumnIndex]);
    const centerFallback = normalizeCell(row[centerColumnIndex + 1]);
    const centerCandidate = isLikelyCenterName(centerCandidateRaw)
      ? centerCandidateRaw
      : centerFallback;
    if (centerCandidate) {
      currentCenter = centerCandidate;
    }

    const stationName = normalizeCell(row[stationColumnIndex]);
    if (!stationName) {
      continue;
    }

    for (const dayColumn of dayColumns) {
      const rawDuty = normalizeCell(row[dayColumn.index]);
      if (!rawDuty) {
        continue;
      }

      if (!currentCenter) {
        warnings.push(`二级第 ${i + 1} 行存在收费站但缺少运管中心: ${stationName}`);
        continue;
      }

      const unitName = aliasMap[currentCenter] ?? currentCenter;
      const dutyDate = `${month.year}-${pad2(month.month)}-${pad2(dayColumn.day)}`;
      const dutyItems = splitDutyEntries(rawDuty);
      for (const dutyItem of dutyItems) {
        const parsed = parseDutyItem(dutyItem);
        if (parsed.kind === "skip") {
          filteredStatusRows += 1;
          continue;
        }

        if (parsed.kind === "shutdown") {
          records.push({
            unitName,
            dutyDate,
            departmentName: stationName,
            personName: "",
            role: null,
            phone: null,
            mobilePhone: null,
            landlineType: null,
            landlinePhone: null,
            statusTag: "shutdown",
          });
          continue;
        }

        records.push({
          unitName,
          dutyDate,
          departmentName: stationName,
          personName: parsed.personName,
          role: parsed.role,
          phone: parsed.mobilePhone,
          mobilePhone: parsed.mobilePhone,
          landlineType: parsed.landlineType,
          landlinePhone: parsed.landlinePhone,
          statusTag: null,
        });
      }
    }
  }

  return {
    records,
    filteredStatusRows,
    warnings,
  };
}

function detectSourceMonthFromLevelTwoWorkbookInternal(workbook: XLSX.WorkBook): string | null {
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return null;
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | Date)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  const title = normalizeCell(rows[0]?.[0]);
  if (!title) {
    return null;
  }
  const matched = title.match(/(\d{4})年(\d{1,2})月/);
  if (!matched) {
    return null;
  }

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    return null;
  }

  return `${year}-${pad2(month)}`;
}

function normalizeCell(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const normalized = String(value).replace(/\u3000/g, " ").trim();
  if (normalized.toLowerCase() === "nan") {
    return "";
  }
  return normalized;
}

function normalizeDateString(input: string): string | null {
  const direct = input.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (direct) {
    return `${direct[1]}-${pad2(Number(direct[2]))}-${pad2(Number(direct[3]))}`;
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
}

function parseSourceMonth(sourceMonth: string): { year: number; month: number } {
  const matched = sourceMonth.match(/^(\d{4})-(\d{1,2})$/);
  if (!matched) {
    throw new Error(`sourceMonth 格式错误，应为 YYYY-MM，当前值: ${sourceMonth}`);
  }

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  if (month < 1 || month > 12) {
    throw new Error(`sourceMonth 月份范围错误，应为 1-12，当前值: ${sourceMonth}`);
  }

  return { year, month };
}

function splitPersonAndRole(input: string): { personName: string; role: string | null } {
  const normalized = normalizeCell(input);
  if (!normalized) {
    return { personName: "", role: null };
  }

  if (normalized.includes("/")) {
    const [left, ...rest] = normalized.split("/");
    return {
      personName: normalizeCell(left),
      role: normalizeCell(rest.join("/")) || null,
    };
  }

  return {
    personName: normalized,
    role: null,
  };
}

function isStatusOnlyText(input: string): boolean {
  const normalized = normalizeCell(input);
  return normalized === "无" || normalized === "关停";
}

function findColumnIndex(headerRow: (string | number | Date)[], expected: RegExp): number {
  for (let i = 0; i < headerRow.length; i += 1) {
    const value = normalizeCell(headerRow[i]);
    if (expected.test(value)) {
      return i;
    }
  }
  return -1;
}

function readDayColumns(
  headerRow: (string | number | Date)[],
): Array<{ day: number; index: number }> {
  const columns: Array<{ day: number; index: number }> = [];
  for (let i = 0; i < headerRow.length; i += 1) {
    const value = normalizeCell(headerRow[i]);
    const matched = value.match(/^(\d{1,2})日/);
    if (!matched) {
      continue;
    }
    const day = Number(matched[1]);
    if (day >= 1 && day <= 31) {
      columns.push({ day, index: i });
    }
  }
  return columns.sort((a, b) => a.day - b.day);
}

function isLikelyCenterName(input: string): boolean {
  const normalized = normalizeCell(input);
  if (!normalized) {
    return false;
  }
  if (/^\d+$/.test(normalized)) {
    return false;
  }
  return true;
}

function splitDutyEntries(input: string): string[] {
  const normalized = normalizeCell(input);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\r?\n/)
    .flatMap((line) => line.split("、"))
    .map((item) => normalizeCell(item))
    .filter((item) => item.length > 0);
}

function parseDutyItem(input: string):
  | { kind: "skip" }
  | { kind: "shutdown" }
  | {
      kind: "normal";
      personName: string;
      role: string | null;
      mobilePhone: string | null;
      landlineType: "internal" | "landline" | "none" | null;
      landlinePhone: string | null;
    } {
  const normalized = normalizeCell(input);
  if (!normalized || isStatusOnlyText(normalized)) {
    if (normalized === "关停") {
      return { kind: "shutdown" };
    }
    return { kind: "skip" };
  }

  const parts = normalized.split("/").map((part) => normalizeCell(part));
  if (parts.length === 1) {
    const mobilePhone = readMobilePhone(parts[0]);
    const personName = normalizeCell(parts[0].replace(mobilePhone ?? "", ""));
    return {
      kind: "normal",
      personName,
      role: null,
      mobilePhone,
      landlineType: null,
      landlinePhone: null,
    };
  }

  const personName = parts[0] ?? "";
  const role = parts[1] ? normalizeCell(parts[1]) : null;
  const mobilePhone = readMobilePhone(parts[2] ?? "");
  const landlineRaw = normalizeCell(parts.slice(3).join("/"));
  const landline = classifyLandline(landlineRaw);

  return {
    kind: "normal",
    personName,
    role,
    mobilePhone,
    landlineType: landline.type,
    landlinePhone: landline.phone,
  };
}

function readMobilePhone(input: string): string | null {
  const matched = normalizeCell(input).match(/(1\d{10})/);
  return matched ? matched[1] : null;
}

function classifyLandline(input: string): {
  type: "internal" | "landline" | "none" | null;
  phone: string | null;
} {
  const normalized = normalizeCell(input).replace(/\s+/g, "");
  if (!normalized || normalized === "无固话") {
    return {
      type: "none",
      phone: null,
    };
  }

  const digitOnly = normalized.replace(/[^\d]/g, "");
  if (digitOnly.length === 5 || digitOnly.length === 6) {
    return {
      type: "internal",
      phone: digitOnly,
    };
  }

  if (/^0\d{2,3}-?\d+$/.test(normalized)) {
    return {
      type: "landline",
      phone: normalized,
    };
  }

  return {
    type: null,
    phone: digitOnly || null,
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function readWorkbookFromSource(source: string | Buffer): XLSX.WorkBook {
  if (typeof source === "string") {
    return XLSX.readFile(source, {
      cellDates: true,
    });
  }

  return XLSX.read(source, {
    type: "buffer",
    cellDates: true,
  });
}
