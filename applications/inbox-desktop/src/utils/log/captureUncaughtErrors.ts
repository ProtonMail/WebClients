import { app, dialog } from "electron";
import { flush as sentryFlush } from "@sentry/electron/main";
import { c } from "ttag";
import { mainLogger } from "./index";
import { MAIL_APP_NAME } from "@proton/shared/lib/constants";
import { quitTracker } from "./quitTracker";
import { sentryReport } from "../sentryReport";
import { shouldReportAssetIssue } from "../../constants/resources";

let isExiting = false;

// Report every Nth occurrence to avoid spamming Sentry on repeated rejections,
// and cap the total number of reports per session as a hard upper bound.
const UNHANDLED_REJECTION_REPORT_MODULO = 10;
const UNHANDLED_REJECTION_REPORT_CAP = 3;
let unhandledRejectionCount = 0;
let unhandledRejectionReportsSent = 0;

// Shape of rejections from webContents loadURL/loadFile.
export type ChromiumLoadError = Error & { errno: number; code: string; url: string };

export function isChromiumLoadError(reason: unknown): reason is ChromiumLoadError {
    return (
        reason instanceof Error &&
        typeof (reason as Partial<ChromiumLoadError>).code === "string" &&
        typeof (reason as Partial<ChromiumLoadError>).url === "string" &&
        typeof (reason as Partial<ChromiumLoadError>).errno === "number"
    );
}

// ERR_ABORTED and ERR_FAILED are dominated by lifecycle teardown (superseded navigation,
// view destroyed, window closed), not real bugs.
const SKIPPED_CHROMIUM_CODES = new Set(["ERR_ABORTED", "ERR_FAILED"]);
const SKIPPED_DOM_EXCEPTIONS = new Set(["AbortError"]);

function shouldSendSentryReport(reason: unknown): boolean {
    if (isChromiumLoadError(reason)) {
        if (SKIPPED_CHROMIUM_CODES.has(reason.code)) return false;
        if (!app.isPackaged) return false; // We can safely ignore Sentry reports in dev-mode.

        // Do not report issues for any assets that are not present in the expected asset directory.
        return shouldReportAssetIssue(reason.url);
    }

    if (reason instanceof DOMException && SKIPPED_DOM_EXCEPTIONS.has(reason.name)) {
        return false;
    }

    return true;
}

export function shouldSendSentryReportTestOnly(reason: unknown): boolean {
    return shouldSendSentryReport(reason);
}

export function captureUncaughtErrors() {
    process.on("unhandledRejection", (reason) => {
        mainLogger.error("unhandledRejection", reason);

        if (!shouldSendSentryReport(reason)) {
            mainLogger.debug("Skipping Sentry report for unhandled rejection", reason);
            return;
        }

        unhandledRejectionCount++;

        if (unhandledRejectionCount % UNHANDLED_REJECTION_REPORT_MODULO !== 0) return;
        if (unhandledRejectionReportsSent >= UNHANDLED_REJECTION_REPORT_CAP) return;

        if (isChromiumLoadError(reason)) {
            // Stable title so Sentry collapses across users, install paths, and query params.
            sentryReport.reportMessage(`${reason.code} loading <file>`, {
                level: "error",
                error: reason,
                extras: {
                    occurrenceCount: unhandledRejectionCount,
                    url: reason.url,
                    errno: reason.errno,
                    originalMessage: reason.message,
                },
            });
        } else if (reason instanceof Error) {
            sentryReport.reportException(reason, {
                extras: { occurrenceCount: unhandledRejectionCount },
            });
        } else {
            sentryReport.reportMessage(`unhandledRejection: ${String(reason)}`, {
                level: "error",
                extras: { occurrenceCount: unhandledRejectionCount },
            });
        }

        unhandledRejectionReportsSent++;
    });

    process.on("uncaughtException", (reason, origin) => {
        captureTopLevelRejection(reason, origin);
    });
}

export function captureTopLevelRejection(reason: unknown, origin?: NodeJS.UncaughtExceptionOrigin) {
    if (isExiting) return;
    isExiting = true;

    mainLogger.error("uncaughtException", reason, origin);

    if (reason instanceof Error) {
        sentryReport.reportException(reason, {
            tags: { origin: origin ?? "uncaughtException" },
        });
    } else {
        sentryReport.reportMessage(`uncaughtException: ${String(reason)}`, {
            level: "fatal",
            tags: { origin: origin ?? "uncaughtException" },
        });
    }

    dialog.showErrorBox(
        c("Error dialog").t`${MAIL_APP_NAME} - Unexpected error`,
        c("Error dialog")
            .t`Due to an error, the ${MAIL_APP_NAME} app will close. Try running it again and, if the problem persists, contact us. Information about the error can be found in the application log.`,
    );
    quitTracker.setReason("uncaught-exception");
    // Flush queued Sentry events before exiting. sentryFlush times out after 2s so the
    // process won't hang indefinitely if the network is unavailable.
    sentryFlush(2000).finally(() => app.exit(1));
}

export const resetIsExitingTestOnly = () => {
    isExiting = false;
};

export const resetUnhandledRejectionCountTestOnly = () => {
    unhandledRejectionCount = 0;
    unhandledRejectionReportsSent = 0;
};
