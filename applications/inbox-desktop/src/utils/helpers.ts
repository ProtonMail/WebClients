import { app } from "electron";
import { getCalendarView, getMailView } from "./view/viewManagement";
import { clearLogs, mainLogger } from "./log";
import { DESKTOP_PLATFORMS } from "./external/shared/lib/constants";

export const isMac = process.platform === "darwin";
export const isWindows = process.platform === "win32";
export const isLinux = process.platform === "linux";

export const getPlatform = (): DESKTOP_PLATFORMS => {
    if (isMac) {
        return DESKTOP_PLATFORMS.MACOS;
    } else if (isWindows) {
        return DESKTOP_PLATFORMS.WINDOWS;
    } else if (isLinux) {
        return DESKTOP_PLATFORMS.LINUX;
    }

    throw new Error(`Platform "${process.platform}" not supported.`);
};

export const restartApp = (timeout = 300) => {
    mainLogger.info("Restarting app in", timeout, "ms");
    setTimeout(() => {
        // Since the app can crash under some circunstances when being restarted
        // We are just keeping it closed after clearing data.
        // app.relaunch();
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

    clearLogs();

    if (restart) {
        restartApp(timeout);
    }
};

/**
 * Retuns a truncated text if it's longer than maxLength, otherwise returns the original text.
 * If the text is truncated but the last character is a dot, it won't add the three dots.
 *
 * @param text Text to truncate if it's longer than maxLength
 * @param maxLength Max length of the text
 * @returns Truncated text
 */
export const smartTruncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) {
        return text;
    }

    let truncated = text.slice(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(" ");

    if (lastSpaceIndex === -1) {
        truncated = text.slice(0, maxLength);
    } else {
        truncated = text.slice(0, lastSpaceIndex);
    }

    if (truncated.endsWith(".")) {
        return truncated;
    }

    return `${truncated}...`;
};
