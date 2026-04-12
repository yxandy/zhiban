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

  // 二级真实文件从第 3 行开始是数据，运管中心列需要前向填充。
  let currentCenter = "";
  for (let i = 2; i < rows.length; i += 1) {
    const row = rows[i];
    const centerCandidate = normalizeCell(row[2]);
    if (centerCandidate) {
      currentCenter = centerCandidate;
    }

    const stationName = normalizeCell(row[3]);
    if (!stationName) {
      continue;
    }

    for (let day = 1; day <= 30; day += 1) {
      const rawDuty = normalizeCell(row[3 + day]);
      if (!rawDuty) {
        continue;
      }

      if (isStatusOnlyText(rawDuty)) {
        filteredStatusRows += 1;
        continue;
      }

      if (!currentCenter) {
        warnings.push(`二级第 ${i + 1} 行存在收费站但缺少运管中心: ${stationName}`);
        continue;
      }

      const unitName = aliasMap[currentCenter] ?? currentCenter;
      const dutyDate = `${month.year}-${pad2(month.month)}-${pad2(day)}`;
      const parsed = splitPersonAndRole(rawDuty);

      records.push({
        unitName,
        dutyDate,
        departmentName: stationName,
        personName: parsed.personName,
        role: parsed.role,
        phone: null,
      });
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
