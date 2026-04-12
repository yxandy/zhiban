import { afterEach, describe, expect, it, vi } from "vitest";

const runDutyExcelImportDryRunMock = vi.fn();
const runDutyExcelImportCommitMock = vi.fn();
const getRuntimeConfigMock = vi.fn();

vi.mock("@/lib/services/import-service", () => ({
  runDutyExcelImportDryRun: runDutyExcelImportDryRunMock,
  runDutyExcelImportCommit: runDutyExcelImportCommitMock,
}));

vi.mock("@/lib/env", () => ({
  getRuntimeConfig: getRuntimeConfigMock,
}));

describe("POST /api/admin/imports", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("密码错误时返回 401", async () => {
    getRuntimeConfigMock.mockReturnValue({
      adminImportPassword: "correct-password",
    });

    const { handleAdminImportForm } = await import("@/app/api/admin/imports/route");

    const form = new FormData();
    form.set("password", "wrong-password");
    form.set("levelOneFile", new Blob(["a"]), "一级.xlsx");
    form.set("levelTwoFile", new Blob(["b"]), "二级.xlsx");

    const response = await handleAdminImportForm(form);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
    expect(runDutyExcelImportDryRunMock).not.toHaveBeenCalled();
  });

  it("缺少文件时返回 400", async () => {
    getRuntimeConfigMock.mockReturnValue({
      adminImportPassword: "correct-password",
    });

    const { handleAdminImportForm } = await import("@/app/api/admin/imports/route");

    const form = new FormData();
    form.set("password", "correct-password");
    form.set("levelOneFile", new Blob(["a"]), "一级.xlsx");

    const response = await handleAdminImportForm(form);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
  });

  it("参数正确时返回 dry-run 统计", async () => {
    getRuntimeConfigMock.mockReturnValue({
      adminImportPassword: "correct-password",
    });
    runDutyExcelImportDryRunMock.mockReturnValue({
      sourceMonth: "2026-04",
      overviewCount: 800,
      contactCount: 4700,
      filteredStatusRows: 10,
      skippedTemplateOnlyUnits: ["泰曲路运管中心"],
      unmatchedUnitsFromLevelOne: ["路桥运营事业部"],
      unmatchedUnitsFromLevelTwo: [],
      warnings: [],
    });

    const { handleAdminImportPayload } = await import("@/app/api/admin/imports/route");
    const response = await handleAdminImportPayload({
      password: "correct-password",
      sourceMonth: "2026-04",
      levelOneBuffer: Buffer.from("a"),
      levelTwoBuffer: Buffer.from("b"),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.overviewCount).toBe(800);
    expect(runDutyExcelImportDryRunMock).toHaveBeenCalledTimes(1);
  });

  it("commit 模式时调用写库导入并返回批次号", async () => {
    getRuntimeConfigMock.mockReturnValue({
      adminImportPassword: "correct-password",
    });
    runDutyExcelImportCommitMock.mockResolvedValue({
      sourceMonth: "2026-04",
      overviewCount: 800,
      contactCount: 4700,
      filteredStatusRows: 10,
      importBatchId: 12,
      skippedTemplateOnlyUnits: [],
      unmatchedUnitsFromLevelOne: [],
      unmatchedUnitsFromLevelTwo: [],
      warnings: [],
    });

    const { handleAdminImportPayload } = await import("@/app/api/admin/imports/route");
    const response = await handleAdminImportPayload({
      password: "correct-password",
      sourceMonth: "2026-04",
      mode: "commit",
      levelOneBuffer: Buffer.from("a"),
      levelTwoBuffer: Buffer.from("b"),
      fileName: "一级.xlsx + 二级.xlsx",
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.message).toContain("已写入数据库");
    expect(json.data.importBatchId).toBe(12);
    expect(runDutyExcelImportCommitMock).toHaveBeenCalledTimes(1);
    expect(runDutyExcelImportDryRunMock).not.toHaveBeenCalled();
  });
});
