import Store from "electron-store";
import { z } from "zod";
import { updateSettings } from "./settingsStore";
import { mainLogger } from "../utils/log";

const BASE_LOCAL_URL = process.env.BASE_LOCAL_URL || "proton.local";
const localUrls = {
    account: `https://account.${BASE_LOCAL_URL}`,
    mail: `https://mail.${BASE_LOCAL_URL}`,
    calendar: `https://calendar.${BASE_LOCAL_URL}`,
};

const store = new Store();

const urlValidators = (subdomain: string) => {
    return z
        .string()
        .url()
        .includes(subdomain)
        .includes("proton")
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
    if (process.env.BASE_LOCAL_URL) {
        return localUrls;
    }

    const overrideURLString = store.get("overrideURL");
    const overrideURL = validateURL(overrideURLString);

    if (overrideURL) {
        return overrideURL;
    }

    return defaultAppURL;
};
