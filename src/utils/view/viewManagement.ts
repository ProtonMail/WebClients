import { BrowserView, BrowserWindow, Rectangle, Session, app } from "electron";
import Logger from "electron-log";
import { VIEW_TARGET } from "../../ipc/ipcConstants";
import { getConfig } from "../config";
import { checkKeys } from "../keyPinning";
import { setApplicationMenu } from "../menus/menuApplication";
import { createContextMenu } from "../menus/menuContext";
import { getWindowConfig } from "../view/windowHelpers";
import { handleBeforeHandle } from "./beforeUnload";
import { macOSExitEvent, windowsExitEvent } from "./windowClose";
import { isWindows } from "../helpers";

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

const adjustBoundsForWindows = (bounds: Rectangle) => {
    const padding = { top: 16, right: 8, bottom: 16, left: 8 };
    if (isWindows) {
      return {
        x: bounds.x + padding.left,
        y: bounds.y + padding.top,
        width: bounds.width - padding.left - padding.right,
        height: bounds.height - padding.top - padding.bottom,
      };
    }
    return bounds;
  };

const loadMailView = (window: BrowserWindow) => {
    Logger.info("Loading mail view");
    if (!mailView) {
        Logger.info("mailView not created");
        return;
    }

    const bounds = adjustBoundsForWindows(window.getBounds())
    mailView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    window.setBrowserView(mailView);
    mailView.webContents.toggleDevTools()
};

const loadCalendarView = (window: BrowserWindow) => {
    Logger.info("Loading calendar view");
    if (!calendarView) {
        Logger.info("calendarView not created");
        return;
    }

    const bounds = adjustBoundsForWindows(window.getBounds())
    calendarView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    window.setBrowserView(calendarView);
};

export const loadAccountView = (window: BrowserWindow) => {
    Logger.info("Loading account view");
    if (!accountView) {
        Logger.info("accountView not created");
        const congif = getWindowConfig(window.webContents.session);
        accountView = new BrowserView({ ...congif });
    }

    const bounds = adjustBoundsForWindows(window.getBounds())
    accountView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
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

    Logger.info("unsupported view", target);
};

export const reloadCalendarWithSession = (session: string) => {
    Logger.info("Reloading calendar with session", session);
    if (!calendarView) {
        Logger.error("calendarView not created");
        const config = getWindowConfig(BrowserWindow.getFocusedWindow().webContents.session);
        calendarView = new BrowserView({ ...config });
    }

    calendarView.webContents.loadURL(`${config.url.calendar}/u/${session}`);
};

export const getMailView = () => mailView;
export const getCalendarView = () => calendarView;
