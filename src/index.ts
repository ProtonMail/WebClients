import { app, BrowserWindow, globalShortcut, session, shell } from "electron";
import { ALLOWED_PERMISSIONS, PARTITION } from "./utils/constants";
import { isHostAllowed, isHostCalendar, isHostMail, isMac, quitApplication } from "./utils/helpers";
import { macosStartup } from "./utils/macos";
import { handleCalendarWindow, handleMailWindow, initialWindowCreation } from "./utils/windowManagement";

if (require("electron-squirrel-startup")) {
    app.quit();
}

// Security addition
app.enableSandbox();

// Used to make the app run on Parallels Desktop
// app.commandLine.appendSwitch("no-sandbox");

app.whenReady().then(() => {
    let partition = PARTITION;
    if (isMac) {
        partition = macosStartup();
    }

    const secureSession = session.fromPartition(partition, {
        cache: false,
    });

    // TODO check how this works on windows
    globalShortcut.register("Command+Q", quitApplication);

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

    // Security addition
    secureSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: /* eng-disable CSP_GLOBAL_CHECK */ {
                ...details.responseHeaders,
                "Content-Security-Policy": ["default-src: 'self'; object-src: 'none'"],
            },
        });
    });
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
        const { url, disposition } = details;
        console.log({ details });

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
