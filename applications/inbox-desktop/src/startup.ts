import { app } from "electron";
import { getAppURL } from "./store/urlStore";
import { updateDownloaded } from "./update/update";
import { authStatusPoller } from "./utils/auth/authPoller";
import { isMac } from "./utils/helpers";
import { registerWindowEventLog } from "./utils/log/appEventLog";
import { setApplicationMenu } from "./utils/menus/menuApplication";
import { readAndClearOpenCalendarArgs, readAndClearOpenMailArgs } from "./utils/protocol/deep_links";
import { readAndClearMailtoArgs } from "./utils/protocol/mailto";
import telemetryService from "./utils/telemetry";
import { createMainWindow, openFirstView, restoreMainWindowState, setUpMainWindow } from "./utils/view/viewManagement";
import { getMailView, getMainWindow } from "./utils/view/viewState";
import { macOSExitEvent, windowsAndLinuxExitEvent } from "./utils/view/windowClose";

/**
 * Creates the main window, wires the modules that depend on it and opens the first view.
 * Only index.ts may import this module: it imports from every layer of the app.
 */
export const startup = async () => {
    const mainWindow = createMainWindow();
    // The menu reads the window session for the spell check state, so it is built once the window exists.
    setApplicationMenu();
    setUpMainWindow(mainWindow);

    authStatusPoller.attachToWindow(mainWindow);

    registerWindowEventLog(mainWindow);
    telemetryService.registerAppInFocusTelemetry(mainWindow, getMailView);

    mainWindow.on("close", (event) => {
        // We don't want to prevent the close event if the update is downloaded
        if (updateDownloaded) {
            return;
        }

        event.preventDefault();

        if (isMac) {
            macOSExitEvent(getMainWindow());
        } else {
            windowsAndLinuxExitEvent(getMainWindow());
        }
    });

    restoreMainWindowState(mainWindow);

    // For e2e playwright tests load mail immediately.
    if (process.env.PLAYWRIGHT_TEST === "true") {
        await openFirstView("mail", getAppURL().mail);
        return;
    }

    // We add the delay to avoid blank windows on startup, only mac supports openAtLogin for now
    const delay = isMac && app.getLoginItemSettings().openAtLogin ? 100 : 0;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const mailto = readAndClearMailtoArgs();
    if (mailto) {
        void openFirstView("mail", getAppURL().mail + `/inbox#mailto=${mailto}`);
        return;
    }

    const openMail = readAndClearOpenMailArgs();
    if (openMail) {
        void openFirstView("mail", getAppURL().mail + `/inbox#${openMail}`);
        return;
    }

    const openCalendar = readAndClearOpenCalendarArgs();
    if (openCalendar) {
        void openFirstView("calendar", getAppURL().calendar);
        return;
    }

    void openFirstView("mail", getAppURL().mail);
};
