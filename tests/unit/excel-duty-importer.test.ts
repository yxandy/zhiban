import path from "node:path";
import * as XLSX from "xlsx";

import { describe, expect, it } from "vitest";

import {
  parseLevelOneWorkbook,
  parseLevelTwoWorkbookFromBuffer,
  parseLevelTwoWorkbook,
  splitNameAndPhone,
} from "@/lib/importers/excel-duty-importer";

describe("excel duty importer", () => {
  const docsDir = path.resolve(process.cwd(), "docs");
  const levelOneFile = path.join(docsDir, "一级.xlsx");
  const levelTwoFile = path.join(docsDir, "二级.xlsx");
  const levelTwoMayFile = path.join(docsDir, "new 二级.xlsx");

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

  it("应能解析五月二级详情并覆盖31日字段", () => {
    const parsed = parseLevelTwoWorkbook(levelTwoMayFile, {
      sourceMonth: "2026-05",
      unitAliasMap: {
        德州运管中心: "德州运管中心-映射",
      },
    });

    const sample = parsed.records.find(
      (item) =>
        item.unitName === "德州运管中心-映射" &&
        item.departmentName === "德州站" &&
        item.dutyDate === "2026-05-31",
    );
    expect(sample).toBeDefined();
    expect(sample?.personName).toBe("崔红芬");
    expect(sample?.role).toBe("站长");
    expect(sample?.mobilePhone).toBe("13505447555");
    expect(sample?.landlineType).toBe("internal");
    expect(sample?.landlinePhone).toBe("230701");
  });

  it("应能按规则拆分电话并识别关停及多联系人", () => {
    const workbook = XLSX.utils.book_new();
    const rows = [
      [
        "2026年5月份收费站值班表",
      ],
      [
        "序号",
        "运管中心",
        "",
        "收费站",
        "1日值班人员/职务/手机号/固话",
        "31日值班人员/职务/手机号/固话",
      ],
      ["1", "甲中心", "", "甲站", "张三/管理员/13800000000/0531-88990011", "关停"],
      ["2", "", "", "乙站", "李四/副站长/13900000000/无固话\n王五/站长/13700000000/262751（跟班）", ""],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const parsed = parseLevelTwoWorkbookFromBuffer(buffer, {
      sourceMonth: "2026-05",
    });

    const stationA = parsed.records.find((item) => item.departmentName === "甲站" && item.dutyDate === "2026-05-01");
    expect(stationA).toMatchObject({
      personName: "张三",
      role: "管理员",
      mobilePhone: "13800000000",
      landlineType: "landline",
      landlinePhone: "0531-88990011",
      statusTag: null,
    });

    const stationB = parsed.records.filter((item) => item.departmentName === "乙站" && item.dutyDate === "2026-05-01");
    expect(stationB).toHaveLength(2);
    expect(stationB[0]).toMatchObject({
      personName: "李四",
      role: "副站长",
      mobilePhone: "13900000000",
      landlineType: "none",
      landlinePhone: null,
    });
    expect(stationB[1]).toMatchObject({
      personName: "王五",
      role: "站长",
      mobilePhone: "13700000000",
      landlineType: "internal",
      landlinePhone: "262751",
    });

    const shutdown = parsed.records.find((item) => item.departmentName === "甲站" && item.dutyDate === "2026-05-31");
    expect(shutdown).toMatchObject({
      statusTag: "shutdown",
      personName: "",
      mobilePhone: null,
      landlineType: null,
      landlinePhone: null,
    });
  });
});
