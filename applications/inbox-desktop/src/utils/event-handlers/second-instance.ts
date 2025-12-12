import { app, Event } from "electron";
import { mainLogger } from "../log";
import { bringWindowToFront } from "../view/viewManagement";
import { handleMailToUrls } from "../urls/mailtoLinks";
import { handleOpenCalendar, handleOpenMail } from "../protocol/deep_links";
import { cleanupDeeplinkNotifications, DeepLinkNotificationSource } from "../../ipc/notification";
import { getMailtoArg } from "../protocol/mailto";

export function handleSecondInstance() {
    app.on("second-instance", (_ev: Event, argv: string[]) => {
        mainLogger.info("Second instance called", argv);
        bringWindowToFront(); // Bring window to focus

        if (handleMailToUrls(getMailtoArg(argv))) {
            return;
        }

        if (handleOpenMail(argv)) {
            cleanupDeeplinkNotifications(argv, DeepLinkNotificationSource.DEEP_LINK);
            return;
        }

        if (handleOpenCalendar(argv)) {
            cleanupDeeplinkNotifications(argv, DeepLinkNotificationSource.DEEP_LINK);
            return;
        }

        cleanupDeeplinkNotifications(argv, DeepLinkNotificationSource.DEEP_LINK);
    });
}
