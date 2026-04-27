// Tracks the most recent x-pm-uid seen per webContents, updated on every outgoing request.

import { uidLogger } from "../log";

// Keyed by webContentsId so mail/calendar/account each carry their own session UID.
const trackedUIDs = new Map<number, string>();
const viewNames = new Map<number, string>();

export const setViewName = (webContentsId: number, viewName: string) => {
    viewNames.set(webContentsId, viewName);
};

export const updateTrackedUID = (webContentsId: number, uid: string) => {
    if (getTrackedUID(webContentsId) !== uid) {
        const name = viewNames.get(webContentsId) ?? `webContents:${webContentsId}`;
        uidLogger.info(`UID changed; viewName: ${name}, uid: ${uid}`);
    }
    trackedUIDs.set(webContentsId, uid);
};

export const getTrackedUID = (webContentsId: number): string | undefined => {
    return trackedUIDs.get(webContentsId);
};
