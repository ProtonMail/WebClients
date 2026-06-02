jest.mock("electron", () => ({
    app: {
        on: jest.fn(),
        getPath: jest.fn(() => "/mock/home"),
        getAppPath: jest.fn(() => "/mock/app"),
        exit: jest.fn(),
        isPackaged: true,
    },
    dialog: {
        showErrorBox: jest.fn(),
    },
}));

jest.mock("../sentryReport");

jest.mock("./quitTracker", () => ({
    quitTracker: {
        setReason: jest.fn(),
    },
}));
jest.mock("./index");

import { app, dialog } from "electron";
import { flush as sentryFlush } from "@sentry/electron/main";
import { sentryReport } from "../sentryReport";
const { reportException, reportMessage } = sentryReport;
import {
    captureTopLevelRejection,
    captureUncaughtErrors,
    resetIsExitingTestOnly,
    resetUnhandledRejectionCountTestOnly,
    shouldSendSentryReportTestOnly,
} from "./captureUncaughtErrors";

function makeChromiumLoadError(code: string, errno: number, url: string): Error {
    return Object.assign(new Error(`${code} (${errno}) loading '${url}'`), { code, errno, url });
}

// captureTopLevelRejection is synchronous but calls sentryFlush().finally(() => app.exit(1)).
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

// app.getAppPath() is mocked to "/mock/app" and isPackaged is true,
// so packaged resources resolve under dirname("/mock/app") = "/mock".
describe("shouldSendSentryReport", () => {
    it("drops Chromium load errors with cancellation codes", () => {
        expect(shouldSendSentryReportTestOnly(makeChromiumLoadError("ERR_ABORTED", -3, "file:///x.html"))).toBe(false);
    });

    it("drops Chromium load errors with ERR_FAILED (lifecycle teardown noise)", () => {
        expect(shouldSendSentryReportTestOnly(makeChromiumLoadError("ERR_FAILED", -2, "file:///x.html"))).toBe(false);
    });

    it("sends unrelated errors", () => {
        expect(shouldSendSentryReportTestOnly(new Error("some random error"))).toBe(true);
    });

    it("drops AbortError DOMExceptions", () => {
        expect(shouldSendSentryReportTestOnly(new DOMException("aborted", "AbortError"))).toBe(false);
    });

    it("drops every Chromium load error in development", () => {
        (app as unknown as { isPackaged: boolean }).isPackaged = false;
        try {
            expect(
                shouldSendSentryReportTestOnly(makeChromiumLoadError("ERR_FILE_NOT_FOUND", -6, "file:///x.html")),
            ).toBe(false);
            expect(shouldSendSentryReportTestOnly(makeChromiumLoadError("ERR_TIMED_OUT", -7, "file:///x.html"))).toBe(
                false,
            );
        } finally {
            (app as unknown as { isPackaged: boolean }).isPackaged = true;
        }
    });

    it("sends Chromium load errors for a tracked resource at its expected location", () => {
        const error = makeChromiumLoadError("ERR_FILE_NOT_FOUND", -6, "file:///mock/loading.html");
        expect(shouldSendSentryReportTestOnly(error)).toBe(true);
    });

    it("sends Chromium load errors for a tracked resource with query params at its expected location", () => {
        const error = makeChromiumLoadError(
            "ERR_FILE_NOT_FOUND",
            -6,
            "file:///mock/loading.html?message=Loading&theme=dark",
        );
        expect(shouldSendSentryReportTestOnly(error)).toBe(true);
    });

    it("drops Chromium load errors when a tracked filename appears outside the expected directory", () => {
        // The gate applies regardless of code: ERR_TIMED_OUT, ERR_FILE_NOT_FOUND, etc. all drop here.
        const error = makeChromiumLoadError("ERR_TIMED_OUT", -7, "file:///somewhere/else/loading.html");
        expect(shouldSendSentryReportTestOnly(error)).toBe(false);
    });

    it("sends Chromium load errors for a non-tracked file", () => {
        const error = makeChromiumLoadError(
            "ERR_FILE_NOT_FOUND",
            -6,
            "file:///Users/johndoe/Documents/folder/file.pdf",
        );
        expect(shouldSendSentryReportTestOnly(error)).toBe(true);
    });

    it("sends Chromium load errors when the URL cannot be parsed", () => {
        const error = makeChromiumLoadError("ERR_FILE_NOT_FOUND", -6, "not a url");
        expect(shouldSendSentryReportTestOnly(error)).toBe(true);
    });
});

