import { app, dialog } from "electron";
import { flush as sentryFlush } from "@sentry/electron/main";
import { c } from "ttag";
import { mainLogger } from "./index";
import { MAIL_APP_NAME } from "@proton/shared/lib/constants";
import { quitTracker } from "./quitTracker";
import { sentryReport } from "../sentryReport";

let isExiting = false;

// AbortError signals intentional cancellation, not a bug; skip it.
// For everything else, report every 10th occurrence to avoid spamming Sentry.
const UNHANDLED_REJECTION_REPORT_MODULO = 10;
let unhandledRejectionCount = 0;

export function captureUncaughtErrors() {
    process.on("unhandledRejection", (reason) => {
        mainLogger.error("unhandledRejection", reason);

        if ((reason instanceof Error || reason instanceof DOMException) && reason.name === "AbortError") {
            return;
        }

        unhandledRejectionCount++;

        if (unhandledRejectionCount % UNHANDLED_REJECTION_REPORT_MODULO === 0) {
            if (reason instanceof Error) {
                sentryReport.reportException(reason);
            } else {
                sentryReport.reportMessage(`unhandledRejection: ${String(reason)}`, { level: "error" });
            }
        }
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
        sentryReport.reportException(reason);
    } else {
        sentryReport.reportMessage(`uncaughtException: ${String(reason)}`, { level: "fatal" });
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
};
