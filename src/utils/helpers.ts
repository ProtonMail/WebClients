import { app } from "electron";
import Logger from "electron-log";
import { getCalendarView, getMailView } from "./view/viewManagement";

export const isMac = process.platform === "darwin";
export const isWindows = process.platform === "win32";
export const isLinux = process.platform === "linux";

export const getPlatform = () => {
    if (isMac) {
        return "macos";
    } else if (isWindows) {
        return "windows";
    } else if (isLinux) {
        return "linux";
    }
};

export const restartApp = (timeout = 300) => {
    Logger.info("Restarting app in", timeout, "ms");
    setTimeout(() => {
        app.relaunch();
        app.exit();
    }, timeout);
};

const clear = (view: Electron.BrowserView) => {
    view.webContents.session.flushStorageData();
    view.webContents.session.clearStorageData();
    view.webContents.session.clearAuthCache();
    view.webContents.session.clearCache();
};

export const clearStorage = (restart: boolean, timeout?: number) => {
    const mailView = getMailView();
    const calendaView = getCalendarView();

    if (mailView) {
        clear(mailView);
    }
    if (calendaView) {
        clear(calendaView);
    }

    // Clear logs
    Logger.transports.file.getFile().clear();

    if (restart) {
        restartApp(timeout);
    }
};
