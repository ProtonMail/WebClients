import { BrowserWindow, Rectangle, Session, WebContents, app } from "electron";
import contextMenu from "electron-context-menu";
import { getConfig } from "./config";
import { APP, WINDOW_SIZES } from "./constants";
import { isMac } from "./helpers";
import { setApplicationMenu } from "./menu";
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
        // We only hide the frame and the title bar on macOS
        titleBarStyle: isMac ? "hidden" : "default",
        trafficLightPosition: { x: 12, y: 8 },
        vibrancy: "under-window",
        transparent: isMac,
        frame: !isMac,
        webPreferences: {
            devTools: config.devTools,
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

    visible ? window.show() : window.hide();
    return window;
};

const createGenericWindow = (session: Session, url: string, mapKey: APP, visible: boolean, windowConfig: Rectangle) => {
    const window = createWindow(session, url, visible, windowConfig);
    window.on("close", (ev) => {
        ev.preventDefault();
        window.hide();
    });

    windowMap.set(mapKey, window);
    return window;
};

export const createMailWindow = (session: Session, visible = true) => {
    const state = getWindowState("MAIL");
    const window = createGenericWindow(session, config.url.mail, "MAIL", visible, state);
    window.on("close", () => {
        setWindowState(window.getBounds(), "MAIL");
    });

    return window;
};
export const createCalendarWindow = (session: Session, visible = true) => {
    const state = getWindowState("CALENDAR");
    const window = createGenericWindow(session, config.url.calendar, "CALENDAR", visible, state);
    window.on("close", () => {
        setWindowState(window.getBounds(), "CALENDAR");
    });
    return window;
};

export const initialWindowCreation = ({ session, mailVisible, calendarVisible }: WindowCreationProps) => {
    const mailWindow = createMailWindow(session, mailVisible);
    mailWindow.webContents.on("did-finish-load", () => {
        const calendarWindow = createCalendarWindow(session, calendarVisible);
        calendarWindow.hide();
    });
};

const handleWindowVisibility = (contents: WebContents, mapKey: APP, creationMethod: (session: Session) => void) => {
    const window = windowMap.get(mapKey);
    if (window) {
        window.isVisible() ? window.focus() : window.show();
    } else {
        creationMethod(contents.session);
    }
};

export const handleMailWindow = (contents: WebContents) => {
    handleWindowVisibility(contents, "MAIL", createMailWindow);
};

export const handleCalendarWindow = (contents: WebContents) => {
    handleWindowVisibility(contents, "CALENDAR", createCalendarWindow);
};
