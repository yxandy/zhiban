import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
    expect(screen.getByText("路桥运营事业部值班详情")).toBeInTheDocument();
    expect(screen.getByText("2026年4月10日")).toBeInTheDocument();
    expect(screen.getByText("运营调度中心")).toBeInTheDocument();
    expect(screen.getByText("运营调度中心 范文东 18660196617")).toBeInTheDocument();
    expect(screen.getByText("收费管理科 杨洋 电话待补充")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "拨打 18660196617" })).toHaveAttribute("href", "tel:18660196617");
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
  });
});
