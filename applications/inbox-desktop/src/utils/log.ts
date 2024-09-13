import { Session, WebContents } from "electron";
import Logger from "electron-log";
import { CHANGE_VIEW_TARGET } from "@proton/shared/lib/desktop/desktopTypes";

export const mainLogger = Logger.scope("main");
export const ipcLogger = Logger.scope("ipc");
export const netLogger = (viewID: CHANGE_VIEW_TARGET | null) =>
    viewID ? Logger.scope(`net/${viewID}`) : Logger.scope("net");
export const settingsLogger = Logger.scope("settings");
export const updateLogger = Logger.scope("update");
export const protocolLogger = Logger.scope("protocol");
export const viewLogger = (viewID: CHANGE_VIEW_TARGET) => Logger.scope(viewID);

export function initializeLog() {
    Logger.initialize({ preload: true });
    Logger.transports.file.maxSize = 5 * 1024 * 1024; // 3MB
}

export async function connectNetLogger(
    session: Session,
    getWebContentsViewName: (webContents: WebContents) => CHANGE_VIEW_TARGET | null,
) {
    session.webRequest.onCompleted((details) => {
        const viewName = details.webContents ? getWebContentsViewName(details.webContents) : null;

        if (details.statusCode >= 200 && details.statusCode < 400) {
            netLogger(viewName).verbose(details.method, details.url, details.statusCode, details.statusLine);
        } else {
            netLogger(viewName).error(
                details.method,
                details.url,
                details.statusCode,
                details.statusLine,
                details.error,
            );
        }
    });
}

export function clearLogs() {
    Logger.transports.file.getFile().clear();
}
