import { ipcMain, IpcMainInvokeEvent, shell } from "electron";
import type { IPCMeetClientUpdateMessage } from "@proton/shared/lib/desktop/desktopTypes";
import { ipcLogger } from "../utils/log";
import { getScreenCaptureAccess, requestScreenCaptureAccess } from "../utils/screenPicker";
import { isHostAllowed } from "../utils/urls/urlTests";

function isValidMeetClientUpdateMessage(message: unknown): message is IPCMeetClientUpdateMessage {
    if (typeof message !== "object" || message === null) {
        return false;
    }
    const { type } = message as Record<string, unknown>;
    return type === "openExternal";
}

const isTrustedSender = (event: IpcMainInvokeEvent) => {
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
