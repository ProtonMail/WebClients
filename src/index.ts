import { app, BrowserWindow, session, shell } from "electron";
import log from "electron-log/main";
import { moveUninstaller } from "./macos/uninstall";
import { ALLOWED_PERMISSIONS, PARTITION } from "./utils/constants";
import { isHostAllowed, isHostCalendar, isHostMail, isMac, saveWindowsPosition } from "./utils/helpers";
import { getSessionID } from "./utils/urlHelpers";
import { saveHardcodedURLs } from "./utils/urlStore";
import {
    handleCalendarWindow,
    handleMailWindow,
    initialWindowCreation,
    refreshCalendarPage,
} from "./utils/windowManagement";

if (require("electron-squirrel-startup")) {
    app.quit();
}

// Security addition
app.enableSandbox();

saveHardcodedURLs();

log.initialize({ preload: true });
log.info("App start");

moveUninstaller();

// Used to make the app run on Parallels Desktop
// app.commandLine.appendSwitch("no-sandbox");

app.whenReady().then(() => {
    const secureSession = session.fromPartition(PARTITION, {
        cache: false,
    });

    initialWindowCreation({ session: secureSession, mailVisible: true, calendarVisible: false });

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().filter((windows) => windows.isVisible()).length === 0) {
            const window = BrowserWindow.getAllWindows()[0];
            handleMailWindow(window.webContents);
        }
    });

    // Security addition, reject all permissions except notifications
    secureSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
        const { host, protocol } = new URL(_webContents.getURL());
        if (!isHostAllowed(host, app.isPackaged) || protocol !== "https:") {
            return callback(false);
        }

        if (ALLOWED_PERMISSIONS.includes(_permission)) {
            return callback(true);
        }

        callback(false);
    });
});

// Only used on macOS to save the windows position when CMD+Q is used
app.on("before-quit", () => {
    if (isMac) {
        saveWindowsPosition(true);
    }
});

// Security addition
app.on("web-contents-created", (_ev, contents) => {
    const preventDefault = (ev: Electron.Event) => {
        ev.preventDefault();
    };

    contents.on("did-navigate-in-page", (ev, url) => {
        if (!isHostAllowed(url, app.isPackaged)) {
            return preventDefault(ev);
        }

        const sessionID = getSessionID(url);
        if (isHostMail(url) && sessionID && !isNaN(sessionID as unknown as any)) {
            refreshCalendarPage(+sessionID);
        }
    });

    contents.on("will-attach-webview", preventDefault);

    contents.on("will-navigate", (details) => {
        console.log("will-navigate", contents.getURL());
        if (!isHostAllowed(details.url, app.isPackaged)) {
            return preventDefault(details);
        }

        return details;
    });

    contents.setWindowOpenHandler((details) => {
        const { url } = details;

        if (isHostCalendar(url)) {
            handleCalendarWindow(contents);
            return { action: "deny" };
        }

        if (isHostMail(url)) {
            handleMailWindow(contents);
            return { action: "deny" };
        }

        if (isHostAllowed(url, app.isPackaged)) {
            return { action: "allow" };
        } else {
            shell.openExternal(url);
        }

        return { action: "deny" };
    });
});
