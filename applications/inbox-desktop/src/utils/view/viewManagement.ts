import { BrowserView, BrowserWindow, Event, Rectangle, WebContents, app, nativeTheme } from "electron";
import { debounce } from "lodash";
import { getWindowBounds, saveWindowBounds } from "../../store/boundsStore";
import { getSettings, updateSettings } from "../../store/settingsStore";
import { updateDownloaded } from "../../update";
import { CHANGE_VIEW_TARGET } from "@proton/shared/lib/desktop/desktopTypes";
import { isLinux, isMac, isWindows } from "../helpers";
import { urlHasMailto, readAndClearMailtoArgs } from "../protocol/mailto";
import { checkKeys } from "../keyPinning";
import { mainLogger, viewLogger } from "../log";
import { setApplicationMenu } from "../menus/menuApplication";
import { createContextMenu } from "../menus/menuContext";
import { getLocalID, isAccountSwitch, isHostAllowed, isSameURL, trimLocalID } from "../urls/urlTests";
import { getWindowConfig } from "../view/windowHelpers";
import { handleBeforeHandle } from "./dialogs";
import { macOSExitEvent, windowsAndLinuxExitEvent } from "./windowClose";
import { handleBeforeInput } from "./windowShortcuts";
import { getAppURL, URLConfig } from "../../store/urlStore";
import metrics from "../metrics";
import { join } from "node:path";
import { c } from "ttag";
import { isElectronOnMac } from "@proton/shared/lib/helpers/desktop";
import { APPS, APPS_CONFIGURATION, CALENDAR_APP_NAME, MAIL_APP_NAME } from "@proton/shared/lib/constants";
import { MenuBarMonitor } from "./MenuBarMonitor";
import telemetry from "./../telemetry";
import { PROTON_THEMES_MAP, ThemeTypes } from "@proton/shared/lib/themes/themes";

type ViewID = keyof URLConfig;

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

const viewTitleMap: Record<ViewID, string> = {
    mail: MAIL_APP_NAME,
    calendar: CALENDAR_APP_NAME,
    account: APPS_CONFIGURATION[APPS.PROTONACCOUNT].name,
};

const PRELOADED_VIEWS: ViewID[] = ["mail", "calendar"];
let mainWindow: undefined | BrowserWindow = undefined;

/**
 * @see https://www.electronjs.org/docs/latest/api/web-contents#event-did-fail-load
 * @see https://source.chromium.org/chromium/chromium/src/+/main:net/base/net_error_list.h
 */
const NET_ERROR_CODE = {
    ABORTED: -3,
    CONNECTION_REFUSED: -102,
    ERR_NAME_NOT_RESOLVED: -105,
    INVALID_URL: -300,
};

export const IGNORED_NET_ERROR_CODES = [NET_ERROR_CODE.ABORTED];

export const viewCreationAppStartup = async () => {
    mainWindow = createBrowserWindow();
    createViews();

    const debouncedSaveWindowBounds = debounce(() => saveWindowBounds(mainWindow!), 1000);
    mainWindow.on("move", debouncedSaveWindowBounds);
    mainWindow.on("resize", debouncedSaveWindowBounds);
    mainWindow.on("maximize", debouncedSaveWindowBounds);
    mainWindow.on("unmaximize", debouncedSaveWindowBounds);

    mainWindow.on("maximize", debouncedUpdateViewsBounds);
    mainWindow.on("unmaximize", debouncedUpdateViewsBounds);
    mainWindow.on("enter-full-screen", debouncedUpdateViewsBounds);
    mainWindow.on("leave-full-screen", debouncedUpdateViewsBounds);

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
        mainWindow!.maximize();
    }

    // We add the delay to avoid blank windows on startup, only mac supports openAtLogin for now
    const delay = isMac && app.getLoginItemSettings().openAtLogin ? 100 : 0;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const mailto = readAndClearMailtoArgs();

    loadURL("mail", getAppURL().mail + (mailto ? `/inbox#mailto=${mailto}` : "")).then(() => {
        showView("mail");
        mainWindow!.show();
    });
};

const createView = (viewID: ViewID) => {
    const view = new BrowserView(getWindowConfig());

    if (viewID) {
        handleBeforeHandle(viewID, view);
    }

    view.webContents.on("context-menu", (_e, props) => {
        const contextMenu = createContextMenu(props, view);

        if (contextMenu) {
            mainLogger.info("Opening context menu");
            contextMenu.popup();
        } else {
            mainLogger.info("Cannot create context menu");
        }
    });

    view.webContents.session.setCertificateVerifyProc((request, callback) => {
        const callbackValue = checkKeys(request);
        callback(callbackValue);
    });

    return view;
};

