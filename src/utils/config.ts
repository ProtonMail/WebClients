import { app } from "electron";
import { type } from "os";
import { URLConfig, getAppURL } from "../store/urlStore";

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
        return ["./src/macos/Proton Mail Uninstaller.app", "./src/macos/uninstall.sh"];
    }
    return [];
};

export const isProdEnv = (config: Config) => {
    return config.url.account.endsWith("proton.me");
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
