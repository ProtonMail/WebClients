import { app, Event } from "electron";
import { mainLogger } from "../log";
import { bringWindowToFront } from "../view/viewManagement";
import { handleMailToUrls } from "../urls/mailtoLinks";
import { handleOpenCalendar, handleOpenMail } from "../protocol/deep_links";
import { cleanupDeeplinkNotifications } from "../../ipc/notification";
import { getMailtoArg } from "../protocol/mailto";

export function handleSecondInstance() {
    const cleanup = (argv: string[]) => cleanupDeeplinkNotifications(argv, "deep-link");

    app.on("second-instance", (_ev: Event, argv: string[]) => {
        mainLogger.info("Second instance called", argv);
        // Bring window to focus
        bringWindowToFront();
        if (handleMailToUrls(getMailtoArg(argv))) {
            return;
        }

        // We can indeed make these exclusive
        // These should be applicable to both windows and linux. I think. What is the difference between Notification and Windows toast notification
        // These should are only applicable to Windows.
        // we also need to add switch cases here
        if (handleOpenMail(argv)) {
            cleanup(argv);
            return;
        } else if (handleOpenCalendar(argv)) {
            cleanup(argv);
            return;
        }
        cleanup(argv);
    });
}
