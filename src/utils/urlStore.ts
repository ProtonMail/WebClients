import Store from "electron-store";
import { URLConfig } from "./config";

const store = new Store();

export const hardcodedUrl: URLConfig = {
    account: "https://account.quimby.proton.pink",
    mail: "https://mail.quimby.proton.pink",
    calendar: "https://calendar.quimby.proton.pink",
};

export const saveHardcodedURLs = () => {
    if (!store.has("HardcodedUrls")) {
        store.set("HardcodedUrls", hardcodedUrl);
    }
};

export const getHardcodedURLs = (): URLConfig => {
    return (store.get("HardcodedUrls") as URLConfig) ?? hardcodedUrl;
};
