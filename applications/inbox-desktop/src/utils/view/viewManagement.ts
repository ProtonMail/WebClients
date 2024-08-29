import { BrowserView, BrowserWindow, Input, Rectangle, Session, WebContents, app } from "electron";
import { getSettings, saveSettings } from "../../store/settingsStore";
import { updateDownloaded } from "../../update";
import { getConfig } from "../config";
import { CHANGE_VIEW_TARGET } from "../external/packages/shared/lib/desktop/desktopTypes";
import { isLinux, isMac, isWindows } from "../helpers";
import { checkKeys } from "../keyPinning";
import { mainLogger, viewLogger } from "../log";
import { setApplicationMenu } from "../menus/menuApplication";
import { createContextMenu } from "../menus/menuContext";
import { getLocalID, isAccountSwitch, isHostAllowed, isSameURL, trimLocalID } from "../urls/urlTests";
import { getWindowConfig } from "../view/windowHelpers";
import { handleBeforeHandle } from "./dialogs";
import { macOSExitEvent, windowsAndLinuxExitEvent } from "./windowClose";

type ViewID = keyof ReturnType<typeof getConfig>["url"];

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

const PRELOADED_VIEWS: ViewID[] = ["mail", "calendar"];
let mainWindow: undefined | BrowserWindow = undefined;

export const viewCreationAppStartup = (session: Session) => {
    mainWindow = createBrowserWindow(session);
    createViews(session);

    // We add the delay to avoid blank windows on startup, only mac supports openAtLogin for now
    const delay = isMac && app.getLoginItemSettings().openAtLogin ? 100 : 0;
    setTimeout(() => showView("mail"), delay);

    mainWindow.on("close", (event) => {
        // We don't want to prevent the close event if the update is downloaded
        if (updateDownloaded) {
            return;
        }

        event.preventDefault();

        if (isMac) {
            macOSExitEvent(mainWindow!);
        } else {
            windowsAndLinuxExitEvent(mainWindow!);
        }
    });

    return mainWindow;
};

const createView = (viewID: ViewID, session: Session) => {
    const view = new BrowserView(getWindowConfig(session));

    handleBeforeHandle(viewID, view);

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
    mainLogger.info("Creating views");
    browserViewMap.mail = createView("mail", session);
    browserViewMap.calendar = createView("calendar", session);
    browserViewMap.account = createView("account", session);

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

    const config = getConfig();
    loadURL("mail", config.url.mail);
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

    const url = new URL(trimLocalID(urlString));
    url.pathname = `/u/${currentLocalID}${url.pathname}`;

    mainLogger.warn("Rewriting URL to include local id", url.toString());
    return url.toString();
}

export async function showView(viewID: CHANGE_VIEW_TARGET, targetURL: string = "") {
    const url = targetURL ? await updateLocalID(targetURL) : targetURL;

    if (!mainWindow) {
        throw new Error("mainWindow is undefined");
    }

    const internalShowView = async (windowTitle: string) => {
        const view = browserViewMap[viewID]!;
        const bounds = adjustBoundsForWindows(mainWindow!.getBounds());
        view.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });

        if (viewID === currentViewID) {
            viewLogger(viewID).info("showView loading in current view", url);
            await loadURL(viewID, url);
            return;
        }

        currentViewID = viewID;
        mainWindow!.title = windowTitle;

        if (url && !isSameURL(url, await getViewURL(viewID))) {
            viewLogger(viewID).debug("showView current url is different", await getViewURL(viewID));
            viewLogger(viewID).info("showView loading", url);
            await loadURL(viewID, "about:blank");
            const loadPromise = loadURL(viewID, url);
            mainWindow!.setBrowserView(view);
            await loadPromise;
        } else {
            viewLogger(viewID).info("showView showing view");
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
            viewLogger(viewID).error("showView unsupported view");
            break;
    }
}

export async function loadURL(viewID: ViewID, url: string) {
    const view = browserViewMap[viewID]!;
    const viewURL = await getViewURL(viewID);

    if (isSameURL(viewURL, url)) {
        viewLogger(viewID).info("loadURL already in given url", url);
        return;
    }

    viewLogger(viewID).info("loadURL from", viewURL, "to", url);

    if (view.webContents.isLoadingMainFrame()) {
        view.webContents.stop();
    }

    loadingViewMap[viewID] = new Promise<void>((resolve, reject) => {
        let loadingTimeoutID: NodeJS.Timeout | undefined = undefined;

        const handleLoadingTimeout = () => {
            viewLogger(viewID).error("loadURL timeout", url);
            clearTimeout(loadingTimeoutID);
            reject();
        };

        const handleStopLoading = () => {
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
            viewLogger(viewID as ViewID).info("Reloading hidden view");
            loadPromises.push(loadURL(viewID as ViewID, await getViewURL(viewID as ViewID)));
        }
    }
    await Promise.all(loadPromises);
}

export async function resetHiddenViews({ toHomepage } = { toHomepage: false }) {
    const config = getConfig();
    const loadPromises = [];
    for (const [viewID, view] of Object.entries(browserViewMap)) {
        if (viewID !== currentViewID && view) {
            if (PRELOADED_VIEWS.includes(viewID as ViewID) && toHomepage) {
                const homepageURL = await updateLocalID(config.url[viewID as ViewID]);
                viewLogger(viewID as ViewID).info("reset to home page", homepageURL);
                loadPromises.push(loadURL(viewID as ViewID, homepageURL));
            } else {
                viewLogger(viewID as ViewID).info("reset to blank");
                loadPromises.push(loadURL(viewID as ViewID, "about:blank"));
            }
        }
    }
    await Promise.all(loadPromises);
}

export async function showEndOfTrial() {
    const trialEndURL = `${getConfig().url.account}/trial-ended`;
    await loadURL("account", trialEndURL);
    showView("account");
    resetHiddenViews();
}

export function getSpellCheckStatus() {
    return mainWindow?.webContents?.session?.spellCheckerEnabled ?? getSettings().spellChecker;
}

export function toggleSpellCheck(enabled: boolean) {
    saveSettings({ ...getSettings(), spellChecker: enabled });
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

export function getWebContentsViewName(webContents: WebContents): ViewID | null {
    for (const [viewID, view] of Object.entries(browserViewMap)) {
        if (view?.webContents === webContents) {
            return viewID as ViewID;
        }
    }

    return null;
}
