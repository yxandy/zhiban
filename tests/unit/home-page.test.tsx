import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/page";

function getChinaTodayLabel() {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    return "1970年1月1日";
  }
  return `${year}年${Number(month)}月${Number(day)}日`;
}

describe("HomePage", () => {
  it("默认显示折叠日期栏和单位摘要卡片", async () => {
    render(
      await HomePage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.queryByRole("heading", { name: "2026年4月10日值班总览" })).not.toBeInTheDocument();
    expect(screen.getByText("2026年4月10日")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "展开日期选择" })).toBeInTheDocument();
    expect(screen.queryByText("4月日历面板")).not.toBeInTheDocument();
    expect(screen.queryByText("DUTY BOARD")).not.toBeInTheDocument();
    expect(screen.queryByText("点击单位名称后进入详情页查看完整联系人。")).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: "路桥运营事业部" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看路桥运营事业部详情" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回当天" })).toBeInTheDocument();
    expect(screen.getAllByText("值班领导")).toHaveLength(3);
    expect(screen.getAllByText("值班中层")).toHaveLength(3);
    expect(screen.getAllByText("值班人员")).toHaveLength(3);
    expect(screen.getByText("杨洋")).toBeInTheDocument();
    expect(screen.getAllByText("待补充").length).toBeGreaterThan(0);
    expect(screen.queryByText("当日三项值班摘要")).not.toBeInTheDocument();
    expect(screen.getByText("范文东")).toBeInTheDocument();
    expect(screen.getByText("18660196617")).toBeInTheDocument();
    expect(screen.queryByText("点单位看详情")).not.toBeInTheDocument();
  });

  it("当 mode=database 时不再展示当前模式文案", async () => {
    render(
      await HomePage({
        searchParams: Promise.resolve({
          mode: "database",
        }),
      }),
    );

    expect(screen.queryByText(/当前模式：/)).not.toBeInTheDocument();
  });

  it("展开月历后选择日期会自动收起并刷新摘要数据", async () => {
    const user = userEvent.setup();

    render(
      await HomePage({
        searchParams: Promise.resolve({}),
      }),
    );

    await user.click(screen.getByRole("button", { name: "展开日期选择" }));

    expect(screen.getByText("4月日历面板")).toBeInTheDocument();
    expect(screen.getByLabelText("切换年份")).toBeInTheDocument();
    expect(screen.getByLabelText("切换月份")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "选择 2026年4月11日" }));

    expect(screen.queryByText("4月日历面板")).not.toBeInTheDocument();
    expect(screen.getByText("2026年4月11日")).toBeInTheDocument();
    expect(screen.getByText("陈龙")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "返回当天" }));
    expect(screen.getByText(getChinaTodayLabel())).toBeInTheDocument();
  });
});
