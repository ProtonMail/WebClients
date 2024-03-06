import { app } from "electron";
import Logger from "electron-log";

export const handleIPCBadge = (count: number) => {
    Logger.info("handleIPCBadge, update badge value", count);

    if (count) {
        app.setBadgeCount(count);
    } else {
        app.setBadgeCount(0);
    }
};

export const resetBadge = () => {
    app.setBadgeCount(0);
};
