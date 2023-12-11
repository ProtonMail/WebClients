import { createHash, randomUUID } from "crypto";
import log from "electron-log";
import Store from "electron-store";

const store = new Store();

export const saveAppID = () => {
    if (!store.has("")) {
        generateAppID().then((appID) => {
            store.set("appID", appID);
        });
    }
};

export const generateAppID = async () => {
    const id = randomUUID();
    const hash = createHash("sha256").update(id).digest("hex");
    const distribution = parseInt(hash, 16) / Math.pow(2, 256);

    const appID = {
        id,
        hash,
        distribution,
    };

    log.info("AppID generated", appID);
    return appID;
};
