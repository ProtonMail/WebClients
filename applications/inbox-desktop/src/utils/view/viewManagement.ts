import { BrowserView, BrowserWindow, Event, Input, Session, WebContents, app } from "electron";
import { debounce } from "lodash";
import { WindowBounds, getWindowBounds, saveWindowBounds } from "../../store/boundsStore";
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
import { handleBeforeInput } from "./windowShortcuts";

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

/**
 * @see https://www.electronjs.org/docs/latest/api/web-contents#event-did-fail-load
 * @see https://source.chromium.org/chromium/chromium/src/+/main:net/base/net_error_list.h
 */
const IGNORED_NET_ERROR_CODES = [
    -3, // ABORTED
    -300, // INVALID_URL
];

export const viewCreationAppStartup = (session: Session) => {
    mainWindow = createBrowserWindow(session);
    createViews(session);

    // We add the delay to avoid blank windows on startup, only mac supports openAtLogin for now
    const delay = isMac && app.getLoginItemSettings().openAtLogin ? 100 : 0;
    setTimeout(() => showView("mail"), delay);

    const debouncedUpdateWindowBounds = debounce(() => saveWindowBounds(mainWindow!), 1000);
    mainWindow.on("move", debouncedUpdateWindowBounds);
    mainWindow.on("resize", debouncedUpdateWindowBounds);
    mainWindow.on("maximize", debouncedUpdateWindowBounds);
    mainWindow.on("unmaximize", debouncedUpdateWindowBounds);

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

    if (getWindowBounds().maximized) {
        mainWindow.maximize();
    }

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

    browserViewMap.mail.webContents.on("before-input-event", handleBeforeInput);
    browserViewMap.calendar.webContents.on("before-input-event", handleBeforeInput);
    browserViewMap.account.webContents.on("before-input-event", handleBeforeInput);

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

const adjustBoundsForWindows = (bounds: WindowBounds) => {
    if (isWindows || isLinux) {
        const windowWidth = isWindows ? 16 : 0;
        const windowHeight = isWindows ? 32 : 24;

        return {
            ...bounds,
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
        const bounds = adjustBoundsForWindows(getWindowBounds());
        view.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
        view.webContents.setZoomFactor(bounds.zoom);

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

    loadingViewMap[viewID] = new Promise<void>((resolve) => {
        let loadingTimeoutID: NodeJS.Timeout | undefined = undefined;

        const cleanup = () => {
            clearTimeout(loadingTimeoutID);
            view.webContents.off("did-stop-loading", handleLoadFinish);
            view.webContents.on("did-fail-load", handleLoadError);
            resolve();
        };

        const handleLoadTimeout = () => {
            viewLogger(viewID).error("loadURL timeout", url);
            cleanup();
        };

        const handleLoadFinish = () => {
            viewLogger(viewID).debug("did-finish-load", url);
            cleanup();
        };

        const handleLoadError = (_event: Event, errorCode: number, errorDescription: string) => {
            if (!IGNORED_NET_ERROR_CODES.includes(errorCode)) {
                viewLogger(viewID).error("did-fail-load", url, errorCode, errorDescription);
            }
            cleanup();
        };

        view.webContents.on("did-finish-load", handleLoadFinish);
        view.webContents.on("did-fail-load", handleLoadError);
        loadingTimeoutID = setTimeout(handleLoadTimeout, 30000);
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

// Based on Firefox zoom factor list
export const ZOOM_FACTOR_LIST = [
    0.3, 0.5, 0.67, 0.8, 0.9, 1.0, 1.1, 1.2, 1.33, 1.5, 1.7, 2.0, 2.4, 3.0, 4.0, 5.0,
] as const;
export type ZoomFactor = (typeof ZOOM_FACTOR_LIST)[number];
export const DEFAULT_ZOOM_FACTOR: ZoomFactor = 1.0;

export function getZoom() {
    const zoomFactor = getWindowBounds().zoom;

    if (ZOOM_FACTOR_LIST.includes(zoomFactor)) {
        return zoomFactor;
    }

    return DEFAULT_ZOOM_FACTOR;
}

export function setZoom(zoomFactor: ZoomFactor) {
    mainLogger.info("set zoom factor to", zoomFactor);

    for (const view of Object.values(browserViewMap)) {
        view?.webContents.setZoomFactor(zoomFactor);
    }

    if (mainWindow) {
        saveWindowBounds(mainWindow, {
            zoom: zoomFactor,
        });
    }
}

export function resetZoom() {
    mainLogger.info("reset zoom");
    setZoom(DEFAULT_ZOOM_FACTOR);
}

export function updateZoom(direction: "in" | "out") {
    const zoomFactorIndex = ZOOM_FACTOR_LIST.indexOf(getZoom());

    const nextZoomFactor =
        direction === "in"
            ? ZOOM_FACTOR_LIST[Math.min(ZOOM_FACTOR_LIST.length - 1, zoomFactorIndex + 1)]
            : ZOOM_FACTOR_LIST[Math.max(0, zoomFactorIndex - 1)];

    setZoom(nextZoomFactor);
}
