import Store from "electron-store";
import { URLConfig } from "../utils/config";

const store = new Store();

export const defaultAppURL: URLConfig = {
    account: "https://account.proton.me",
    mail: "https://mail.proton.me",
    calendar: "https://calendar.proton.me",
};

export const saveAppURL = () => {
    if (!store.has("appURL")) {
        store.set("appURL", defaultAppURL);
    }
};

export const getAppURL = (): URLConfig => {
    return (store.get("appURL") as URLConfig) ?? defaultAppURL;
};
