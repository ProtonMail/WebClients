import { BrowserWindow, BrowserWindowConstructorOptions, Rectangle, Session, WebContents, app } from "electron";
import log from "electron-log/main";
import { getWindowState } from "../store/windowsStore";
import { handleBeforeHandle } from "./beforeUnload";
import { getConfig } from "./config";
import { APP, WINDOW_SIZES } from "./constants";
import { areAllWindowsClosedOrHidden, isMac, isWindows } from "./helpers";
import { checkKeys } from "./keyPinning";
import { logURL } from "./logs";
import { setApplicationMenu } from "./menu";
import { createContextMenu } from "./menuContext";
import { getSessionID } from "./url";

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

interface WindowCreationProps {
    session: Session;
    mailVisible?: boolean;
    calendarVisible?: boolean;
}

const config = getConfig(app.isPackaged);
export const windowMap = new Map<APP, BrowserWindow>();

const getOSSpecificConfig = (): BrowserWindowConstructorOptions => {
    if (isMac) {
        log.info("getOSSpecificConfig, macOSConfig");
        return {
            frame: false,
            titleBarStyle: "hidden",
            vibrancy: "sidebar",
            trafficLightPosition: { x: 12, y: 18 },
        };
    } else if (isWindows) {
        log.info("getOSSpecificConfig, windowOSConfig");
        return {};
    }
    log.info("getOSSpecificConfig, empty object");
    return {};
};

const createWindow = (session: Session, url: string, visible: boolean, windowConfig: Rectangle): BrowserWindow => {
    logURL("createWindow", url);
    const { x, y, width, height } = windowConfig;

    const window = new BrowserWindow({
        title: config.appTitle,
        icon: "../../assets/icon.png",
        x,
        y,
        width,
        height,
        minHeight: WINDOW_SIZES.MIN_HEIGHT,
        minWidth: WINDOW_SIZES.MIN_WIDTH,
        ...getOSSpecificConfig(),
        webPreferences: {
            devTools: config.devTools,
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            spellcheck: true,
            // Security additions
            session,
            nodeIntegration: false,
            contextIsolation: true,
            disableBlinkFeatures: "Auxclick",
            sandbox: true,
        },
    });

    setApplicationMenu(app.isPackaged);
    handleBeforeHandle(window);
    window.loadURL(url);

    window.webContents.on("context-menu", (_e, props) => {
        createContextMenu(props, window).popup();
    });

    window.webContents.session.setCertificateVerifyProc((request, callback) => {
        const callbackValue = checkKeys(request);
        callback(callbackValue);
    });

    if (visible) {
        logURL("createWindow, visible", url);
        window.showInactive();
        window.setOpacity(1);
        window.focus();
    } else {
        logURL("createWindow, hidden", url);
        window.hide();
        window.setOpacity(0);
    }

    return window;
};

const createGenericWindow = (session: Session, url: string, mapKey: APP, visible: boolean, windowConfig: Rectangle) => {
    logURL("createGenericWindow", url);
    const window = createWindow(session, url, visible, windowConfig);

    // Used to keep track of closing windows on macOS and hide them during leave-full-screen callback
    let closingMacOSFullscreen = false;

    // TODO handle Linux close events
    // Windows on close event
    window.on("close", (ev) => {
        if (!isWindows) {
            return;
        }

        ev.preventDefault();
        window.hide();
        window.setOpacity(0);

        // Close the application if all windows are closed
        if (areAllWindowsClosedOrHidden()) {
            log.info("close, areAllWindowsClosedOrHidden on Windows");
            BrowserWindow.getAllWindows().forEach((window) => window.destroy());
            app.quit();
        }
    });

    // macOS on close event
    window.on("close", (ev) => {
        if (!isMac) {
            return;
        }

        ev.preventDefault();
        if (window.isFullScreen()) {
            log.info("close, isFullScreen on macOS");
            closingMacOSFullscreen = true;
            window.setFullScreen(false);
        } else {
            window.hide();
            window.setOpacity(0);
        }
    });

    // Handle macOS fullscreen close event
    window.on("leave-full-screen", () => {
        if (!closingMacOSFullscreen || !isMac) {
            return;
        }
        log.info("close, leave-full-screen on macOS");
        window.hide();
        window.setOpacity(0);
        closingMacOSFullscreen = false;
    });

    windowMap.set(mapKey, window);
    return window;
};

