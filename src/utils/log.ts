import { Session } from "electron";
import Logger from "electron-log";

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
