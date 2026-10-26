import { initialize, toReportableError } from './chargebee-entry';
import { addCheckpoint, getLastCheckpointName } from './checkpoints';
import { getMessageBus } from './message-bus';

document.addEventListener('DOMContentLoaded', () => initialize());

const WINDOW_ERROR_REPORT_LIMIT = 10;
let windowErrorCount = 0;
let reportedWindowErrorCount = 0;

const BROWSER_EXTENSION_SCRIPT_PREFIXES = [
    'chrome-extension://',
    'moz-extension://',
    'safari-web-extension://',
    'blob:',
];

function isThrownByBrowserExtension({ filename }: ErrorEvent) {
    return BROWSER_EXTENSION_SCRIPT_PREFIXES.some((prefix) => filename?.startsWith(prefix));
}

window.addEventListener('error', (event) => {
    const stage = getLastCheckpointName();
    windowErrorCount++;

    addCheckpoint('window_error', {
        stage,
        occurrence: windowErrorCount,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        errorName: event.error?.name ?? null,
        errorMessage: event.error?.message ?? null,
    });
    event.preventDefault();

    if (isThrownByBrowserExtension(event) || reportedWindowErrorCount >= WINDOW_ERROR_REPORT_LIMIT) {
        return;
    }
    reportedWindowErrorCount++;

    /**
     * Scripts from other domains report only "Script error." with no error object. Sent as-is that
     * reaches Sentry with no title, and lands in the same pile as everything else.
     */
    getMessageBus().sendUnhandledErrorMessage(toReportableError(event.error ?? { message: event.message }), stage);
});
