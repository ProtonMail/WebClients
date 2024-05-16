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

type ViewID = keyof (typeof config)["url"];

let currentViewID: ViewID = "mail";

const browserViewMap: Record<ViewID, BrowserView | undefined> = {
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
    browserViewMap.mail = new BrowserView({ ...config });
    browserViewMap.calendar = new BrowserView({ ...config });

    handleBeforeHandle(browserViewMap.mail);
    handleBeforeHandle(browserViewMap.calendar);

    browserViewMap.mail.webContents.on("context-menu", (_e, props) => {
        createContextMenu(props, browserViewMap.mail!)?.popup();
    });

    browserViewMap.calendar.webContents.on("context-menu", (_e, props) => {
        createContextMenu(props, browserViewMap.calendar!)?.popup();
    });

    browserViewMap.mail.webContents.session.setCertificateVerifyProc((request, callback) => {
        const callbackValue = checkKeys(request);
        callback(callbackValue);
    });

    browserViewMap.calendar.webContents.session.setCertificateVerifyProc((request, callback) => {
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

        browserViewMap.mail.webContents.on("before-input-event", (_e, input) => {
            keyPressHandling(input);
        });

        browserViewMap.calendar.webContents.on("before-input-event", (_e, input) => {
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
    browserViewMap.mail!.setAutoResize({ width: true, height: true });
    browserViewMap.mail!.webContents.loadURL(config.url.mail);

    browserViewMap.calendar!.setAutoResize({ width: true, height: true });
    browserViewMap.calendar!.webContents.loadURL(config.url.calendar);
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
    if (!browserViewMap.mail) {
        Logger.info("mailView not created");
        return;
    }

    const bounds = adjustBoundsForWindows(window.getBounds());
    browserViewMap.mail.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    window.setBrowserView(browserViewMap.mail);
};

const loadCalendarView = (window: BrowserWindow) => {
    Logger.info("Loading calendar view");
    if (!browserViewMap.calendar) {
        Logger.info("calendarView not created");
        return;
    }

    const bounds = adjustBoundsForWindows(window.getBounds());
    browserViewMap.calendar.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    window.setBrowserView(browserViewMap.calendar);
};

export const loadAccountView = (window: BrowserWindow) => {
    Logger.info("Loading account view");
    if (!browserViewMap.account) {
        Logger.info("accountView not created");
        const config = getWindowConfig(window.webContents.session);
        browserViewMap.account = new BrowserView({ ...config });
    }

    const bounds = adjustBoundsForWindows(window.getBounds());
    browserViewMap.account.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    window.setBrowserView(browserViewMap.account);
};

export const updateView = (target: VIEW_TARGET) => {
    if (!mainWindow) {
        throw new Error("mainWindow is undefined");
    }

    if (target === currentViewID) {
        Logger.warn(target, "view is already current view");
        return;
    }

    switch (target) {
        case "mail":
            loadMailView(mainWindow);
            mainWindow.title = "Proton Mail";
            currentViewID = "mail";
            break;
        case "calendar":
            loadCalendarView(mainWindow);
            mainWindow.title = "Proton Calendar";
            currentViewID = "calendar";
            break;
        case "account":
            loadAccountView(mainWindow);
            mainWindow.title = "Proton";
            currentViewID = "account";
            break;
        default:
            Logger.error("unsupported view", target);
            break;
    }
};

export const loadURL = async (viewID: ViewID, url: string) => {
    Logger.info(`loading URL in ${viewID}`);

    if (viewID === currentViewID) {
        getCurrentView()!.webContents.loadURL(url);
        return;
    }

    const previousView = browserViewMap[viewID];

    if (previousView) {
        Logger.info(`clearing ${viewID}`);
        await previousView.webContents.loadURL("about:blank");
    }

    updateView(viewID);
    getCurrentView()!.webContents.loadURL(url);
};

export const refreshHiddenViews = () => {
    for (const [viewID, view] of Object.entries(browserViewMap)) {
        if (viewID !== currentViewID && view) {
            view.webContents.reload();
        }
    }
};

export const reloadCalendarWithSession = (session: string) => {
    Logger.info("Reloading calendar with session", session);
    if (!browserViewMap.calendar) {
        Logger.error("calendarView not created");
        const config = getWindowConfig(mainWindow!.webContents.session);
        browserViewMap.calendar = new BrowserView({ ...config });
    }

    browserViewMap.calendar.webContents.loadURL(`${config.url.calendar}/u/${session}`);
};

export const setTrialEnded = () => {
    const url = getTrialEndURL();
    clearStorage(true);
    resetBadge();

    browserViewMap.mail?.webContents?.loadURL(url);
    browserViewMap.calendar?.webContents?.loadURL(url);
};

export const getSpellCheckStatus = () => {
    return mainWindow?.webContents?.session?.spellCheckerEnabled ?? settings.spellChecker;
};

export const toggleSpellCheck = (enabled: boolean) => {
    saveSettings({ ...settings, spellChecker: enabled });
    mainWindow?.webContents?.session?.setSpellCheckerEnabled(enabled);
};

export const getMailView = () => browserViewMap.mail!;
export const getCalendarView = () => browserViewMap.calendar!;
export const getMainWindow = () => mainWindow!;

export const getCurrentView = () => {
    return browserViewMap[currentViewID];
};
