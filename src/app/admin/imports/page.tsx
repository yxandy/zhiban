"use client";

import { FormEvent, useMemo, useState } from "react";

type ImportDryRunResult = {
  sourceMonth: string;
  overviewCount: number;
  contactCount: number;
  filteredStatusRows: number;
  importBatchId?: number;
  skippedTemplateOnlyUnits: string[];
  unmatchedUnitsFromLevelOne: string[];
  unmatchedUnitsFromLevelTwo: string[];
  warnings: string[];
};

export default function AdminImportsPage() {
  const [password, setPassword] = useState("");
  const [sourceMonth, setSourceMonth] = useState("");
  const [mode, setMode] = useState<"dry-run" | "commit">("dry-run");
  const [levelOneFile, setLevelOneFile] = useState<File | null>(null);
  const [levelTwoFile, setLevelTwoFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<ImportDryRunResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitDisabled = useMemo(() => {
    return isSubmitting || !password || !levelOneFile || !levelTwoFile;
  }, [isSubmitting, password, levelOneFile, levelTwoFile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!levelOneFile || !levelTwoFile) {
      setErrorMessage("请同时上传一级和二级 Excel 文件。");
      setMessage("");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setMessage("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.set("password", password);
      if (sourceMonth.trim()) {
        formData.set("sourceMonth", sourceMonth.trim());
      }
      formData.set("mode", mode);
      formData.set("levelOneFile", levelOneFile);
      formData.set("levelTwoFile", levelTwoFile);

      const response = await fetch("/api/admin/imports", {
        method: "POST",
        body: formData,
      });
      const json = (await response.json()) as {
        ok: boolean;
        message: string;
        data?: ImportDryRunResult;
      };

      if (!response.ok || !json.ok) {
        setErrorMessage(json.message || "解析失败，请稍后重试。");
        return;
      }

      setMessage(json.message || "解析成功。");
      setResult(json.data ?? null);
    } catch {
      setErrorMessage("请求失败，请检查网络或稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <h1 className="text-lg font-semibold text-slate-900">管理员导入</h1>

      <form className="space-y-4 rounded-lg border border-slate-200 bg-white p-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="password-input">
            上传密码
          </label>
          <input
            id="password-input"
            type="password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="month-input">
            月份（可选，格式 YYYY-MM）
          </label>
          <input
            id="month-input"
            type="text"
            placeholder="例如 2026-04"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            value={sourceMonth}
            onChange={(event) => setSourceMonth(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">执行模式</p>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="mode"
              value="dry-run"
              checked={mode === "dry-run"}
              onChange={() => setMode("dry-run")}
            />
            仅解析（dry-run，不写库）
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="mode"
              value="commit"
              checked={mode === "commit"}
              onChange={() => setMode("commit")}
            />
            写入数据库（commit）
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="level-one-file">
            一级值班表（首页摘要）
          </label>
          <input
            id="level-one-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => setLevelOneFile(event.target.files?.[0] ?? null)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="level-two-file">
            二级值班表（详情联系人）
          </label>
          <input
            id="level-two-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => setLevelTwoFile(event.target.files?.[0] ?? null)}
          />
        </div>

        <button
          type="submit"
          disabled={submitDisabled}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "处理中..." : mode === "commit" ? "开始导入（写入数据库）" : "开始解析（dry-run）"}
        </button>
      </form>

      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>
      ) : null}

      {result ? (
        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">解析结果</h2>
          {result.importBatchId ? (
            <p className="text-sm text-slate-700">导入批次 ID：{result.importBatchId}</p>
          ) : null}
          <p className="text-sm text-slate-700">来源月份：{result.sourceMonth}</p>
          <p className="text-sm text-slate-700">首页摘要记录：{result.overviewCount}</p>
          <p className="text-sm text-slate-700">详情联系人记录：{result.contactCount}</p>
          <p className="text-sm text-slate-700">二级状态过滤行：{result.filteredStatusRows}</p>

          <ListBlock title="仅模板无数据单位" items={result.skippedTemplateOnlyUnits} />
          <ListBlock title="仅一级存在单位" items={result.unmatchedUnitsFromLevelOne} />
          <ListBlock title="仅二级存在单位" items={result.unmatchedUnitsFromLevelTwo} />
          <ListBlock title="解析告警" items={result.warnings} />
        </section>
      ) : null}
    </main>
  );
}

function ListBlock(props: { title: string; items: string[] }) {
  const { title, items } = props;
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-slate-800">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">无</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
