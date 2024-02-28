import { BrowserView, Notification, app } from "electron";
import Logger from "electron-log";
import { getMainWindow, updateView } from "../utils/view/viewManagement";
import { ElectronNotification } from "./ipcConstants";

export const handleIPCBadge = (count: number) => {
    Logger.info("handleIPCBadge, update badge value", count);

    if (count) {
        app.setBadgeCount(count);
    } else {
        resetBadge();
    }
};

export const resetBadge = () => {
    app.setBadgeCount(0);
};

/**
 * Loads the URL in the current view so the user is redirected to the appropriate place
 * @param link Pathname to load in the current view
 */
const loadNotificationURl = (view: BrowserView, link: string) => {
    try {
        const currentURL = view?.webContents.getURL();
        const url = new URL(currentURL);
        url.pathname = link;
        view?.webContents.loadURL(url.toString());
    } catch (error) {
        Logger.error("Error while parsing mailto url");
    }
};

export const showNotification = (payload: ElectronNotification) => {
    const { title, body, app, link } = payload;
    const notification = new Notification({ title, body });

    notification.on("click", () => {
        const mainWindow = getMainWindow();
        const view = updateView(app);
        if (link) {
            loadNotificationURl(view, link);
        }

        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();
        }
    });

    notification.show();
};
