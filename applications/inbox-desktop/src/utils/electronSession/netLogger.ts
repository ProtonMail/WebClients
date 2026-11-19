import { CHANGE_VIEW_TARGET } from "@proton/shared/lib/desktop/desktopTypes";
import { WebContents } from "electron";
import { netLogger } from "../log";
import { getTrackedUID, setViewName } from "./uidTracker";
import { webRequestRouter } from "./webRequestRouter";

// High-freq requests that add a lot of noise to the logs. Non-200 responses are still recorded.
const NET_LOG_SKIP_PATTERNS = [/\/assets\/static\//, /\/api\/calendar\/v1\//, /\/api\/core\/v4\/images/];

export async function connectNetLogger(
    getWebContentsViewName: (webContents: WebContents) => CHANGE_VIEW_TARGET | null,
) {
    webRequestRouter.onCompleted((details) => {
        const viewName = details.webContents ? getWebContentsViewName(details.webContents) : null;
        if (details.webContents && viewName) {
            setViewName(details.webContents.id, viewName);
        }
        const uid = details.webContents ? getTrackedUID(details.webContents.id) : undefined;

        if (details.statusCode >= 200 && details.statusCode < 400) {
            if (NET_LOG_SKIP_PATTERNS.some((re) => re.test(details.url))) {
                return;
            }

            netLogger(viewName).verbose(details.method, details.url, details.statusCode, details.statusLine, uid);
        } else {
            netLogger(viewName).error(
                details.method,
                details.url,
                details.statusCode,
                details.statusLine,
                details.error,
                uid,
            );
        }
    });

    webRequestRouter.onErrorOccurred((details) => {
        const viewName = details.webContents ? getWebContentsViewName(details.webContents) : null;
        const uid = details.webContents ? getTrackedUID(details.webContents.id) : undefined;
        netLogger(viewName).error(details.method, details.url, details.error, uid);
    });
}
