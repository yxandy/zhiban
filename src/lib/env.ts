import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string({
      required_error: "缺少环境变量 DATABASE_URL",
      invalid_type_error: "缺少环境变量 DATABASE_URL",
    })
    .min(1, "缺少环境变量 DATABASE_URL"),
  ADMIN_IMPORT_PASSWORD: z
    .string({
      required_error: "缺少环境变量 ADMIN_IMPORT_PASSWORD",
      invalid_type_error: "缺少环境变量 ADMIN_IMPORT_PASSWORD",
    })
    .min(1, "缺少环境变量 ADMIN_IMPORT_PASSWORD"),
  USE_MOCK_DATA: z.enum(["true", "false"]).default("true"),
});

type RuntimeConfig = {
  databaseHost: string;
  databaseUrl: string;
  adminImportPassword: string;
  useMockData: boolean;
};

function readDatabaseHost(databaseUrl: string) {
  try {
    return new URL(databaseUrl).hostname;
  } catch {
    throw new Error("DATABASE_URL 不是合法的 MySQL 连接串");
  }
}

export function buildRuntimeConfig(input: Partial<Record<string, string | undefined>>): RuntimeConfig {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "环境变量配置无效");
  }

  return {
    databaseHost: readDatabaseHost(result.data.DATABASE_URL),
    databaseUrl: result.data.DATABASE_URL,
    adminImportPassword: result.data.ADMIN_IMPORT_PASSWORD,
    useMockData: result.data.USE_MOCK_DATA === "true",
  };
}

let cachedConfig: RuntimeConfig | null = null;

export function getRuntimeConfig() {
  if (!cachedConfig) {
    cachedConfig = buildRuntimeConfig(process.env);
  }

  return cachedConfig;
}
