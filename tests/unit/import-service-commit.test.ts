import { describe, expect, it, vi, beforeEach } from "vitest";

const parseLevelOneWorkbookFromBufferMock = vi.fn();
const parseLevelTwoWorkbookFromBufferMock = vi.fn();
const detectSourceMonthFromLevelTwoWorkbookBufferMock = vi.fn();

const importBatchCreateMock = vi.fn();
const importBatchUpdateMock = vi.fn();
const unitFindManyMock = vi.fn();
const unitCreateManyMock = vi.fn();
const dutyOverviewDeleteManyMock = vi.fn();
const dutyContactDeleteManyMock = vi.fn();
const dutyOverviewCreateManyMock = vi.fn();
const dutyContactCreateManyMock = vi.fn();

const prismaTransactionMock = vi.fn();

vi.mock("@/lib/importers/excel-duty-importer", () => ({
  parseLevelOneWorkbookFromBuffer: parseLevelOneWorkbookFromBufferMock,
  parseLevelTwoWorkbookFromBuffer: parseLevelTwoWorkbookFromBufferMock,
  detectSourceMonthFromLevelTwoWorkbookBuffer: detectSourceMonthFromLevelTwoWorkbookBufferMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    importBatch: {
      create: importBatchCreateMock,
      update: importBatchUpdateMock,
    },
    $transaction: prismaTransactionMock,
  },
}));

describe("runDutyExcelImportCommit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    detectSourceMonthFromLevelTwoWorkbookBufferMock.mockReturnValue("2026-04");
    parseLevelOneWorkbookFromBufferMock.mockReturnValue({
      records: [
        {
          unitName: "德州运管中心",
          dutyDate: "2026-04-01",
          leaderName: "甲",
          leaderPhone: "13800000000",
          middleManagerName: "乙",
          middleManagerPhone: "13900000000",
          staffName: "丙",
          staffPhone: "13700000000",
        },
      ],
      skippedTemplateOnlyUnits: [],
      warnings: [],
    });
    parseLevelTwoWorkbookFromBufferMock.mockReturnValue({
      records: [
        {
          unitName: "德州运管中心",
          dutyDate: "2026-04-01",
          departmentName: "德州站",
          personName: "张三",
          role: "站长",
          phone: null,
        },
      ],
      filteredStatusRows: 0,
      warnings: [],
    });
    importBatchCreateMock.mockResolvedValue({ id: 101 });
    unitFindManyMock
      .mockResolvedValueOnce([{ name: "德州运管中心" }])
      .mockResolvedValueOnce([{ id: 1, name: "德州运管中心" }]);
    unitCreateManyMock.mockResolvedValue({ count: 0 });
    dutyOverviewDeleteManyMock.mockResolvedValue({ count: 0 });
    dutyContactDeleteManyMock.mockResolvedValue({ count: 0 });
    dutyOverviewCreateManyMock.mockResolvedValue({ count: 1 });
    dutyContactCreateManyMock.mockResolvedValue({ count: 1 });
    importBatchUpdateMock.mockResolvedValue({ id: 101 });

    prismaTransactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<void>) => {
      const tx = {
        unit: {
          findMany: unitFindManyMock,
          createMany: unitCreateManyMock,
        },
        dutyOverview: {
          deleteMany: dutyOverviewDeleteManyMock,
          createMany: dutyOverviewCreateManyMock,
        },
        dutyContact: {
          deleteMany: dutyContactDeleteManyMock,
          createMany: dutyContactCreateManyMock,
        },
        importBatch: {
          update: importBatchUpdateMock,
        },
      };
      await callback(tx);
    });
  });

  it("应写入批次、覆盖当月数据并返回批次号", async () => {
    const { runDutyExcelImportCommit } = await import("@/lib/services/import-service");
    const result = await runDutyExcelImportCommit({
      levelOneBuffer: Buffer.from("a"),
      levelTwoBuffer: Buffer.from("b"),
      sourceMonth: "2026-04",
      fileName: "一级.xlsx + 二级.xlsx",
    });

    expect(importBatchCreateMock).toHaveBeenCalledTimes(1);
    expect(dutyOverviewDeleteManyMock).toHaveBeenCalledTimes(1);
    expect(dutyContactDeleteManyMock).toHaveBeenCalledTimes(1);
    expect(dutyOverviewCreateManyMock).toHaveBeenCalledTimes(1);
    expect(dutyContactCreateManyMock).toHaveBeenCalledTimes(1);
    expect(importBatchUpdateMock).toHaveBeenCalled();
    expect(result.importBatchId).toBe(101);
    expect(result.overviewCount).toBe(1);
    expect(result.contactCount).toBe(1);
  });
});
