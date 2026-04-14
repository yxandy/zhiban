import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("body 显式声明移动端注入样式并允许 hydration 忽略属性差异", () => {
    const rootElement = RootLayout({
      children: <div>内容</div>,
    }) as ReactElement;
    const bodyElement = rootElement.props.children as ReactElement;

    expect(bodyElement.type).toBe("body");
    expect(bodyElement.props.suppressHydrationWarning).toBe(true);
    expect(bodyElement.props.style).toMatchObject({
      WebkitTextSizeAdjust: "100%",
      WebkitTouchCallout: "none",
    });
  });
});
