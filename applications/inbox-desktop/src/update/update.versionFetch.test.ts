jest.mock("electron", () => ({
    app: { on: jest.fn(), isPackaged: true },
    autoUpdater: { on: jest.fn() },
}));

jest.mock("../utils/session", () => ({
    updateSession: jest.fn(),
    appSession: jest.fn(),
}));

jest.mock("../utils/sentryReport");

jest.mock("../utils/view/viewManagement", () => ({
    getCalendarView: jest.fn(),
    getMailView: jest.fn(),
}));

import { updateSession } from "../utils/session";
import { sentryReport } from "../utils/sentryReport";
import { getAvailableVersionsTestOnly, resetVersionFetchCounterTestOnly } from "./update";
import { DESKTOP_PLATFORMS } from "@proton/shared/lib/constants";

const mockFetch = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    resetVersionFetchCounterTestOnly();
    (updateSession as jest.Mock).mockReturnValue({ fetch: mockFetch });
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
