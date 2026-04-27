import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminImportsPage from "@/app/admin/imports/page";

const fetchMock = vi.fn();

describe("AdminImportsPage", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("应展示上传表单核心字段", () => {
    render(<AdminImportsPage />);

    expect(screen.getByLabelText("上传密码")).toBeInTheDocument();
    expect(screen.getByLabelText("一级值班表（首页摘要）")).toBeInTheDocument();
    expect(screen.getByLabelText("二级值班表（详情联系人）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始解析（dry-run）" })).toBeInTheDocument();
    expect(screen.getByLabelText("仅解析（dry-run，不写库）")).toBeInTheDocument();
    expect(screen.getByLabelText("写入数据库（commit）")).toBeInTheDocument();
  });

  it("提交成功后应展示解析统计", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          message: "解析成功（dry-run，未写入数据库）。",
          data: {
            sourceMonth: "2026-04",
            overviewCount: 800,
            contactCount: 4700,
            filteredStatusRows: 12,
            skippedTemplateOnlyUnits: ["泰曲路运管中心"],
            unmatchedUnitsFromLevelOne: ["路桥运营事业部"],
            unmatchedUnitsFromLevelTwo: [],
            warnings: [],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const user = userEvent.setup();
    render(<AdminImportsPage />);

    await user.type(screen.getByLabelText("上传密码"), "secret");
    await user.type(screen.getByLabelText("月份（可选，格式 YYYY-MM）"), "2026-04");
    await user.upload(
      screen.getByLabelText("一级值班表（首页摘要）"),
      new File(["a"], "一级.xlsx"),
    );
    await user.upload(
      screen.getByLabelText("二级值班表（详情联系人）"),
      new File(["b"], "二级.xlsx"),
    );
    await user.click(screen.getByRole("button", { name: "开始解析（dry-run）" }));

    expect(await screen.findByText("解析成功（dry-run，未写入数据库）。")).toBeInTheDocument();
    expect(screen.getByText("首页摘要记录：800")).toBeInTheDocument();
    expect(screen.getByText("详情联系人记录：4700")).toBeInTheDocument();
    expect(screen.getByText("二级状态过滤行：12")).toBeInTheDocument();
  });

  it("切换为 commit 后应提交写库模式并展示批次号", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          message: "导入成功（已写入数据库）。",
          data: {
            sourceMonth: "2026-04",
            overviewCount: 800,
            contactCount: 4700,
            filteredStatusRows: 12,
            importBatchId: 21,
            skippedTemplateOnlyUnits: [],
            unmatchedUnitsFromLevelOne: [],
            unmatchedUnitsFromLevelTwo: [],
            warnings: [],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const user = userEvent.setup();
    render(<AdminImportsPage />);

    await user.type(screen.getByLabelText("上传密码"), "secret");
    await user.upload(screen.getByLabelText("一级值班表（首页摘要）"), new File(["a"], "一级.xlsx"));
    await user.upload(screen.getByLabelText("二级值班表（详情联系人）"), new File(["b"], "二级.xlsx"));
    await user.click(screen.getByLabelText("写入数据库（commit）"));
    expect(screen.getByRole("button", { name: "开始导入（写入数据库）" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "开始导入（写入数据库）" }));

    const body = fetchMock.mock.calls[0]?.[1]?.body;
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("mode")).toBe("commit");
    expect(await screen.findByText("导入成功（已写入数据库）。")).toBeInTheDocument();
    expect(screen.getByText("导入批次 ID：21")).toBeInTheDocument();
  });

  it("接口返回500文本错误时应展示后端原始错误", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(new Response("sourceMonth 格式错误：2026-5", { status: 500 }));

    const user = userEvent.setup();
    render(<AdminImportsPage />);

    await user.type(screen.getByLabelText("上传密码"), "secret");
    await user.type(screen.getByLabelText("月份（可选，格式 YYYY-MM）"), "2026-5");
    await user.upload(screen.getByLabelText("一级值班表（首页摘要）"), new File(["a"], "一级.xlsx"));
    await user.upload(screen.getByLabelText("二级值班表（详情联系人）"), new File(["b"], "二级.xlsx"));
    await user.click(screen.getByRole("button", { name: "开始解析（dry-run）" }));

    expect(await screen.findByText("sourceMonth 格式错误：2026-5")).toBeInTheDocument();
  });
});
