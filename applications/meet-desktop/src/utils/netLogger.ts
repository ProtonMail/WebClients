import { WebContents } from "electron";
import { netLogger, sanitizeUrlForLogging } from "./log";
import { appSession } from "./session";
import { ViewID } from "./view/viewState";

export async function connectNetLogger(getWebContentsViewName: (webContents: WebContents) => ViewID | null) {
    appSession().webRequest.onCompleted((details) => {
        const viewName = details.webContents ? getWebContentsViewName(details.webContents) : null;

        // Only log network errors - successful requests don't need logging
        if (details.statusCode < 200 || details.statusCode >= 400) {
            netLogger(viewName).error(
                details.method,
                sanitizeUrlForLogging(details.url),
                details.statusCode,
                details.statusLine,
                details.error,
            );
        }
    });
}
