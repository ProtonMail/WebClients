import { app, dialog } from "electron";
import { clearLogs, mainLogger } from "./log";
import { DESKTOP_PLATFORMS } from "@proton/shared/lib/constants";
import { c } from "ttag";

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

export const clearStorage = async () => {
    const { t } = c("Clear application data prompt");
    const { response } = await dialog.showMessageBox({
        buttons: [t`Clear application data`, t`Cancel`],
        title: "Proton Meet",
        message: t`Clear application data`,
        detail: t`This removes all data associated with this app. The app will close and you will need to sign in again to use the app.`,
    });

    if (response !== 0) {
        mainLogger.info("Clear application data canceled by user.");
        return;
    }

    mainLogger.info("Clear application data.");

    clearLogs();

    const timeout = 500;
    mainLogger.info("Closing app in", timeout, "ms");
    setTimeout(() => {
        // Since the app can crash under some circunstances when being restarted
        // We are just keeping it closed after clearing data.
        // app.relaunch();
        app.exit();
    }, timeout);
};
