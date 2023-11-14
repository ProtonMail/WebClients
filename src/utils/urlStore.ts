import Store from "electron-store";
import { getSessionID } from "./authStore";
import { URLConfig } from "./config";

const store = new Store();

export const hardcodedUrl: URLConfig = {
    account: "https://account.proton.me",
    mail: "https://mail.proton.me",
    calendar: "https://calendar.proton.me",
};

export const saveHardcodedURLs = () => {
    if (!store.has("HardcodedUrls")) {
        store.set("HardcodedUrls", hardcodedUrl);
    }
};

export const getHardcodedURLs = (): URLConfig => {
    const sessionID = getSessionID();
    const urls = (store.get("HardcodedUrls") as URLConfig) ?? hardcodedUrl;
    if (sessionID) {
        return {
            account: `${urls.account}/u/${sessionID}/`,
            mail: `${urls.mail}/u/${sessionID}/`,
            calendar: `${urls.calendar}/u/${sessionID}/`,
        };
    }

    return urls;
};
