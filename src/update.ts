import { autoUpdater } from "electron";
import Logger from "electron-log";
import { updateElectronApp } from "update-electron-app";
import pkg from "../package.json";

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
        repo: `${pkg.config.githubUser}/${pkg.config.githubRepo}`,
        // FIXME updateInterval: "1 hour",
        updateInterval: "5 min", // minimal
        logger: Logger,
    });
};
