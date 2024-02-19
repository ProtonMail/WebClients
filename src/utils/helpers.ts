import { BrowserWindow, app } from "electron";
import Logger from "electron-log";

export const isMac = process.platform === "darwin";
export const isWindows = process.platform === "win32";

export const getPlatform = () => {
    if (isMac) {
        return "macos";
    } else if (isWindows) {
        return "windows";
    }
};

export const restartApp = (timeout = 300) => {
    Logger.info("Restarting app in", timeout, "ms");
    setTimeout(() => {
        app.relaunch();
        app.exit();
    }, timeout);
};

export const clearStorage = (restart: boolean, timeout?: number) => {
    const webContents = BrowserWindow.getFocusedWindow().webContents;
    webContents.session.flushStorageData();
    webContents.session.clearStorageData();
    webContents.session.clearAuthCache();
    webContents.session.clearCache();

    // Clear logs
    Logger.transports.file.getFile().clear();

    if (restart) {
        restartApp(timeout);
    }
};
