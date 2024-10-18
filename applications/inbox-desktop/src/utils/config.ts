import { type } from "os";

export const isBetaRelease = process.env.RELEASE === "beta";

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
            return [
                "./src/windows/uninstall.bat",
                "./src/utils/protocol/protonmail-mailto-register.reg",
                "./src/utils/protocol/protonmail-mailto-delete.reg",
                "./assets/icons/icon.ico",
            ];
        default:
            return [];
    }
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
