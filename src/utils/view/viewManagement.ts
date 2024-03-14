import { BrowserView, BrowserWindow, Rectangle, Session, app } from "electron";
import Logger from "electron-log";
import { VIEW_TARGET } from "../../ipc/ipcConstants";
import { resetBadge } from "../../ipc/notification";
import { getSettings, saveSettings } from "../../store/settingsStore";
import { getConfig } from "../config";
import { clearStorage, isLinux, isMac, isWindows } from "../helpers";
import { checkKeys } from "../keyPinning";
import { setApplicationMenu } from "../menus/menuApplication";
import { createContextMenu } from "../menus/menuContext";
import { getTrialEndURL } from "../urls/trial";
import { getWindowConfig } from "../view/windowHelpers";
import { handleBeforeHandle } from "./dialogs";
import { macOSExitEvent, windowsExitEvent } from "./windowClose";

const config = getConfig();
const settings = getSettings();

let mailView: undefined | BrowserView = undefined;
let calendarView: undefined | BrowserView = undefined;
let accountView: undefined | BrowserView = undefined;

let currentView: "mail" | "calendar" | "account" = "mail";

let mainWindow: undefined | BrowserWindow = undefined;

export const viewCreationAppStartup = (session: Session) => {
    const window = createBrowserWindow(session);
    createViews(session);
    configureViews();

    // We add the delay to avoid blank windows on startup, only mac supports openAtLogin for now
    const delay = isMac && app.getLoginItemSettings().openAtLogin ? 100 : 0;
    setTimeout(() => {
        loadMailView(mainWindow);
    }, delay);

    mainWindow.on("close", (ev) => {
        macOSExitEvent(mainWindow, ev);
        windowsExitEvent(mainWindow, ev);
    });

    return window;
};

const createViews = (session: Session) => {
    const config = getWindowConfig(session);
    mailView = new BrowserView({ ...config });
    calendarView = new BrowserView({ ...config });

    handleBeforeHandle(mailView);
    handleBeforeHandle(calendarView);

    mailView.webContents.on("context-menu", (_e, props) => {
        createContextMenu(props, mailView)?.popup();
    });

    calendarView.webContents.on("context-menu", (_e, props) => {
        createContextMenu(props, calendarView)?.popup();
    });

    mailView.webContents.session.setCertificateVerifyProc((request, callback) => {
        const callbackValue = checkKeys(request);
        callback(callbackValue);
    });

    calendarView.webContents.session.setCertificateVerifyProc((request, callback) => {
        const callbackValue = checkKeys(request);
        callback(callbackValue);
    });
};

const createBrowserWindow = (session: Session) => {
    mainWindow = new BrowserWindow({ ...getWindowConfig(session) });

    setApplicationMenu(app.isPackaged);

    mainWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
        const callbackValue = checkKeys(request);
        callback(callbackValue);
    });
};

const configureViews = () => {
    mailView.setAutoResize({ width: true, height: true });
    mailView.webContents.loadURL(config.url.mail);

    calendarView.setAutoResize({ width: true, height: true });
    calendarView.webContents.loadURL(config.url.calendar);
};

const adjustBoundsForWindows = (bounds: Rectangle) => {
    if (isWindows || isLinux) {
        const windowWidth = isWindows ? 16 : 0;
        const windowHeight = isWindows ? 32 : 24;

        return {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width - windowWidth,
            height: bounds.height - windowHeight,
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

    const bounds = adjustBoundsForWindows(window.getBounds());
    mailView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    window.setBrowserView(mailView);
};

const loadCalendarView = (window: BrowserWindow) => {
    Logger.info("Loading calendar view");
    if (!calendarView) {
        Logger.info("calendarView not created");
        return;
    }

    const bounds = adjustBoundsForWindows(window.getBounds());
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

    const bounds = adjustBoundsForWindows(window.getBounds());
    accountView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    window.setBrowserView(accountView);
};

export const updateView = (target: VIEW_TARGET) => {
    const window = mainWindow;
    if (target === "mail" && currentView !== "mail") {
        loadMailView(window);
        mainWindow.title = "Proton Mail";
        currentView = "mail";
        return mailView;
    } else if (target === "calendar" && currentView !== "calendar") {
        loadCalendarView(window);
        currentView = "calendar";
        mainWindow.title = "Proton Calendar";
        return calendarView;
    } else if (target === "account" && currentView !== "account") {
        loadAccountView(window);
        currentView = "account";
        mainWindow.title = "Proton";
        return;
    }

    Logger.info("unsupported view", target);
};

export const reloadCalendarWithSession = (session: string) => {
    Logger.info("Reloading calendar with session", session);
    if (!calendarView) {
        Logger.error("calendarView not created");
        const window = mainWindow;
        const config = getWindowConfig(window.webContents.session);
        calendarView = new BrowserView({ ...config });
    }

    calendarView.webContents.loadURL(`${config.url.calendar}/u/${session}`);
};

export const setTrialEnded = () => {
    const url = getTrialEndURL();
    clearStorage(true);
    resetBadge();

    mailView?.webContents?.loadURL(url);
    calendarView?.webContents?.loadURL(url);
};

export const getSpellCheckStatus = () => {
    return mainWindow?.webContents?.session?.spellCheckerEnabled ?? settings.spellChecker;
};

export const toggleSpellCheck = (enabled: boolean) => {
    saveSettings({ ...settings, spellChecker: enabled });
    mainWindow?.webContents?.session?.setSpellCheckerEnabled(enabled);
};

export const getMailView = () => mailView;
export const getCalendarView = () => calendarView;
export const getMainWindow = () => mainWindow;

export const getCurrentView = () => {
    if (currentView === "mail") {
        return mailView;
    } else if (currentView === "calendar") {
        return calendarView;
    }
    return accountView;
};
