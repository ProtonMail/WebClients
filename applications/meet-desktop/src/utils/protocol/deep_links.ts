import { Event, app } from "electron";
import { isMac } from "../helpers";
import { protocolLogger } from "../log";
import { showView, bringWindowToFront } from "../view/viewManagement";
import { isMeet, isNavigationAllowed } from "../urls/urlTests";

export const DEEPLINK_PROTOCOL = "proton-meet";

export const checkDeepLinks = () => {
    app.setAsDefaultProtocolClient(DEEPLINK_PROTOCOL);
};

const isValidMeetUrl = (url: string): boolean => {
    try {
        if (!isNavigationAllowed(url)) {
            protocolLogger.warn("Navigation not allowed for URL", url);
            return false;
        }

        if (!isMeet(url)) {
            protocolLogger.warn("URL is not a Proton Meet URL", url);
            return false;
        }

        return true;
    } catch (error) {
        protocolLogger.error("Error validating meet URL", error);
        return false;
    }
};

const convertProtocolUrlToWebUrl = (protocolUrl: string): string | null => {
    try {
        const withoutProtocol = protocolUrl.replace(`${DEEPLINK_PROTOCOL}://`, "");
        const webUrl = `https://${withoutProtocol}`;

        if (!isValidMeetUrl(webUrl)) {
            protocolLogger.warn("Invalid meeting URL", webUrl);
            return null;
        }

        return webUrl;
    } catch (error) {
        protocolLogger.error("Failed to convert protocol URL", error);
        return null;
    }
};

export const handleDeepLink = () => {
    if (!isMac) {
        return;
    }

    app.on("open-url", (_ev: Event, url: string) => {
        protocolLogger.info("Deep link received", url);

        if (url.startsWith(`${DEEPLINK_PROTOCOL}://`)) {
            const webUrl = convertProtocolUrlToWebUrl(url);
            if (webUrl) {
                showView("meet", webUrl);
                bringWindowToFront();
            }
        }
    });
};

export const handleStartupDeepLink = (): string | null => {
    const protocolUrl = process.argv.find((arg) => arg.startsWith(`${DEEPLINK_PROTOCOL}://`));

    if (protocolUrl) {
        protocolLogger.info("Startup deep link", protocolUrl);
        return convertProtocolUrlToWebUrl(protocolUrl);
    }

    return null;
};

export const handleSecondInstanceDeepLink = (argv: string[]): string | null => {
    const protocolUrl = argv.find((arg) => arg.startsWith(`${DEEPLINK_PROTOCOL}://`));

    if (protocolUrl) {
        protocolLogger.info("Second instance deep link", protocolUrl);
        return convertProtocolUrlToWebUrl(protocolUrl);
    }

    return null;
};
