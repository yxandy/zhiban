import {
  detectSourceMonthFromLevelTwoWorkbookBuffer,
  parseLevelOneWorkbookFromBuffer,
  parseLevelTwoWorkbookFromBuffer,
} from "@/lib/importers/excel-duty-importer";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type RunDutyExcelImportDryRunInput = {
  levelOneBuffer: Buffer;
  levelTwoBuffer: Buffer;
  sourceMonth?: string;
};

export type DutyExcelImportDryRunResult = {
  sourceMonth: string;
  overviewCount: number;
  contactCount: number;
  filteredStatusRows: number;
  skippedTemplateOnlyUnits: string[];
  unmatchedUnitsFromLevelOne: string[];
  unmatchedUnitsFromLevelTwo: string[];
  warnings: string[];
};

export type DutyExcelImportCommitResult = DutyExcelImportDryRunResult & {
  importBatchId: number;
};

const defaultUnitAliasMap: Record<string, string> = {
  利津桥: "利津大桥公司",
};

export function runDutyExcelImportDryRun(
  input: RunDutyExcelImportDryRunInput,
): DutyExcelImportDryRunResult {
  return buildImportSnapshot(input);
}

export async function runDutyExcelImportCommit(
  input: RunDutyExcelImportDryRunInput & {
    fileName?: string;
  },
): Promise<DutyExcelImportCommitResult> {
  const snapshot = buildImportSnapshot(input);
  const fileName = input.fileName ?? "一级.xlsx + 二级.xlsx";
  const unitNames = [
    ...new Set([...snapshot.levelOneResult.records, ...snapshot.levelTwoResult.records].map((item) => item.unitName)),
  ];
  const monthRange = readMonthRange(snapshot.sourceMonth);

  const importBatch = await prisma.importBatch.create({
    data: {
      fileName,
      importStatus: "processing",
    },
    select: {
      id: true,
    },
  });

  try {
    await prisma.$transaction(async (tx) => {
      await ensureUnitsExist(tx, unitNames);

      const units = await tx.unit.findMany({
        where: {
          name: { in: unitNames },
        },
        select: {
          id: true,
          name: true,
        },
      });
      const unitIdByName = new Map(units.map((item) => [item.name, item.id]));
      const unitIds = units.map((item) => item.id);

      if (unitIds.length > 0) {
        await tx.dutyOverview.deleteMany({
          where: {
            unitId: { in: unitIds },
            dutyDate: {
              gte: monthRange.start,
              lt: monthRange.end,
            },
          },
        });

        await tx.dutyContact.deleteMany({
          where: {
            unitId: { in: unitIds },
            dutyDate: {
              gte: monthRange.start,
              lt: monthRange.end,
            },
          },
        });
      }

      const overviewRows = snapshot.levelOneResult.records
        .map((item) => {
          const unitId = unitIdByName.get(item.unitName);
          if (!unitId) {
            return null;
          }
          return {
            dutyDate: new Date(`${item.dutyDate}T00:00:00+08:00`),
            unitId,
            leaderName: item.leaderName || null,
            leaderPhone: item.leaderPhone,
            middleManagerName: item.middleManagerName || null,
            middleManagerPhone: item.middleManagerPhone,
            staffName: item.staffName || null,
            staffPhone: item.staffPhone,
            sourceBatchId: importBatch.id,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (overviewRows.length > 0) {
        await tx.dutyOverview.createMany({
          data: overviewRows,
        });
      }

      const contactRows = snapshot.levelTwoResult.records
        .map((item, index) => {
          const unitId = unitIdByName.get(item.unitName);
          if (!unitId) {
            return null;
          }
          return {
            dutyDate: new Date(`${item.dutyDate}T00:00:00+08:00`),
            unitId,
            departmentName: item.departmentName,
            personName: item.personName,
            phone: item.phone,
            sortOrder: index + 1,
            sourceBatchId: importBatch.id,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (contactRows.length > 0) {
        await tx.dutyContact.createMany({
          data: contactRows,
        });
      }

      await tx.importBatch.update({
        where: {
          id: importBatch.id,
        },
        data: {
          importStatus: "success",
          importedAt: new Date(),
          errorMessage: null,
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    await prisma.importBatch.update({
      where: { id: importBatch.id },
      data: {
        importStatus: "failed",
        errorMessage: message.slice(0, 2000),
      },
    });
    throw error;
  }

  return {
    ...snapshot,
    importBatchId: importBatch.id,
  };
}

function buildImportSnapshot(input: RunDutyExcelImportDryRunInput): DutyExcelImportDryRunResult & {
  levelOneResult: ReturnType<typeof parseLevelOneWorkbookFromBuffer>;
  levelTwoResult: ReturnType<typeof parseLevelTwoWorkbookFromBuffer>;
} {
  const sourceMonth =
    input.sourceMonth ?? detectSourceMonthFromLevelTwoWorkbookBuffer(input.levelTwoBuffer);

  if (!sourceMonth) {
    throw new Error("无法从二级文件识别月份，请手动传入 sourceMonth（格式：YYYY-MM）");
  }

  const levelOneResult = parseLevelOneWorkbookFromBuffer(input.levelOneBuffer);
  const levelTwoResult = parseLevelTwoWorkbookFromBuffer(input.levelTwoBuffer, {
    sourceMonth,
    unitAliasMap: defaultUnitAliasMap,
  });

  const levelOneUnits = new Set(levelOneResult.records.map((item) => item.unitName));
  const levelTwoUnits = new Set(levelTwoResult.records.map((item) => item.unitName));

  return {
    sourceMonth,
    overviewCount: levelOneResult.records.length,
    contactCount: levelTwoResult.records.length,
    filteredStatusRows: levelTwoResult.filteredStatusRows,
    skippedTemplateOnlyUnits: levelOneResult.skippedTemplateOnlyUnits,
    unmatchedUnitsFromLevelOne: [...levelOneUnits].filter((name) => !levelTwoUnits.has(name)).sort(),
    unmatchedUnitsFromLevelTwo: [...levelTwoUnits].filter((name) => !levelOneUnits.has(name)).sort(),
    warnings: [...levelOneResult.warnings, ...levelTwoResult.warnings],
    levelOneResult,
    levelTwoResult,
  };
}

async function ensureUnitsExist(
  tx: Prisma.TransactionClient,
  unitNames: string[],
) {
  if (unitNames.length === 0) {
    return;
  }
  const existing = await tx.unit.findMany({
    where: {
      name: {
        in: unitNames,
      },
    },
    select: {
      name: true,
    },
  });
  const existingNames = new Set(existing.map((item) => item.name));
  const missingNames = unitNames.filter((name) => !existingNames.has(name));
  if (missingNames.length === 0) {
    return;
  }
  await tx.unit.createMany({
    data: missingNames.map((name) => ({
      name,
      sortOrder: 0,
      isActive: true,
    })),
  });
}

function readMonthRange(sourceMonth: string): { start: Date; end: Date } {
  const matched = sourceMonth.match(/^(\d{4})-(\d{2})$/);
  if (!matched) {
    throw new Error(`sourceMonth 格式错误：${sourceMonth}`);
  }
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { start, end };
}
