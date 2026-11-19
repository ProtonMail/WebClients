import { APPS, APPS_CONFIGURATION, CALENDAR_APP_NAME, MAIL_APP_NAME } from "@proton/shared/lib/constants";
import { CHANGE_VIEW_TARGET } from "@proton/shared/lib/desktop/desktopTypes";
import { isElectronOnMac } from "@proton/shared/lib/helpers/desktop";
import { ThemeTypes } from "@proton/shared/lib/themes/constants";
import { PROTON_THEMES_MAP } from "@proton/shared/lib/themes/themes";
import { BrowserWindow, Event, nativeTheme, Rectangle, WebContentsView } from "electron";
import { debounce } from "lodash";
import { c } from "ttag";
import { getFileResourcePath } from "../../constants/resources";
import { getWindowBounds, saveWindowBounds } from "../../store/boundsStore";
import { getSettings, updateSettings } from "../../store/settingsStore";
import { getAppURL } from "../../store/urlStore";
import { authStatusPoller } from "../auth/authPoller";
import { isLinux, isMac, isWindows } from "../helpers";
import { checkKeys } from "../keyPinning";
import { mainLogger, viewLogger } from "../log";
import { createContextMenu } from "../menus/menuContext";
import metrics from "../metrics";
import { isUserNetworkErrorCode, NET_ERROR_CODE } from "../netErrors";
import { logNetworkDiagnostics } from "../networkDiagnostics";
import { profiler } from "../profiler/profiler";
import { sentryReport } from "../sentryReport";
import { addHashToCurrentURL, urlHasMailto, urlHasOpenMailParams } from "../urls/urlHelpers";
import { watchForStuckLoader } from "./utils/stuckViewTracker";
import {
    getLocalID,
    isAccountLogin,
    isAccountSwitch,
    isCalendarCreateBookingURL,
    isHomePage,
    isSameURL,
    isURLAllowed,
    trimLocalID,
} from "../urls/urlTests";
import { getWindowConfig, getWindowPlaywrightConfig } from "../view/windowHelpers";
import telemetryService from "./../telemetry";
import { handleBeforeHandle } from "./dialogs";
import { MenuBarMonitor } from "./MenuBarMonitor";
import {
    getCurrentView,
    getCurrentViewID,
    getMainWindow,
    getMainWindowOrNull,
    getViewURL,
    setCurrentViewID,
    setMainWindow,
    ViewID,
    viewMap,
    viewURLMap,
} from "./viewState";
import { handleBeforeInput } from "./windowShortcuts";
import { isWindowValid } from "./windowUtils";

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
let loadingView: WebContentsView | null = null;

export const IGNORED_NET_ERROR_CODES: number[] = [NET_ERROR_CODE.ABORTED];

// Report loadURL timeouts to Sentry once per session per view, after 10 total timeouts.
const LOAD_TIMEOUT_REPORT_THRESHOLD = 10;
const loadTimeoutCounts = new Map<string, number>();

// Report did-fail-load to Sentry once per session per view, after 5 total failures.
const LOAD_FAIL_REPORT_THRESHOLD = 5;
const loadFailCounts = new Map<string, number>();

// Report error page asset failures once per session per view.
const errorPageFailReported = new Set<string>();

export const createMainWindow = () => {
    const isPlaywrightTest = process.env.PLAYWRIGHT_TEST === "true";
    const mainWindow = new BrowserWindow(isPlaywrightTest ? getWindowPlaywrightConfig() : getWindowConfig());
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
    profiler.mark("window-created");

    // We need this for E2E tests because Playwright waits for something
    // to be loaded before connecting to the browser view.
    if (process.env.PLAYWRIGHT_TEST === "true") {
        mainWindow.show();
        mainWindow.loadURL("about:blank").catch(() => {});
    }

    createViews();
    profiler.mark("views-created");

    const debouncedSaveWindowBounds = debounce(() => saveWindowBounds(getMainWindow()), 1000);
    mainWindow.on("move", debouncedSaveWindowBounds);
    mainWindow.on("resize", debouncedSaveWindowBounds);
    mainWindow.on("maximize", debouncedSaveWindowBounds);
    mainWindow.on("unmaximize", debouncedSaveWindowBounds);

    mainWindow.on("maximize", debouncedUpdateViewsBounds);
    mainWindow.on("unmaximize", debouncedUpdateViewsBounds);
    mainWindow.on("enter-full-screen", debouncedUpdateViewsBounds);
    mainWindow.on("leave-full-screen", debouncedUpdateViewsBounds);
};

