import { app } from "electron";
import { type } from "os";
import { URLConfig, getAppURL } from "../store/urlStore";

interface Config {
    appTitle: string;
    url: URLConfig;
}

export const isBetaRelease = process.env.RELEASE === "beta";
const BASE_LOCAL_URL = process.env.BASE_LOCAL_URL || "proton.local";

const localUrls = {
    account: `https://account.${BASE_LOCAL_URL}`,
    mail: `https://mail.${BASE_LOCAL_URL}`,
    calendar: `https://calendar.${BASE_LOCAL_URL}`,
};

const devConfig: Config = {
    appTitle: "Proton Mail",
    url: localUrls,
};

const prodConfig: Config = {
    appTitle: "Proton Mail",
    url: getAppURL(),
};

export const getConfig = () => {
    if (app) {
        return app.isPackaged ? prodConfig : devConfig;
    } else {
        return process.env.NODE_ENV === "development" ? devConfig : prodConfig;
    }
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
    switch (type()) {
        case "Darwin":
            return ["./src/macos/Proton Mail Uninstaller.app", "./src/macos/uninstall.sh"];
        case "Windows_NT":
            return ["./src/windows/uninstall.bat"];
        default:
            return [];
    }
};

export const isProdEnv = (): boolean => {
    if (app && !app.isPackaged) {
        return false;
    }

    return getConfig().url.account.endsWith("proton.me");
};

const transportSecuirityException = {
    NSExceptionAllowsInsecureHTTPLoads: false,
    NSIncludesSubdomains: true,
    NSThirdPartyExceptionRequiresForwardSecrecy: false,
    NSThirdPartyExceptionAllowsInsecureHTTPLoads: false,
};

export const getAppTransportSecuity = () => {
    return {
        NSAppTransportSecurity: {
            NSAllowsArbitraryLoads: true,
            NSExceptionDomains: {
                "update.electronjs.org": { ...transportSecuirityException },
                "proton.me": { ...transportSecuirityException },
                "mail.proton.me": { ...transportSecuirityException },
                "account.proton.me": { ...transportSecuirityException },
                "calendar.proton.me": { ...transportSecuirityException },
            },
        },
    };
};
