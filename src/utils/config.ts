import { app } from "electron";
import { type } from "os";
import { getAppURL } from "../store/urlStore";

export interface URLConfig {
    account: string;
    mail: string;
    calendar: string;
}

interface Config {
    appTitle: string;
    url: URLConfig;
}

export const isBetaRelease = process.env.RELEASE === "beta";

const localUrls = {
    account: "https://account.proton.local",
    mail: "https://mail.proton.local",
    calendar: "https://calendar.proton.local",
};

const devConfig: Config = {
    appTitle: "DEV - Proton",
    url: localUrls,
};

const prodConfig: Config = {
    appTitle: "Proton",
    url: getAppURL(),
};

export const getConfig = () => {
    return app.isPackaged ? prodConfig : devConfig;
};

export const getIco = () => {
    if (isBetaRelease) {
        return "icon-beta.ico";
    }
    return "icon.ico";
};

export const getIcon = () => {
    if (isBetaRelease) {
        return "icon-beta";
    }
    return "icon";
};

export const getName = () => {
    if (isBetaRelease) {
        return "Proton Mail Beta";
    }
    return "Proton Mail";
};

export const getExtraResource = () => {
    if (type() === "Darwin") {
        return ["./src/macos/Uninstall Proton Mail.app", "./src/macos/uninstall.sh"];
    }
    return [];
};

export const isProdEnv = (config: Config) => {
    return config.url.account.endsWith("proton.me");
};
