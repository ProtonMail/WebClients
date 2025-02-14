import { BrowserView, Notification, app, nativeImage } from "electron";
import { addHashToCurrentURL } from "../utils/urls/urlHelpers";
import { getMailView, getMainWindow, showView } from "../utils/view/viewManagement";
import { ipcLogger, notificationLogger } from "../utils/log";
import { ElectronNotification } from "@proton/shared/lib/desktop/desktopTypes";
import { isWindows } from "../utils/helpers";
import { join } from "node:path";

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
            const size = 32;
            const strValue = value > 99 ? "+" : value.toString();
            const fontSize = value < 10 || value > 99 ? 24 : 20;

            const browserView = new BrowserView();

            await new Promise((resolve) => {
                browserView.webContents.once("dom-ready", resolve);
                // We need to load something on the browser view so we can
                // now that DOM is ready to execute injected JS
                const filePath = app.isPackaged
                    ? join(process.resourcesPath, "blank.html")
                    : join(app.getAppPath(), "assets/blank.html");
                browserView.webContents.loadURL(`file://${filePath}`);
            });

            const badgeURL = await browserView.webContents.executeJavaScript(
                `(${drawBadge})("${strValue}", {badgeSize: ${size}, fontSize: ${fontSize}});`,
                true,
            );

            mainWindow.setOverlayIcon(nativeImage.createFromDataURL(badgeURL), strValue);
        } catch (error) {
            ipcLogger.error("Could not set badge on windows", error);
        }

        return;
    }

    app.setBadgeCount(value);
}

function drawBadge(badgeValue: string, { badgeSize, fontSize }: { badgeSize: number; fontSize: number }) {
    const canvas = document.createElement("canvas");
    canvas.width = badgeSize;
    canvas.height = badgeSize;
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Canvas 2d context is not available");
    }

    context.font = `bold ${fontSize}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#c70039";
    context.roundRect(0, 0, badgeSize, badgeSize, badgeSize * 0.1);
    context.fill();
    context.fillStyle = "white";
    context.fillText(badgeValue, badgeSize * 0.5, badgeSize * 0.55);

    return canvas.toDataURL();
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
