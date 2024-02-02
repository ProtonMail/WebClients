import { ipcMain } from "electron";
import log from "electron-log";
import { clearStorage } from "../utils/helpers";
import { handleIPCBadge } from "./badge";

export const handleIPCCalls = () => {
    ipcMain.on("updateNotification", (_e, count: number) => {
        log.info("IPC updateNotification");
        handleIPCBadge(count);
    });
    ipcMain.on("userLogout", () => {
        log.info("IPC userLogout");
        clearStorage(true, 500);
    });
    ipcMain.on("clearAppData", () => {
        log.info("IPC clearAppData");
        clearStorage(true, 500);
    });
    ipcMain.on("oauthPopupOpened", (_e, payload) => {
        log.info("IPC oauthPopupOpened", payload);
        global.oauthProcess = payload === "oauthPopupStarted";
    });
};
