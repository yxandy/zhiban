import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import { getRuntimeConfig } from "@/lib/env";
import { runDutyExcelImportCommit, runDutyExcelImportDryRun } from "@/lib/services/import-service";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    return await handleAdminImportForm(formData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 },
    );
  }
}

export async function handleAdminImportForm(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const sourceMonthRaw = String(formData.get("sourceMonth") ?? "").trim();
  const sourceMonth = normalizeSourceMonth(sourceMonthRaw);
  const mode = String(formData.get("mode") ?? "dry-run");
  const levelOneFile = formData.get("levelOneFile");
  const levelTwoFile = formData.get("levelTwoFile");

  if (!isUploadBinary(levelOneFile) || !isUploadBinary(levelTwoFile)) {
    return NextResponse.json(
      {
        ok: false,
        message: "请同时上传一级和二级 Excel 文件。",
      },
      { status: 400 },
    );
  }

  const config = getRuntimeConfig();
  if (password !== config.adminImportPassword) {
    return NextResponse.json(
      {
        ok: false,
        message: "上传密码错误。",
      },
      { status: 401 },
    );
  }

  try {
    const [levelOneBuffer, levelTwoBuffer] = await Promise.all([
      Buffer.from(await levelOneFile.arrayBuffer()),
      Buffer.from(await levelTwoFile.arrayBuffer()),
    ]);

    return handleAdminImportPayload({
      password,
      sourceMonth: sourceMonth || undefined,
      mode: mode === "commit" ? "commit" : "dry-run",
      levelOneBuffer,
      levelTwoBuffer,
      fileName: `${(levelOneFile as File).name} + ${(levelTwoFile as File).name}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json(
      {
        ok: false,
        message: `解析失败：${message}`,
      },
      { status: 400 },
    );
  }
}

export async function handleAdminImportPayload(input: {
  password: string;
  sourceMonth?: string;
  mode?: "dry-run" | "commit";
  fileName?: string;
  levelOneBuffer: Buffer;
  levelTwoBuffer: Buffer;
}) {
  const config = getRuntimeConfig();
  if (input.password !== config.adminImportPassword) {
    return NextResponse.json(
      {
        ok: false,
        message: "上传密码错误。",
      },
      { status: 401 },
    );
  }

  const mode = input.mode ?? "dry-run";
  const normalizedMonth = normalizeSourceMonth(input.sourceMonth ?? "");
  const result =
    mode === "commit"
      ? await runDutyExcelImportCommit({
          levelOneBuffer: input.levelOneBuffer,
          levelTwoBuffer: input.levelTwoBuffer,
          sourceMonth: normalizedMonth || undefined,
          fileName: input.fileName,
        })
      : runDutyExcelImportDryRun({
          levelOneBuffer: input.levelOneBuffer,
          levelTwoBuffer: input.levelTwoBuffer,
          sourceMonth: normalizedMonth || undefined,
        });

  return NextResponse.json({
    ok: true,
    message: mode === "commit" ? "导入成功（已写入数据库）。" : "解析成功（dry-run，未写入数据库）。",
    data: result,
  });
}

function isUploadBinary(value: FormDataEntryValue | null): value is Blob {
  if (!value) {
    return false;
  }
  return value instanceof Blob;
}

function normalizeSourceMonth(input: string): string {
  const normalized = input.trim();
  if (!normalized) {
    return "";
  }
  const matched = normalized.match(/^(\d{4})-(\d{1,2})$/);
  if (!matched) {
    return normalized;
  }
  const year = matched[1];
  const month = Number(matched[2]);
  if (!Number.isFinite(month) || month < 1 || month > 12) {
    return normalized;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}
