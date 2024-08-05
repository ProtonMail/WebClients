import { Notification, app } from "electron";
import { isWindows } from "../utils/helpers";
import { addHashToCurrentURL } from "../utils/urls/urlHelpers";
import { getMailView, getMainWindow, showView } from "../utils/view/viewManagement";
import { ipcLogger } from "../utils/log";
import { ElectronNotification } from "../utils/external/packages/shared/lib/desktop/desktopTypes";

export const handleIPCBadge = (count: number) => {
    ipcLogger.info("Update badge value", count);
    if (isWindows) {
        return;
    }

    if (count) {
        app.setBadgeCount(count);
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

        if (labelID && elementID && app === "mail") {
            const url = addHashToCurrentURL(
                getMailView().webContents.getURL(),
                `#elementID=${elementID}&labelID=${labelID}`,
            );

            showView("mail", url);
        } else {
            showView(app);
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
