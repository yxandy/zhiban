import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

process.env.USE_MOCK_DATA = "true";

afterEach(() => {
  cleanup();
});
