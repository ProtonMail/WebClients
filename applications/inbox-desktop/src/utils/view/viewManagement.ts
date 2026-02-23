import { BrowserWindow, Event, Rectangle, WebContents, WebContentsView, app, nativeTheme } from "electron";
import { debounce } from "lodash";
import { getWindowBounds, saveWindowBounds } from "../../store/boundsStore";
import { getSettings, updateSettings } from "../../store/settingsStore";
import { updateDownloaded } from "../../update/update";
import { CHANGE_VIEW_TARGET } from "@proton/shared/lib/desktop/desktopTypes";
import { isLinux, isMac, isWindows } from "../helpers";
import { urlHasMailto, readAndClearMailtoArgs } from "../protocol/mailto";
import { urlHasOpenMailParams, readAndClearOpenMailArgs, readAndClearOpenCalendarArgs } from "../protocol/deep_links";
import { checkKeys } from "../keyPinning";
import { mainLogger, viewLogger } from "../log";
import { setApplicationMenu } from "../menus/menuApplication";
import { createContextMenu } from "../menus/menuContext";
import {
    getLocalID,
    isAccountLogin,
    isAccountSwitch,
    isHomePage,
    isHostAllowed,
    isSameURL,
    trimLocalID,
} from "../urls/urlTests";
import { getWindowConfig, getWindowPlaywrightConfig } from "../view/windowHelpers";
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
import { PROTON_THEMES_MAP } from "@proton/shared/lib/themes/themes";
import { ThemeTypes } from "@proton/shared/lib/themes/constants";
import { DEFAULT_ZOOM_FACTOR, ZOOM_FACTOR_LIST, ZoomFactor } from "../../constants/zoom";
import { addHashToCurrentURL } from "../urls/urlHelpers";
import { isWindowValid } from "./windowUtils";

type ViewID = keyof URLConfig;

let currentViewID: ViewID;

const viewMap: Record<ViewID, WebContentsView | undefined> = {
    mail: undefined,
    calendar: undefined,
    account: undefined,
};

const loadingViewMap: Record<ViewID, Promise<void> | undefined> = {
    mail: undefined,
    calendar: undefined,
    account: undefined,
};

// If some view is showing url X, and we call loadURL with url Y, webContents.getURL()
// will return X until Y has fully loaded (all network requests have finished, including resource loading).
// This has historically introduced lots of race condition issues, because we have to either assume
// that we are still on X url or wait until the load process of Y has fully finished. This information
// is something we need during view changes, like the login process or navigating to settings view.
//
// Although viewURLMap can introduce inconsistencies, the only possible side effect might be some duplicated
// loading, but at least we have a synchronous source of truth to check which URL is being shown in a view.
// It is important to keep this updated in all loadURL and loadFile calls, and also monitor the did-navigate
// and did-navigate-in-page events.
const viewURLMap: Record<ViewID, string | undefined> = {
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
let mainWindow: BrowserWindow | null = null;
let loadingView: WebContentsView | null = null;

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

    // We need this for E2E tests because Playwright waits for something
    // to be loaded before connecting to the browser view.
    // We need to check if removing this after the Electron version update
    // will work
    const isPlaywrightTest = process.env.PLAYWRIGHT_TEST === "true";
    if (isPlaywrightTest) {
        await mainWindow.loadURL("about:blank");
        mainWindow.show();
    }

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

    // Clean up main window reference when it's destroyed.
    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    // For e2e playwright tests load mail immediately.
    if (isPlaywrightTest) {
        await loadURL("mail", getAppURL().mail);
        showView("mail");
        mainWindow!.show();
        return;
    }

    // We add the delay to avoid blank windows on startup, only mac supports openAtLogin for now
    const delay = isMac && app.getLoginItemSettings().openAtLogin ? 100 : 0;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const mailto = readAndClearMailtoArgs();
    if (mailto) {
        loadURL("mail", getAppURL().mail + `/inbox#mailto=${mailto}`).then(() => {
            showView("mail");
            mainWindow!.show();
        });
        return;
    }

    const openMail = readAndClearOpenMailArgs();
    if (openMail) {
        loadURL("mail", getAppURL().mail + `/inbox#${openMail}`).then(() => {
            showView("mail");
            mainWindow!.show();
        });
        return;
    }

    const openCalendar = readAndClearOpenCalendarArgs();
    if (openCalendar) {
        loadURL("calendar", getAppURL().calendar).then(() => {
            showView("calendar");
            mainWindow!.show();
        });
        return;
    }

    loadURL("mail", getAppURL().mail).then(() => {
        showView("mail");
        mainWindow!.show();
    });
};

