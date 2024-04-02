import { ipcMain, shell } from "electron";
import { saveTrialStatus } from "../store/trialStore";
import { clearStorage } from "../utils/helpers";
import { refreshHiddenViews, setTrialEnded, updateView } from "../utils/view/viewManagement";
import { handleIPCBadge, resetBadge, showNotification } from "./notification";
import Logger from "electron-log";
import { IPCClientUpdateMessage } from "./ipcConstants";
import { getTheme, setTheme } from "../utils/themes";

function isValidClientUpdateMessage(message: unknown): message is IPCClientUpdateMessage {
    return Boolean(message && typeof message === "object" && "type" in message && "payload" in message);
}

export const handleIPCCalls = () => {
    ipcMain.on("getTheme", (event) => {
        event.returnValue = getTheme();
    });

    ipcMain.on("clientUpdate", (_e, message: unknown) => {
        if (!isValidClientUpdateMessage(message)) {
            Logger.error(`Invalid clientUpdate message: ${message}`);
            return;
        }

        const { type, payload } = message;

        switch (type) {
            case "updateNotification":
                handleIPCBadge(payload);
                break;
            case "userLogout":
                clearStorage(true, 500);
                resetBadge();
                break;
            case "clearAppData":
                clearStorage(true, 500);
                resetBadge();
                break;
            case "oauthPopupOpened":
                global.oauthProcess = payload === "oauthPopupStarted";
                break;
            case "openExternal":
                shell.openExternal(payload);
                break;
            case "trialEnd":
                saveTrialStatus(payload);

                if (payload === "trialEnded") {
                    setTrialEnded();
                }
                break;
            case "changeView":
                updateView(payload);
                break;
            case "showNotification":
                showNotification(payload);
                break;
            case "updateLocale":
                refreshHiddenViews();
                break;
            case "setTheme":
                setTheme(payload);
                break;
            default:
                Logger.error(`unknown message type: ${type}`);
                break;
        }
    });
};
