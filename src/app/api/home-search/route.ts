import { NextResponse } from "next/server";

import { searchHomeTarget } from "@/lib/repositories/duty-repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = String(searchParams.get("keyword") ?? "").trim();
  const date = String(searchParams.get("date") ?? "").trim();
  const mode = String(searchParams.get("mode") ?? "").trim();

  if (!keyword) {
    return NextResponse.json(
      {
        ok: false,
        message: "请输入搜索关键词。",
      },
      { status: 400 },
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      {
        ok: false,
        message: "日期参数格式错误。",
      },
      { status: 400 },
    );
  }

  try {
    const result = await searchHomeTarget({
      keyword,
      date,
      forceMode: mode || undefined,
    });
    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "搜索失败";
    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 },
    );
  }
}