const createView = (viewID: ViewID) => {
    const view = new WebContentsView(getWindowConfig());

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
    viewMap.mail = createView("mail");
    viewMap.calendar = createView("calendar");
    viewMap.account = createView("account");

    if (isWindows) {
        mainWindow!.setMenuBarVisibility(false);
    }

    viewMap.mail.webContents.on("before-input-event", handleBeforeInput);
    viewMap.calendar.webContents.on("before-input-event", handleBeforeInput);
    viewMap.account.webContents.on("before-input-event", handleBeforeInput);

    mainWindow!.on("resize", () => {
        if (!isWindowValid(mainWindow)) {
            return;
        }

        const bounds = mainWindow.getBounds();
        viewMap.mail?.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
        viewMap.calendar?.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
        viewMap.account?.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
        loadingView?.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    });
};

const createBrowserWindow = () => {
    const isPlaywrightTest = process.env.PLAYWRIGHT_TEST === "true";
    mainWindow = new BrowserWindow(isPlaywrightTest ? getWindowPlaywrightConfig() : getWindowConfig());

    setApplicationMenu();

    const menuBarMonitor = new MenuBarMonitor(mainWindow);
    menuBarMonitor.onVisibilityChange(debouncedUpdateViewsBounds);

    mainWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
        const callbackValue = checkKeys(request);
        callback(callbackValue);
    });

    return mainWindow;
};

function updateViewBounds(view: WebContentsView | undefined, viewID: ViewID | null = null) {
    if (!isWindowValid(mainWindow)) {
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
    for (const [viewID, view] of Object.entries(viewMap)) {
        if (view && viewID) {
            updateViewBounds(view, viewID as ViewID);
        }
    }
}, 0);

async function updateLocalID(urlString: string) {
    if (!isHostAllowed(urlString) || isAccountSwitch(urlString) || isAccountLogin(urlString)) {
        return urlString;
    }

    const currentURLString = getViewURL(currentViewID);
    const currentLocalID = getLocalID(currentURLString);

    if (currentLocalID === null) {
        return urlString;
    }

    if (currentLocalID === getLocalID(urlString)) {
        return urlString;
    }

    const url = new URL(trimLocalID(urlString));
    url.pathname = `/u/${currentLocalID}${url.pathname}`;

    mainLogger.info("Rewriting URL to include local id", url.toString());
    return url.toString();
}

export async function showView(viewID: CHANGE_VIEW_TARGET, url: string = "") {
    if (!isWindowValid(mainWindow)) {
        return;
    }

    const view = viewMap[viewID]!;
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
        viewLogger(viewID).debug(`showView loading mailto ${url} from`, getViewURL(viewID));
        await showLoadingPage(viewTitleMap[viewID]);
        await loadURL(viewID, url);
        mainWindow!.setContentView(view);
    } else if (url && urlHasOpenMailParams(url)) {
        viewLogger(viewID).debug(`showView loading open mail ${url} from`, getViewURL(viewID));
        await showLoadingPage(viewTitleMap[viewID]);
        await loadURL(viewID, url);
        mainWindow!.setContentView(view);
    } else if (url && !isSameURL(url, getViewURL(viewID))) {
        viewLogger(viewID).debug("showView current url is different", getViewURL(viewID));
        viewLogger(viewID).info("showView loading", url);
        await showLoadingPage(viewTitleMap[viewID]);
        await loadURL(viewID, url);
        mainWindow!.setContentView(view);
    } else {
        viewLogger(viewID).info("showView showing view for ", url);
        mainWindow!.setContentView(view);
    }
}

export const openMail = (labelID?: string, elementID?: string, messageID?: string) => {
    if (!isWindowValid(mainWindow)) {
        viewLogger("mail").warn("Ignoring openMail action, mainWindow is not available");
        return;
    }

    const currentUrl = viewMap.mail!.webContents.getURL();
    const hasValidLabelAndElement = labelID && elementID;

    const localID = getCurrentLocalID();
    const url = hasValidLabelAndElement
        ? addHashToCurrentURL(
              currentUrl,
              `#${new URLSearchParams({
                  labelID,
                  elementID,
                  ...(messageID ? { messageID } : {}),
              }).toString()}`,
          )
        : // Case may occur when notifications are grouped together by the OS.
          localID != null
          ? `${getAppURL().mail}/u/${localID}/all-mail`
          : `${getAppURL().mail}/u/0/all-mail`; // localID will be fixed by showView.

    showView("mail", url);

    if (mainWindow.isMinimized()) {
        viewLogger("mail").info("Restoring main window");
        mainWindow.restore();
    }

    mainWindow.focus();
};

export const openCalendar = () => {
    if (!isWindowValid(mainWindow)) {
        viewLogger("calendar").warn("Ignoring openCalendar action, mainWindow is not available");
        return;
    }

    showView("calendar");

    if (mainWindow.isMinimized()) {
        viewLogger("calendar").info("Restoring main window");
        mainWindow.restore();
    }

    mainWindow.focus();
};

