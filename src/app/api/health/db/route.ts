import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getRuntimeConfig } from "@/lib/env";

export async function GET() {
  const config = getRuntimeConfig();

  if (config.useMockData) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      databaseHost: config.databaseHost,
      message: "当前为模拟数据模式，未执行数据库连通性检查。",
    });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      mode: "database",
      databaseHost: config.databaseHost,
      message: "远程 MySQL 连接正常。",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";

    return NextResponse.json(
      {
        ok: false,
        mode: "database",
        databaseHost: config.databaseHost,
        message: `远程 MySQL 连接失败：${message}`,
      },
      { status: 500 },
    );
  }
}
