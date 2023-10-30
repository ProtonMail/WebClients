import { BrowserWindow, app, screen } from "electron";
import { join } from "path";
import { getConfig } from "./config";
import { DEFAULT_WINDOW_HEIGHT, DEFAULT_WINDOW_WIDTH } from "./constants";

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
    const urls = getConfig(app.isPackaged).url;
    const hostURl = new URL(host);

    return urls.calendar === hostURl.origin;
};

export const isHostMail = (host: string) => {
    const urls = getConfig(app.isPackaged).url;
    const hostURl = new URL(host);

    return urls.mail === hostURl.origin;
};

export const isHostAllowed = (host: string, isPackaged: boolean) => {
    const urls = getConfig(isPackaged).url;
    const hostURl = new URL(host);

    return Object.values(urls)
        .map((item) => new URL(item))
        .some((url) => {
            return url.host === hostURl.host;
        });
};

export const getWindowSize = () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const windowWidth = Math.round(width * 0.95);
    const windowHeight = Math.round(height * 0.9);

    return {
        height: DEFAULT_WINDOW_HEIGHT > height ? windowHeight : DEFAULT_WINDOW_HEIGHT,
        width: DEFAULT_WINDOW_WIDTH > width ? windowWidth : DEFAULT_WINDOW_WIDTH,
    };
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

export const quitApplication = () => {
    BrowserWindow.getAllWindows().forEach((window) => {
        window.destroy();
    });
    app.quit();
};
