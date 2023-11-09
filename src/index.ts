import { app, BrowserWindow, session, shell } from "electron";
import { ALLOWED_PERMISSIONS, PARTITION } from "./utils/constants";
import { isHostAllowed, isHostCalendar, isHostMail, isMac, saveWindowsPosition } from "./utils/helpers";
import { saveHardcodedURLs } from "./utils/urlStore";
import { handleCalendarWindow, handleMailWindow, initialWindowCreation } from "./utils/windowManagement";

if (require("electron-squirrel-startup")) {
    app.quit();
}

// Security addition
app.enableSandbox();

saveHardcodedURLs();

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

app.on("before-quit", () => {
    saveWindowsPosition(true);
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

    contents.on("will-attach-webview", preventDefault);

    contents.on("will-navigate", (details) => {
        if (!isHostAllowed(details.url, app.isPackaged)) {
            return preventDefault(details);
        }

        return details;
    });

    contents.setWindowOpenHandler((details) => {
        const { url } = details;

        if (isHostCalendar(url)) {
            handleCalendarWindow(contents);
            return;
        }

        if (isHostMail(url)) {
            handleMailWindow(contents);
            return;
        }

        if (isHostAllowed(url, app.isPackaged)) {
            return { action: "allow" };
        } else {
            shell.openExternal(url);
        }

        return { action: "deny" };
    });
});
