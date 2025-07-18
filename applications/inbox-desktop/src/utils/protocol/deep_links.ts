import { Event, app } from "electron";
import { isMac, OneTimeArgument } from "../helpers";
import { protocolLogger } from "../log";
import { openMail, openCalendar, getCurrentLocalID } from "../view/viewManagement";
import { parseURLParams } from "../urls/urlHelpers";

export const DEEPLINK_PROTOCOL = "proton-inbox";

export const checkDeepLinks = () => {
    app.setAsDefaultProtocolClient(DEEPLINK_PROTOCOL);
};

export enum DeepLinkActions {
    OpenMail = "open_mail",
    OpenCalendar = "open_calendar",
}

export const urlHasOpenMailParams = (url: string): boolean => {
    return url.includes("#labelID=") || url.includes("#elementID=");
};

const findDeepLink = (argv: string[], action: DeepLinkActions): string | undefined => {
    return argv.find(
        (value: string) =>
            value.startsWith(`${DEEPLINK_PROTOCOL}://${action}`) || value.startsWith(`${DEEPLINK_PROTOCOL}:${action}`),
    );
};

const parseOpenMailParams = (url: string): { labelID: string | undefined; elementID: string | undefined } => {
    const params = parseURLParams(url);
    return { labelID: params?.get("labelID") ?? undefined, elementID: params?.get("elementID") ?? undefined };
};

const handleOpenMail = (argv: string[]) => {
    const url = findDeepLink(argv, DeepLinkActions.OpenMail);
    if (!url) {
        return;
    }

    protocolLogger.log("open mail", argv);

    const urlLocalID = parseURLParams(url)?.get("localID");
    const currentLocalID = getCurrentLocalID();

    if (!urlLocalID) {
        protocolLogger.debug("Open mail notification doesn't contain localID");
    } else {
        if (urlLocalID !== currentLocalID) {
            protocolLogger.warn(
                `Skipping open_mail navigation: current localID ${currentLocalID} is different than notification localID ${urlLocalID}`,
            );
            // INDA-440: switch account.
            return;
        }
    }

    const { labelID, elementID } = parseOpenMailParams(url);

    openMail(labelID, elementID);
};

const handleOpenCalendar = (argv: string[]) => {
    const url = findDeepLink(argv, DeepLinkActions.OpenCalendar);
    if (!url) {
        return;
    }

    protocolLogger.log("open calendar", argv);
    openCalendar();
};

export const handleDeepLink = () => {
    app.on("second-instance", (_ev: Event, argv: string[]) => {
        handleOpenMail(argv);
        handleOpenCalendar(argv);
    });

    if (!isMac) {
        return;
    }

    app.on("open-url", (_ev: Event, url: string) => {
        handleOpenMail([url]);
        handleOpenCalendar([url]);
    });
};

const openMailArgs = new OneTimeArgument();
const openCalendarArgs = new OneTimeArgument();

export const handleStartupDeepLink = () => {
    const urlMail = findDeepLink(process.argv, DeepLinkActions.OpenMail);
    if (urlMail) {
        const { labelID, elementID } = parseOpenMailParams(urlMail);
        if (labelID && labelID !== "" && elementID && elementID !== "") {
            openMailArgs.setOnce(`labelID=${encodeURIComponent(labelID)}&elementID=${encodeURIComponent(elementID)}`);
        }
    }

    if (findDeepLink(process.argv, DeepLinkActions.OpenCalendar)) {
        openCalendarArgs.setOnce(`calendar`);
    }
};

export const readAndClearOpenMailArgs = (): string => openMailArgs.readAndClear();
export const readAndClearOpenCalendarArgs = (): string => openCalendarArgs.readAndClear();
