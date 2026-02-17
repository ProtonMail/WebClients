import { Event, app } from "electron";
import { isMac } from "../helpers";
import { showView, bringWindowToFront } from "../view/viewManagement";
import { isMeet, isNavigationAllowed } from "../urls/urlTests";

export const DEEPLINK_PROTOCOL = "proton-meet";

let macOSStartupUrl: string | null = null;

export const checkDeepLinks = () => {
    app.setAsDefaultProtocolClient(DEEPLINK_PROTOCOL);
};

const isValidMeetUrl = (url: string): boolean => {
    try {
        if (!isNavigationAllowed(url)) {
            return false;
        }

        if (!isMeet(url)) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
};

const convertProtocolUrlToWebUrl = (protocolUrl: string): string | null => {
    try {
        const url = new URL(protocolUrl);

        if (url.protocol.toLowerCase() !== `${DEEPLINK_PROTOCOL}:`) {
            return null;
        }

        const webUrl = `https://${url.hostname}${url.pathname}${url.search}${url.hash}`;

        if (!isValidMeetUrl(webUrl)) {
            return null;
        }

        return webUrl;
    } catch (error) {
        return null;
    }
};

export const handleDeepLink = () => {
    if (isMac) {
        app.on("open-url", (ev: Event, url: string) => {
            ev.preventDefault();

            if (url.startsWith(`${DEEPLINK_PROTOCOL}://`)) {
                const webUrl = convertProtocolUrlToWebUrl(url);
                if (webUrl) {
                    if (app.isReady()) {
                        showView("meet", webUrl);
                        bringWindowToFront();
                    } else {
                        macOSStartupUrl = webUrl;
                    }
                }
            }
        });
    }
};

export const handleStartupDeepLink = (): string | null => {
    if (isMac && macOSStartupUrl) {
        const url = macOSStartupUrl;
        macOSStartupUrl = null;
        return url;
    }

    const protocolUrl = process.argv.find((arg) => arg.startsWith(`${DEEPLINK_PROTOCOL}://`));

    if (protocolUrl) {
        return convertProtocolUrlToWebUrl(protocolUrl);
    }

    return null;
};

export const handleSecondInstanceDeepLink = (argv: string[]): string | null => {
    const protocolUrl = argv.find((arg) => arg.startsWith(`${DEEPLINK_PROTOCOL}://`));

    if (protocolUrl) {
        return convertProtocolUrlToWebUrl(protocolUrl);
    }

    return null;
};