const createViews = () => {
    mainLogger.info("Creating views");
    browserViewMap.mail = createView("mail");
    browserViewMap.calendar = createView("calendar");
    browserViewMap.account = createView("account");

    if (isWindows) {
        mainWindow!.setMenuBarVisibility(false);
    }

    browserViewMap.mail.webContents.on("before-input-event", handleBeforeInput);
    browserViewMap.calendar.webContents.on("before-input-event", handleBeforeInput);
    browserViewMap.account.webContents.on("before-input-event", handleBeforeInput);

    browserViewMap.mail.setAutoResize({ width: true, height: true });
    browserViewMap.calendar.setAutoResize({ width: true, height: true });
    browserViewMap.account.setAutoResize({ width: true, height: true });
};

const createBrowserWindow = () => {
    mainWindow = new BrowserWindow(getWindowConfig());

    setApplicationMenu();

    const menuBarMonitor = new MenuBarMonitor(mainWindow);
    menuBarMonitor.onVisibilityChange(debouncedUpdateViewsBounds);

    mainWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
        const callbackValue = checkKeys(request);
        callback(callbackValue);
    });

    return mainWindow;
};

function updateViewBounds(view: BrowserView | undefined, viewID: ViewID | null = null) {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    const { height: windowHeight, width: windowWidth } = mainWindow.getBounds();
    let horizontalMargin = 0;
    let verticalMargin = 0;

    if (isWindows) {
        const menuBarHeight = mainWindow.isMenuBarVisible() ? 20 : 0;

        if (mainWindow.isFullScreen()) {
            horizontalMargin = 0;
            verticalMargin = menuBarHeight;
        } else {
            horizontalMargin = 16;
            verticalMargin = 39 + menuBarHeight;
        }
    } else if (isLinux) {
        const menuBarHeight = mainWindow.isMenuBarVisible() ? 25 : 0;
        verticalMargin = menuBarHeight;
    }

    const updatedBounds: Rectangle = {
        x: 0,
        y: 0,
        width: windowWidth - horizontalMargin,
        height: windowHeight - verticalMargin,
    };

    if (!view) {
        viewLogger(viewID).warn("cannot adjust view bounds, view is null");
        return;
    }

    viewLogger(viewID).verbose("updating view bounds", JSON.stringify(updatedBounds));
    view.setBounds(updatedBounds);
}

/**
 * We need to delay the update until the next tick, otherwise
 * some window props will not be updated.
 */
const debouncedUpdateViewsBounds = debounce(() => {
    for (const [viewID, view] of Object.entries(browserViewMap)) {
        if (view && viewID) {
            updateViewBounds(view, viewID as ViewID);
        }
    }
}, 0);

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
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    const url = targetURL ? await updateLocalID(targetURL) : targetURL;

    const view = browserViewMap[viewID]!;
    updateViewBounds(view, viewID);
    view.webContents.setZoomFactor(getWindowBounds().zoom);

    if (viewID === currentViewID) {
        if (!url) {
            viewLogger(viewID).silly("already in current view");
            return;
        }

        viewLogger(viewID).info("showView loading in current view", url);
        await loadURL(viewID, url);
        return;
    }

    currentViewID = viewID;
    mainWindow!.title = viewTitleMap[viewID];

    telemetry.showView(viewID);

    if (url && urlHasMailto(url)) {
        viewLogger(viewID).debug(`showView loading mailto ${url} from`, await getViewURL(viewID));
        await showLoadingPage(viewTitleMap[viewID]);
        await loadURL(viewID, url);
        mainWindow!.setBrowserView(view);
    } else if (url && !isSameURL(url, await getViewURL(viewID))) {
        viewLogger(viewID).debug("showView current url is different", await getViewURL(viewID));
        viewLogger(viewID).info("showView loading", url);
        await showLoadingPage(viewTitleMap[viewID]);
        await loadURL(viewID, url);
        mainWindow!.setBrowserView(view);
    } else {
        viewLogger(viewID).info("showView showing view for ", url);
        mainWindow!.setBrowserView(view);
    }
}

