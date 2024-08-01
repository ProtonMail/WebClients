import Store from "electron-store";
import { z } from "zod";
import { getSettings, saveSettings } from "./settingsStore";
import { mainLogger } from "../utils/log";

const store = new Store();

const settings = getSettings();

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
    saveSettings({ ...settings, overrideError: false });
    if (!override) {
        return null;
    }

    try {
        return urlSchema.parse(override);
    } catch (error) {
        mainLogger.error("Invalid URL override", error);
        saveSettings({ ...settings, overrideError: true });

        return null;
    }
};

export const getAppURL = (): URLConfig => {
    const override = store.get("overrideURL");
    const validatedOverride = validateURL(override);

    return validatedOverride ?? defaultAppURL;
};
