import { captureException as sentryCaptureException, SeverityLevel, withScope } from "@sentry/electron/main";
import { getAppIDSync } from "../store/idStore";
import { getSettings } from "../store/settingsStore";
import { getWindowBounds } from "../store/boundsStore";
import { getAppURL } from "../store/urlStore";
import { getAccountView, getCalendarView, getCurrentViewID, getMailView, getMainWindow } from "./view/viewManagement";
import { getOSInfo } from "./log/getOSInfo";

export interface ReportOptions {
    level?: SeverityLevel;
    /** Short, filterable key-value pairs (max 32 char key, 200 char value). Searchable in Sentry. */
    tags?: Record<string, string>;
    /** Arbitrary debugging data. Visible on the event page but not searchable. Use for URLs, descriptions, or any long/unstructured values. */
    extras?: Record<string, unknown>;
}

export interface ReportMessageOptions extends ReportOptions {
    error?: Error;
}

function collectContext(): Record<string, unknown> {
    try {
        return {
            appID: getAppIDSync(),
            settings: getSettings(),
            windowBounds: getWindowBounds(),
            mainWindow: {
                isMinimized: getMainWindow()?.isMinimized(),
                currentView: getCurrentViewID(),
                mailViewURL: getMailView()?.webContents.getURL(),
                calendarViewURL: getCalendarView()?.webContents.getURL(),
                accountViewURL: getAccountView()?.webContents.getURL(),
            },
            osInfo: getOSInfo(),
            appURL: getAppURL(),
        };
    } catch {
        return { contextCollectionFailed: true };
    }
}

function reportMessage(message: string, options?: ReportMessageOptions): void {
    const level = options?.level ?? "error";

    withScope((scope) => {
        scope.setExtras({ ...options?.extras, context: collectContext() });

        if (options?.error) {
            scope.setContext("Caught Error", {
                name: options.error.name,
                message: options.error.message,
                stack: options.error.stack,
            });
        }
        scope.setLevel(level);

        // Group sentry reports by the message text. Without this directive attachStacktrace causes
        // all reportMessage calls to share a stack trace and collapse into one Sentry issue.
        scope.setFingerprint([message]);

        if (options?.tags) {
            scope.setTags(options.tags);
        }

        const err = new Error(message);
        err.name = message;

        sentryCaptureException(err);
    });
}

function reportException(error: Error, options?: ReportOptions): void {
    const level = options?.level ?? "error";

    withScope((scope) => {
        scope.setExtras({ ...options?.extras, context: collectContext() });
        scope.setLevel(level);

        // Group by error class + message so different exception types with identical messages
        // don't collapse into one Sentry issue. attachStacktrace causes exceptions through the
        // shared reportException path to share a stack trace and merge into one issue.
        scope.setFingerprint([error.name, error.message]);

        if (options?.tags) {
            scope.setTags(options.tags);
        }

        sentryCaptureException(error);
    });
}

export const sentryReport = { reportMessage, reportException };