describe("captureUncaughtErrors", () => {
    it("registers process handlers", () => {
        const onSpy = jest.spyOn(process, "on").mockImplementation(() => process);
        captureUncaughtErrors();

        expect(onSpy).toHaveBeenCalledWith("unhandledRejection", expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith("uncaughtException", expect.any(Function));

        onSpy.mockRestore();
    });

    describe("unhandledRejection handler", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            resetUnhandledRejectionCountTestOnly();
        });

        function getUnhandledRejectionHandler(): (reason: unknown) => void {
            const handlers: Record<string, (...args: unknown[]) => void> = {};
            const onSpy = jest.spyOn(process, "on").mockImplementation((event, handler) => {
                handlers[event as string] = handler as (...args: unknown[]) => void;
                return process;
            });
            captureUncaughtErrors();
            onSpy.mockRestore();
            return handlers["unhandledRejection"] as (reason: unknown) => void;
        }

        it("calls reportException when reason is an Error (on 10th occurrence)", () => {
            const handler = getUnhandledRejectionHandler();
            const error = new Error("rejected");
            for (let i = 0; i < 10; i++) handler(error);

            expect(reportException).toHaveBeenCalledTimes(1);
            expect(reportException).toHaveBeenCalledWith(
                error,
                expect.objectContaining({
                    extras: { occurrenceCount: 10 },
                }),
            );
            expect(reportMessage).not.toHaveBeenCalled();
        });

        it("calls reportMessage when reason is not an Error (on 10th occurrence)", () => {
            const handler = getUnhandledRejectionHandler();
            for (let i = 0; i < 10; i++) handler("string reason");

            expect(reportMessage).toHaveBeenCalledTimes(1);
            expect(reportMessage).toHaveBeenCalledWith(
                "unhandledRejection: string reason",
                expect.objectContaining({ level: "error", extras: { occurrenceCount: 10 } }),
            );
            expect(reportException).not.toHaveBeenCalled();
        });

        it("collapses Chromium load errors to a code-only title", () => {
            const handler = getUnhandledRejectionHandler();
            const url = "https://mail.proton.me/u/0/inbox?sessionId=abc123";
            const error = makeChromiumLoadError("ERR_TIMED_OUT", -7, url);

            for (let i = 0; i < 10; i++) handler(error);

            expect(reportException).not.toHaveBeenCalled();
            expect(reportMessage).toHaveBeenCalledTimes(1);
            expect(reportMessage).toHaveBeenCalledWith(
                "ERR_TIMED_OUT loading <file>",
                expect.objectContaining({
                    level: "error",
                    error,
                    extras: expect.objectContaining({
                        occurrenceCount: 10,
                        url,
                        errno: -7,
                        originalMessage: error.message,
                    }),
                }),
            );
        });

        it("does not report skipped Chromium codes regardless of occurrence count", () => {
            const handler = getUnhandledRejectionHandler();
            const error = makeChromiumLoadError("ERR_FAILED", -2, "file:///x.html");

            for (let i = 0; i < 20; i++) handler(error);

            expect(reportException).not.toHaveBeenCalled();
            expect(reportMessage).not.toHaveBeenCalled();
        });

        it("does not report AbortError to Sentry", () => {
            const handler = getUnhandledRejectionHandler();
            const abortError = new DOMException("signal aborted", "AbortError");

            for (let i = 0; i < 20; i++) handler(abortError);

            expect(reportException).not.toHaveBeenCalled();
            expect(reportMessage).not.toHaveBeenCalled();
        });

        it("reports every 10th occurrence, suppressing those in between", () => {
            const handler = getUnhandledRejectionHandler();
            const error = new Error("repeated");

            // Supressed
            for (let i = 0; i < 9; i++) handler(error);
            expect(reportException).toHaveBeenCalledTimes(0);

            // 10th Fires
            handler(error);
            expect(reportException).toHaveBeenCalledTimes(1);

            // Supressed
            for (let i = 0; i < 9; i++) handler(error);
            expect(reportException).toHaveBeenCalledTimes(1);

            // 20th fires
            handler(error);
            expect(reportException).toHaveBeenCalledTimes(2);
        });

        it("stops reporting after the per-session cap is reached", () => {
            const handler = getUnhandledRejectionHandler();
            const error = new Error("repeated");

            // Fires at each 10th occurrences (report_cap = 3).
            for (let i = 0; i < 30; i++) handler(error);
            expect(reportException).toHaveBeenCalledTimes(3);

            // No further reports past the cap.
            for (let i = 0; i < 50; i++) handler(error);
            expect(reportException).toHaveBeenCalledTimes(3);
        });
    });
});

describe("captureTopLevelRejection", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resetIsExitingTestOnly();
    });

    it("reports the error to Sentry via reportException when given an Error", () => {
        const error = new Error("fatal");
        captureTopLevelRejection(error);

        expect(reportException).toHaveBeenCalledWith(
            error,
            expect.objectContaining({ tags: { origin: "uncaughtException" } }),
        );
    });

    it("reports to Sentry via reportMessage when given a non-Error", () => {
        captureTopLevelRejection("string rejection");

        expect(reportMessage).toHaveBeenCalledWith(
            "uncaughtException: string rejection",
            expect.objectContaining({ level: "fatal", tags: { origin: "uncaughtException" } }),
        );
    });

    it("shows error dialog", () => {
        captureTopLevelRejection(new Error("fatal"));

        expect(dialog.showErrorBox).toHaveBeenCalled();
    });

    it("ignores subsequent calls while exiting", () => {
        const error = new Error("first");
        captureTopLevelRejection(error);
        captureTopLevelRejection(new Error("second"));

        expect(dialog.showErrorBox).toHaveBeenCalledTimes(1);
        expect(reportException).toHaveBeenCalledTimes(1);
        expect(reportException).toHaveBeenCalledWith(error, expect.anything());
    });

    it("flushes Sentry then exits", async () => {
        const exitOrder: string[] = [];
        (sentryFlush as jest.Mock).mockImplementation(async () => {
            exitOrder.push("flush");
            return true;
        });
        (app.exit as jest.Mock).mockImplementation(() => {
            exitOrder.push("exit");
        });

        captureTopLevelRejection(new Error("fatal"));
        await flushPromises();

        expect(sentryFlush).toHaveBeenCalledWith(2000);
        expect(exitOrder).toEqual(["flush", "exit"]);
    });
});
