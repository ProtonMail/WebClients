import log from "electron-log/main";
import Store from "electron-store";
import { SESSION_ID_KEY } from "./constants";

const store = new Store();
const storeKey = SESSION_ID_KEY;

export const getSessionID = () => {
    const storedData = store.get(storeKey);
    return storedData;
};

export const setSessionID = (sessionNumber: string) => {
    store.set(storeKey, sessionNumber);
};

export const manageSessionIDStore = (url: string) => {
    try {
        const pathName = new URL(url).pathname;
        const sessionID = pathName
            .split("/")
            .filter((item) => item !== "")
            .slice(-1)[0];

        if (sessionID && !isNaN(sessionID as unknown as any)) {
            setSessionID(sessionID);
        }
    } catch (error) {
        log.error(error);
    }
};
