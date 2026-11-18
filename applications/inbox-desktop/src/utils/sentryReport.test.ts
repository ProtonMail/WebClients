import type { Mock } from "vitest";
vi.mock("../store/idStore", () => ({
    getAppIDSync: vi.fn(() => ({ id: "test-id", hash: "test-hash", distribution: 0.5 })),
}));
vi.mock("../store/settingsStore", () => ({
    getSettings: vi.fn(() => ({ spellChecker: true })),
}));
vi.mock("../store/boundsStore", () => ({
    getWindowBounds: vi.fn(() => ({ zoom: 1, width: 800, height: 600 })),
}));
vi.mock("../store/urlStore", () => ({
    getAppURL: vi.fn(() => ({
        mail: "https://mail.proton.me",
        calendar: "https://calendar.proton.me",
        account: "https://account.proton.me",
    })),
}));
vi.mock("./view/viewManagement", () => ({
    getMainWindow: vi.fn(() => ({ isMinimized: () => false })),
    getCurrentViewID: vi.fn(() => "mail"),
    getMailView: vi.fn(() => ({ webContents: { getURL: () => "https://mail.proton.me/inbox" } })),
    getCalendarView: vi.fn(() => null),
    getAccountView: vi.fn(() => null),
}));
vi.mock("./log/getOSInfo", () => ({
    getOSInfo: vi.fn(() => ({ cpuCount: 8 })),
}));

import { captureException, withScope } from "@sentry/electron/main";
import { getMainWindow } from "./view/viewManagement";
import { sentryReport } from "./sentryReport";
const { reportMessage, reportException } = sentryReport;

function makeMockScope() {
    return {
        setExtras: vi.fn(),
        setTags: vi.fn(),
        setLevel: vi.fn(),
        setContext: vi.fn(),
        setFingerprint: vi.fn(),
    };
}

describe("collectContext failure", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("falls back to { contextCollectionFailed: true } when a getter throws", () => {
        (getMainWindow as Mock).mockImplementationOnce(() => {
            throw new Error("window not ready");
        });
        const mockScope = makeMockScope();
        (withScope as Mock).mockImplementation((cb) => cb(mockScope));

        reportException(new Error("crash"));

        expect(mockScope.setExtras).toHaveBeenCalledWith(
            expect.objectContaining({ context: { contextCollectionFailed: true } }),
        );
    });
});

describe("reportMessage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("calls captureException with correct level and centralized context", () => {
        reportMessage("something went wrong", { level: "warning" });

        expect(withScope).toHaveBeenCalledTimes(1);
        expect(captureException).toHaveBeenCalledWith(expect.objectContaining({ message: "something went wrong" }));
    });

    it("attaches additional tags when provided", () => {
        const mockScope = makeMockScope();
        (withScope as Mock).mockImplementation((cb) => cb(mockScope));

        reportMessage("test message", { tags: { viewID: "mail" } });

        expect(mockScope.setTags).toHaveBeenCalledWith(expect.objectContaining({ viewID: "mail" }));
    });

    it("attaches error as extra context when provided", () => {
        const mockScope = makeMockScope();
        (withScope as Mock).mockImplementation((cb) => cb(mockScope));

        const error = new Error("underlying cause");
        reportMessage("operation failed", { error });

        expect(mockScope.setContext).toHaveBeenCalledWith("Caught Error", {
            name: error.name,
            message: error.message,
            stack: error.stack,
        });
    });

    it("merges call-site extras with collected context", () => {
        const mockScope = makeMockScope();
        (withScope as Mock).mockImplementation((cb) => cb(mockScope));

        reportMessage("did-fail-load", {
            extras: { url: "https://mail.proton.me/inbox", errorDescription: "ERR_CONNECTION_REFUSED" },
        });

        expect(mockScope.setExtras).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "https://mail.proton.me/inbox",
                errorDescription: "ERR_CONNECTION_REFUSED",
                context: expect.objectContaining({ appID: expect.any(Object) }),
            }),
        );
    });

    it("defaults to error level when no level is specified", () => {
        const mockScope = makeMockScope();
        (withScope as Mock).mockImplementation((cb) => cb(mockScope));

        reportMessage("test");

        expect(mockScope.setLevel).toHaveBeenCalledWith("error");
    });

    it("sets fingerprint to the message string so each distinct message creates a separate Sentry issue", () => {
        const mockScope = makeMockScope();
        (withScope as Mock).mockImplementation((cb) => cb(mockScope));

        reportMessage("renderer unresponsive");

        expect(mockScope.setFingerprint).toHaveBeenCalledWith(["renderer unresponsive"]);
        expect(captureException).toHaveBeenCalledWith(expect.objectContaining({ message: "renderer unresponsive" }));
    });
});

describe("reportException", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("calls captureException with the error object", () => {
        const mockScope = makeMockScope();
        (withScope as Mock).mockImplementation((cb) => cb(mockScope));

        const error = new Error("crash");
        reportException(error);

        expect(captureException).toHaveBeenCalledWith(error);
    });

    it("includes centralized context in extras", () => {
        const mockScope = makeMockScope();
        (withScope as Mock).mockImplementation((cb) => cb(mockScope));

        reportException(new Error("crash"));

        expect(mockScope.setExtras).toHaveBeenCalledWith(
            expect.objectContaining({
                context: expect.objectContaining({
                    appID: expect.any(Object),
                    settings: expect.any(Object),
                    windowBounds: expect.any(Object),
                    osInfo: expect.any(Object),
                    appURL: expect.any(Object),
                }),
            }),
        );
    });

    it("defaults to error level", () => {
        const mockScope = makeMockScope();
        (withScope as Mock).mockImplementation((cb) => cb(mockScope));

        reportException(new Error("crash"));

        expect(mockScope.setLevel).toHaveBeenCalledWith("error");
    });

    it("attaches tags when provided", () => {
        const mockScope = makeMockScope();
        (withScope as Mock).mockImplementation((cb) => cb(mockScope));

        reportException(new Error("crash"), { tags: { component: "autoUpdater" } });

        expect(mockScope.setTags).toHaveBeenCalledWith(expect.objectContaining({ component: "autoUpdater" }));
    });

    it("includes error.name in fingerprint so same-message different-type errors create separate Sentry issues", () => {
        const mockScope = makeMockScope();
        (withScope as Mock).mockImplementation((cb) => cb(mockScope));

        const error = new TypeError("request failed");
        reportException(error);

        expect(mockScope.setFingerprint).toHaveBeenCalledWith(["TypeError", "request failed"]);
    });
});
