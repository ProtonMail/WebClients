import { Session } from "electron";
import Logger from "electron-log";
import { VIEW_TARGET } from "../ipc/ipcConstants";

export const mainLogger = Logger.scope("main");
export const ipcLogger = Logger.scope("ipc");
export const squirrelLogger = Logger.scope("squirrel");
export const updateLogger = Logger.scope("update");
export const viewLogger = (viewID: VIEW_TARGET) => Logger.scope(viewID);

export function initializeNetLogger(session: Session) {
    const logger = Logger.scope("net");

    session.webRequest.onCompleted((details) => {
        if (details.statusCode >= 200 && details.statusCode < 400) {
            logger.info(details.method, details.url, details.statusCode, details.statusLine);
        } else {
            logger.info(details.method, details.url, details.statusCode, details.statusLine, details.error);
        }
    });
}

export function clearLogs() {
    Logger.transports.file.getFile().clear();
}
