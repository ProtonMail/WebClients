import { APPS, APPS_CONFIGURATION } from "@proton/shared/lib/constants";
import { isElectronOnMac } from "@proton/shared/lib/helpers/desktop";
import { ThemeTypes } from "@proton/shared/lib/themes/constants";
import { PROTON_THEMES_MAP } from "@proton/shared/lib/themes/themes";
import { app, BrowserWindow, Event, nativeTheme, Rectangle, WebContentsView } from "electron";
import { debounce } from "lodash";
import { join } from "node:path";
import { c } from "ttag";
import { DEFAULT_ZOOM_FACTOR } from "../../constants/zoom";
import { getAppURL } from "../../store/urlStore";
import { isLinux, isMac, isWindows } from "../helpers";
import { checkKeys } from "../keyPinning";
import { mainLogger, sanitizeUrlForLogging, viewLogger } from "../log";
import { IGNORED_NET_ERROR_CODES } from "../netErrors";
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
import { MenuBarMonitor } from "./MenuBarMonitor";
import {
    getCurrentViewID,
    getMainWindow,
    getMainWindowOrUndefined,
    getViewURL,
    setCurrentViewID,
    setMainWindow,
    ViewID,
    viewMap,
    viewURLMap,
} from "./viewState";
import { handleBeforeInput } from "./windowShortcuts";

const loadingViewMap: Record<ViewID, Promise<void> | undefined> = {
    meet: undefined,
    account: undefined,
};

const viewTitleMap: Record<ViewID, string> = {
    meet: "Proton Meet",
    account: APPS_CONFIGURATION[APPS.PROTONACCOUNT].name,
};

const PRELOADED_VIEWS: ViewID[] = ["meet"];
let loadingView: undefined | WebContentsView = undefined;

export const createMainWindow = () => {
    const mainWindow = new BrowserWindow(getWindowConfig());
    setMainWindow(mainWindow);
    return mainWindow;
};

/**
 * Call after the application menu is set: MenuBarMonitor reads and createViews hides the menu bar.
 */
export const setUpMainWindow = (mainWindow: BrowserWindow) => {
    const menuBarMonitor = new MenuBarMonitor(mainWindow);
    menuBarMonitor.onVisibilityChange(debouncedUpdateViewsBounds);

    mainWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
        const callbackValue = checkKeys(request);
        callback(callbackValue);
    });

    createViews();

    mainWindow.on("maximize", debouncedUpdateViewsBounds);
    mainWindow.on("unmaximize", debouncedUpdateViewsBounds);
    mainWindow.on("enter-full-screen", debouncedUpdateViewsBounds);
    mainWindow.on("leave-full-screen", debouncedUpdateViewsBounds);
};

export const openFirstView = async (viewID: ViewID, url: string) => {
    await loadURL(viewID, url);
    showView(viewID);
    getMainWindow().show();
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
        getMainWindow().setMenuBarVisibility(false);
    }

    viewMap.meet.webContents.on("before-input-event", handleBeforeInput);
    viewMap.account.webContents.on("before-input-event", handleBeforeInput);

    getMainWindow().on("resize", () => {
        const mainWindow = getMainWindowOrUndefined();
        if (!mainWindow || mainWindow.isDestroyed()) {
            return;
        }

        const bounds = mainWindow.getBounds();
        viewMap.meet?.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
        viewMap.account?.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
        loadingView?.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    });
};

function updateViewBounds(view: WebContentsView | undefined, viewID: ViewID | null = null) {
    const mainWindow = getMainWindowOrUndefined();
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

    const currentURLString = getViewURL(getCurrentViewID());
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
    const mainWindow = getMainWindowOrUndefined();
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    const view = viewMap[viewID]!;
    updateViewBounds(view, viewID);
    view.webContents.setZoomFactor(DEFAULT_ZOOM_FACTOR);

    if (viewID === getCurrentViewID()) {
        if (!url) {
            return;
        }

        await loadURL(viewID, url);
        return;
    }

    setCurrentViewID(viewID);
    mainWindow.title = viewTitleMap[viewID];

    if (url && !isSameURL(url, getViewURL(viewID))) {
        await showLoadingPage(viewTitleMap[viewID]);
        await loadURL(viewID, url);
        getMainWindow().setContentView(view);
    } else {
        mainWindow.setContentView(view);
    }
}

async function loadURL(viewID: ViewID, url: string, { force } = { force: false }) {
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
    const mainWindow = getMainWindowOrUndefined();
    if (!mainWindow) {
        mainLogger.error("Cannot show loading page, mainWindow is null");
        return;
    }

    loadingView = new WebContentsView(getWindowConfig());
    await renderLoadingPage(loadingView, title);

    getMainWindow().setContentView(loadingView);
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

export async function resetHiddenViews({ toHomepage } = { toHomepage: false }) {
    const appURL = getAppURL();
    const loadPromises = [];
    for (const [viewID, view] of Object.entries(viewMap)) {
        if (viewID !== getCurrentViewID() && view) {
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

export const bringWindowToFront = () => {
    const mainWindow = getMainWindowOrUndefined();
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
