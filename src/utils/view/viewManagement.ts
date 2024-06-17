import { BrowserView, BrowserWindow, Input, Rectangle, Session, WebContents, app } from "electron";
import Logger from "electron-log";
import { VIEW_TARGET } from "../../ipc/ipcConstants";
import { getSettings, saveSettings } from "../../store/settingsStore";
import { getConfig } from "../config";
import { isLinux, isMac, isWindows } from "../helpers";
import { checkKeys } from "../keyPinning";
import { setApplicationMenu } from "../menus/menuApplication";
import { createContextMenu } from "../menus/menuContext";
import { getWindowConfig } from "../view/windowHelpers";
import { handleBeforeHandle } from "./dialogs";
import { macOSExitEvent, windowsExitEvent } from "./windowClose";
import { getLocalID, isAccountSwitch, isHostAllowed, isSameURL } from "../urls/urlTests";

const config = getConfig();
const settings = getSettings();

type ViewID = keyof (typeof config)["url"];

let currentViewID: ViewID;

const browserViewMap: Record<ViewID, BrowserView | undefined> = {
    mail: undefined,
    calendar: undefined,
    account: undefined,
};

const loadingViewMap: Record<ViewID, Promise<void> | undefined> = {
    mail: undefined,
    calendar: undefined,
    account: undefined,
};

let mainWindow: undefined | BrowserWindow = undefined;

export const viewCreationAppStartup = (session: Session) => {
    mainWindow = createBrowserWindow(session);
    createViews(session);

    // We add the delay to avoid blank windows on startup, only mac supports openAtLogin for now
    const delay = isMac && app.getLoginItemSettings().openAtLogin ? 100 : 0;
    setTimeout(() => showView("mail"), delay);

    mainWindow.on("close", (ev) => {
        macOSExitEvent(mainWindow!, ev);
        windowsExitEvent(mainWindow!, ev);
    });

    return mainWindow;
};

const createView = (session: Session) => {
    const view = new BrowserView(getWindowConfig(session));

    handleBeforeHandle(view);

    view.webContents.on("context-menu", (_e, props) => {
        createContextMenu(props, view)?.popup();
    });

    view.webContents.session.setCertificateVerifyProc((request, callback) => {
        const callbackValue = checkKeys(request);
        callback(callbackValue);
    });

    return view;
};

const createViews = (session: Session) => {
    Logger.info("Creating views");
    browserViewMap.mail = createView(session);
    browserViewMap.calendar = createView(session);
    browserViewMap.account = createView(session);

    if (isWindows) {
        mainWindow!.setMenuBarVisibility(false);

        const handleBeforeInput = (_event: unknown, input: Input) => {
            if (input.key === "Alt" && input.type === "keyDown") {
                mainWindow!.setMenuBarVisibility(!mainWindow!.isMenuBarVisible());
            }
        };

        browserViewMap.mail.webContents.on("before-input-event", handleBeforeInput);
        browserViewMap.calendar.webContents.on("before-input-event", handleBeforeInput);
        browserViewMap.account.webContents.on("before-input-event", handleBeforeInput);
    }

    browserViewMap.mail.setAutoResize({ width: true, height: true });
    browserViewMap.calendar.setAutoResize({ width: true, height: true });
    browserViewMap.account.setAutoResize({ width: true, height: true });

    loadURL("mail", config.url.mail);
    loadURL("calendar", config.url.calendar);
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

async function updateLocalID(urlString: string) {
    if (!isHostAllowed(urlString) || isAccountSwitch(urlString)) {
        return urlString;
    }

    const currentURLString = await getViewURL(currentViewID);
    const currentLocalID = getLocalID(currentURLString);

    if (currentLocalID === null) {
        return urlString;
    }

    if (currentLocalID === getLocalID(urlString)) {
        return urlString;
    }

    const url = new URL(urlString);
    url.pathname = `/u/${currentLocalID}`;

    Logger.warn("Rewriting URL to include local id", app.isPackaged ? "" : url.toString());
    return url.toString();
}

export async function showView(viewID: VIEW_TARGET, targetURL: string = "") {
    const logPrefix = `${viewID}(showView)`;
    const url = targetURL ? await updateLocalID(targetURL) : targetURL;
    const loggedURL = app.isPackaged ? "" : url;

    if (!mainWindow) {
        throw new Error("mainWindow is undefined");
    }

    const internalShowView = async (windowTitle: string) => {
        const view = browserViewMap[viewID]!;
        const bounds = adjustBoundsForWindows(mainWindow!.getBounds());
        view.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });

        if (viewID === currentViewID) {
            Logger.info(logPrefix, "loading in current view", loggedURL);
            await loadURL(viewID, url);
            return;
        }

        currentViewID = viewID;
        mainWindow!.title = windowTitle;

        if (url && !isSameURL(url, await getViewURL(viewID))) {
            Logger.info(logPrefix, "loading", loggedURL);
            await loadURL(viewID, "about:blank");
            const loadPromise = loadURL(viewID, url);
            mainWindow!.setBrowserView(view);
            await loadPromise;
        } else {
            Logger.info(logPrefix, "showing view");
            mainWindow!.setBrowserView(view);
        }
    };

    switch (viewID) {
        case "mail":
            await internalShowView("Proton Mail");
            break;
        case "calendar":
            await internalShowView("Proton Calendar");
            break;
        case "account":
            await internalShowView("Proton");
            break;
        default:
            Logger.error(logPrefix, "unsupported view");
            break;
    }
}

