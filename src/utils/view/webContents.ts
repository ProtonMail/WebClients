import { WebContents, app, shell } from "electron";
import Logger from "electron-log";
import {
    getSessionID,
    isAccount,
    isAccountAuthorize,
    isAccountSwitch,
    isAccoutLite,
    isCalendar,
    isHostAllowed,
    isMail,
    isUpgradeURL,
    isUpsellURL,
} from "../urls/urlTests";
import {
    getAccountView,
    getCalendarView,
    getCurrentView,
    getMailView,
    loadURL,
    reloadCalendarWithSession,
} from "./viewManagement";
import { resetBadge } from "../../ipc/notification";

export function handleWebContents(contents: WebContents) {
    const preventDefault = (ev: Electron.Event) => {
        ev.preventDefault();
    };

    contents.on("did-navigate-in-page", (ev, url) => {
        Logger.info("did-navigate-in-page", app.isPackaged ? "" : url);

        if (!isHostAllowed(url)) {
            return preventDefault(ev);
        }

        if (isAccountSwitch(url)) {
            resetBadge();
        }

        // This is used to redirect users to the external browser for internal upgrade modals
        if (isAccount(url) && isUpgradeURL(url)) {
            return;
        }

        const sessionID = getSessionID(url);
        const calendarView = getCalendarView();
        const calendarSessionID = getSessionID(calendarView.webContents.getURL());
        if (isMail(url) && sessionID && !calendarSessionID) {
            reloadCalendarWithSession(sessionID);
        }
    });

    contents.on("will-attach-webview", preventDefault);

    contents.on("will-navigate", (details) => {
        Logger.info("will-navigate");

        if (!isHostAllowed(details.url) && !global.oauthProcess && !global.subscriptionProcess) {
            return preventDefault(details);
        }

        // Only redirect to a different browser view if the navigation is happening in
        // the visible web contents.
        if (getCurrentView()!.webContents === contents) {
            if (isAccount(details.url) && !isAccountAuthorize(details.url) && getCurrentView() !== getAccountView()) {
                loadURL("account", details.url);
                return preventDefault(details);
            }

            if (isCalendar(details.url) && getCurrentView() !== getCalendarView()) {
                loadURL("calendar", details.url);
                return preventDefault(details);
            }

            if (isMail(details.url) && getCurrentView() !== getMailView()) {
                loadURL("mail", details.url);
                return preventDefault(details);
            }
        }

        return details;
    });

    contents.setWindowOpenHandler((details) => {
        const { url } = details;
        const loggedURL = app.isPackaged ? "" : url;

        if (isCalendar(url)) {
            Logger.info("Calendar link", loggedURL);
            loadURL("calendar", url);
            return { action: "deny" };
        }

        if (isMail(url)) {
            Logger.info("Mail link", loggedURL);
            loadURL("mail", url);
            return { action: "deny" };
        }

        if (isAccount(url)) {
            // Upsell links should be opened in browser to avoid 3D secure issues
            if (isAccoutLite(url) || isUpsellURL(url)) {
                Logger.info("Account lite or upsell in browser", loggedURL);
                shell.openExternal(url);
            } else {
                Logger.info("Account link", loggedURL);
                loadURL("account", url);
            }

            return { action: "deny" };
        }

        if (isHostAllowed(url)) {
            Logger.info("Allowed host", loggedURL);
            return { action: "allow" };
        }

        if (global.oauthProcess) {
            Logger.info("OAuth link in app", loggedURL);
            return { action: "allow" };
        }

        if (global.subscriptionProcess) {
            Logger.info("Subscription link in modal", loggedURL);
            return { action: "allow" };
        }

        Logger.info("Other link in browser", loggedURL);
        shell.openExternal(url);
        return { action: "deny" };
    });
}
