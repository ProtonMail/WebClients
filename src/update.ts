import { autoUpdater } from "electron";
import Logger from "electron-log";
import { updateElectronApp } from "update-electron-app";

export let updateDownloaded = false;
autoUpdater.on("update-downloaded", () => {
    updateDownloaded = true;
});

autoUpdater.on("before-quit-for-update", () => {
    updateDownloaded = true;
});

export const checkForUpdates = () => {
    Logger.info("checkForUpdates");

    updateElectronApp({
        repo: "ProtonMail/inbox-desktop",
        updateInterval: "1 hour",
        logger: Logger,
    });
};
