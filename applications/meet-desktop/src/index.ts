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
    loadURL,
    showView,
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
import {
    checkDeepLinks,
    handleDeepLink,
    handleSecondInstanceDeepLink,
    handleStartupDeepLink,
} from "./utils/protocol/deep_links";

(async function () {
    initializeLog();
    captureUncaughtErrors();
    await initializeSentry();
    logInitialAppInfo();

    // Handle squirrel events at the very top of the application
    // WARN: We need to wait for this promise because we do not want any code to be executed
    // during the uninstall process (or any other procees that implies application restart).
    await handleSquirrelEvents();

    // Check for startup deep link URL
    const startupUrl = handleStartupDeepLink();

    // Security addition
    app.enableSandbox();

    // Config initialization
    saveAppID();

    // We do not want to show certificates errors to users.
    // Also, this can happen during development when running the server locally.
    app.commandLine.appendSwitch("ignore-certificate-errors");

    // Prevent GTK 2-3-4 collision on the current version of Electron. Should be re-checked when bumping to v37.
    app.commandLine.appendSwitch("gtk-version", "3");

    // Enable Picture-in-Picture and Auto PiP features in Chromium
    app.commandLine.appendSwitch(
        "enable-features",
        [
            // Allow automatic PiP transitions initiated by sites
            "AutoPictureInPicture",
            // Ensure Document Picture-in-Picture API is available
            "DocumentPictureInPictureAPI",
            // Enable native screen sharing picker
            "GetDisplayMediaSet",
            "GetDisplayMediaSetAutoSelectAllScreens",
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
            app.quit();
        }
    });

    app.on("web-contents-created", (_ev, contents) => {
        handleWebContents(contents);
    });

    app.on("second-instance", (_ev, argv) => {
        const deepLinkUrl = handleSecondInstanceDeepLink(argv);
        if (deepLinkUrl) {
            showView("meet", deepLinkUrl);
        }

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

    // Register protocol handler
    checkDeepLinks();
    handleDeepLink();

    connectNetLogger(getWebContentsViewName);
    initializeUpdateChecks();
    new Notification();

    // After this point the main window and views have been created
    viewCreationAppStartup();

    // Navigate to startup URL if provided via protocol
    if (startupUrl) {
        loadURL("meet", startupUrl);
    }

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

    app.on("open-url", (_e: Event) => {
        bringWindowToFront();
    });

    setRequestPermission();
    extendAppVersionHeader();
})().catch(captureTopLevelRejection);
