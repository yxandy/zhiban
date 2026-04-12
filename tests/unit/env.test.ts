import { describe, expect, it } from "vitest";

import { buildRuntimeConfig } from "@/lib/env";

describe("buildRuntimeConfig", () => {
  it("在启用模拟数据时返回模拟模式配置", () => {
    const result = buildRuntimeConfig({
      DATABASE_URL: "mysql://tester:secret@192.168.1.20:3306/zhiban?charset=utf8mb4",
      ADMIN_IMPORT_PASSWORD: "secret-password",
      USE_MOCK_DATA: "true",
    });

    expect(result.useMockData).toBe(true);
    expect(result.databaseHost).toBe("192.168.1.20");
    expect(result.adminImportPassword).toBe("secret-password");
  });

  it("在缺少密码时抛出清晰错误", () => {
    expect(() =>
      buildRuntimeConfig({
        DATABASE_URL: "mysql://tester:secret@192.168.1.20:3306/zhiban?charset=utf8mb4",
        USE_MOCK_DATA: "false",
      }),
    ).toThrow("缺少环境变量 ADMIN_IMPORT_PASSWORD");
  });
});
