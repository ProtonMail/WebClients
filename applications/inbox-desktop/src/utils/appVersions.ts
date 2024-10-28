import { app } from "electron";
import { AppVersion } from "@proton/shared/lib/desktop/DesktopVersion";
import { utilsLogger } from "./log";
import { type APP_NAMES, APPS } from "@proton/shared/lib/constants";

const usedAppVersions: Partial<Record<APP_NAMES, string>> = {};

export const getAllAppVersions = (): string => {
    const appVersions: string[] = [];

    Object.entries(usedAppVersions).forEach(([key, value]) => {
        if (!value) return;

        const abbrev: string = (() => {
            if (key === APPS.PROTONMAIL) return "M";
            if (key === APPS.PROTONCALENDAR) return "C";
            if (key === APPS.PROTONACCOUNT) return "A";

            // It should not happen. If it does, we need to know Y.
            return "Y";
        })();

        appVersions.push(`${abbrev} ${value}`);
    });

    return `${app.getVersion()} (${appVersions.join(" / ")})`;
};

export const storeAppVersion = (appVersion: AppVersion): void => {
    utilsLogger.info(`Application loaded: ${appVersion.name}@${appVersion.version}`);

    usedAppVersions[appVersion.name] = appVersion.version;

    utilsLogger.debug("Current versions are:", getAllAppVersions());
};
