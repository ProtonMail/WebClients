import { WebContents, shell } from "electron";
import {
    isAccount,
    isAccountAuthorize,
    isAccountSwitch,
    isAccoutLite,
    isCalendar,
    isHome,
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
    getWebContentsViewName,
    resetHiddenViews,
    getZoom,
    showView,
    showNetworkErrorPage,
    IGNORED_NET_ERROR_CODES,
    getCurrentViewID,
} from "./viewManagement";
import { resetBadge } from "../../ipc/notification";
import { mainLogger, viewLogger } from "../log";

export function handleWebContents(contents: WebContents) {
    const logger = () => {
        const viewName = getWebContentsViewName(contents);

        if (viewName) {
            return viewLogger(viewName);
        } else {
            return mainLogger;
        }
    };

    const isCurrentContent = () => {
        return getCurrentView()?.webContents === contents;
    };

    contents.on("did-navigate", (_ev, url) => {
        logger().info("did-navigate", url);

        if (isHostAllowed(url)) {
            // We need to ensure that the zoom is consistent for all URLs.
            // Currently electron stores the zoom factor for each URL (this is chromium's behavior)
            // and it is not able to have a default zoom factor (lack of API).
            logger().debug("did-navigate set zoom factor to", getZoom());
            contents.setZoomFactor(getZoom());
        }

        if (!isCurrentContent()) {
            return;
        }

        // There is a big issue with view.webContents.getURL(): if a view is displaying x and you
        // tell it to load y, if you ask which is the current URL, it will return x until y is
        // fully loaded. That's why there is a weird getViewURL function in viewManagement.ts.
        //
        // That is causing the race condition, because during the login process the mail view
        // says that it is displaying the home page (that was showing before the logout event)
        // but it is actually loading the loading page in background.
        //
        // So the fix is basically reset all views when user reaches account switch, so none of
        // them is in the previous user home page after login.
        if (getCurrentViewID() === "account" && (isAccountSwitch(url) || isAccountLogin(url))) {
            resetHiddenViews({ toHomepage: false });
        }

        if (isHome(url)) {
            resetHiddenViews({ toHomepage: true });
        }
    });

    contents.on("did-navigate-in-page", (ev, url) => {
        logger().info("did-navigate-in-page", url);

        if (!isCurrentContent()) {
            return;
        }

        if (!isHostAllowed(url)) {
            return ev.preventDefault();
        }

        if (isAccountSwitch(url)) {
            resetBadge();
        }

        if (isHome(url)) {
            resetHiddenViews({ toHomepage: true });
        }

        // This is used to redirect users to the external browser for internal upgrade modals
        if (isAccount(url) && isUpgradeURL(url)) {
            return;
        }
    });

    contents.on("will-attach-webview", (event) => {
        logger().info("will-attach-webview event prevented");
        return event.preventDefault();
    });

    contents.on("did-fail-load", (_event, errorCode, validatedURL) => {
        logger().error("did-fail-load", errorCode, validatedURL);

        if (!isCurrentContent()) {
            return;
        }

        if (!IGNORED_NET_ERROR_CODES.includes(errorCode)) {
            const viewName = getWebContentsViewName(contents);
            if (viewName) showNetworkErrorPage(viewName);
        }
    });

    contents.on("will-navigate", (details) => {
        logger().info("will-navigate", details.url);

        if (!isHostAllowed(details.url) && !global.oauthProcess && !global.subscriptionProcess) {
            logger().info("opening external URL", details.url);
            shell.openExternal(details.url);
            return details.preventDefault();
        }

        // Only redirect to a different browser view if the navigation is happening in
        // the visible web contents.
        if (isCurrentContent()) {
            if (isAccount(details.url) && !isAccountAuthorize(details.url) && getCurrentView() !== getAccountView()) {
                showView("account", details.url);
                return details.preventDefault();
            }

            if (isCalendar(details.url) && getCurrentView() !== getCalendarView()) {
                showView("calendar", details.url);
                return details.preventDefault();
            }

            if (isMail(details.url) && getCurrentView() !== getMailView()) {
                showView("mail", details.url);
                return details.preventDefault();
            }
        }

        return details;
    });

    contents.setWindowOpenHandler((details) => {
        const { url } = details;
        const logWindowOpen = (status: "allowed" | "denied", description: string, level: "debug" | "error" = "debug") =>
            logger()[level](`Window open (${status}) ${description}`);

        if (isCalendar(url)) {
            logWindowOpen("denied", `calendar link in calendar view ${url}`);
            showView("calendar", url);
            return { action: "deny" };
        }

        if (isMail(url)) {
            logWindowOpen("denied", `mail link in mail view ${url}`);
            showView("mail", url);
            return { action: "deny" };
        }

        if (isAccount(url)) {
            if (isAccoutLite(url)) {
                logWindowOpen("denied", `account lite in browser ${url}`);
                shell.openExternal(url);
                return { action: "deny" };
            }

            if (isUpsellURL(url)) {
                logWindowOpen("denied", `upsell in browser ${url}`);
                shell.openExternal(url);
                return { action: "deny" };
            }

            logWindowOpen("denied", `account link in account view ${url}`);
            showView("account", url);
            return { action: "deny" };
        }

        if (isHostAllowed(url)) {
            // We probably want to disable this case, this will only happen with proton URLs
            // that are not calendar/mail/account domains and should be handled as a regular
            // unknown link. We are keeping it enabled for now to detect error cases.
            logWindowOpen("allowed", `host not caught by any electron view ${url}`, "error");
            return { action: "allow" };
        }

        if (global.oauthProcess) {
            logWindowOpen("allowed", `oauth process enabled ${url}`);
            return { action: "allow" };
        }

        if (global.subscriptionProcess) {
            logWindowOpen("allowed", `subscription process enabled ${url}`);
            return { action: "allow" };
        }

        logWindowOpen("denied", `unknown link open in browser ${url}`);
        shell.openExternal(url);
        return { action: "deny" };
    });
}
