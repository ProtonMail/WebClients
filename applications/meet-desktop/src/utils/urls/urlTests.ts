import { getAppURL } from "../../store/urlStore";
import { mainLogger } from "../log";
import { GOOGLE_OAUTH_PATH } from "@proton/shared/lib/api/activation";

const sessionRegex = /(?!:\/u\/)(\d+)(?!:\/)/g;
export const getLocalID = (url?: string): string | null => {
    if (!url) {
        return null;
    }

    try {
        const pathName = new URL(url).pathname;

        const localID = pathName.match(sessionRegex)?.[0];

        if (!localID || isNaN(Number(localID))) {
            return null;
        }

        return localID;
    } catch (error) {
        mainLogger.error("getLocalID", error);
        return null;
    }
};

export const trimLocalID = (urlString: string) => {
    const url = new URL(urlString);
    url.pathname = url.pathname.replace(/^\/u\/\d+\/?/, "");
    return url.toString();
};

export const isMeet = (urlString: string) => {
    try {
        const url = new URL(urlString);
        return getAppURL().meet === url.origin;
    } catch (error) {
        return false;
    }
};

const isMeetHome = (urlString: string) => {
    try {
        const url = new URL(urlString);

        if (getAppURL().meet !== url.origin) {
            return false;
        }

        return /^\/u\/(\d+)\/?$/.test(url.pathname); // /u/0
    } catch (error) {
        return false;
    }
};

export const isHome = (urlString: string) => {
    return isMeetHome(urlString);
};

export const isAccount = (urlString: string) => {
    try {
        const url = new URL(urlString);
        return getAppURL().account === url.origin;
    } catch (error) {
        return false;
    }
};

export const isCalendar = (urlString: string) => {
    try {
        const url = new URL(urlString);
        // Check for both calendar.proton.me and calendar.proton.dev
        return url.hostname === "calendar.proton.me" || url.hostname === "calendar.proton.dev";
    } catch (error) {
        return false;
    }
};

export const isGoogleOAuthAuthorizationURL = (urlString: string) => {
    try {
        const url = new URL(urlString);

        const isAuthPath = url.pathname.startsWith(GOOGLE_OAUTH_PATH);

        return isAccount(urlString) && isAuthPath;
    } catch (error) {
        return false;
    }
};

export const isAccountAuthorize = (urlString: string) => {
    try {
        const url = new URL(urlString);

        if (getAppURL().account !== url.origin) {
            return false;
        }

        return /^\/authorize\/?$/i.test(url.pathname);
    } catch (error) {
        return false;
    }
};

export const isAccountSwitch = (urlString: string) => {
    try {
        const url = new URL(urlString);

        if (getAppURL().account !== url.origin) {
            return false;
        }

        return /^\/switch\/?$/i.test(url.pathname);
    } catch (error) {
        return false;
    }
};

export const isAccountLogin = (urlString: string) => {
    try {
        const url = new URL(urlString);

        if (getAppURL().account !== url.origin) {
            return false;
        }

        return /^\/login\/?$/i.test(url.pathname);
    } catch (error) {
        return false;
    }
};

export const isAccoutLite = (host: string) => {
    try {
        const hostURl = new URL(host);
        return hostURl.pathname.includes("/lite");
    } catch (error) {
        mainLogger.error("isAccoutLite", error);
        return false;
    }
};

export const isUpgradeURL = (host: string) => {
    try {
        const hostURL = new URL(host);
        return hostURL.pathname.includes("/upgrade") && hostURL.searchParams.size > 0;
    } catch (error) {
        mainLogger.error("isUpgradeURL", error);
        return false;
    }
};

export const isUpsellURL = (host: string) => {
    try {
        const hostURl = new URL(host);
        const plan = hostURl.searchParams.get("plan");
        const billing = hostURl.searchParams.get("billing");
        const currency = hostURl.searchParams.get("currency");
        const coupon = hostURl.searchParams.get("coupon");
        return hostURl.pathname.includes("/signup") && (plan || billing || currency || coupon);
    } catch (error) {
        mainLogger.error("isUpsellURL", error);
        return false;
    }
};

export const isHostAllowed = (host: string) => {
    try {
        const appURL = getAppURL();
        let finalURL = host;
        if (!finalURL.startsWith("https://")) {
            finalURL = "https://" + finalURL;
        }

        const hostURl = new URL(finalURL);

        return Object.values(appURL)
            .map((item) => new URL(item))
            .some((url) => {
                return url.host === hostURl.host;
            });
    } catch (error) {
        mainLogger.error("isHostAllowed", host, error);
        return false;
    }
};

export const isHomePage = (url: string) => {
    return isHome(url);
};

export const isSameURL = (urlA: string, urlB: string) => {
    if (urlA === urlB) {
        return true;
    }

    if (urlA.replace(/\/$/, "") === urlB.replace(/\/$/, "")) {
        return true;
    }

    return isHomePage(urlA) && isHomePage(urlB);
};
