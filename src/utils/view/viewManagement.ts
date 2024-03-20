import { BrowserView, BrowserWindow, Input, Rectangle, Session, app } from "electron";
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

type ViewID = "mail" | "calendar" | "account";

let currentViewID: ViewID = "mail";

const views: Record<ViewID, BrowserView | undefined> = {
    mail: undefined,
    calendar: undefined,
    account: undefined,
};

let mainWindow: undefined | BrowserWindow = undefined;

export const viewCreationAppStartup = (session: Session) => {
    mainWindow = createBrowserWindow(session);
    createViews(session);
    configureViews();

    // We add the delay to avoid blank windows on startup, only mac supports openAtLogin for now
    const delay = isMac && app.getLoginItemSettings().openAtLogin ? 100 : 0;
    setTimeout(() => {
        loadMailView(mainWindow!);
    }, delay);

    mainWindow.on("close", (ev) => {
        macOSExitEvent(mainWindow!, ev);
        windowsExitEvent(mainWindow!, ev);
    });

    return mainWindow;
};

const createViews = (session: Session) => {
    const config = getWindowConfig(session);
    views.mail = new BrowserView({ ...config });
    views.calendar = new BrowserView({ ...config });

    handleBeforeHandle(views.mail);
    handleBeforeHandle(views.calendar);

    views.mail.webContents.on("context-menu", (_e, props) => {
        createContextMenu(props, views.mail!)?.popup();
    });

    views.calendar.webContents.on("context-menu", (_e, props) => {
        createContextMenu(props, views.calendar!)?.popup();
    });

    views.mail.webContents.session.setCertificateVerifyProc((request, callback) => {
        const callbackValue = checkKeys(request);
        callback(callbackValue);
    });

    views.calendar.webContents.session.setCertificateVerifyProc((request, callback) => {
        const callbackValue = checkKeys(request);
        callback(callbackValue);
    });

    if (isWindows) {
        mainWindow!.setMenuBarVisibility(false);

        const keyPressHandling = (input: Input) => {
            if (input.key === "Alt" && input.type === "keyDown") {
                mainWindow!.setMenuBarVisibility(!mainWindow!.isMenuBarVisible());
            }
        };

        views.mail.webContents.on("before-input-event", (_e, input) => {
            keyPressHandling(input);
        });

        views.calendar.webContents.on("before-input-event", (_e, input) => {
            keyPressHandling(input);
        });
    }
};

const createBrowserWindow = (session: Session) => {
    mainWindow = new BrowserWindow({ ...getWindowConfig(session) });

    setApplicationMenu();

    mainWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
        const callbackValue = checkKeys(request);
        callback(callbackValue);
    });

    return mainWindow;
};

const configureViews = () => {
    views.mail!.setAutoResize({ width: true, height: true });
    views.mail!.webContents.loadURL(config.url.mail);

    views.calendar!.setAutoResize({ width: true, height: true });
    views.calendar!.webContents.loadURL(config.url.calendar);
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
    if (!views.mail) {
        Logger.info("mailView not created");
        return;
    }

    const bounds = adjustBoundsForWindows(window.getBounds());
    views.mail.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    window.setBrowserView(views.mail);
};

const loadCalendarView = (window: BrowserWindow) => {
    Logger.info("Loading calendar view");
    if (!views.calendar) {
        Logger.info("calendarView not created");
        return;
    }

    const bounds = adjustBoundsForWindows(window.getBounds());
    views.calendar.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    window.setBrowserView(views.calendar);
};

export const loadAccountView = (window: BrowserWindow) => {
    Logger.info("Loading account view");
    if (!views.account) {
        Logger.info("accountView not created");
        const config = getWindowConfig(window.webContents.session);
        views.account = new BrowserView({ ...config });
    }

    const bounds = adjustBoundsForWindows(window.getBounds());
    views.account.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    window.setBrowserView(views.account);
};

export const updateView = (target: VIEW_TARGET) => {
    if (!mainWindow) {
        throw new Error("mainWindow is undefined");
    }

    if (target === "mail" && currentViewID !== "mail") {
        loadMailView(mainWindow);
        mainWindow.title = "Proton Mail";
        currentViewID = "mail";
        return views.mail;
    } else if (target === "calendar" && currentViewID !== "calendar") {
        loadCalendarView(mainWindow);
        currentViewID = "calendar";
        mainWindow.title = "Proton Calendar";
        return views.calendar;
    } else if (target === "account" && currentViewID !== "account") {
        loadAccountView(mainWindow);
        currentViewID = "account";
        mainWindow.title = "Proton";
        return;
    }

    Logger.info("unsupported view", target);
};

export const reloadCalendarWithSession = (session: string) => {
    Logger.info("Reloading calendar with session", session);
    if (!views.calendar) {
        Logger.error("calendarView not created");
        const config = getWindowConfig(mainWindow!.webContents.session);
        views.calendar = new BrowserView({ ...config });
    }

    views.calendar.webContents.loadURL(`${config.url.calendar}/u/${session}`);
};

export const setTrialEnded = () => {
    const url = getTrialEndURL();
    clearStorage(true);
    resetBadge();

    views.mail?.webContents?.loadURL(url);
    views.calendar?.webContents?.loadURL(url);
};

export const getSpellCheckStatus = () => {
    return mainWindow?.webContents?.session?.spellCheckerEnabled ?? settings.spellChecker;
};

export const toggleSpellCheck = (enabled: boolean) => {
    saveSettings({ ...settings, spellChecker: enabled });
    mainWindow?.webContents?.session?.setSpellCheckerEnabled(enabled);
};

export const getMailView = () => views.mail!;
export const getCalendarView = () => views.calendar!;
export const getMainWindow = () => mainWindow!;

export const getCurrentView = () => {
    return views[currentViewID];
};
