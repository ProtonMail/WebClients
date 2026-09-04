import { PROTON_LOCAL_DOMAIN } from "@proton/shared/lib/localDev";
import { app } from "electron";
import Store from "electron-store";
import { z } from "zod";
import { mainLogger } from "../utils/log";
import { updateSettings } from "./settingsStore";

const BASE_LOCAL_URL = process.env.BASE_LOCAL_URL || PROTON_LOCAL_DOMAIN;
const localUrls = {
    account: `https://account.${BASE_LOCAL_URL}`,
    mail: `https://mail.${BASE_LOCAL_URL}`,
    calendar: `https://calendar.${BASE_LOCAL_URL}`,
};

const store = new Store({
    configFileMode: 0o600,
});

const ALLOWED_HOSTNAME_PATTERNS: Record<string, RegExp> = {
    account: /^account\.(?:[a-z0-9-]+\.)?proton\.(?:black|pink)$|^account\.proton\.(?:me|dev)$/,
    mail: /^mail\.(?:[a-z0-9-]+\.)?proton\.(?:black|pink)$|^mail\.proton\.(?:me|dev)$/,
    calendar: /^calendar\.(?:[a-z0-9-]+\.)?proton\.(?:black|pink)$|^calendar\.proton\.(?:me|dev)$/,
};

const urlValidators = (subdomain: string) => {
    const hostnamePattern = ALLOWED_HOSTNAME_PATTERNS[subdomain];

    return z
        .string()
        .url()
        .refine((value) => {
            try {
                const url = new URL(value);
                return url.protocol === "https:" && hostnamePattern.test(url.hostname);
            } catch {
                return false;
            }
        }, "Override hostname is not an allowed Proton domain")
        .refine((value) => !value.endsWith("/"));
};

const urlSchema = z.object({
    account: urlValidators("account"),
    mail: urlValidators("mail"),
    calendar: urlValidators("calendar"),
});

export type URLConfig = z.infer<typeof urlSchema>;

export const defaultAppURL: URLConfig = {
    account: "https://account.proton.me",
    mail: "https://mail.proton.me",
    calendar: "https://calendar.proton.me",
};

const validateURL = (override?: unknown): null | URLConfig => {
    updateSettings({ overrideError: false });
    if (!override) {
        return null;
    }

    try {
        return urlSchema.parse(override);
    } catch (error) {
        mainLogger.error("Invalid URL override", error);
        updateSettings({ overrideError: true });

        return null;
    }
};

export const getAppURL = (): URLConfig => {
    const isPlaywrightTest = process.env.PLAYWRIGHT_TEST === "true";

    if ((!app.isPackaged || isPlaywrightTest) && process.env.BASE_LOCAL_URL) {
        return localUrls;
    }

    const overrideURLString = store.get("overrideURL");
    const overrideURL = validateURL(overrideURLString);

    if (overrideURL) {
        return overrideURL;
    }

    return defaultAppURL;
};