export async function loadURL(viewID: ViewID, url: string, { force } = { force: false }) {
    if (!url) {
        viewLogger(viewID).warn("trying to load empty URL, skipping");
        return;
    }

    const view = browserViewMap[viewID]!;
    const viewURL = await getViewURL(viewID);

    // NOTE isSameURL will ignore `#mailto` arguments, but we want to load even if it's
    // same. In some cases this might cause a view reload.
    if (urlHasMailto(url)) {
        if (viewURL == url) {
            const defURL = url.replace(/#mailto=.*$/, "#mailto=default");
            viewLogger(viewID).info(
                `loadURL asked to navigate to the same mailto ${url}, first navigating to ${defURL}`,
            );
            await view.webContents.loadURL(defURL);
        }
    } else if (isSameURL(viewURL, url) && !force) {
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
            view.webContents.off("did-finish-load", handleLoadFinish);
            view.webContents.off("did-navigate-in-page", handleLoadFinish);
            view.webContents.off("did-fail-load", handleLoadError);
            resolve();
        };

        const handleLoadTimeout = () => {
            viewLogger(viewID).error("loadURL timeout", url);
            showNetworkErrorPage(viewID);
            cleanup();
        };

        const handleLoadFinish = () => {
            viewLogger(viewID).debug("did-finish-load", url);
            cleanup();
        };

        const handleLoadError = (_event: Event, errorCode: number, errorDescription: string) => {
            if (!IGNORED_NET_ERROR_CODES.includes(errorCode)) {
                viewLogger(viewID).error("did-fail-load", url, errorCode, errorDescription);
                metrics.recordFailToLoadView();
                showNetworkErrorPage(viewID);
            }
            cleanup();
        };

        view.webContents.on("did-finish-load", handleLoadFinish);
        view.webContents.on("did-navigate-in-page", handleLoadFinish);
        view.webContents.on("did-fail-load", handleLoadError);

        loadingTimeoutID = setTimeout(handleLoadTimeout, 30000);
        view.webContents.loadURL(url);
    });

    await loadingViewMap[viewID];
    return;
}

export async function showNetworkErrorPage(viewID: ViewID): Promise<void> {
    const view = browserViewMap[viewID];

    if (!view) {
        viewLogger(viewID).warn("cannot show error page, view is null");
        return;
    }

    const filePath = app.isPackaged
        ? join(process.resourcesPath, "error-network.html")
        : join(app.getAppPath(), "assets/error-network.html");

    const themeColors = nativeTheme.shouldUseDarkColors
        ? PROTON_THEMES_MAP[ThemeTypes.Carbon]
        : PROTON_THEMES_MAP[ThemeTypes.Snow];

    const query: Record<string, string> = {
        color: themeColors.thumbColors.weak,
        backgroundColor: isMac ? "transparent" : themeColors.themeColorMeta,
        title: c("error screen").t`Cannot establish connection`,
        description: c("error screen")
            .t`Check your internet connection or network settings. If the issue persists, please contact customer support.`,
        button: c("error screen").t`Try again`,
        buttonTarget: getAppURL()[viewID],
    };

    if (isElectronOnMac) {
        query.draggable = "";
    }

    await view.webContents.loadFile(filePath, { query });
}

async function showLoadingPage(title: string): Promise<void> {
    if (!mainWindow) {
        mainLogger.error("Cannot show loading page, mainWindow is null");
        return;
    }

    mainLogger.info("Show loading view");
    const loadingView = new BrowserView(getWindowConfig());
    await renderLoadingPage(loadingView, title);

    mainWindow.setBrowserView(loadingView);
}

async function renderLoadingPage(view: BrowserView, title: string): Promise<void> {
    const filePath = app.isPackaged
        ? join(process.resourcesPath, "loading.html")
        : join(app.getAppPath(), "assets/loading.html");

    const themeColors = nativeTheme.shouldUseDarkColors
        ? PROTON_THEMES_MAP[ThemeTypes.Carbon]
        : PROTON_THEMES_MAP[ThemeTypes.Snow];

    const query: Record<string, string> = {
        message: c("loading screen").t`Loading ${title}…`,
        color: themeColors.thumbColors.weak,
        backgroundColor: isMac ? "transparent" : themeColors.themeColorMeta,
    };

    if (isElectronOnMac) {
        query.draggable = "";
    }

    await view.webContents.loadFile(filePath, { query });
    updateViewBounds(view);
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
            loadPromises.push(loadURL(viewID as ViewID, await getViewURL(viewID as ViewID), { force: true }));
        }
    }
    await Promise.all(loadPromises);
}

export async function resetHiddenViews({ toHomepage } = { toHomepage: false }) {
    const appURL = getAppURL();
    const loadPromises = [];
    for (const [viewID, view] of Object.entries(browserViewMap)) {
        if (viewID !== currentViewID && view) {
            if (PRELOADED_VIEWS.includes(viewID as ViewID) && toHomepage) {
                const homepageURL = await updateLocalID(appURL[viewID as ViewID]);
                viewLogger(viewID as ViewID).info("reset to home page", homepageURL);
                loadPromises.push(loadURL(viewID as ViewID, homepageURL));
            } else {
                viewLogger(viewID as ViewID).info("reset to blank");
                loadPromises.push(renderLoadingPage(view, viewTitleMap[viewID as ViewID]));
            }
        }
    }
    await Promise.all(loadPromises);
}

export async function showEndOfTrial() {
    const trialEndURL = `${getAppURL().account}/trial-ended`;
    await loadURL("account", trialEndURL);
    showView("account");
    resetHiddenViews();
}

export function getSpellCheckStatus() {
    return mainWindow?.webContents?.session?.spellCheckerEnabled ?? getSettings().spellChecker;
}

export function toggleSpellCheck(enabled: boolean) {
    updateSettings({ spellChecker: enabled });
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

export function getCurrentViewID() {
    return currentViewID;
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
