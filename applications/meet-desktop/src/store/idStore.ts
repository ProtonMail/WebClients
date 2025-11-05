import { createHash, randomUUID } from "node:crypto";
import Store from "electron-store";
import { mainLogger } from "../utils/log";
import { z } from "zod";

const store = new Store<{ appID: AppID }>();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const appIDSchema = z.object({
    id: z.string(),
    hash: z.string(),
    distribution: z.number(),
});

type AppID = z.infer<typeof appIDSchema>;

export const saveAppID = async () => {
    if (!store.has("appID")) {
        const appID = await generateAppID();
        store.set("appID", appID);
    }
};

export const generateAppID = async () => {
    const id = randomUUID();
    const hash = createHash("sha256").update(id).digest("hex");
    const distribution = parseInt(hash, 16) / Math.pow(2, 256);

    const appID: AppID = {
        id,
        hash,
        distribution,
    };

    mainLogger.info("AppID generated", appID);
    return appID;
};

export const getAppID = async () => {
    await saveAppID();
    return store.get("appID");
};
