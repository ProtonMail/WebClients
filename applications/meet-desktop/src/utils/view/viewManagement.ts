import { BrowserWindow, Event, Rectangle, WebContents, WebContentsView, app, nativeTheme } from "electron";
import { debounce } from "lodash";
import { updateDownloaded } from "../../update";
import { isLinux, isMac, isWindows } from "../helpers";
import { checkKeys } from "../keyPinning";
import { mainLogger, sanitizeUrlForLogging, viewLogger } from "../log";
import { setApplicationMenu } from "../menus/menuApplication";
import {
    getLocalID,
    isAccountLogin,
    isAccountSwitch,
    isHomePage,
    isHostAllowed,
    isSameURL,
    trimLocalID,
} from "../urls/urlTests";
import { getWindowConfig } from "../view/windowHelpers";
import { handleBeforeHandle } from "./dialogs";
import { macOSExitEvent, windowsAndLinuxExitEvent } from "./windowClose";
import { handleBeforeInput } from "./windowShortcuts";
import { getAppURL, URLConfig } from "../../store/urlStore";
import { join } from "node:path";
import { c } from "ttag";
import { isElectronOnMac } from "@proton/shared/lib/helpers/desktop";
import { APPS, APPS_CONFIGURATION } from "@proton/shared/lib/constants";
import { MenuBarMonitor } from "./MenuBarMonitor";
import { PROTON_THEMES_MAP } from "@proton/shared/lib/themes/themes";
import { ThemeTypes } from "@proton/shared/lib/themes/constants";
import { DEFAULT_ZOOM_FACTOR, ZOOM_FACTOR_LIST, ZoomFactor } from "../../constants/zoom";

type ViewID = keyof URLConfig;

let currentViewID: ViewID;

const viewMap: Record<ViewID, WebContentsView | undefined> = {
    meet: undefined,
    account: undefined,
};

const loadingViewMap: Record<ViewID, Promise<void> | undefined> = {
    meet: undefined,
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
    meet: undefined,
    account: undefined,
};

const viewTitleMap: Record<ViewID, string> = {
    meet: "Proton Meet",
    account: APPS_CONFIGURATION[APPS.PROTONACCOUNT].name,
};

const PRELOADED_VIEWS: ViewID[] = ["meet"];
let mainWindow: undefined | BrowserWindow = undefined;
let loadingView: undefined | WebContentsView = undefined;

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

    // We add the delay to avoid blank windows on startup, only mac supports openAtLogin for now
    const delay = isMac && app.getLoginItemSettings().openAtLogin ? 100 : 0;
    await new Promise((resolve) => setTimeout(resolve, delay));

    loadURL("meet", getAppURL().meet).then(() => {
        showView("meet");
        mainWindow!.show();
    });
};

const createView = (viewID: ViewID) => {
    const view = new WebContentsView(getWindowConfig());

    if (viewID) {
        handleBeforeHandle(viewID, view);
    }

    view.webContents.session.setCertificateVerifyProc((request, callback) => {
        const callbackValue = checkKeys(request);
        callback(callbackValue);
    });

    return view;
};

const createViews = () => {
    viewMap.meet = createView("meet");
    viewMap.account = createView("account");

    if (isWindows) {
        mainWindow!.setMenuBarVisibility(false);
    }

    viewMap.meet.webContents.on("before-input-event", handleBeforeInput);
    viewMap.account.webContents.on("before-input-event", handleBeforeInput);

    mainWindow!.on("resize", () => {
        if (!mainWindow || mainWindow.isDestroyed()) {
            return;
        }

        const bounds = mainWindow.getBounds();
        viewMap.meet?.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
        viewMap.account?.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
        loadingView?.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    });
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

function updateViewBounds(view: WebContentsView | undefined, viewID: ViewID | null = null) {
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

    mainLogger.info("Rewriting URL to include local id", sanitizeUrlForLogging(url.toString()));
    return url.toString();
}

export async function showView(viewID: ViewID, url: string = "") {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    const view = viewMap[viewID]!;
    updateViewBounds(view, viewID);
    view.webContents.setZoomFactor(DEFAULT_ZOOM_FACTOR);

    if (viewID === currentViewID) {
        if (!url) {
            return;
        }

        await loadURL(viewID, url);
        return;
    }

    currentViewID = viewID;
    mainWindow!.title = viewTitleMap[viewID];

    if (url && !isSameURL(url, getViewURL(viewID))) {
        await showLoadingPage(viewTitleMap[viewID]);
        await loadURL(viewID, url);
        mainWindow!.setContentView(view);
    } else {
        mainWindow!.setContentView(view);
    }
}

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

    if (!isAccountSwitching && isSameURL(viewURL, url) && !force) {
        return;
    }

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
            viewLogger(viewID).error("loadURL timeout", sanitizeUrlForLogging(url));
            showNetworkErrorPage(viewID);
            cleanup();
        };

        const handleLoadFinish = () => {
            cleanup();
        };

        const handleLoadError = (_event: Event, errorCode: number, errorDescription: string) => {
            if (!IGNORED_NET_ERROR_CODES.includes(errorCode)) {
                viewLogger(viewID).error("did-fail-load", sanitizeUrlForLogging(url), errorCode, errorDescription);
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

export async function resetHiddenViews({ toHomepage } = { toHomepage: false }) {
    const appURL = getAppURL();
    const loadPromises = [];
    for (const [viewID, view] of Object.entries(viewMap)) {
        if (viewID !== currentViewID && view) {
            if (PRELOADED_VIEWS.includes(viewID as ViewID) && toHomepage) {
                const homepageURL = await updateLocalID(appURL[viewID as ViewID]);
                loadPromises.push(loadURL(viewID as ViewID, homepageURL));
            } else {
                loadPromises.push(renderLoadingPage(view, viewTitleMap[viewID as ViewID]));
            }
        }
    }
    await Promise.all(loadPromises);
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
    return DEFAULT_ZOOM_FACTOR;
}

export function setZoom(zoomFactor: ZoomFactor) {
    for (const view of Object.values(viewMap)) {
        view?.webContents.setZoomFactor(zoomFactor);
    }
}

export function resetZoom() {
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
    if (!mainWindow) {
        return;
    }

    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }

    if (isWindows) {
        mainWindow.setAlwaysOnTop(true);
    }

    mainWindow.show();

    if (isWindows) {
        mainWindow.setAlwaysOnTop(false);
    }

    mainWindow.focus();
};
