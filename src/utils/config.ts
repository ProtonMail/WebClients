import { getHardcodedURLs } from "./urlStore";

export interface URLConfig {
    account: string;
    mail: string;
    calendar: string;
}

interface Config {
    appTitle: string;
    devTools: boolean;
    url: URLConfig;
}

const localUrls = {
    account: "https://account.proton.me",
    mail: "https://mail.proton.me",
    calendar: "https://calendar.proton.me",
};

const devConfig: Config = {
    appTitle: "DEV - Proton",
    devTools: true,
    url: localUrls,
};

const prodConfig: Config = {
    appTitle: "Proton",
    devTools: true, // TODO set to false for the beta
    url: getHardcodedURLs(),
};

export const getConfig = (isPackaged: boolean) => {
    return isPackaged ? prodConfig : devConfig;
};
