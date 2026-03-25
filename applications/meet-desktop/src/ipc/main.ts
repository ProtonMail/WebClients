import { ipcMain, shell } from "electron";
import type { IPCMeetClientUpdateMessage } from "@proton/shared/lib/desktop/desktopTypes";
import { ipcLogger } from "../utils/log";

function isValidMeetClientUpdateMessage(message: unknown): message is IPCMeetClientUpdateMessage {
    if (typeof message !== "object" || message === null) {
        return false;
    }
    const { type } = message as Record<string, unknown>;
    return type === "openExternal";
}

export const handleIPCCalls = () => {
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
