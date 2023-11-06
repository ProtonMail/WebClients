import { BrowserWindow, app } from "electron";
import { join } from "path";
import { getConfig } from "./config";
import { setWindowState } from "./windowsStore";

export const isMac = process.platform === "darwin";

export const getBasePath = (): string => {
    const basePath = app.getPath("exe");

    if (basePath.match(/node_modules/)) {
        return __dirname;
    } else if (basePath.match(/MacOS/)) {
        return join(basePath, "..", "..");
    } else {
        return join(basePath, "..");
    }
};

export const isHostCalendar = (host: string) => {
    try {
        const urls = getConfig(app.isPackaged).url;
        const hostURl = new URL(host);

        return urls.calendar === hostURl.origin;
    } catch (error) {
        return false;
    }
};

export const isHostMail = (host: string) => {
    try {
        const urls = getConfig(app.isPackaged).url;
        const hostURl = new URL(host);

        return urls.mail === hostURl.origin;
    } catch (error) {
        return false;
    }
};

export const isHostAllowed = (host: string, isPackaged: boolean) => {
    try {
        const urls = getConfig(isPackaged).url;
        const hostURl = new URL(host);

        return Object.values(urls)
            .map((item) => new URL(item))
            .some((url) => {
                return url.host === hostURl.host;
            });
    } catch (error) {
        return false;
    }
};

export const getWindow = () => {
    return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
};

export const restartApp = (timeout = 300) => {
    setTimeout(() => {
        app.relaunch();
        app.exit();
    }, timeout);
};

export const clearStorage = (restart: boolean, timeout?: number) => {
    const { webContents } = getWindow();
    webContents.session.flushStorageData();
    webContents.session.clearStorageData();
    webContents.session.clearAuthCache();
    webContents.session.clearCache();

    if (restart) {
        restartApp(timeout);
    }
};

export const saveWindowsPosition = (shouldDestroy: boolean) => {
    BrowserWindow.getAllWindows().forEach((window) => {
        if (window.isVisible()) {
            const url = window.webContents.getURL();
            if (isHostCalendar(url)) {
                setWindowState(window.getBounds(), "CALENDAR");
            } else if (isHostMail(url)) {
                setWindowState(window.getBounds(), "MAIL");
            }
        }

        if (shouldDestroy) {
            window.destroy();
        }
    });
};
export const quitApplication = () => {
    saveWindowsPosition(true);
    app.quit();
};
