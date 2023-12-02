import { BrowserWindow, BrowserWindowConstructorOptions, Rectangle, Session, WebContents, app } from "electron";
import contextMenu from "electron-context-menu";
import { getConfig } from "./config";
import { APP, WINDOW_SIZES } from "./constants";
import { isMac, isWindows } from "./helpers";
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

const windowOSConfig: BrowserWindowConstructorOptions = {
    frame: true,
    transparent: true,
    backgroundMaterial: "mica",
};

const macOSConfig: BrowserWindowConstructorOptions = {
    frame: false,
    transparent: true,
    titleBarStyle: "hidden",
    vibrancy: "under-window",
    trafficLightPosition: { x: 12, y: 8 },
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
        ...(isMac ? macOSConfig : {}),
        ...(isWindows ? windowOSConfig : {}),
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
        ev.preventDefault();
        window.hide();
        window.setOpacity(0);
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
        if (windowMap.get("CALENDAR")) return;

        createCalendarWindow(session, calendarVisible);
    });
};

const handleWindowVisibility = (contents: WebContents, mapKey: APP, creationMethod: (session: Session) => void) => {
    const window = windowMap.get(mapKey);
    if (window) {
        if (window.isVisible()) {
            window.focus();
        } else {
            window.show();
            window.setOpacity(1);
        }
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
