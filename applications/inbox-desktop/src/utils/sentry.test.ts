import type { Mock } from "vitest";
vi.mock("../store/idStore", () => ({
    getAppID: vi.fn(() => ({ id: "test-id", hash: "test-hash", distribution: 0.5 })),
}));
vi.mock("../store/urlStore", () => ({
    getAppURL: vi.fn(() => ({ mail: "https://mail.proton.me" })),
}));
vi.mock("./isProdEnv", () => ({
    isProdEnv: vi.fn(() => true),
}));
vi.mock("../../package.json", () => ({ default: { name: "test", version: "1.0.0" } }));
vi.mock("./helpers", () => ({ isMac: true, isWindows: false, isLinux: false }));
vi.mock("../ipc/ipcConstants", () => ({ DESKTOP_FEATURES: {} }));
vi.mock("./electronSession/partitions", () => ({ appSession: vi.fn(), updateSession: vi.fn() }));
vi.mock("../store/settingsStore", () => ({ getSettings: vi.fn(() => ({})) }));
vi.mock("../store/boundsStore", () => ({ getWindowBounds: vi.fn(() => ({})) }));
vi.mock("./view/viewState", () => ({
    getMainWindow: vi.fn(() => ({ isMinimized: vi.fn(() => false) })),
    getCurrentViewID: vi.fn(() => "mail"),
    getMailView: vi.fn(() => ({ webContents: { getURL: vi.fn(() => "") } })),
    getCalendarView: vi.fn(() => ({ webContents: { getURL: vi.fn(() => "") } })),
    getAccountView: vi.fn(() => ({ webContents: { getURL: vi.fn(() => "") } })),
}));
vi.mock("./log/getOSInfo", () => ({ getOSInfo: vi.fn(() => ({})) }));

import { addBreadcrumb, captureMessage, init } from "@sentry/electron/main";
import Logger, { LogMessage } from "electron-log";
import { initializeSentry } from "./sentry";
import type { Event } from "@sentry/electron/main";

describe("beforeSend", () => {
    let beforeSend: (event: Event) => Event | null;

    beforeEach(async () => {
        vi.clearAllMocks();
        process.env.DESKTOP_SENTRY_DSN = "https://key@sentry/123";
        await initializeSentry();
        beforeSend = (init as Mock).mock.calls[0][0].beforeSend;
    });

    afterEach(() => {
        delete process.env.DESKTOP_SENTRY_DSN;
    });

    it("uses error message as issue title for exception events", () => {
        const event: Event = {
            exception: { values: [{ type: "Error", value: "certificate pinning failed" }] },
        };
        const result = beforeSend(event);
        expect(result?.exception?.values?.[0].type).toBe("certificate pinning failed");
        expect(result?.exception?.values?.[0].value).toBe("certificate pinning failed");
    });

    it("uses error message as issue title for custom error classes", () => {
        const event: Event = {
            exception: { values: [{ type: "Fs", value: "version fetch failed repeatedly" }] },
        };
        const result = beforeSend(event);
        expect(result?.exception?.values?.[0].type).toBe("version fetch failed repeatedly");
        expect(result?.exception?.values?.[0].value).toBe("version fetch failed repeatedly");
    });

    it("does not transform message events — title remains the message string", () => {
        const event: Event = { message: "renderer unresponsive" };
        const result = beforeSend(event);
        expect(result?.message).toBe("renderer unresponsive");
        expect(result?.exception).toBeUndefined();
    });
});

describe("Sentry transport", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DESKTOP_SENTRY_DSN = "https://key@sentry/123";
    });

    afterEach(() => {
        delete Logger.transports.sentry;
        delete process.env.DESKTOP_SENTRY_DSN;
    });

    it("adds breadcrumbs for all log levels", async () => {
        await initializeSentry();
        const transport = Logger.transports.sentry!;

        transport({
            data: ["test message"],
            level: "info",
            scope: "main",
            date: new Date(1000),
        } as LogMessage);

        expect(addBreadcrumb).toHaveBeenCalledWith({
            category: "main",
            level: "info",
            message: "test message",
            timestamp: 1,
        });
    });

    it("does NOT call captureMessage for error logs", async () => {
        await initializeSentry();
        const transport = Logger.transports.sentry!;

        transport({
            data: ["error occurred"],
            level: "error",
            scope: "main",
            date: new Date(1000),
        } as LogMessage);

        expect(addBreadcrumb).toHaveBeenCalled();
        expect(captureMessage).not.toHaveBeenCalled();
    });

    it("does NOT call captureMessage for warn logs", async () => {
        await initializeSentry();
        const transport = Logger.transports.sentry!;

        transport({
            data: ["warning occurred"],
            level: "warn",
            scope: "main",
            date: new Date(1000),
        } as LogMessage);

        expect(addBreadcrumb).toHaveBeenCalled();
        expect(captureMessage).not.toHaveBeenCalled();
    });

    it("skips breadcrumbs for sentry scope to avoid recursion", async () => {
        await initializeSentry();
        const transport = Logger.transports.sentry!;

        transport({
            data: ["sentry internal"],
            level: "info",
            scope: "sentry",
            date: new Date(1000),
        } as LogMessage);

        expect(addBreadcrumb).not.toHaveBeenCalled();
    });
});
