import { Notification, Event, app } from "electron";
import { ALLOWED_PERMISSIONS } from "./constants";
import { handleIPCCalls } from "./ipc/main";
import { moveUninstaller } from "./macos/uninstall";
import { saveAppID } from "./store/idStore";
import { getSettings } from "./store/settingsStore";
import { performStoreMigrations } from "./store/storeMigrations";
import { initializeUpdateChecks, updateDownloaded } from "./update";
import { isMac } from "./utils/helpers";
import { isHostAllowed } from "./utils/urls/urlTests";
import { urlOverrideError } from "./utils/view/dialogs";
import { getMainWindow, getWebContentsViewName, viewCreationAppStartup } from "./utils/view/viewManagement";
import { handleSquirrelEvents } from "./windows/squirrel";
import pkg from "../package.json";
import { getTheme, updateNativeTheme } from "./utils/themes";
import { handleWebContents } from "./utils/view/webContents";
import { connectNetLogger, initializeLog, mainLogger } from "./utils/log";
import { registerLogIPCForwardTransport } from "./utils/log/logIPCForwardTransport";
import { handleStartupMailto, handleAppReadyMailto } from "./utils/protocol/mailto";
import { checkDefaultProtocols } from "./utils/protocol/default";
import { initializeSentry } from "./utils/sentry";
import { appSession } from "./utils/session";
import { captureTopLevelRejection, captureUncaughtErrors } from "./utils/log/captureUncaughtErrors";
import { logInitialAppInfo } from "./utils/log/logInitialAppInfo";
import metrics from "./utils/metrics";

(async function () {
    initializeLog();
    captureUncaughtErrors();
    await initializeSentry();
    logInitialAppInfo();
    handleStartupMailto();

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

    // Move uninstaller on macOS
    moveUninstaller();

    // Store migrations
    performStoreMigrations();

    // Used to make the app run on Parallels Desktop
    // app.commandLine.appendSwitch("no-sandbox");

    app.setAppUserModelId(pkg.config.appUserModelId);

    app.on("before-quit", () => {
        const mainWindow = getMainWindow();

        if (!mainWindow || mainWindow.isDestroyed() || updateDownloaded) {
            return;
        }

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
        mainLogger.info("Second instance called", argv);

        // Bring window to focus
        const mainWindow = getMainWindow();
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }

            mainWindow.show();
        }
    });

    if (!app.requestSingleInstanceLock()) {
        mainLogger.info("App is already running");
        app.quit();
        return;
    }

    // After this point we should be able to use all electron APIs safely.
    await app.whenReady();

    checkDefaultProtocols();
    registerLogIPCForwardTransport();
    connectNetLogger(getWebContentsViewName);
    initializeUpdateChecks();
    new Notification();
    handleIPCCalls();
    handleAppReadyMailto();

    // After this point the main window and views have been created
    viewCreationAppStartup();
    metrics.initialize();

    const settings = getSettings();

    if (settings.overrideError) {
        urlOverrideError();
    }

    if (settings.theme) {
        updateNativeTheme(getTheme());
    }

    app.on("activate", () => {
        if (isMac) {
            getMainWindow()?.show();
            return;
        }

        if (!getMainWindow()) {
            viewCreationAppStartup();
        }
    });

    app.on("open-url", (_e: Event, url: string) => {
        mainLogger.info("Open URL event", url);

        // Bring window to focus
        const mainWindow = getMainWindow();
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.show();
    });

    // Security addition, reject all permissions except notifications
    appSession().setPermissionRequestHandler((webContents, permission, callback) => {
        try {
            const { host, protocol } = new URL(webContents.getURL());
            if (!isHostAllowed(host) || protocol !== "https:") {
                return callback(false);
            }

            if (ALLOWED_PERMISSIONS.includes(permission)) {
                return callback(true);
            }

            mainLogger.info("Permission request rejected", permission);
            callback(false);
        } catch (error) {
            mainLogger.error("Permission request error", error);
            callback(false);
        }
    });
})().catch(captureTopLevelRejection);
