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
    account: "https://account.proton.local",
    mail: "https://mail.proton.local",
    calendar: "https://calendar.proton.local",
};

const devConfig: Config = {
    appTitle: "DEV - Proton",
    devTools: true,
    url: localUrls,
};

const prodConfig: Config = {
    appTitle: "Proton",
    devTools: false,
    url: getHardcodedURLs(),
};

export const getConfig = (isPackaged: boolean) => {
    return isPackaged ? prodConfig : devConfig;
};
