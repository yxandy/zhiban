import path from "node:path";
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { runDutyExcelImportDryRun } from "@/lib/services/import-service";

describe("runDutyExcelImportDryRun", () => {
  const docsDir = path.resolve(process.cwd(), "docs");

  it("应返回一级和二级解析统计结果", async () => {
    const levelOneBuffer = await readFile(path.join(docsDir, "一级.xlsx"));
    const levelTwoBuffer = await readFile(path.join(docsDir, "二级.xlsx"));

    const result = runDutyExcelImportDryRun({
      levelOneBuffer,
      levelTwoBuffer,
      sourceMonth: "2026-04",
    });

    expect(result.overviewCount).toBeGreaterThan(700);
    expect(result.contactCount).toBeGreaterThan(4000);
    expect(result.filteredStatusRows).toBeGreaterThan(0);
    expect(result.unmatchedUnitsFromLevelOne).toContain("路桥运营事业部");
  });

  it("未显式传 sourceMonth 时应从二级标题识别月份", async () => {
    const levelOneBuffer = await readFile(path.join(docsDir, "一级.xlsx"));
    const levelTwoBuffer = await readFile(path.join(docsDir, "二级.xlsx"));

    const result = runDutyExcelImportDryRun({
      levelOneBuffer,
      levelTwoBuffer,
    });

    expect(result.sourceMonth).toBe("2026-04");
  });
});
