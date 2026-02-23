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
    const commonResources = [
        "./assets/proton-spinner.svg",
        "./assets/loading.html",
        "./assets/error-network.html",
        "../../packages/styles/assets/img/errors/error-network.svg",
    ];

    switch (type()) {
        case "Darwin":
            return [
                ...commonResources,
                "./src/macos/Proton Mail Uninstaller.app",
                "./src/macos/uninstall.sh",
                "./assets/macos/tahoe-icon/Assets.car",
            ];
        case "Windows_NT":
            return [
                ...commonResources,
                "./src/windows/uninstall.bat",
                "./src/utils/protocol/protonmail-mailto-register.reg",
                "./src/utils/protocol/protonmail-mailto-delete.reg",
                "./assets/icons/icon.ico",
            ];
        default:
            return commonResources;
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
