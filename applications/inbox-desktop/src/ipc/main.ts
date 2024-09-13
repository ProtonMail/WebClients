import { IpcMainEvent, ipcMain, shell } from "electron";
import { setReleaseCategory } from "../store/settingsStore";
import { cachedLatestVersion } from "../update";
import { IPCInboxClientUpdateMessage, IPCInboxGetInfoMessage } from "@proton/shared/lib/desktop/desktopTypes";
import { clearStorage } from "../utils/helpers";
import { ipcLogger } from "../utils/log";
import { getTheme, isEqualTheme, setTheme } from "../utils/themes";
import { reloadHiddenViews, resetHiddenViews, showEndOfTrial, showView } from "../utils/view/viewManagement";
import { DESKTOP_FEATURES } from "./ipcConstants";
import { handleIPCBadge, resetBadge, showNotification } from "./notification";
import { clearInstallSource, getInstallSource } from "../store/installSourceStore";

function isValidClientUpdateMessage(message: unknown): message is IPCInboxClientUpdateMessage {
    return Boolean(message && typeof message === "object" && "type" in message && "payload" in message);
}

export const handleIPCCalls = () => {
    ipcMain.on("hasFeature", (event: IpcMainEvent, message: keyof typeof DESKTOP_FEATURES) => {
        event.returnValue = !!DESKTOP_FEATURES[message];
    });

    ipcMain.on("getInfo", (event: IpcMainEvent, message: IPCInboxGetInfoMessage["type"]) => {
        switch (message) {
            case "theme":
                event.returnValue = getTheme();
                break;
            case "latestVersion":
                event.returnValue = cachedLatestVersion;
                break;
            case "installSource": {
                const installSource = getInstallSource();
                event.returnValue = installSource;
                clearInstallSource();
                break;
            }
            default:
                ipcLogger.error(`Invalid getInfo message: ${message}`);
                break;
        }
    });

    ipcMain.on("clientUpdate", (_e, message: unknown) => {
        if (!isValidClientUpdateMessage(message)) {
            ipcLogger.error(`Invalid clientUpdate message: ${message}`);
            return;
        }

        const { type, payload } = message;

        switch (type) {
            case "updateNotification":
                handleIPCBadge(payload);
                break;
            case "userLogin":
                resetHiddenViews();
                break;
            case "userLogout":
                resetHiddenViews();
                resetBadge();
                break;
            case "clearAppData":
                clearStorage(true, 500);
                resetBadge();
                break;
            case "oauthPopupOpened":
                global.oauthProcess = payload === "oauthPopupStarted";
                break;
            case "subscriptionModalOpened":
                global.subscriptionProcess = payload === "subscriptionModalStarted";
                break;
            case "openExternal":
                shell.openExternal(payload);
                break;
            case "trialEnd":
                resetBadge();
                showEndOfTrial();
                break;
            case "changeView":
                showView(payload);
                break;
            case "showNotification":
                showNotification(payload);
                break;
            case "updateLocale":
                reloadHiddenViews();
                break;
            case "setTheme": {
                if (!isEqualTheme(getTheme(), payload)) {
                    setTheme(payload);
                    reloadHiddenViews();
                }
                break;
            }
            case "earlyAccess": {
                setReleaseCategory(payload);
                break;
            }
            default:
                ipcLogger.error(`unknown message type: ${type}`);
                break;
        }
    });
};
