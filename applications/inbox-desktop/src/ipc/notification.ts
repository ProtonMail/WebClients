import { Notification, app, nativeImage } from "electron";
import { addHashToCurrentURL } from "../utils/urls/urlHelpers";
import { getMailView, getMainWindow, showView } from "../utils/view/viewManagement";
import { ipcLogger, notificationLogger } from "../utils/log";
import { ElectronNotification } from "@proton/shared/lib/desktop/desktopTypes";
import { isWindows } from "../utils/helpers";
import sharp from "sharp";

async function setBadgeCount(value: number) {
    if (isWindows) {
        const mainWindow = getMainWindow();

        if (!mainWindow || mainWindow.isDestroyed()) {
            return;
        }

        if (value <= 0) {
            mainWindow.setOverlayIcon(null, "");
            return;
        }

        try {
            const size = 320;
            const strValue = value > 99 ? "99+" : value.toString();
            const fontSize = value < 10 ? 200 : 160;

            const badgeContent = `<?xml version="1.0" encoding="UTF-8"?>
                <svg width="${size}" height="${size}" version="1.1" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0" y="0" width="${size}" height="${size}" ry="30" fill="#c70039" />
                    <text x="${size * 0.5}" y="${size * 0.5 + fontSize * 0.35}" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="${fontSize}px" text-align="center" text-anchor="middle" xml:space="preserve">${strValue}</text>
                </svg>
            `;

            mainWindow.setOverlayIcon(
                nativeImage.createFromBuffer(await sharp(Buffer.from(badgeContent, "utf8")).toBuffer()),
                `${value} notifications`,
            );
        } catch (error) {
            ipcLogger.error("Could not set badge on windows", error);
        }

        return;
    }

    app.setBadgeCount(value);
}

export const handleIPCBadge = (count: number) => {
    ipcLogger.info("Update badge value", count);

    if (count) {
        if (count < 0) {
            ipcLogger.error("Received invalid badge count", count);
            resetBadge();
        } else {
            setBadgeCount(count);
        }
    } else {
        resetBadge();
    }
};

export const resetBadge = () => {
    ipcLogger.info("Reset badge value");
    setBadgeCount(0);
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
