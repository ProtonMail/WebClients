import { Notification, Event, app, session } from "electron";
import { ALLOWED_PERMISSIONS, PARTITION } from "./constants";
import { handleIPCCalls } from "./ipc/main";
import { moveUninstaller } from "./macos/uninstall";
import { saveAppID } from "./store/idStore";
import { getSettings } from "./store/settingsStore";
import { performStoreMigrations } from "./store/storeMigrations";
import { initializeUpdateChecks, updateDownloaded } from "./update";
import { isLinux, isMac, isWindows } from "./utils/helpers";
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
import { handleStartupMailto, handleAppReadyMailto } from "./utils/protocol/mailto";
import { checkDefaultProtocols } from "./utils/protocol/default";

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
        "params",
        process.argv,
    );

    mainLogger.info(
        "Desktop features:",
        Object.entries(DESKTOP_FEATURES)
            .map(([key, value]) => `${key}:${value}`)
            .join(", "),
    );

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

    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        mainLogger.info("App is already running");
        app.quit();
    } else {
        checkDefaultProtocols();

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

            app.on("open-url", (_e: Event, url: string) => {
                mainLogger.info("Open URL event", url);

                // Bring window to focus
                const mainWindow = getMainWindow();
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                mainWindow.show();
            });

            handleAppReadyMailto();

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

    // Security addition
    app.on("web-contents-created", (_ev, contents) => {
        handleWebContents(contents);
    });
})();
