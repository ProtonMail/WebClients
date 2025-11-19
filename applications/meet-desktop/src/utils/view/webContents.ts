import { WebContents, shell, BrowserWindow } from "electron";
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
    isNavigationAllowed,
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
import { mainLogger, sanitizeUrlForLogging, viewLogger } from "../log";

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
        logger().info("did-navigate", sanitizeUrlForLogging(url));
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
        updateViewURL(contents, url);

        if (!isCurrentContent()) {
            return;
        }

        if (!isNavigationAllowed(url)) {
            shell.openExternal(url);
            return ev.preventDefault();
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

    contents.on("did-fail-load", (_event, errorCode) => {
        if (!isCurrentContent()) {
            return;
        }

        if (!IGNORED_NET_ERROR_CODES.includes(errorCode)) {
            const viewName = getWebContentsViewName(contents);
            if (viewName) showNetworkErrorPage(viewName);
        }
    });

    contents.on("will-navigate", (details) => {
        if (!isSafeUrl(details)) {
            return details.preventDefault();
        }

        const closeExtraWindow = () => {
            const viewName = getWebContentsViewName(contents);
            if (!viewName) {
                const browserWindow = BrowserWindow.fromWebContents(contents);
                if (browserWindow && !browserWindow.isDestroyed()) {
                    browserWindow.close();
                }
            }
        };

        if (isCalendar(details.url)) {
            shell.openExternal(details.url);
            details.preventDefault();

            closeExtraWindow();

            return;
        }

        if (!isNavigationAllowed(details.url)) {
            shell.openExternal(details.url);
            details.preventDefault();

            closeExtraWindow();
        }

        // Only redirect to a different browser view if the navigation is happening in
        // the visible web contents.
        const isCurrent = isCurrentContent();

        if (isCurrent) {
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

        // Handle about:blank - this is created by window.open() before navigation
        // We allow it, then the subsequent navigation will be caught by will-navigate
        if (url === "about:blank" || url === "") {
            return { action: "allow" };
        }

        if (!isSafeUrl(details)) {
            return { action: "deny" };
        }

        if (!isNavigationAllowed(url)) {
            shell.openExternal(url);
            return { action: "deny" };
        }

        // Open calendar URLs in external browser
        if (isCalendar(url)) {
            shell.openExternal(url);
            return { action: "deny" };
        }

        if (isMeet(url)) {
            showView("meet", url);
            return { action: "deny" };
        }

        if (isAccount(url) && !isGoogleOAuthAuthorizationURL(url)) {
            if (isAccoutLite(url)) {
                shell.openExternal(url);
                return { action: "deny" };
            }

            if (isUpsellURL(url)) {
                shell.openExternal(url);
                return { action: "deny" };
            }

            showView("account", url);
            return { action: "deny" };
        }

        shell.openExternal(url);
        return { action: "deny" };
    });
}
