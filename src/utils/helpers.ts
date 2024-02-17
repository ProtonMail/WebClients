import { BrowserWindow, app, shell } from "electron";
import log from "electron-log/main";
import { join } from "path";
import { getConfig } from "./config";
import { logURL } from "./logs";

export const isMac = process.platform === "darwin";
export const isWindows = process.platform === "win32";

export const getPlatform = () => {
    if (isMac) {
        return "macos";
    } else if (isWindows) {
        return "windows";
    }
};

export const isHostCalendar = (host: string) => {
    try {
        const urls = getConfig().url;
        const hostURl = new URL(host);

        return urls.calendar === hostURl.origin;
    } catch (error) {
        log.error("isHostCalendar", error);
        return false;
    }
};

export const isHostMail = (host: string) => {
    try {
        const urls = getConfig().url;
        const hostURl = new URL(host);

        return urls.mail === hostURl.origin;
    } catch (error) {
        log.error("isHostMail", error);
        return false;
    }
};

export const isHostAccount = (host: string) => {
    try {
        const urls = getConfig().url;
        const hostURl = new URL(host);

        return urls.account === hostURl.origin;
    } catch (error) {
        log.error("isHostAccount", error);
        return false;
    }
};

export const isAccoutLite = (host: string) => {
    try {
        const hostURl = new URL(host);
        return hostURl.pathname.includes("/lite");
    } catch (error) {
        log.error("isAccoutLite", error);
        return false;
    }
};

export const isUpsellURL = (host: string) => {
    try {
        const hostURl = new URL(host);
        const plan = hostURl.searchParams.get("plan");
        const billing = hostURl.searchParams.get("billing");
        const currency = hostURl.searchParams.get("currency");
        const coupon = hostURl.searchParams.get("coupon");
        return hostURl.pathname.includes("/signup") && (plan || billing || currency || coupon);
    } catch (error) {
        log.error("isUpsellURL", error);
        return false;
    }
};

export const isHostAllowed = (host: string) => {
    try {
        logURL("isHostAllowed", host);
        const urls = getConfig().url;
        let finalURL = host;
        if (!finalURL.startsWith("https://")) {
            finalURL = "https://" + finalURL;
        }

        const hostURl = new URL(finalURL);

        return Object.values(urls)
            .map((item) => new URL(item))
            .some((url) => {
                return url.host === hostURl.host;
            });
    } catch (error) {
        log.error("isHostAllowed", error);
        return false;
    }
};

export const getWindow = () => {
    return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
};

export const restartApp = (timeout = 300) => {
    log.info("Restarting app in", timeout, "ms");
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

    // Clear logs
    log.transports.file.getFile().clear();

    if (restart) {
        restartApp(timeout);
    }
};

export const openLogFolder = () => {
    try {
        const home = app.getPath("home");
        if (isMac) {
            log.info("openLogFolder macOS");
            shell.openPath(join(home, "/Library/Logs/Proton Mail"));
        } else if (isWindows) {
            log.info("openLogFolder Windows");
            shell.openPath(join(home, "/AppData/Roaming/Proton Mail/logs"));
        }
        log.info("openLogFolder, not macOS or Windows");
    } catch (error) {
        log.error("openLogFolder", error);
    }
};

export const saveWindowsPosition = (shouldDestroy: boolean) => {
    log.info("Saving windows position");
    BrowserWindow.getAllWindows().forEach((window) => {
        if (window.isVisible()) {
            const url = window.webContents.getURL();
            logURL("saveWindowsPosition", url);
            log.info("saveWindowsPosition bounds", window.getBounds());
            if (isHostCalendar(url)) {
                // setWindowState(window.getBounds(), "CALENDAR");
            } else if (isHostMail(url)) {
                // setWindowState(window.getBounds(), "MAIL");
            }
        }

        if (shouldDestroy) {
            log.info("Destroying window after window position save");
            window.destroy();
        }
    });
};
