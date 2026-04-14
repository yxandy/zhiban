import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DetailDateSwitcher } from "@/components/detail/detail-date-switcher";

describe("DetailDateSwitcher", () => {
  it("选择具体日期后会立即收起日历", async () => {
    const user = userEvent.setup();

    render(
      <DetailDateSwitcher
        unitSlug="luqiao-yunying"
        currentDate="2026-04-10"
        availableDates={["2026-04-10", "2026-04-11"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "展开日期选择" }));
    expect(screen.getByText("日期选择")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "选择 2026年4月11日" }));
    expect(screen.queryByText("日期选择")).not.toBeInTheDocument();
  });
});
