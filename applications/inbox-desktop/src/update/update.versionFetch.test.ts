import type { Mock } from "vitest";
vi.mock("electron", () => ({
    app: { on: vi.fn(), isPackaged: true },
    autoUpdater: { on: vi.fn() },
}));

vi.mock("../utils/electronSession/partitions", () => ({
    updateSession: vi.fn(),
    appSession: vi.fn(),
}));

vi.mock("../utils/sentryReport");

import { updateSession } from "../utils/electronSession/partitions";
import { sentryReport } from "../utils/sentryReport";
import { getAvailableVersionsTestOnly, resetVersionFetchCounterTestOnly } from "./update";
import { DESKTOP_PLATFORMS } from "@proton/shared/lib/constants";

const mockFetch = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    resetVersionFetchCounterTestOnly();
    (updateSession as Mock).mockReturnValue({ fetch: mockFetch });
});

describe("getAvailableVersions consecutive failure threshold", () => {
    it("does not report to Sentry before the threshold is reached", async () => {
        mockFetch.mockRejectedValue(new Error("network error"));

        for (let i = 0; i < 4; i++) {
            await getAvailableVersionsTestOnly(DESKTOP_PLATFORMS.LINUX);
        }

        expect(sentryReport.reportMessage).not.toHaveBeenCalled();
    });

    it("reports to Sentry exactly once when the threshold is reached", async () => {
        mockFetch.mockRejectedValue(new Error("network error"));

        for (let i = 0; i < 5; i++) {
            await getAvailableVersionsTestOnly(DESKTOP_PLATFORMS.LINUX);
        }

        expect(sentryReport.reportMessage).toHaveBeenCalledTimes(1);
        expect(sentryReport.reportMessage).toHaveBeenCalledWith(
            "version fetch failed repeatedly",
            expect.objectContaining({ level: "warning" }),
        );
    });

    it("does not report again after the threshold has already fired", async () => {
        mockFetch.mockRejectedValue(new Error("network error"));

        for (let i = 0; i < 20; i++) {
            await getAvailableVersionsTestOnly(DESKTOP_PLATFORMS.LINUX);
        }

        expect(sentryReport.reportMessage).toHaveBeenCalledTimes(1);
    });
});
