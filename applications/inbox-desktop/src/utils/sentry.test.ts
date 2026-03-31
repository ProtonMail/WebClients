jest.mock("../store/idStore", () => ({
    getAppID: jest.fn(() => ({ id: "test-id", hash: "test-hash", distribution: 0.5 })),
}));
jest.mock("../store/urlStore", () => ({
    getAppURL: jest.fn(() => ({ mail: "https://mail.proton.me" })),
}));
jest.mock("./isProdEnv", () => ({
    isProdEnv: jest.fn(() => true),
}));
jest.mock("../../package.json", () => ({ name: "test", version: "1.0.0" }), { virtual: true });
jest.mock("./helpers", () => ({ isMac: true, isWindows: false, isLinux: false }));
jest.mock("../ipc/ipcConstants", () => ({ DESKTOP_FEATURES: {} }));
jest.mock("./session", () => ({ appSession: jest.fn(), updateSession: jest.fn() }));
jest.mock("../store/settingsStore", () => ({ getSettings: jest.fn(() => ({})) }));
jest.mock("../store/boundsStore", () => ({ getWindowBounds: jest.fn(() => ({})) }));
jest.mock("./view/viewManagement", () => ({
    getMainWindow: jest.fn(() => ({ isMinimized: jest.fn(() => false) })),
    getCurrentViewID: jest.fn(() => "mail"),
    getMailView: jest.fn(() => ({ webContents: { getURL: jest.fn(() => "") } })),
    getCalendarView: jest.fn(() => ({ webContents: { getURL: jest.fn(() => "") } })),
    getAccountView: jest.fn(() => ({ webContents: { getURL: jest.fn(() => "") } })),
}));
jest.mock("./log/getOSInfo", () => ({ getOSInfo: jest.fn(() => ({})) }));

import { addBreadcrumb, captureMessage } from "@sentry/electron/main";
import Logger, { LogMessage } from "electron-log";
import { initializeSentry } from "./sentry";

describe("Sentry transport", () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
