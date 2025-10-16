import { Notification, Event, app } from "electron";
import { saveAppID } from "./store/idStore";
import { getSettings } from "./store/settingsStore";
import { initializeUpdateChecks, updateDownloaded } from "./update";
import { isMac } from "./utils/helpers";
import { urlOverrideError } from "./utils/view/dialogs";
import {
    bringWindowToFront,
    getMainWindow,
    getWebContentsViewName,
    viewCreationAppStartup,
} from "./utils/view/viewManagement";
import { handleSquirrelEvents } from "./windows/squirrel";
import pkg from "../package.json";
import { initializeDarkTheme } from "./utils/themes";
import { handleWebContents } from "./utils/view/webContents";
import { connectNetLogger, initializeLog, mainLogger } from "./utils/log";
import { initializeSentry } from "./utils/sentry";
import { setRequestPermission, extendAppVersionHeader } from "./utils/session";
import { captureTopLevelRejection, captureUncaughtErrors } from "./utils/log/captureUncaughtErrors";
import { logInitialAppInfo } from "./utils/log/logInitialAppInfo";
import metrics from "./utils/metrics";

(async function () {
    initializeLog();
    captureUncaughtErrors();
    await initializeSentry();
    logInitialAppInfo();

    // Handle squirrel events at the very top of the application
    // WARN: We need to wait for this promise because we do not want any code to be executed
    // during the uninstall process (or any other procees that implies application restart).
    await handleSquirrelEvents();

    // Security addition
    app.enableSandbox();

    // Config initialization
    saveAppID();

    // We do not want to show certificates errors to users.
    // Also, this can happen during development when running the server locally.
    app.commandLine.appendSwitch("ignore-certificate-errors");

    // Enable Picture-in-Picture and Auto PiP features in Chromium
    app.commandLine.appendSwitch(
        "enable-features",
        [
            // Allow automatic PiP transitions initiated by sites
            "AutoPictureInPicture",
            // Ensure Document Picture-in-Picture API is available
            "DocumentPictureInPictureAPI",
        ].join(","),
    );

    // Used to make the app run on Parallels Desktop
    // app.commandLine.appendSwitch("no-sandbox");

    app.setAppUserModelId(pkg.config.appUserModelId);

    app.on("before-quit", () => {
        const mainWindow = getMainWindow();

        if (!mainWindow || mainWindow.isDestroyed() || updateDownloaded) {
            return;
        }

        mainLogger.info("before-quit destroying main window");
        mainWindow.destroy();
    });

    app.on("window-all-closed", () => {
        if (!isMac) {
            mainLogger.info("All windows closed");
            app.quit();
        }
    });

    app.on("web-contents-created", (_ev, contents) => {
        handleWebContents(contents);
    });

    app.on("second-instance", (_ev, argv) => {
        mainLogger.info("Second instance called", argv);

        // Bring window to focus
        bringWindowToFront();
    });

    if (!app.requestSingleInstanceLock()) {
        mainLogger.info("App is already running");
        app.quit();
        return;
    }

    // After this point we should be able to use all electron APIs safely.
    await app.whenReady();

    connectNetLogger(getWebContentsViewName);
    initializeUpdateChecks();
    new Notification();

    // After this point the main window and views have been created
    viewCreationAppStartup();
    metrics.initialize();

    const settings = getSettings();

    if (settings.overrideError) {
        urlOverrideError();
    }

    // Initialize Meet's dark theme
    initializeDarkTheme();

    app.on("activate", () => {
        if (isMac) {
            bringWindowToFront();
            return;
        }

        if (!getMainWindow()) {
            viewCreationAppStartup();
        }
    });

    app.on("open-url", (_e: Event, url: string) => {
        mainLogger.info("Open URL event", url);

        // Bring window to focus
        bringWindowToFront();
    });

    setRequestPermission();
    extendAppVersionHeader();
})().catch(captureTopLevelRejection);