export async function loadURL(viewID: ViewID, url: string) {
    const view = browserViewMap[viewID]!;
    const loggedURL = app.isPackaged ? "" : url;
    const logPrefix = `${viewID}(loadURL)`;

    if (isSameURL(await getViewURL(viewID), url)) {
        Logger.info(logPrefix, "already in given url", loggedURL);
        return;
    }

    Logger.info(logPrefix, "loading", loggedURL);

    if (view.webContents.isLoadingMainFrame()) {
        view.webContents.stop();
    }

    loadingViewMap[viewID] = new Promise<void>((resolve, reject) => {
        let loadingTimeoutID: NodeJS.Timeout | undefined = undefined;

        const handleLoadingTimeout = () => {
            Logger.error(logPrefix, "timeout", loggedURL);
            clearTimeout(loadingTimeoutID);
            reject();
        };

        const handleStopLoading = () => {
            Logger.info(logPrefix, "loaded", loggedURL);
            clearTimeout(loadingTimeoutID);
            view.webContents.off("did-stop-loading", handleStopLoading);
            resolve();
        };

        view.webContents.on("did-stop-loading", handleStopLoading);
        loadingTimeoutID = setTimeout(handleLoadingTimeout, 30000);
        view.webContents.loadURL(url);
    });

    await loadingViewMap[viewID];
    return;
}

async function getViewURL(viewID: ViewID): Promise<string> {
    await loadingViewMap[viewID];
    return browserViewMap[viewID]!.webContents.getURL();
}

export async function reloadHiddenViews() {
    const loadPromises = [];
    for (const [viewID, view] of Object.entries(browserViewMap)) {
        if (viewID !== currentViewID && view) {
            Logger.info("Reloading hidden view", viewID);
            loadPromises.push(loadURL(viewID as ViewID, await getViewURL(viewID as ViewID)));
        }
    }
    await Promise.all(loadPromises);
}

export async function resetHiddenViews() {
    const loadPromises = [];
    for (const [viewID, view] of Object.entries(browserViewMap)) {
        if (viewID !== currentViewID && view) {
            Logger.info(`${viewID}(reset)`);
            loadPromises.push(loadURL(viewID as ViewID, "about:blank"));
        }
    }
    await Promise.all(loadPromises);
}

export async function showEndOfTrial() {
    const trialEndURL = `${config.url.account}/trial-ended`;
    await loadURL("account", trialEndURL);
    showView("account");
    resetHiddenViews();
}

export function getSpellCheckStatus() {
    return mainWindow?.webContents?.session?.spellCheckerEnabled ?? settings.spellChecker;
}

export function toggleSpellCheck(enabled: boolean) {
    saveSettings({ ...settings, spellChecker: enabled });
    mainWindow?.webContents?.session?.setSpellCheckerEnabled(enabled);
}

export function getMailView() {
    return browserViewMap.mail!;
}

export function getCalendarView() {
    return browserViewMap.calendar!;
}

export function getAccountView() {
    return browserViewMap.account;
}

export function getMainWindow() {
    return mainWindow!;
}

export function getCurrentView() {
    return browserViewMap[currentViewID];
}

export function getWebContentsViewName(webContents: WebContents) {
    for (const [viewID, view] of Object.entries(browserViewMap)) {
        if (view?.webContents === webContents) {
            return viewID;
        }
    }

    return "unknown";
}
