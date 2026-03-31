jest.mock("electron", () => ({
    app: {
        on: jest.fn(),
        getPath: jest.fn(() => "/mock/home"),
        exit: jest.fn(),
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

import { app, dialog } from "electron";
import { flush as sentryFlush } from "@sentry/electron/main";
import { sentryReport } from "../sentryReport";
const { reportException, reportMessage } = sentryReport;
import {
    captureTopLevelRejection,
    captureUncaughtErrors,
    resetIsExitingTestOnly,
    resetUnhandledRejectionCountTestOnly,
} from "./captureUncaughtErrors";

// captureTopLevelRejection is synchronous but calls sentryFlush().finally(() => app.exit(1)).
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

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
            expect(reportException).toHaveBeenCalledWith(error);
            expect(reportMessage).not.toHaveBeenCalled();
        });

        it("calls reportMessage when reason is not an Error (on 10th occurrence)", () => {
            const handler = getUnhandledRejectionHandler();
            for (let i = 0; i < 10; i++) handler("string reason");

            expect(reportMessage).toHaveBeenCalledTimes(1);
            expect(reportMessage).toHaveBeenCalledWith(
                "unhandledRejection: string reason",
                expect.objectContaining({ level: "error" }),
            );
            expect(reportException).not.toHaveBeenCalled();
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

        expect(reportException).toHaveBeenCalledWith(error);
    });

    it("reports to Sentry via reportMessage when given a non-Error", () => {
        captureTopLevelRejection("string rejection");

        expect(reportMessage).toHaveBeenCalledWith(
            "uncaughtException: string rejection",
            expect.objectContaining({ level: "fatal" }),
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
        expect(reportException).toHaveBeenCalledWith(error);
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
