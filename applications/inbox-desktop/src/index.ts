import { Notification, Event, app, BrowserWindow } from "electron";
import { handleIPCCalls } from "./ipc/main";
import { handleWinNotification } from "./ipc/notification";
import { moveUninstaller } from "./macos/uninstall";
import { saveAppID } from "./store/idStore";
import { getSettings } from "./store/settingsStore";
import { performStoreMigrations } from "./store/storeMigrations";
import { initializeUpdateChecks, updateDownloaded } from "./update/update";
import { isMac } from "./utils/helpers";
import { urlOverrideError } from "./utils/view/dialogs";
import {
    bringWindowToFront,
    getCurrentViewID,
    getMainWindow,
    getWebContentsViewName,
    viewCreationAppStartup,
} from "./utils/view/viewManagement";
import { handleSquirrelEvents } from "./windows/squirrel";
import pkg from "../package.json";
import { getTheme, updateNativeTheme } from "./utils/themes";
import { isWindowValid } from "./utils/view/windowUtils";
import { handleWebContents } from "./utils/view/webContents";
import { connectNetLogger, initializeLog, mainLogger } from "./utils/log";
import { handleStartupMailto, handleAppReadyMailto } from "./utils/protocol/mailto";
import { handleDeepLink, handleStartupDeepLink } from "./utils/protocol/deep_links";
import { checkDefaultProtocols } from "./utils/protocol/default";
import { initializeSentry } from "./utils/sentry";
import { setRequestPermission, extendAppVersionHeader } from "./utils/session";
import { captureTopLevelRejection, captureUncaughtErrors } from "./utils/log/captureUncaughtErrors";
import { logInitialAppInfo } from "./utils/log/logInitialAppInfo";
import metrics from "./utils/metrics";
import { measureRequestTime } from "./utils/log/measureRequestTime";
import { initializeFeatureFlagManager } from "./utils/flags/manager";
import { handleSecondInstance } from "./utils/event-handlers/second-instance";
import { registerDebugStartOptions } from "./debug/start-options";
import { registerIOStreamErrorHandlers } from "./utils/errors/io-stream";

(async function () {
    initializeLog();
    captureUncaughtErrors();
    registerIOStreamErrorHandlers();
    await initializeSentry();
    logInitialAppInfo();
    handleStartupMailto();
    handleStartupDeepLink();

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

    // Prevent GTK 2-3-4 collision on the current version of Electron. Should be re-checked when bumping to v37.
    app.commandLine.appendSwitch("gtk-version", "3");

    // Move uninstaller on macOS
    moveUninstaller();

    // Store migrations
    performStoreMigrations();

    // Used to make the app run on Parallels Desktop
    // app.commandLine.appendSwitch("no-sandbox");

    // Set debugging start options (such as '--devtools')
    registerDebugStartOptions();

    app.setAppUserModelId(pkg.config.appUserModelId);

    app.on("before-quit", () => {
        const mainWindow = getMainWindow();

        if (!isWindowValid(mainWindow) || updateDownloaded) {
            return;
        }

        mainLogger.info("before-quit destroying main window");
        mainWindow.destroy();

        BrowserWindow.getAllWindows().forEach((window) => {
            if (!window.isDestroyed()) {
                window.destroy();
            }
        });
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

    if (!app.requestSingleInstanceLock()) {
        mainLogger.info("App is already running");
        app.quit();
        return;
    }

    // After this point we should be able to use all electron APIs safely.
    await app.whenReady();

    handleSecondInstance();
    checkDefaultProtocols();
    connectNetLogger(getWebContentsViewName);
    measureRequestTime();
    initializeUpdateChecks();
    new Notification();
    handleIPCCalls();
    handleAppReadyMailto();
    handleDeepLink();
    handleWinNotification();

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

    initializeFeatureFlagManager();
    setRequestPermission();
    extendAppVersionHeader();

    if (process.env.PLAYWRIGHT_TEST === "true") {
        // We can expose a method through the global node context.
        // Playwright can interface with it via JS handles.
        // In turn this enables us to evaluate what view is presented in the main browser window on INDA.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).getCurrentViewID = getCurrentViewID;
    }
})().catch(captureTopLevelRejection);
