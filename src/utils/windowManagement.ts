import { BrowserWindow, BrowserWindowConstructorOptions, Rectangle, Session, WebContents, app } from "electron";
import contextMenu from "electron-context-menu";
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
    transparent: true,
    titleBarStyle: "hidden",
    vibrancy: "under-window",
    trafficLightPosition: { x: 12, y: 8 },
};

const getOSSpecificConfig = () => {
    if (isMac) {
        return macOSConfig;
    }
    return windowOSConfig;
};

const createWindow = (session: Session, url: string, visible: boolean, windowConfig: Rectangle): BrowserWindow => {
    const { x, y, width, height } = windowConfig;

    const window = new BrowserWindow({
        title: config.appTitle,
        icon: "../../assets/icons/icon.png",
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
        window.showInactive();
        window.setOpacity(1);
        window.focus();
    } else {
        window.hide();
        window.setOpacity(0);
    }

    return window;
};

const createGenericWindow = (session: Session, url: string, mapKey: APP, visible: boolean, windowConfig: Rectangle) => {
    const window = createWindow(session, url, visible, windowConfig);

    window.on("close", (ev) => {
        setWindowState(window.getBounds(), mapKey);
        if (isWindows) {
            ev.preventDefault();

            // window.removeAllListeners("close");
            // window.destroy();
            window.hide();
            window.setOpacity(0);

            // Close the application if all windows are closed
            if (areAllWindowsClosedOrHidden()) {
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
    const state = getWindowState("MAIL");
    const window = createGenericWindow(session, config.url.mail, "MAIL", visible, state);
    return window;
};
export const createCalendarWindow = (session: Session, visible = true) => {
    const state = getWindowState("CALENDAR");
    const window = createGenericWindow(session, config.url.calendar, "CALENDAR", visible, state);
    return window;
};

export const initialWindowCreation = ({ session, mailVisible, calendarVisible }: WindowCreationProps) => {
    const mailWindow = createMailWindow(session, mailVisible);
    mailWindow.webContents.on("did-finish-load", () => {
        if (windowMap.get("CALENDAR")) return;

        createCalendarWindow(session, calendarVisible);
    });
};

const handleWindowVisibility = (contents: WebContents, mapKey: APP, creationMethod: (session: Session) => void) => {
    const window = windowMap.get(mapKey);

    if (window.isDestroyed()) {
        windowMap.delete(mapKey);
        creationMethod(contents.session);
    } else {
        if (window.isVisible()) {
            window.focus();
        } else {
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
    const calendarWindow = windowMap.get("CALENDAR");
    const mailWindow = windowMap.get("MAIL");

    if (calendarWindow.isDestroyed()) {
        windowMap.delete("CALENDAR");
        const visible = areAllWindowsClosedOrHidden();
        createCalendarWindow(mailWindow.webContents.session, visible);
    } else {
        const calendarURL = calendarWindow.webContents.getURL();
        const calendarHasSessionID = getSessionID(calendarURL);
        if (calendarHasSessionID) {
            return;
        }
        const newCalendarUrl = `${config.url.calendar}/${sessionID}/`;
        calendarWindow.loadURL(newCalendarUrl);
    }
};
