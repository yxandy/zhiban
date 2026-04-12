import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  parseLevelOneWorkbook,
  parseLevelTwoWorkbook,
  splitNameAndPhone,
} from "@/lib/importers/excel-duty-importer";

describe("excel duty importer", () => {
  const docsDir = path.resolve(process.cwd(), "docs");
  const levelOneFile = path.join(docsDir, "一级.xlsx");
  const levelTwoFile = path.join(docsDir, "二级.xlsx");

  it("应能拆分一级姓名与电话", () => {
    expect(splitNameAndPhone("于忠胜13589911999")).toEqual({
      name: "于忠胜",
      phone: "13589911999",
    });
    expect(splitNameAndPhone("唐正87564122")).toEqual({
      name: "唐正",
      phone: "87564122",
    });
    expect(splitNameAndPhone("仅姓名")).toEqual({
      name: "仅姓名",
      phone: null,
    });
  });

  it("应能解析一级首页摘要并跳过仅模板sheet", () => {
    const parsed = parseLevelOneWorkbook(levelOneFile);

    expect(parsed.records.length).toBeGreaterThan(700);
    expect(parsed.skippedTemplateOnlyUnits).toContain("泰曲路运管中心");

    const sample = parsed.records.find(
      (item) =>
        item.unitName === "德州运管中心" &&
        item.dutyDate === "2026-04-01",
    );

    expect(sample).toBeDefined();
    expect(sample?.leaderName).toBe("初文晓");
    expect(sample?.leaderPhone).toBe("15966658218");
  });

  it("应能解析二级详情并应用单位别名", () => {
    const parsed = parseLevelTwoWorkbook(levelTwoFile, {
      sourceMonth: "2026-04",
      unitAliasMap: {
        德州运管中心: "德州运管中心-映射",
      },
    });

    expect(parsed.records.length).toBeGreaterThan(4000);
    expect(parsed.filteredStatusRows).toBeGreaterThan(0);

    const sample = parsed.records.find(
      (item) =>
        item.unitName === "德州运管中心-映射" &&
        item.departmentName === "德州站" &&
        item.dutyDate === "2026-04-01",
    );

    expect(sample).toBeDefined();
    expect(sample?.personName).toBe("崔红芬");
    expect(sample?.role).toBe("站长");
    expect(sample?.phone).toBeNull();
    expect(parsed.records.some((item) => item.unitName === "德州运管中心-映射")).toBe(
      true,
    );
  });
});
