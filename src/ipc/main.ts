import { BrowserWindow, ipcMain } from "electron";
import { saveTrialStatus } from "../store/trialStore";
import { clearStorage } from "../utils/helpers";
import { getTrialEndURL } from "../utils/urls/trial";
import { updateView } from "../utils/view/viewManagement";
import { handleIPCBadge, resetBadge } from "./badge";

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
    ipcMain.on("trialEnd", (_e, payload) => {
        saveTrialStatus(payload);

        if (payload === "trialEnded") {
            const url = getTrialEndURL();
            clearStorage(true);
            resetBadge();
            BrowserWindow.getFocusedWindow()?.loadURL(url);
        }
    });
    ipcMain.on("changeView", (_e, target) => {
        updateView(target);
    });
};
