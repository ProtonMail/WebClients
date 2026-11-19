import type { BrowserWindow, WebContents, WebContentsView } from "electron";
import type { URLConfig } from "../../store/urlStore";

// Keep this module free of runtime imports from the app: it sits below every module that reads the window
// or a view, and any app import would bring the view cycle back.

export type ViewID = keyof URLConfig;

let currentViewID: ViewID;
let mainWindow: undefined | BrowserWindow = undefined;

export const viewMap: Record<ViewID, WebContentsView | undefined> = {
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
export const viewURLMap: Record<ViewID, string | undefined> = {
    meet: undefined,
    account: undefined,
};

export function setMainWindow(window: BrowserWindow) {
    mainWindow = window;
}

export function setCurrentViewID(viewID: ViewID) {
    currentViewID = viewID;
}

export function getMainWindowOrUndefined() {
    return mainWindow;
}

export const getMeetView = () => {
    return viewMap.meet!;
};

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
