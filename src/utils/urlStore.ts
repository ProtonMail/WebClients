import Store from "electron-store";
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
    return (store.get("HardcodedUrls") as URLConfig) ?? hardcodedUrl;
};
