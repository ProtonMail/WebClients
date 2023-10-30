import { BrowserWindow, Session, WebContents, app } from "electron";
import { getConfig } from "./config";
import { getWindowSize } from "./helpers";
import { setApplicationMenu } from "./menu";

interface WindowCreationProps {
    session: Session;
    mailVisible?: boolean;
    calendarVisible?: boolean;
}

const config = getConfig(app.isPackaged);
export const windowMap = new Map<string, BrowserWindow>();

const createWindow = (session: Session, url: string, visible: boolean): BrowserWindow => {
    const { width, height } = getWindowSize();

    const window = new BrowserWindow({
        title: config.appTitle,
        icon: "../../assets/icons/icon.png",
        height,
        width,
        webPreferences: {
            devTools: config.devTools,
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

const createGenericWindow = (session: Session, url: string, mapKey: string, visible: boolean) => {
    const window = createWindow(session, url, visible);
    window.on("close", (ev) => {
        ev.preventDefault();
        window.hide();
    });

    windowMap.set(mapKey, window);
    return window;
};

export const createMailWindow = (session: Session, visible = true) => {
    return createGenericWindow(session, config.url.mail, "mail", visible);
};
export const createCalendarWindow = (session: Session, visible = true) => {
    return createGenericWindow(session, config.url.calendar, "calendar", visible);
};

export const initialWindowCreation = ({ session, mailVisible, calendarVisible }: WindowCreationProps) => {
    const mailWindow = createMailWindow(session, mailVisible);
    mailWindow.webContents.on("did-finish-load", () => {
        const calendarWindow = createCalendarWindow(session, calendarVisible);
        calendarWindow.hide();
    });
};

const handleWindowVisibility = (contents: WebContents, mapKey: string, creationMethod: (session: Session) => void) => {
    const window = windowMap.get(mapKey);
    if (window) {
        window.isVisible() ? window.focus() : window.show();
    } else {
        creationMethod(contents.session);
    }
};

export const handleMailWindow = (contents: WebContents) => {
    handleWindowVisibility(contents, "mail", createMailWindow);
};

export const handleCalendarWindow = (contents: WebContents) => {
    handleWindowVisibility(contents, "calendar", createCalendarWindow);
};