export const createMailWindow = (session: Session, visible = true) => {
    log.info("createMailWindow", visible);
    const state = getWindowState("MAIL");
    const window = createGenericWindow(session, config.url.mail, "MAIL", visible, state);
    return window;
};
export const createCalendarWindow = (session: Session, visible = true) => {
    log.info("createCalendarWindow", visible);
    const state = getWindowState("CALENDAR");
    const window = createGenericWindow(session, config.url.calendar, "CALENDAR", visible, state);
    return window;
};

export const initialWindowCreation = ({ session, mailVisible, calendarVisible }: WindowCreationProps) => {
    log.info("initialWindowCreation", mailVisible, calendarVisible);
    const mailWindow = createMailWindow(session, mailVisible);
    mailWindow.webContents.on("did-finish-load", () => {
        log.info("initialWindowCreation, did-finish-load");
        if (windowMap.get("CALENDAR")) return;

        log.info("initialWindowCreation, create calendar windows after mail load");
        createCalendarWindow(session, calendarVisible);
    });
};

const handleWindowVisibility = (contents: WebContents, mapKey: APP, creationMethod: (session: Session) => void) => {
    log.info("handleWindowVisibility", mapKey);
    const window = windowMap.get(mapKey);

    if (window.isDestroyed()) {
        log.info("handleWindowVisibility, window.isDestroyed, create window");
        windowMap.delete(mapKey);
        creationMethod(contents.session);
    } else {
        log.info("handleWindowVisibility, window.isDestroyed, show window");
        if (window.isVisible()) {
            log.info("handleWindowVisibility, focus on visible windows");
            window.focus();
        } else {
            log.info("handleWindowVisibility, show hidden windows");
            window.show();
            window.setOpacity(1);
        }
    }
};

export const handleMailWindow = (contents: WebContents) => {
    handleWindowVisibility(contents, "MAIL", createMailWindow);
};

export const handleCalendarWindow = (contents: WebContents) => {
    handleWindowVisibility(contents, "CALENDAR", createCalendarWindow);
};

export const refreshCalendarPage = (sessionID: number) => {
    log.info("refreshCalendarPage", sessionID);
    const calendarWindow = windowMap.get("CALENDAR");
    const mailWindow = windowMap.get("MAIL");

    if (calendarWindow.isDestroyed()) {
        log.info("refreshCalendarPage, calendarWindow.isDestroyed, create calendar window");

        windowMap.delete("CALENDAR");
        const visible = areAllWindowsClosedOrHidden();
        createCalendarWindow(mailWindow.webContents.session, visible);
    } else {
        log.info("refreshCalendarPage, calendarWindow.isDestroyed, refresh calendar window");

        const calendarURL = calendarWindow.webContents.getURL();
        const calendarHasSessionID = getSessionID(calendarURL);
        if (calendarHasSessionID) {
            logURL("refreshCalendarPage, calendarHasSessionID", calendarURL);
            return;
        }

        const newCalendarUrl = `${config.url.calendar}/${sessionID}/`;
        logURL("refreshCalendarPage, newCalendarUrl", newCalendarUrl);
        calendarWindow.loadURL(newCalendarUrl);
    }
};

export const getMailWindow = () => {
    log.info("getMailWindow", windowMap.has("MAIL"));
    return windowMap.get("MAIL");
};

export const getCalendarWindow = () => {
    log.info("getCalendarWindow", windowMap.has("CALENDAR"));
    return windowMap.get("CALENDAR");
};
