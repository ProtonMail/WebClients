import Logger from "electron-log";
import Store from "electron-store";
import { z } from "zod";

const store = new Store();

const urlSchema = z.object({
    account: z.string().url().includes("account").includes("proton"),
    mail: z.string().url().includes("mail").includes("proton"),
    calendar: z.string().url().includes("calendar").includes("proton"),
});

export type URLConfig = z.infer<typeof urlSchema>;

export const defaultAppURL: URLConfig = {
    account: "https://account.proton.me",
    mail: "https://mail.proton.me",
    calendar: "https://calendar.proton.me",
};

const validateURL = (override?: unknown): null | URLConfig => {
    if (!override) {
        return null;
    }

    try {
        return urlSchema.parse(override);
    } catch (error) {
        Logger.error("Invalid URL override", error);
        return null;
    }
};

export const getAppURL = (): URLConfig => {
    const override = store.get("overrideURL");
    const validatedOverride = validateURL(override);

    return validatedOverride ?? defaultAppURL;
};
