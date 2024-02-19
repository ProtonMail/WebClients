import { BrowserView, BrowserWindow, Session, app } from "electron";
import log from "electron-log";
import { VIEW_TARGET } from "../../ipc/ipcConstants";
import { getConfig } from "../config";
import { checkKeys } from "../keyPinning";
import { setApplicationMenu } from "../menus/menuApplication";
import { createContextMenu } from "../menus/menuContext";
import { getWindowConfig } from "../view/windowHelpers";
import { handleBeforeHandle } from "./beforeUnload";
import { macOSExitEvent, windowsExitEvent } from "./windowClose";

const config = getConfig();

let mailView: undefined | BrowserView = undefined;
let calendarView: undefined | BrowserView = undefined;
let accountView: undefined | BrowserView = undefined;

export const viewCreationAppStartup = (session: Session) => {
    const window = createBrowserWindow(session);
    createViews(session);
    configureViews();
    loadMailView(window);

    window.on("close", (ev) => {
        macOSExitEvent(window, ev);
        windowsExitEvent(window, ev);
    });

    return window;
};

const createViews = (session: Session) => {
    const config = getWindowConfig(session);
    mailView = new BrowserView({ ...config });
    calendarView = new BrowserView({ ...config });
};

const createBrowserWindow = (session: Session) => {
    const window = new BrowserWindow({ ...getWindowConfig(session) });

    setApplicationMenu(app.isPackaged);
    handleBeforeHandle(window);

    window.webContents.on("context-menu", (_e, props) => {
        createContextMenu(props, window).popup();
    });

    window.webContents.session.setCertificateVerifyProc((request, callback) => {
        const callbackValue = checkKeys(request);
        callback(callbackValue);
    });

    return window;
};

const configureViews = () => {
    mailView.setAutoResize({ width: true, height: true });
    mailView.webContents.loadURL(config.url.mail);

    calendarView.setAutoResize({ width: true, height: true });
    calendarView.webContents.loadURL(config.url.calendar);
};

const loadMailView = (window: BrowserWindow) => {
    log.info("Loading mail view");
    if (!mailView) {
        log.info("mailView not created");
        return;
    }

    mailView.setBounds({ x: 0, y: 0, width: window.getBounds().width, height: window.getBounds().height });
    window.setBrowserView(mailView);
};

const loadCalendarView = (window: BrowserWindow) => {
    log.info("Loading calendar view");
    if (!calendarView) {
        log.info("calendarView not created");
        return;
    }

    calendarView.setBounds({ x: 0, y: 0, width: window.getBounds().width, height: window.getBounds().height });
    window.setBrowserView(calendarView);
};

export const loadAccountView = (window: BrowserWindow) => {
    log.info("Loading account view");
    if (!accountView) {
        log.info("accountView not created");
        const congif = getWindowConfig(window.webContents.session);
        accountView = new BrowserView({ ...congif });
    }

    accountView.setBounds({ x: 0, y: 0, width: window.getBounds().width, height: window.getBounds().height });
    window.setBrowserView(accountView);
};

export const updateView = (target: VIEW_TARGET) => {
    const window = BrowserWindow.getFocusedWindow();
    if (target === "mail") {
        loadMailView(window);
        return;
    } else if (target === "calendar") {
        loadCalendarView(window);
        return;
    } else if (target === "account") {
        loadAccountView(window);
        return;
    }

    log.info("unsupported view", target);
};

export const reloadCalendarWithSession = (session: string) => {
    log.info("Reloading calendar with session", session);
    if (!calendarView) {
        log.error("calendarView not created");
        const config = getWindowConfig(BrowserWindow.getFocusedWindow().webContents.session);
        calendarView = new BrowserView({ ...config });
    }

    calendarView.webContents.loadURL(`${config.url.calendar}/u/${session}`);
};

export const getMailView = () => mailView;
export const getCalendarView = () => calendarView;
