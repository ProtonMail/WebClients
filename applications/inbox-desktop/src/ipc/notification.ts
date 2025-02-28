import { Notification, app, Event, nativeImage, WebContentsView } from "electron";
import {
    bringWindowToFront,
    openMail,
    openCalendar,
    getMainWindow,
    getCurrentLocalID,
} from "../utils/view/viewManagement";
import { ipcLogger, notificationLogger } from "../utils/log";
import { ElectronNotification } from "@proton/shared/lib/desktop/desktopTypes";
import { isWindows, isMac } from "../utils/helpers";
import { parseURLParams } from "../utils/urls/urlHelpers";
import { join } from "node:path";
import { DEEPLINK_PROTOCOL, DeepLinkActions } from "../utils/protocol/deep_links";

const notifications: Map<string, Notification> = new Map();

const NOTIFICATION_ID_KEY = "notificationID";

const findNotificationID = (argv: string[]): string | undefined => {
    const url = argv.find((value: string) => value.includes(`${NOTIFICATION_ID_KEY}=`));
    if (!url) {
        return undefined;
    }

    const params = parseURLParams(url);
    return params?.get(NOTIFICATION_ID_KEY) ?? undefined;
};

export const handleWinNotification = () => {
    app.on("second-instance", (_ev: Event, argv: string[]) => {
        const notificationID = findNotificationID(argv);
        if (!notificationID) {
            return;
        }

        notificationLogger.debug("Clear notification from deep link", notificationID);
        notifications.delete(notificationID);
    });

    if (!isMac) {
        return;
    }

    app.on("open-url", (_ev: Event, url: string) => {
        const notificationID = findNotificationID([url]);
        if (!notificationID) {
            return;
        }

        notificationLogger.debug("Clear notification from open link", notificationID);
        notifications.delete(notificationID);
    });
};

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

            const webContentsView = new WebContentsView();

            await new Promise<void>((resolve) => {
                webContentsView.webContents.once("dom-ready", resolve);
                // We need to load something on the browser view so we can
                // now that DOM is ready to execute injected JS
                const filePath = app.isPackaged
                    ? join(process.resourcesPath, "blank.html")
                    : join(app.getAppPath(), "assets/blank.html");
                webContentsView.webContents.loadURL(`file://${filePath}`);
            });

            const badgeURL = await webContentsView.webContents.executeJavaScript(
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

const windowsToastNotification = (
    payload: ElectronNotification,
    uuid: string,
    localID: string | null,
): { toastXml: string } => {
    const { title, body, app, labelID, elementID, messageID } = payload;

    const action = app === "calendar" ? DeepLinkActions.OpenCalendar : DeepLinkActions.OpenMail;
    const hasValidMailParams = app === "mail" && labelID && labelID !== "" && elementID && elementID !== "";

    let params = `?${NOTIFICATION_ID_KEY}=${uuid}`;

    if (hasValidMailParams) {
        const urlParams = new URLSearchParams();
        urlParams.set("labelID", labelID);
        urlParams.set("elementID", elementID);
        if (messageID) urlParams.set("messageID", messageID);
        urlParams.set(NOTIFICATION_ID_KEY, uuid);
        urlParams.set("localID", localID ?? "null");

        // Replace & with &amp; for XML compatibility
        params = `?${urlParams.toString().replace(/&/g, "&amp;")}`;
    }

    return {
        toastXml: `<toast launch="${DEEPLINK_PROTOCOL}:${action}${params}" activationType="protocol">
                <visual>
                <binding template="ToastText02">
                <text id="1">${title}</text>
                <text id="2">${body}</text>
                </binding>
                </visual>
                </toast>`,
    };
};

const filterSenisitve = (payload: ElectronNotification): string =>
    `app="${payload.app}", labelID="${payload.labelID}", elementID="${payload.elementID}"`;

export const showNotification = (payload: ElectronNotification) => {
    const uuid: string = crypto.randomUUID();
    const localID = getCurrentLocalID();
    notificationLogger.debug(`Notification request received ${uuid}, ${localID}:`, filterSenisitve(payload));

    const { title, body, app, labelID, elementID, messageID } = payload;

    const notification = new Notification(
        isWindows ? windowsToastNotification(payload, uuid, localID) : { title, body },
    );

    notification.on("click", () => {
        const clickLocalID = getCurrentLocalID();
        notificationLogger.info("Notification clicked", uuid, clickLocalID);
        if (!isWindows) bringWindowToFront();

        switch (app) {
            case "mail":
                if (localID !== clickLocalID) {
                    notificationLogger.warn(`Wrong localID: ${app}, ${uuid}`);
                    // INDA-440: switch account
                } else {
                    openMail(labelID, elementID, messageID);
                }
                break;
            case "calendar":
                openCalendar();
                break;
            default:
                notificationLogger.error(`Wrong notification app: ${app}, ${uuid}`);
                return;
        }

        notifications.delete(uuid);
    });

    notification.on("failed", () => {
        notificationLogger.info("Notification failed", uuid);
        notifications.delete(uuid);
    });

    notification.on("close", () => {
        notificationLogger.info("Notification closed", uuid);
        notifications.delete(uuid);
    });

    notifications.set(uuid, notification);
    notificationLogger.info("Showing notification", uuid);
    notification.show();
};
