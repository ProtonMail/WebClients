import { app } from "electron";
import { AppVersion } from "@proton/shared/lib/desktop/DesktopVersion";
import { utilsLogger } from "./log";

const usedAppVersions: {
    M: string;
    C: string;
    A: string;
} = {
    M: "",
    C: "",
    A: "",
};

export const getAllAppVersions = (): string => {
    const appVersions: string[] = [];

    Object.entries(usedAppVersions).forEach(([key, value]) => {
        if (!value) return;

        appVersions.push(`${key} ${value}`);
    });

    return `${app.getVersion()} (${appVersions.join(" / ")})`;
};

export const storeAppVersion = (appVersion: AppVersion): void => {
    utilsLogger.info(`Application loaded: ${appVersion.name}@${appVersion.version}`);

    switch (appVersion.name) {
        case "proton-mail":
            usedAppVersions.M = appVersion.version;
            break;
        case "proton-calendar":
            usedAppVersions.C = appVersion.version;
            break;
        case "proton-account":
            usedAppVersions.A = appVersion.version;
            break;
        default:
            utilsLogger.warn(`Unexpected app loaded: ${appVersion.name}@${appVersion.version}`);
    }

    utilsLogger.debug("Current versions are:", getAllAppVersions());
};