export async function loadURL(viewID: ViewID, url: string, { force } = { force: false }) {
    if (!url) {
        viewLogger(viewID).warn("trying to load empty URL, skipping");
        return;
    }

    const view = viewMap[viewID]!;
    const viewURL = getViewURL(viewID);

    const currentLocalID = getLocalID(viewURL);
    const targetLocalID = getLocalID(url);

    const isAccountSwitching = isHomePage(url) && currentLocalID !== targetLocalID;

    // NOTE isSameURL will ignore `#mailto` arguments.
    // In some cases we want to force react-router to re-evaluate what needs to be displayed.
    // E.g. a mailto address might already be specified in the URL, and the composer was closed. The mailto in the URL is still kept.
    // We would like to open it again if we're clicking on the same mailto URL, thus we force a router hash refresh.
    if (urlHasMailto(url) || urlHasOpenMailParams(url)) {
        if (viewURL == url) {
            const bounceHash = "_refresh_" + Date.now();
            viewLogger(viewID).info(`Same anchor navigation detected for ${url}; forcing router hash refresh`);
            await view.webContents.executeJavaScript(`location.hash = "${bounceHash}";`);
        }
    } else if (!isAccountSwitching && isSameURL(viewURL, url) && !force) {
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
        viewURLMap[viewID] = url;
        view.webContents.loadURL(url);
    });

    await loadingViewMap[viewID];
    return;
}

export async function showNetworkErrorPage(viewID: ViewID): Promise<void> {
    const view = viewMap[viewID];

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

    viewURLMap[viewID] = filePath;
    await view.webContents.loadFile(filePath, { query });
}

async function showLoadingPage(title: string): Promise<void> {
    if (!mainWindow) {
        mainLogger.error("Cannot show loading page, mainWindow is null");
        return;
    }

    mainLogger.info("Show loading view");
    loadingView = new WebContentsView(getWindowConfig());
    await renderLoadingPage(loadingView, title);

    mainWindow.setContentView(loadingView);
}

async function renderLoadingPage(view: WebContentsView, title: string): Promise<void> {
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

    const [viewID] =
        (Object.entries(viewMap) as Array<[ViewID, WebContentsView]>).find(([, _view]) => _view === view) || [];

    if (viewID) {
        viewURLMap[viewID] = filePath;
    }

    await view.webContents.loadFile(filePath, { query });
    updateViewBounds(view);
}

export function getViewURL(viewID: ViewID) {
    return viewURLMap[viewID] || "";
}

export function updateViewURL(webContents: WebContents, url: string) {
    const [viewID] =
        (Object.entries(viewMap) as Array<[ViewID, WebContentsView]>).find(
            ([, view]) => view.webContents === webContents,
        ) || [];

    if (viewID) {
        viewURLMap[viewID] = url;
    }
}

export async function reloadHiddenViews() {
    const loadPromises = [];
    for (const [viewID, view] of Object.entries(viewMap)) {
        if (viewID !== currentViewID && view) {
            viewLogger(viewID as ViewID).info("Reloading hidden view");
            loadPromises.push(loadURL(viewID as ViewID, getViewURL(viewID as ViewID), { force: true }));
        }
    }
    await Promise.all(loadPromises);
}

export async function resetHiddenViews({ toHomepage } = { toHomepage: false }) {
    const appURL = getAppURL();
    const loadPromises = [];
    for (const [viewID, view] of Object.entries(viewMap)) {
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
    return viewMap.mail!;
}

export function getCalendarView() {
    return viewMap.calendar!;
}

export function getAccountView() {
    return viewMap.account;
}

export function getMainWindow() {
    return mainWindow!;
}

export function getCurrentViewID() {
    return currentViewID;
}

export function getCurrentView() {
    return viewMap[currentViewID];
}

export function getWebContentsViewName(webContents: WebContents): ViewID | null {
    for (const [viewID, view] of Object.entries(viewMap)) {
        if (view?.webContents === webContents) {
            return viewID as ViewID;
        }
    }

    return null;
}

export function getZoom() {
    const zoomFactor = getWindowBounds().zoom;

    if (ZOOM_FACTOR_LIST.includes(zoomFactor)) {
        return zoomFactor;
    }

    return DEFAULT_ZOOM_FACTOR;
}

export function setZoom(zoomFactor: ZoomFactor) {
    mainLogger.info("set zoom factor to", zoomFactor);

    for (const view of Object.values(viewMap)) {
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

export const bringWindowToFront = () => {
    if (!isWindowValid(mainWindow)) {
        mainLogger.info("Cannot bring window to front: window unavailable.");
        return;
    }

    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }

    if (isWindows) {
        mainLogger.debug("Main window topMost On, focus and Off");
        mainWindow.setAlwaysOnTop(true);
    }

    mainWindow.show();

    if (isWindows) {
        mainWindow.setAlwaysOnTop(false);
    }

    mainWindow.focus();
};

export const getCurrentLocalID = (): string | null => {
    return getLocalID(viewMap["mail"]!.webContents.getURL());
};
