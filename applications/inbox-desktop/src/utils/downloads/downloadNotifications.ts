import { app, DownloadItem, Notification, shell } from "electron";
import { basename } from "node:path";
import { c } from "ttag";
import { appSession } from "../electronSession/partitions";
import { getFeatureFlagManager } from "../flags/manager";
import { FeatureFlag } from "../flags/flags";
import { isWindows } from "../helpers";
import { notificationLogger } from "../log";
import { DEEPLINK_PROTOCOL, DeepLinkActions, findDeepLink } from "../protocol/deep_links";
import { parseURLParams } from "../urls/urlHelpers";
import { stripBidiControls } from "../bidi";
import { buildProtocolToast } from "../../ipc/notification";

const DOWNLOAD_ID_KEY = "downloadID";

// Without a reference, a garbage-collected notification no longer emits click events.
const shownNotifications = new Set<Notification>();
const windowsDownloadPaths = new Map<string, string>();

const showWindowsCompletedToast = (title: string, body: string, savePath: string) => {
    const downloadID = crypto.randomUUID();
    windowsDownloadPaths.set(downloadID, savePath);

    const showDownloadLink = `${DEEPLINK_PROTOCOL}:${DeepLinkActions.ShowDownload}?${DOWNLOAD_ID_KEY}=${downloadID}`;
    new Notification(buildProtocolToast(showDownloadLink, title, body)).show();
};

const showCompletedNotification = (savePath: string) => {
    const title = c("Download notification").t`Download complete`;
    const body = stripBidiControls(basename(savePath));

    if (isWindows) {
        showWindowsCompletedToast(title, body, savePath);
        return;
    }

    const notification = new Notification({ title, body });
    notification.on("click", () => {
        shownNotifications.delete(notification);
        shell.showItemInFolder(savePath);
    });
    notification.on("close", () => shownNotifications.delete(notification));

    shownNotifications.add(notification);
    notification.show();
};

const showFailedNotification = (fileName: string) => {
    new Notification({
        title: c("Download notification").t`Download failed`,
        body: stripBidiControls(fileName),
    }).show();
};

const handleDownloadDone = (item: DownloadItem, state: "completed" | "cancelled" | "interrupted") => {
    notificationLogger.info("Download done", state);

    if (!getFeatureFlagManager().isEnabled(FeatureFlag.NOTIFICATION_ON_DOWNLOAD_FINISH)) {
        return;
    }

    switch (state) {
        case "completed":
            app.dock?.downloadFinished(item.getSavePath());
            showCompletedNotification(item.getSavePath());
            break;
        case "interrupted":
            showFailedNotification(basename(item.getSavePath()) || item.getFilename());
            break;
        case "cancelled":
            break;
    }
};

export const handleDownloads = () => {
    appSession().on("will-download", (_event, item) => {
        item.once("done", (_doneEvent, state) => handleDownloadDone(item, state));
    });
};

export const handleShowDownload = (argv: string[]): boolean => {
    const url = findDeepLink(argv, DeepLinkActions.ShowDownload);
    if (!url) {
        return false;
    }

    const downloadID = parseURLParams(url)?.get(DOWNLOAD_ID_KEY);
    const savePath = downloadID ? windowsDownloadPaths.get(downloadID) : undefined;
    if (downloadID && savePath) {
        shell.showItemInFolder(savePath);
        windowsDownloadPaths.delete(downloadID);
    } else {
        notificationLogger.warn("Unknown download ID in show_download deep link");
    }

    return true;
};
