import { ipcMain, shell } from "electron";
import { saveTrialStatus } from "../store/trialStore";
import { clearStorage } from "../utils/helpers";
import { setTrialEnded, updateView } from "../utils/view/viewManagement";
import { handleIPCBadge, resetBadge, showNotification } from "./notification";

export const handleIPCCalls = () => {
    ipcMain.on("updateNotification", (_e, count: number) => {
        handleIPCBadge(count);
    });
    ipcMain.on("userLogout", () => {
        clearStorage(true, 500);
        resetBadge();
    });
    ipcMain.on("clearAppData", () => {
        clearStorage(true, 500);
        resetBadge();
    });
    ipcMain.on("oauthPopupOpened", (_e, payload) => {
        global.oauthProcess = payload === "oauthPopupStarted";
    });
    ipcMain.on("openExternal", (_e, url) => {
        shell.openExternal(url);
    });
    ipcMain.on("trialEnd", (_e, payload) => {
        saveTrialStatus(payload);

        if (payload === "trialEnded") {
            setTrialEnded();
        }
    });
    ipcMain.on("changeView", (_e, target) => {
        updateView(target);
    });
    ipcMain.on('showNotification', (_e, payload) => {
        showNotification(payload)
    })
};
