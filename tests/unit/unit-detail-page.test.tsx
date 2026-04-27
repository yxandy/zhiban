import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import UnitDetailPage from "@/app/units/[unitSlug]/page";

describe("UnitDetailPage", () => {
  it("展示单位详情页的紧凑联系人列表", async () => {
    render(
      await UnitDetailPage({
        params: Promise.resolve({ unitSlug: "luqiao-yunying" }),
        searchParams: Promise.resolve({ date: "2026-04-10" }),
      }),
    );

    expect(screen.getByRole("link", { name: "返回" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "展开日期选择" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回当天" })).toBeInTheDocument();
    expect(screen.getByText("路桥运营事业部值班详情")).toBeInTheDocument();
    expect(screen.getByText("2026年4月10日")).toBeInTheDocument();
    expect(screen.getByText("运营调度中心")).toBeInTheDocument();
    expect(screen.getByText("范文东")).toBeInTheDocument();
    expect(screen.getByText("手机 18660196617")).toBeInTheDocument();
    expect(screen.getByText("座机 0531-88990011")).toBeInTheDocument();
    expect(screen.getByText("杨洋")).toBeInTheDocument();
    expect(screen.getByText("该单位无内线电话")).toBeInTheDocument();
    expect(screen.getByText("关停")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "拨打手机 18660196617" })).toHaveAttribute("href", "tel:18660196617");
    expect(screen.getByRole("link", { name: "拨打座机 0531-88990011" })).toHaveAttribute("href", "tel:0531-88990011");
  });

  it("内线电话点击时展示提示文案", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      await UnitDetailPage({
        params: Promise.resolve({ unitSlug: "luqiao-yunying" }),
        searchParams: Promise.resolve({ date: "2026-04-10" }),
      }),
    );

    await user.click(screen.getByRole("button", { name: "内线电话 262751" }));
    expect(alertSpy).toHaveBeenCalledWith("内线电话请用单位内部座机拨打");
    alertSpy.mockRestore();
  });

  it("没有详情数据时展示空状态", async () => {
    render(
      await UnitDetailPage({
        params: Promise.resolve({ unitSlug: "not-exists" }),
        searchParams: Promise.resolve({ date: "2026-04-10", unitName: "工程事业部" }),
      }),
    );

    expect(screen.getByText("工程事业部值班详情")).toBeInTheDocument();
    expect(screen.getByText("该单位本月没有报送更多的值班详情")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "展开日期选择" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回当天" })).toBeInTheDocument();
  });
});
