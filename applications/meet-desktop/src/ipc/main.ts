import { ipcMain, IpcMainEvent, IpcMainInvokeEvent, shell } from "electron";
import type { IPCMeetClientUpdateMessage } from "@proton/shared/lib/desktop/desktopTypes";
import { setRecordingSaveInProgress } from "../utils/downloads";
import { setSessionLocale } from "../utils/locale";
import { ipcLogger } from "../utils/log";
import { setApplicationMenu } from "../utils/menus/menuApplication";
import { getScreenCaptureAccess, requestScreenCaptureAccess } from "../utils/screenPicker";
import { isHostAllowed } from "../utils/urls/urlTests";

function isValidMeetClientUpdateMessage(message: unknown): message is IPCMeetClientUpdateMessage {
    if (typeof message !== "object" || message === null) {
        return false;
    }
    const { type } = message as Record<string, unknown>;
    return type === "openExternal";
}

const isTrustedSender = (event: IpcMainEvent | IpcMainInvokeEvent) => {
    try {
        const { host, protocol } = new URL(event.senderFrame?.url ?? "");
        return protocol === "https:" && isHostAllowed(host);
    } catch {
        return false;
    }
};

export const handleIPCCalls = () => {
    ipcMain.handle("meetScreenCaptureAccess:get", (event) => {
        if (!isTrustedSender(event)) {
            throw new Error("Untrusted sender");
        }
        return getScreenCaptureAccess();
    });

    ipcMain.handle("meetScreenCaptureAccess:request", (event) => {
        if (!isTrustedSender(event)) {
            throw new Error("Untrusted sender");
        }
        return requestScreenCaptureAccess();
    });

    ipcMain.on("meetLocale:set", (event, locale: unknown) => {
        if (!isTrustedSender(event) || typeof locale !== "string") {
            ipcLogger.error("Rejected meetLocale:set");
            return;
        }

        setSessionLocale(locale)
            .then((hasChanged) => {
                if (hasChanged) {
                    setApplicationMenu();
                }
            })
            .catch((error) => ipcLogger.error("Failed to set the session locale", error));
    });

    ipcMain.on("meetRecordingSave:set", (event, isInProgress: unknown) => {
        if (!isTrustedSender(event) || typeof isInProgress !== "boolean") {
            ipcLogger.error("Rejected meetRecordingSave:set");
            return;
        }

        setRecordingSaveInProgress(event.sender, isInProgress);
    });

    ipcMain.on("meetClientUpdate", (_e, message: unknown) => {
        if (!isValidMeetClientUpdateMessage(message)) {
            ipcLogger.error(`Invalid meetClientUpdate message: ${JSON.stringify(message)}`);
            return;
        }

        const { type, payload } = message;

        switch (type) {
            case "openExternal":
                ipcLogger.info("openExternal", payload);
                void shell.openExternal(payload);
                break;
            default:
                ipcLogger.error(`unknown message type: ${type}`);
                break;
        }
    });
};
