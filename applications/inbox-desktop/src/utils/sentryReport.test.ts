jest.mock("../store/idStore", () => ({
    getAppIDSync: jest.fn(() => ({ id: "test-id", hash: "test-hash", distribution: 0.5 })),
}));
jest.mock("../store/settingsStore", () => ({
    getSettings: jest.fn(() => ({ spellChecker: true })),
}));
jest.mock("../store/boundsStore", () => ({
    getWindowBounds: jest.fn(() => ({ zoom: 1, width: 800, height: 600 })),
}));
jest.mock("../store/urlStore", () => ({
    getAppURL: jest.fn(() => ({
        mail: "https://mail.proton.me",
        calendar: "https://calendar.proton.me",
        account: "https://account.proton.me",
    })),
}));
jest.mock("./view/viewManagement", () => ({
    getMainWindow: jest.fn(() => ({ isMinimized: () => false })),
    getCurrentViewID: jest.fn(() => "mail"),
    getMailView: jest.fn(() => ({ webContents: { getURL: () => "https://mail.proton.me/inbox" } })),
    getCalendarView: jest.fn(() => null),
    getAccountView: jest.fn(() => null),
}));
jest.mock("./log/getOSInfo", () => ({
    getOSInfo: jest.fn(() => ({ cpuCount: 8 })),
}));

import { captureMessage, captureException, withScope } from "@sentry/electron/main";
import { getMainWindow } from "./view/viewManagement";
import { sentryReport } from "./sentryReport";
const { reportMessage, reportException } = sentryReport;

describe("collectContext failure", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("falls back to { contextCollectionFailed: true } when a getter throws", () => {
        (getMainWindow as jest.Mock).mockImplementationOnce(() => {
            throw new Error("window not ready");
        });
        const mockScope = {
            setExtras: jest.fn(),
            setTags: jest.fn(),
            setLevel: jest.fn(),
            setContext: jest.fn(),
        };
        (withScope as jest.Mock).mockImplementation((cb) => cb(mockScope));

        reportException(new Error("crash"));

        expect(mockScope.setExtras).toHaveBeenCalledWith(
            expect.objectContaining({ context: { contextCollectionFailed: true } }),
        );
    });
});

describe("reportMessage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("calls captureMessage with correct level and centralized context", () => {
        reportMessage("something went wrong", { level: "warning" });

        expect(withScope).toHaveBeenCalledTimes(1);
        expect(captureMessage).toHaveBeenCalledWith("something went wrong");
    });

    it("attaches additional tags when provided", () => {
        const mockScope = {
            setExtras: jest.fn(),
            setTags: jest.fn(),
            setLevel: jest.fn(),
            setContext: jest.fn(),
        };
        (withScope as jest.Mock).mockImplementation((cb) => cb(mockScope));

        reportMessage("test message", { tags: { viewID: "mail" } });

        expect(mockScope.setTags).toHaveBeenCalledWith(expect.objectContaining({ viewID: "mail" }));
    });

    it("attaches error as extra context when provided", () => {
        const mockScope = {
            setExtras: jest.fn(),
            setTags: jest.fn(),
            setLevel: jest.fn(),
            setContext: jest.fn(),
        };
        (withScope as jest.Mock).mockImplementation((cb) => cb(mockScope));

        const error = new Error("underlying cause");
        reportMessage("operation failed", { error });

        expect(mockScope.setContext).toHaveBeenCalledWith("Caught Error", {
            name: error.name,
            message: error.message,
            stack: error.stack,
        });
    });

    it("merges call-site extras with collected context", () => {
        const mockScope = {
            setExtras: jest.fn(),
            setTags: jest.fn(),
            setLevel: jest.fn(),
            setContext: jest.fn(),
        };
        (withScope as jest.Mock).mockImplementation((cb) => cb(mockScope));

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
        const mockScope = {
            setExtras: jest.fn(),
            setTags: jest.fn(),
            setLevel: jest.fn(),
            setContext: jest.fn(),
        };
        (withScope as jest.Mock).mockImplementation((cb) => cb(mockScope));

        reportMessage("test");

        expect(mockScope.setLevel).toHaveBeenCalledWith("error");
    });
});

describe("reportException", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("calls captureException with the error object", () => {
        const mockScope = {
            setExtras: jest.fn(),
            setTags: jest.fn(),
            setLevel: jest.fn(),
            setContext: jest.fn(),
        };
        (withScope as jest.Mock).mockImplementation((cb) => cb(mockScope));

        const error = new Error("crash");
        reportException(error);

        expect(captureException).toHaveBeenCalledWith(error);
    });

    it("includes centralized context in extras", () => {
        const mockScope = {
            setExtras: jest.fn(),
            setTags: jest.fn(),
            setLevel: jest.fn(),
            setContext: jest.fn(),
        };
        (withScope as jest.Mock).mockImplementation((cb) => cb(mockScope));

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
        const mockScope = {
            setExtras: jest.fn(),
            setTags: jest.fn(),
            setLevel: jest.fn(),
            setContext: jest.fn(),
        };
        (withScope as jest.Mock).mockImplementation((cb) => cb(mockScope));

        reportException(new Error("crash"));

        expect(mockScope.setLevel).toHaveBeenCalledWith("error");
    });

    it("attaches tags when provided", () => {
        const mockScope = {
            setExtras: jest.fn(),
            setTags: jest.fn(),
            setLevel: jest.fn(),
            setContext: jest.fn(),
        };
        (withScope as jest.Mock).mockImplementation((cb) => cb(mockScope));

        reportException(new Error("crash"), { tags: { component: "autoUpdater" } });

        expect(mockScope.setTags).toHaveBeenCalledWith(expect.objectContaining({ component: "autoUpdater" }));
    });
});
