import { BrowserWindow, app } from "electron";
import log from "electron-log/main";
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

export const restartApp = (timeout = 300) => {
    log.info("Restarting app in", timeout, "ms");
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
    log.transports.file.getFile().clear();

    if (restart) {
        restartApp(timeout);
    }
};
