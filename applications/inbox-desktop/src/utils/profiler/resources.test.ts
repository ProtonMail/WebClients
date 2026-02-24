import { describe, it, expect, beforeEach, jest } from "@jest/globals";

jest.mock("node:perf_hooks", () => ({
    performance: { now: jest.fn() },
}));

jest.mock("../../store/urlStore", () => ({
    getAppURL: () => ({
        mail: "https://mail.proton.me",
        calendar: "https://calendar.proton.me",
        account: "https://account.proton.me",
    }),
}));

import { performance } from "node:perf_hooks";
import { resources } from "./resources";

const mockPerfNow = performance.now as jest.Mock;

interface MockRequestDetails {
    id: number;
    resourceType?: string;
    url?: string;
    fromCache?: boolean;
}

let onBeforeRequest: (details: MockRequestDetails, callback: (response: Record<string, never>) => void) => void;
let onResponseStarted: (details: MockRequestDetails) => void;
let onCompleted: (details: MockRequestDetails) => void;
let onErrorOccurred: (details: MockRequestDetails) => void;

const mockSession = {
    webRequest: {
        onBeforeRequest: jest.fn((cb: typeof onBeforeRequest) => {
            onBeforeRequest = cb;
        }),
        onResponseStarted: jest.fn((cb: typeof onResponseStarted) => {
            onResponseStarted = cb;
        }),
        onCompleted: jest.fn((cb: typeof onCompleted) => {
            onCompleted = cb;
        }),
        onErrorOccurred: jest.fn((cb: typeof onErrorOccurred) => {
            onErrorOccurred = cb;
        }),
    },
} as unknown as Electron.Session;

let requestId = 0;

function simulateMainFrame(url: string, ms: number): void {
    const id = ++requestId;
    mockPerfNow.mockReturnValueOnce(ms);
    onBeforeRequest({ id, resourceType: "mainFrame", url }, () => {});
    onResponseStarted({ id });
}

function simulateLoad(durationMs: number, fromCache: boolean): void {
    const id = ++requestId;
    mockPerfNow.mockReturnValueOnce(0).mockReturnValueOnce(durationMs);
    onBeforeRequest({ id, resourceType: "script", url: "https://mail.proton.me/app.js" }, () => {});
    onCompleted({ id, fromCache });
}

function simulateFailedLoad(): void {
    const id = ++requestId;
    mockPerfNow.mockReturnValueOnce(0);
    onBeforeRequest({ id, resourceType: "script", url: "https://mail.proton.me/app.js" }, () => {});
    onErrorOccurred({ id });
}

describe("resources", () => {
    beforeEach(() => {
        mockPerfNow.mockReset();
        requestId = 0;
        resources.reset();
        resources.hookRequestTiming(mockSession, 0);
    });

    describe("buildResources", () => {
        it("computes count, avgMs and maxMs correctly", () => {
            resources.openResourceWindow();
            simulateLoad(100, false);
            simulateLoad(200, false);
            simulateLoad(300, false);

            const { startupWindow } = resources.buildResources();
            expect(startupWindow.count).toBe(3);
            expect(startupWindow.avgMs).toBe(200);
            expect(startupWindow.maxMs).toBe(300);
        });

        it("counts cache hits and misses separately", () => {
            resources.openResourceWindow();
            simulateLoad(10, true);
            simulateLoad(10, true);
            simulateLoad(10, false);

            const { startupWindow } = resources.buildResources();
            expect(startupWindow.fromCache).toBe(2);
            expect(startupWindow.network).toBe(1);
        });

        it("p95 excludes the slowest outlier", () => {
            resources.openResourceWindow();

            for (let i = 0; i < 20; i++) simulateLoad(50, true);

            simulateLoad(1000, true);

            const { startupWindow } = resources.buildResources();
            expect(startupWindow.p95Ms).toBe(50);
            expect(startupWindow.maxMs).toBe(1000);
        });

        it("p95 displays the outlier with small sample size", () => {
            resources.openResourceWindow();

            for (let i = 0; i < 5; i++) simulateLoad(50, true);

            simulateLoad(1000, true);

            const { startupWindow } = resources.buildResources();
            expect(startupWindow.count).toBe(6);
            expect(startupWindow.avgMs).toBe(208);
            expect(startupWindow.p95Ms).toBe(1000);
            expect(startupWindow.maxMs).toBe(1000);
        });

        it("does not record resources outside the startup window", () => {
            resources.closeResourceWindow();
            simulateLoad(100, false);
            simulateLoad(100, false);
            simulateLoad(100, false);

            expect(resources.buildResources().startupWindow.count).toBe(0);
        });

        it("does not record resources after closeResourceWindow is called", () => {
            resources.openResourceWindow();
            simulateLoad(100, false); // within the window -> counted
            simulateLoad(100, false);
            simulateLoad(100, false);

            resources.closeResourceWindow();
            simulateLoad(200, false); // window is now closed -> not counted
            simulateLoad(200, false);
            simulateLoad(200, false);
            simulateLoad(200, false);

            const { startupWindow } = resources.buildResources();
            expect(startupWindow.count).toBe(3);
            expect(startupWindow.maxMs).toBe(100);
        });
    });

    describe("failure tracking", () => {
        it("counts failed requests in failures and does not record a duration", () => {
            resources.openResourceWindow();
            simulateFailedLoad();
            simulateFailedLoad();

            const { startupWindow } = resources.buildResources();
            expect(startupWindow.failures).toBe(2);
            expect(startupWindow.count).toBe(0);
            expect(startupWindow.avgMs).toBeNull();
        });

        it("failures are not counted for requests outside the startup window", () => {
            simulateFailedLoad();
            expect(resources.buildResources().startupWindow.failures).toBe(0);
        });

        it("cleans up mainFrameRequests on error so first-byte is not recorded", () => {
            const id = ++requestId;
            onBeforeRequest({ id, resourceType: "mainFrame", url: "https://mail.proton.me/" }, () => {});
            onErrorOccurred({ id });

            expect(resources.mainFrameFirstByteMs.has("mail")).toBe(false);
        });
    });

    describe("mainFrame first byte tracking", () => {
        it("records first byte for a mail URL", () => {
            simulateMainFrame("https://mail.proton.me/inbox", 750);
            expect(resources.mainFrameFirstByteMs.get("mail")).toBe(750);
        });

        it("records first byte for calendar and account URLs", () => {
            simulateMainFrame("https://calendar.proton.me/", 800);
            simulateMainFrame("https://account.proton.me/", 900);
            expect(resources.mainFrameFirstByteMs.get("calendar")).toBe(800);
            expect(resources.mainFrameFirstByteMs.get("account")).toBe(900);
        });

        it("does not overwrite an existing first-byte entry", () => {
            simulateMainFrame("https://mail.proton.me/inbox", 750);
            simulateMainFrame("https://mail.proton.me/inbox", 900); // second request -> ignored
            expect(resources.mainFrameFirstByteMs.get("mail")).toBe(750);
        });

        it("ignores unknown URLs", () => {
            simulateMainFrame("https://unknown.example.com/", 500); // unkown url -> skipped
            expect(resources.mainFrameFirstByteMs.size).toBe(0);
        });
    });
});
