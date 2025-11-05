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
        return "Proton Meet Beta";
    }
    return "Proton Meet";
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
            return [...commonResources];
        case "Windows_NT":
            return [
                ...commonResources,
                "./src/windows/uninstall.bat",
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
                "meet.proton.me": { ...transportSecuirityException },
                "account.proton.me": { ...transportSecuirityException },
            },
        },
        NSCameraUsageDescription: "Proton Meet needs access to your camera for video calls.",
        NSMicrophoneUsageDescription: "Proton Meet needs access to your microphone for audio calls.",
        NSScreenCaptureUsageDescription: "Proton Meet needs access to your screen for screen sharing during meetings.",
    };
};
