import { PROTON_LOCAL_DOMAIN } from "@proton/shared/lib/localDev";
import Store from "electron-store";
import { z } from "zod";
import { mainLogger } from "../utils/log";
import { updateSettings } from "./settingsStore";

const BASE_LOCAL_URL = process.env.BASE_LOCAL_URL || PROTON_LOCAL_DOMAIN;
const localUrls = {
    account: `https://account.${BASE_LOCAL_URL}`,
    meet: `https://meet.${BASE_LOCAL_URL}`,
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
    meet: urlValidators("meet"),
});

export type URLConfig = z.infer<typeof urlSchema>;

export const defaultAppURL: URLConfig = {
    account: "https://account.proton.me",
    meet: "https://meet.proton.me",
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
