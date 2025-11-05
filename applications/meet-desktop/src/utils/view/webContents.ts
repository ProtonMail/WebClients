import { WebContents, shell } from "electron";
import {
    getLocalID,
    isAccount,
    isAccountAuthorize,
    isAccountLogin,
    isAccountSwitch,
    isAccoutLite,
    isCalendar,
    isGoogleOAuthAuthorizationURL,
    isHome,
    isHostAllowed,
    isMeet,
    isUpgradeURL,
    isUpsellURL,
} from "../urls/urlTests";
import {
    getAccountView,
    getCurrentView,
    getWebContentsViewName,
    resetHiddenViews,
    getZoom,
    showView,
    showNetworkErrorPage,
    IGNORED_NET_ERROR_CODES,
    getCurrentViewID,
    getViewURL,
    updateViewURL,
} from "./viewManagement";
import { mainLogger, viewLogger } from "../log";

function isSafeUrl(
    handlerDetails: Electron.HandlerDetails | Electron.Event<Electron.WebContentsWillNavigateEventParams>,
): boolean {
    try {
        const parsed = new URL(handlerDetails.url);
        return parsed.protocol === "https:";
    } catch {
        return false;
    }
}

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

    contents.on("did-navigate", async (_ev, url) => {
        logger().info("did-navigate", url);
        updateViewURL(contents, url);

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
        // That is causing the race condition, because during the login process the meet view
        // says that it is displaying the home page (that was showing before the logout event)
        // but it is actually loading the loading page in background.
        //
        // So the fix is basically reset all views when user reaches account switch, so none of
        // them is in the previous user home page after login.
        if (getCurrentViewID() === "account" && (isAccountSwitch(url) || isAccountLogin(url))) {
            resetHiddenViews({ toHomepage: false });
        }

        // If we switch accounts from settings, we need to ensure that all hidden views are
        // reset to the home page using the corresponding local ID.
        if (getCurrentViewID() === "account") {
            const accountLocalID = getLocalID(url);
            const meetLocalId = getLocalID(getViewURL("meet"));

            if (accountLocalID !== meetLocalId) {
                resetHiddenViews({ toHomepage: true });
            }
        }

        if (isHome(url)) {
            resetHiddenViews({ toHomepage: true });
        }
    });

    contents.on("did-navigate-in-page", (ev, url) => {
        logger().info("did-navigate-in-page", url);
        updateViewURL(contents, url);

        if (!isCurrentContent()) {
            return;
        }

        if (!isHostAllowed(url)) {
            return ev.preventDefault();
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

        if (!isSafeUrl(details)) {
            return details.preventDefault();
        }

        // Open calendar URLs in external browser
        // This catches navigation from allowed about:blank windows (e.g., from window.open())
        if (isCalendar(details.url)) {
            logger().info("opening calendar URL in external browser", details.url);
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

            if (isMeet(details.url)) {
                showView("meet", details.url);
                return details.preventDefault();
            }
        }

        return details;
    });

    contents.setWindowOpenHandler((details) => {
        const { url } = details;
        const logWindowOpen = (status: "allowed" | "denied", description: string, level: "debug" | "error" = "debug") =>
            logger()[level](`Window open (${status}) ${description}`);

        // Handle about:blank - this is created by window.open() before navigation
        // We allow it, then the subsequent navigation will be caught by will-navigate
        if (url === "about:blank" || url === "") {
            logWindowOpen("allowed", `blank window - will handle navigation ${url}`);
            return { action: "allow" };
        }

        if (!isSafeUrl(details)) {
            return { action: "deny" };
        }

        // Open calendar URLs in external browser
        if (isCalendar(url)) {
            logWindowOpen("denied", `calendar link in external browser ${url}`);
            shell.openExternal(url);
            return { action: "deny" };
        }

        if (isMeet(url)) {
            logWindowOpen("denied", `meet link in meet view ${url}`);
            showView("meet", url);
            return { action: "deny" };
        }

        if (isAccount(url) && !isGoogleOAuthAuthorizationURL(url)) {
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

        logWindowOpen("denied", `unknown link open in browser ${url}`);
        shell.openExternal(url);
        return { action: "deny" };
    });
}
