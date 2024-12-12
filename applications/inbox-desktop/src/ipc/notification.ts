import { Notification, app } from "electron";
import { isWindows } from "../utils/helpers";
import { addHashToCurrentURL } from "../utils/urls/urlHelpers";
import { getMailView, getMainWindow, showView } from "../utils/view/viewManagement";
import { ipcLogger, notificationLogger } from "../utils/log";
import { ElectronNotification } from "@proton/shared/lib/desktop/desktopTypes";

export const handleIPCBadge = (count: number) => {
    ipcLogger.info("Update badge value", count);
    if (isWindows) {
        return;
    }

    if (count) {
        if (count < 0) {
            ipcLogger.error("Received invalid badge count", count);
            resetBadge();
        } else {
            app.setBadgeCount(count);
        }
    } else {
        resetBadge();
    }
};

export const resetBadge = () => {
    ipcLogger.info("Reset badge value");
    app.setBadgeCount(0);
};

export const showNotification = (payload: ElectronNotification) => {
    const { title, body, app, labelID, elementID } = payload;
    const notification = new Notification({ title, body });

    notification.on("click", () => {
        const mainWindow = getMainWindow();

        if (!mainWindow || mainWindow.isDestroyed()) {
            notificationLogger.warn("Ignoring notification, mainWindow is not available");
            return;
        }

        if (labelID && elementID && app === "mail") {
            const url = addHashToCurrentURL(
                getMailView().webContents.getURL(),
                `#elementID=${elementID}&labelID=${labelID}`,
            );

            notificationLogger.info("Opening email from notification");
            showView("mail", url);
        } else {
            notificationLogger.info("Showing app from notification");
            showView(app);
        }

        if (mainWindow.isMinimized()) {
            notificationLogger.info("Restoring main window");
            mainWindow.restore();
        }

        mainWindow.focus();
    });

    notificationLogger.info("Showing notification");
    notification.show();
};
