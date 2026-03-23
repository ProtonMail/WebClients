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

jest.mock("../electronSession/webRequestRouter", () => ({
    webRequestRouter: {
        onBeforeRequest: jest.fn((cb: typeof onBeforeRequest) => {
            onBeforeRequest = cb;
            return jest.fn();
        }),
        onResponseStarted: jest.fn((cb: typeof onResponseStarted) => {
            onResponseStarted = cb;
            return jest.fn();
        }),
        onCompleted: jest.fn((cb: typeof onCompleted) => {
            onCompleted = cb;
            return jest.fn();
        }),
        onErrorOccurred: jest.fn((cb: typeof onErrorOccurred) => {
            onErrorOccurred = cb;
            return jest.fn();
        }),
    },
}));

import { performance } from "node:perf_hooks";
import { StartupRequestRecorder } from "./startupRequests";

const mockPerfNow = performance.now as jest.Mock;

let requestId = 0;
let recorder: StartupRequestRecorder;

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

describe("StartupRequestRecorder", () => {
    beforeEach(() => {
        mockPerfNow.mockReset();
        requestId = 0;
        recorder = new StartupRequestRecorder(0);
    });

    describe("buildResources", () => {
        it("computes count, avgMs and maxMs correctly", () => {
            simulateLoad(100, false);
            simulateLoad(200, false);
            simulateLoad(300, false);

            const { startupWindow } = recorder.buildResources();
            expect(startupWindow.count).toBe(3);
            expect(startupWindow.avgMs).toBe(200);
            expect(startupWindow.maxMs).toBe(300);
        });

        it("counts cache hits and misses separately", () => {
            simulateLoad(10, true);
            simulateLoad(10, true);
            simulateLoad(10, false);

            const { startupWindow } = recorder.buildResources();
            expect(startupWindow.fromCache).toBe(2);
            expect(startupWindow.network).toBe(1);
        });

        it("p95 excludes the slowest outlier", () => {
            for (let i = 0; i < 20; i++) simulateLoad(50, true);
            simulateLoad(1000, true);

            const { startupWindow } = recorder.buildResources();
            expect(startupWindow.p95Ms).toBe(50);
            expect(startupWindow.maxMs).toBe(1000);
        });

        it("p95 displays the outlier with small sample size", () => {
            for (let i = 0; i < 5; i++) simulateLoad(50, true);
            simulateLoad(1000, true);

            const { startupWindow } = recorder.buildResources();
            expect(startupWindow.count).toBe(6);
            expect(startupWindow.avgMs).toBe(208);
            expect(startupWindow.p95Ms).toBe(1000);
            expect(startupWindow.maxMs).toBe(1000);
        });

        it("does not record resources after closeResourceWindow is called", () => {
            recorder.closeResourceWindow();
            simulateLoad(100, false);
            simulateLoad(100, false);
            simulateLoad(100, false);

            expect(recorder.buildResources().startupWindow.count).toBe(0);
        });

        it("records resources before and stops after closeResourceWindow is called", () => {
            simulateLoad(100, false);
            simulateLoad(100, false);
            simulateLoad(100, false);

            recorder.closeResourceWindow();
            simulateLoad(200, false);
            simulateLoad(200, false);
            simulateLoad(200, false);
            simulateLoad(200, false);

            const { startupWindow } = recorder.buildResources();
            expect(startupWindow.count).toBe(3);
            expect(startupWindow.maxMs).toBe(100);
        });
    });

    describe("failure tracking", () => {
        it("counts failed requests in failures and does not record a duration", () => {
            simulateFailedLoad();
            simulateFailedLoad();

            const { startupWindow } = recorder.buildResources();
            expect(startupWindow.failures).toBe(2);
            expect(startupWindow.count).toBe(0);
            expect(startupWindow.avgMs).toBeNull();
        });

        it("failures are not counted after closeResourceWindow", () => {
            recorder.closeResourceWindow();
            simulateFailedLoad();
            expect(recorder.buildResources().startupWindow.failures).toBe(0);
        });

        it("cleans up mainFrameRequests on error so first-byte is not recorded", () => {
            const id = ++requestId;
            onBeforeRequest({ id, resourceType: "mainFrame", url: "https://mail.proton.me/" }, () => {});
            onErrorOccurred({ id });

            expect(recorder.mainFrameFirstByteMs.has("mail")).toBe(false);
        });
    });

    describe("mainFrame first byte tracking", () => {
        it("records first byte for a mail URL", () => {
            simulateMainFrame("https://mail.proton.me/inbox", 750);
            expect(recorder.mainFrameFirstByteMs.get("mail")).toBe(750);
        });

        it("records first byte for calendar and account URLs", () => {
            simulateMainFrame("https://calendar.proton.me/", 800);
            simulateMainFrame("https://account.proton.me/", 900);
            expect(recorder.mainFrameFirstByteMs.get("calendar")).toBe(800);
            expect(recorder.mainFrameFirstByteMs.get("account")).toBe(900);
        });

        it("does not overwrite an existing first-byte entry", () => {
            simulateMainFrame("https://mail.proton.me/inbox", 750);
            simulateMainFrame("https://mail.proton.me/inbox", 900); // second request -> ignored
            expect(recorder.mainFrameFirstByteMs.get("mail")).toBe(750);
        });

        it("ignores unknown URLs", () => {
            simulateMainFrame("https://unknown.example.com/", 500);
            expect(recorder.mainFrameFirstByteMs.size).toBe(0);
        });
    });
});
