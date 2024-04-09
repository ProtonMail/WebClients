import Logger from "electron-log";
import { getConfig } from "../config";

const sessionRegex = /(?!:\/u\/)(\d+)(?!:\/)/g;
export const getSessionID = (url?: string) => {
    if (!url) {
        return null;
    }

    try {
        const pathName = new URL(url).pathname;

        const sessionID = pathName.match(sessionRegex)?.[0];

        if (isNaN(Number(sessionID))) {
            return null;
        }

        return sessionID;
    } catch (error) {
        Logger.error("getSessionID", error);
        return null;
    }
};

export const isHostCalendar = (host: string) => {
    try {
        const urls = getConfig().url;
        const hostURl = new URL(host);

        return urls.calendar === hostURl.origin;
    } catch (error) {
        Logger.error("isHostCalendar", error);
        return false;
    }
};

export const isHostMail = (host: string) => {
    try {
        const urls = getConfig().url;
        const hostURl = new URL(host);

        return urls.mail === hostURl.origin;
    } catch (error) {
        Logger.error("isHostMail", error);
        return false;
    }
};

export const isHostAccount = (host: string) => {
    try {
        const urls = getConfig().url;
        const hostURl = new URL(host);

        return urls.account === hostURl.origin;
    } catch (error) {
        Logger.error("isHostAccount", error);
        return false;
    }
};

export const isAccoutLite = (host: string) => {
    try {
        const hostURl = new URL(host);
        return hostURl.pathname.includes("/lite");
    } catch (error) {
        Logger.error("isAccoutLite", error);
        return false;
    }
};

export const isUpgradeURL = (host: string) => {
    try {
        const hostURL = new URL(host);
        return hostURL.pathname.includes("/upgrade") && hostURL.searchParams.size > 0;
    } catch (error) {
        Logger.error("isUpgradeURL", error);
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
        Logger.error("isUpsellURL", error);
        return false;
    }
};

export const isHostAllowed = (host: string) => {
    try {
        const urls = getConfig().url;
        let finalURL = host;
        if (!finalURL.startsWith("https://")) {
            finalURL = "https://" + finalURL;
        }

        const hostURl = new URL(finalURL);

        return Object.values(urls)
            .map((item) => new URL(item))
            .some((url) => {
                return url.host === hostURl.host;
            });
    } catch (error) {
        Logger.error("isHostAllowed", error);
        return false;
    }
};
