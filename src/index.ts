import { Notification, app, session, shell } from "electron";
import Logger from "electron-log";
import { ALLOWED_PERMISSIONS, PARTITION } from "./constants";
import { handleIPCCalls } from "./ipc/main";
import { moveUninstaller } from "./macos/uninstall";
import { saveWindowBounds } from "./store/boundsStore";
import { saveAppID } from "./store/idStore";
import { getSettings } from "./store/settingsStore";
import { performStoreMigrations } from "./store/storeMigrations";
import { hasTrialEnded } from "./store/trialStore";
import { checkForUpdates, updateDownloaded } from "./update";
import { isLinux, isMac, isWindows } from "./utils/helpers";
import { handleMailToUrls } from "./utils/urls/mailtoLinks";
import { getTrialEndURL } from "./utils/urls/trial";
import {
    getSessionID,
    isAccoutLite,
    isHostAccount,
    isHostAllowed,
    isHostCalendar,
    isHostMail,
    isUpgradeURL,
    isUpsellURL,
} from "./utils/urls/urlTests";
import { urlOverrideError } from "./utils/view/dialogs";
import {
    getCalendarView,
    getMailView,
    getMainWindow,
    reloadCalendarWithSession,
    updateView,
    viewCreationAppStartup,
} from "./utils/view/viewManagement";

if (require("electron-squirrel-startup")) {
    app.quit();
}

// Security addition
app.enableSandbox();

// Config initialization
saveAppID();

if (!app.isPackaged) {
    app.commandLine.appendSwitch("ignore-certificate-errors");
}

// Log initialization
Logger.initialize({ preload: true });
Logger.info("App start is mac:", isMac, "is windows:", isWindows, "isLinux:", isLinux);

// Move uninstaller on macOS
moveUninstaller();

// Store migrations
performStoreMigrations();

// Used to make the app run on Parallels Desktop
// app.commandLine.appendSwitch("no-sandbox");

// Detects if the application is default handler for mailto, works on macOS for now
if (app.isDefaultProtocolClient("mailto")) {
    Logger.info("App is default mailto client");
} else {
    Logger.info("App is not default mailto client");
}

app.setAppUserModelId("com.squirrel.proton_mail.ProtonMail");

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    Logger.info("App is already running");
    app.quit();
} else {
    app.on("second-instance", (_ev, commandLine) => {
        Logger.info("Second instance called");
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
        if (getSettings().overrideError) {
            urlOverrideError();
        }

        const secureSession = session.fromPartition(PARTITION, {
            cache: false,
        });

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
        const mailView = getMailView();
        if (hasTrialEnded() && mailView) {
            const url = getTrialEndURL();
            mailView.webContents?.loadURL(url);
        }

        // Check updates
        checkForUpdates();

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

                Logger.info("Permission request rejected", permission);
                callback(false);
            } catch (error) {
                Logger.error("Permission request error", error);
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
    const preventDefault = (ev: Electron.Event) => {
        ev.preventDefault();
    };

    contents.on("did-navigate-in-page", (ev, url) => {
        Logger.info("did-navigate-in-page");
        if (!isHostAllowed(url)) {
            return preventDefault(ev);
        }

        // This is used to redirect users to the external browser for internal upgrade modals
        if (isHostAccount(url) && isUpgradeURL(url)) {
            shell.openExternal(url);
            return preventDefault(ev);
        }

        const sessionID = getSessionID(url);
        const calendarView = getCalendarView();
        const calendarSessionID = getSessionID(calendarView.webContents.getURL());
        if (isHostMail(url) && sessionID && !calendarSessionID) {
            Logger.info("Refresh calendar session", sessionID);
            reloadCalendarWithSession(sessionID);
        }
    });

    contents.on("will-attach-webview", preventDefault);

    contents.on("will-navigate", (details) => {
        Logger.info("will-navigate");
        if (!isHostAllowed(details.url) && !global.oauthProcess) {
            return preventDefault(details);
        }

        // This is used to redirect users to the external browser for upsell modals
        if (isHostAccount(details.url) && isUpgradeURL(details.url)) {
            shell.openExternal(details.url);
            return preventDefault(details);
        }

        return details;
    });

    contents.setWindowOpenHandler((details) => {
        const { url } = details;

        if (isHostCalendar(url)) {
            Logger.info("Open calendar window");
            updateView("calendar");
            return { action: "deny" };
        }

        if (isHostMail(url)) {
            Logger.info("Open mail window");
            updateView("mail");
            return { action: "deny" };
        }

        if (isHostAccount(url)) {
            // Upsell links should be opened in browser to avoid 3D secure issues
            Logger.info("Account link");
            if (isAccoutLite(url) || isUpsellURL(url)) {
                shell.openExternal(url);
                return { action: "deny" };
            }
            return { action: "allow" };
        } else if (isHostAllowed(url)) {
            return { action: "allow" };
        } else if (global.oauthProcess) {
            Logger.info("Open OAuth link in app");
            return { action: "allow" };
        } else {
            Logger.info("Open link in browser");
            shell.openExternal(url);
        }

        return { action: "deny" };
    });
});