/**
 * Call after the auth poller is attached: maximize() also shows the window, and the poller starts on "show".
 */
export const restoreMainWindowState = (mainWindow: BrowserWindow) => {
    if (getWindowBounds().maximized) {
        mainWindow.maximize();
    }

    // Clean up main window reference when it's destroyed.
    mainWindow.on("closed", () => {
        setMainWindow(null);
    });
};

export const openFirstView = async (viewID: ViewID, url: string) => {
    await loadURL(viewID, url);
    showView(viewID);
    getMainWindow().show();
    profiler.markWindowShownAndWriteReport();
};

const createView = (viewID: ViewID) => {
    const isPlaywrightTest = process.env.PLAYWRIGHT_TEST === "true";
    const view = new WebContentsView(isPlaywrightTest ? getWindowPlaywrightConfig() : getWindowConfig());

    if (isPlaywrightTest) {
        view.webContents.loadURL("about:blank").catch(() => {});
    }

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
        getMainWindow().setMenuBarVisibility(false);
    }

    viewMap.mail.webContents.on("before-input-event", handleBeforeInput);
    viewMap.calendar.webContents.on("before-input-event", handleBeforeInput);
    viewMap.account.webContents.on("before-input-event", handleBeforeInput);

    getMainWindow().on("resize", () => {
        const mainWindow = getMainWindowOrNull();
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

function updateViewBounds(view: WebContentsView | undefined, viewID: ViewID | null = null) {
    const mainWindow = getMainWindowOrNull();
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
    if (!isURLAllowed(urlString) || isAccountSwitch(urlString) || isAccountLogin(urlString)) {
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

    mainLogger.info("Rewriting URL to include local id", url.toString());
    return url.toString();
}

export async function showView(viewID: CHANGE_VIEW_TARGET, url: string = "") {
    if (!isWindowValid(getMainWindowOrNull())) {
        return;
    }

    const view = viewMap[viewID]!;
    updateViewBounds(view, viewID);
    view.webContents.setZoomFactor(getWindowBounds().zoom);

    if (viewID === getCurrentViewID()) {
        authStatusPoller.performPoll();
        if (!url) {
            viewLogger(viewID).silly("already in current view");
            return;
        }

        viewLogger(viewID).info("showView loading in current view", url);
        await loadURL(viewID, url);
        return;
    }

    const previousViewID = getCurrentViewID();
    setCurrentViewID(viewID);

    getMainWindow().title = viewTitleMap[viewID];

    authStatusPoller.performPoll();

    telemetryService.showView(viewID);

    if (url && urlHasMailto(url)) {
        viewLogger(viewID).debug(`showView loading mailto ${url} from`, getViewURL(viewID));
        await showLoadingPage(viewTitleMap[viewID]);
        await loadURL(viewID, url);
        getMainWindow().setContentView(view);
    } else if (url && urlHasOpenMailParams(url)) {
        viewLogger(viewID).debug(`showView loading open mail ${url} from`, getViewURL(viewID));
        await showLoadingPage(viewTitleMap[viewID]);
        await loadURL(viewID, url);
        getMainWindow().setContentView(view);
    } else if (url && (isCalendarCreateBookingURL(url) || !isSameURL(url, getViewURL(viewID)))) {
        viewLogger(viewID).debug("showView current url is different", getViewURL(viewID));
        viewLogger(viewID).info("showView loading", url);
        await showLoadingPage(viewTitleMap[viewID]);
        await loadURL(viewID, url);
        getMainWindow().setContentView(view);
    } else {
        viewLogger(viewID).info("showView showing view for ", url);
        getMainWindow().setContentView(view);
    }

    const contents = view.webContents;
    void watchForStuckLoader(
        contents,
        () => getCurrentView()?.webContents === contents,
        openMailToDefaultAndForceReload,
    );

    if (previousViewID === "account") {
        let reportedError: Error | undefined;

        for (const refreshViewID of ["mail", "calendar"] as const) {
            try {
                viewMap[refreshViewID]?.webContents.send("hostUpdate", { type: "refreshEventLoop" });
            } catch (e) {
                viewLogger(refreshViewID).error("Refreshing event loop", e);
                reportedError ??= e instanceof Error ? e : undefined;
            }
        }

        if (reportedError) {
            sentryReport.reportMessage("Failed to refresh event loop after returning from account view", {
                level: "error",
                error: reportedError,
            });
        }
    }
}

/**
 * May or may not reload the Mail application, depends on the passed in parameters and the current state of the web app.
 */
export const openMail = (labelID?: string, elementID?: string, messageID?: string) => {
    const mainWindow = getMainWindowOrNull();
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

export const openMailToDefaultAndForceReload = async () => {
    await showView("mail");
    await loadURL("mail", getAppURL().mail, { force: true });
};

const openViewWithoutReload = (view: "mail" | "calendar") => {
    const mainWindow = getMainWindowOrNull();
    if (!isWindowValid(mainWindow)) {
        viewLogger(view).warn(`Ignoring open ${view} action, mainWindow is not available`);
        return;
    }

    showView(view);

    if (mainWindow.isMinimized()) {
        viewLogger(view).info("Restoring main window");
        mainWindow.restore();
    }

    mainWindow.focus();
};

export const openMailWithoutReload = () => {
    return openViewWithoutReload("mail");
};

export const openCalendarWithoutReload = () => {
    return openViewWithoutReload("calendar");
};

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
    } else if (!isAccountSwitching && !isCalendarCreateBookingURL(url) && isSameURL(viewURL, url) && !force) {
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

            const count = (loadTimeoutCounts.get(viewID) ?? 0) + 1;
            loadTimeoutCounts.set(viewID, count);

            if (count === LOAD_TIMEOUT_REPORT_THRESHOLD) {
                sentryReport.reportMessage("loadURL timeout repeated", {
                    level: "error",
                    tags: { viewID },
                    extras: { url, consecutiveTimeouts: count },
                });
            }

            showNetworkErrorPage(viewID);
            cleanup();
        };

        const handleLoadFinish = () => {
            profiler.mark("did-finish-load");
            viewLogger(viewID).debug("did-finish-load", url);
            cleanup();
        };

        const handleLoadError = (_event: Event, errorCode: number, errorDescription: string) => {
            if (!IGNORED_NET_ERROR_CODES.includes(errorCode)) {
                if (!isUserNetworkErrorCode(errorCode)) {
                    const failCount = (loadFailCounts.get(viewID) ?? 0) + 1;
                    loadFailCounts.set(viewID, failCount);

                    if (failCount === LOAD_FAIL_REPORT_THRESHOLD) {
                        sentryReport.reportMessage("did-fail-load repeated", {
                            level: "error",
                            tags: { viewID, errorCode: String(errorCode) },
                            extras: { url, errorDescription, totalFailures: failCount },
                        });
                    }
                }

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
        profiler.mark("load-url-called");
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

    void logNetworkDiagnostics();

    const filePath = getFileResourcePath("error-network.html");

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
    try {
        await view.webContents.loadFile(filePath, { query });
    } catch (error) {
        if (!errorPageFailReported.has(viewID)) {
            errorPageFailReported.add(viewID);
            sentryReport.reportMessage("error page asset failed to load", {
                level: "error",
                tags: { viewID },
                extras: {
                    filePath,
                    error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
                },
            });
        }
        viewLogger(viewID).error("showNetworkErrorPage failed to load error asset:", filePath, error);
    }
}

async function showLoadingPage(title: string): Promise<void> {
    if (!getMainWindowOrNull()) {
        mainLogger.error("Cannot show loading page, mainWindow is null");
        return;
    }

    mainLogger.info("Show loading view");
    const isPlaywrightTest = process.env.PLAYWRIGHT_TEST === "true";
    loadingView = new WebContentsView(isPlaywrightTest ? getWindowPlaywrightConfig() : getWindowConfig());
    await renderLoadingPage(loadingView, title);

    getMainWindow().setContentView(loadingView);
}

async function renderLoadingPage(view: WebContentsView, title: string): Promise<void> {
    const filePath = getFileResourcePath("loading.html");

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

export async function reloadHiddenViews() {
    const loadPromises = [];
    for (const [viewID, view] of Object.entries(viewMap)) {
        if (viewID !== getCurrentViewID() && view) {
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
        if (viewID !== getCurrentViewID() && view) {
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
    return getMainWindowOrNull()?.webContents?.session?.spellCheckerEnabled ?? getSettings().spellChecker;
}

export function toggleSpellCheck(enabled: boolean) {
    updateSettings({ spellChecker: enabled });
    getMainWindowOrNull()?.webContents?.session?.setSpellCheckerEnabled(enabled);
}

export const bringWindowToFront = () => {
    const mainWindow = getMainWindowOrNull();
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
