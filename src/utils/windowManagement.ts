import { BrowserWindow, BrowserWindowConstructorOptions, Rectangle, Session, WebContents, app } from "electron";
import contextMenu from "electron-context-menu";
import log from "electron-log/main";
import { getConfig } from "./config";
import { APP, WINDOW_SIZES } from "./constants";
import { areAllWindowsClosedOrHidden, isMac, isWindows } from "./helpers";
import { setApplicationMenu } from "./menu";
import { getSessionID } from "./urlHelpers";
import { getWindowState, setWindowState } from "./windowsStore";

interface WindowCreationProps {
    session: Session;
    mailVisible?: boolean;
    calendarVisible?: boolean;
}

const config = getConfig(app.isPackaged);
export const windowMap = new Map<APP, BrowserWindow>();

contextMenu({
    showInspectElement: config.devTools,
    showSaveImage: true,
});

const windowOSConfig: BrowserWindowConstructorOptions = {};

const macOSConfig: BrowserWindowConstructorOptions = {
    frame: false,
    titleBarStyle: "hidden",
    vibrancy: "sidebar",
    trafficLightPosition: { x: 12, y: 18 },
};

const getOSSpecificConfig = () => {
    if (isMac) {
        log.info("getOSSpecificConfig, macOSConfig");
        return macOSConfig;
    } else if (isWindows) {
        log.info("getOSSpecificConfig, windowOSConfig");
        return windowOSConfig;
    }
    log.info("getOSSpecificConfig, empty object");
    return {};
};

const createWindow = (session: Session, url: string, visible: boolean, windowConfig: Rectangle): BrowserWindow => {
    log.info("createWindow", url, visible, windowConfig);
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
            devTools: true,
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
    window.loadURL(url);

    if (visible) {
        log.info("createWindow, visible", url);
        window.showInactive();
        window.setOpacity(1);
        window.focus();
    } else {
        log.info("createWindow, hidden", url);
        window.hide();
        window.setOpacity(0);
    }

    return window;
};

const createGenericWindow = (session: Session, url: string, mapKey: APP, visible: boolean, windowConfig: Rectangle) => {
    log.info("createGenericWindow", url, mapKey, visible, windowConfig);
    const window = createWindow(session, url, visible, windowConfig);

    window.on("close", (ev) => {
        log.info("close", mapKey);
        setWindowState(window.getBounds(), mapKey);
        if (isWindows) {
            ev.preventDefault();
            window.hide();
            window.setOpacity(0);

            // Close the application if all windows are closed
            if (areAllWindowsClosedOrHidden()) {
                log.info("close, areAllWindowsClosedOrHidden on Windows");
                BrowserWindow.getAllWindows().forEach((window) => window.destroy());
                app.quit();
            }
        } else if (isMac) {
            ev.preventDefault();
            window.hide();
            window.setOpacity(0);
        }
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
            log.error("refreshCalendarPage, no session ID", calendarURL);
            return;
        }

        const newCalendarUrl = `${config.url.calendar}/${sessionID}/`;
        log.info("refreshCalendarPage, newCalendarUrl", newCalendarUrl);
        calendarWindow.loadURL(newCalendarUrl);
    }
};
