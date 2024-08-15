import { Notification, app, session } from "electron";
import { ALLOWED_PERMISSIONS, PARTITION } from "./constants";
import { handleIPCCalls } from "./ipc/main";
import { moveUninstaller } from "./macos/uninstall";
import { saveWindowBounds } from "./store/boundsStore";
import { saveAppID } from "./store/idStore";
import { getSettings } from "./store/settingsStore";
import { performStoreMigrations } from "./store/storeMigrations";
import { initializeUpdateChecks, updateDownloaded } from "./update";
import { isLinux, isMac, isWindows } from "./utils/helpers";
import { handleMailToUrls } from "./utils/urls/mailtoLinks";
import { isHostAllowed } from "./utils/urls/urlTests";
import { urlOverrideError } from "./utils/view/dialogs";
import { getMainWindow, getWebContentsViewName, viewCreationAppStartup } from "./utils/view/viewManagement";
import { handleSquirrelEvents } from "./windows/squirrel";
import pkg from "../package.json";
import { DESKTOP_FEATURES } from "./ipc/ipcConstants";
import { getTheme, updateNativeTheme } from "./utils/themes";
import { handleWebContents } from "./utils/view/webContents";
import { connectNetLogger, initializeLog, mainLogger } from "./utils/log";
import { registerLogIPCForwardTransport } from "./utils/logIPCForwardTransport";

(async function () {
    initializeLog();

    mainLogger.info(
        "App start is mac:",
        isMac,
        "is windows:",
        isWindows,
        "isLinux:",
        isLinux,
        "version:",
        app.getVersion(),
    );

    mainLogger.info(
        "Desktop features:",
        Object.entries(DESKTOP_FEATURES)
            .map(([key, value]) => `${key}:${value}`)
            .join(", "),
    );

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

    // Detects if the application is default handler for mailto, works on macOS for now
    if (app.isDefaultProtocolClient("mailto")) {
        mainLogger.info("App is default mailto client");
    } else {
        mainLogger.info("App is not default mailto client");
    }

    app.setAppUserModelId(pkg.config.appUserModelId);

    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        mainLogger.info("App is already running");
        app.quit();
    } else {
        app.on("second-instance", (_ev, commandLine) => {
            mainLogger.info("Second instance called");
            const mainWindow = getMainWindow();
            if (mainWindow) {
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                mainWindow.focus();
            }

            handleMailToUrls(commandLine?.pop() || "");
        });

        app.whenReady().then(() => {
            registerLogIPCForwardTransport();
            const settings = getSettings();

            if (settings.overrideError) {
                urlOverrideError();
            }

            if (settings.theme) {
                updateNativeTheme(getTheme());
            }

            const secureSession = session.fromPartition(PARTITION, {
                cache: false,
            });

            connectNetLogger(secureSession, getWebContentsViewName);

            app.on("activate", () => {
                if (isMac) {
                    getMainWindow()?.show();
                    return;
                }

                if (!getMainWindow()) {
                    return viewCreationAppStartup(secureSession);
                }
            });

            viewCreationAppStartup(secureSession);

            // Check updates
            initializeUpdateChecks();

            // Trigger blank notification to force presence in settings
            new Notification();

            // Handle IPC calls coming from the destkop application
            handleIPCCalls();

            // Normally this only works on macOS and is not required for Windows
            app.on("open-url", (_e, url) => {
                handleMailToUrls(url);
            });

            // Security addition, reject all permissions except notifications
            secureSession.setPermissionRequestHandler((webContents, permission, callback) => {
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
        });
    }

    // Only used on macOS to save the windows position when CMD+Q is used
    app.on("before-quit", () => {
        const mainWindow = getMainWindow();
        if (!mainWindow || !isMac || updateDownloaded) {
            return;
        }

        saveWindowBounds(mainWindow);
        mainWindow.destroy();
    });

    app.on("window-all-closed", () => {
        if (!isMac) {
            app.quit();
        }
    });

    // Security addition
    app.on("web-contents-created", (_ev, contents) => {
        handleWebContents(contents);
    });
})();
