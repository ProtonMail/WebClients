import Store from "electron-store";
import { settingsLogger } from "../utils/log";
import { RELEASE_CATEGORIES } from "@proton/shared/lib/constants";
import { Environment } from "@proton/shared/lib/interfaces/Environment";

const store = new Store<{ settings: SettingsStore }>({
    configFileMode: 0o600,
});

export interface SettingsStore {
    overrideError: boolean;
    releaseCategory?: RELEASE_CATEGORIES;
    rolloutProportion?: number;
}

const defaultSettings = {
    overrideError: false,
    releaseCategory: RELEASE_CATEGORIES.STABLE,
    rolloutProportion: 1 - Math.random(),
} as const satisfies SettingsStore;

export const updateSettings = (settings: Partial<SettingsStore>) => {
    const oldSettings = getSettings();
    const settingsChanged = Array.from(Object.keys(settings) as Array<keyof SettingsStore>).some(
        (key) => settings[key] !== oldSettings[key],
    );

    if (!settingsChanged) {
        return;
    }

    store.set("settings", { ...oldSettings, ...settings });
};

export const getSettings = (): SettingsStore => {
    const settings = store.get("settings");

    if (settings) {
        let saveDefaults = false;

        if (!settings.releaseCategory) {
            settings.releaseCategory = defaultSettings.releaseCategory;
            saveDefaults = true;
        }

        if (!settings.rolloutProportion) {
            settings.rolloutProportion = defaultSettings.rolloutProportion;
            saveDefaults = true;
        }

        if (saveDefaults) {
            settingsLogger.info("Some default values were missing, saving settings", JSON.stringify(settings));
            store.set("settings", settings);
        }

        return settings;
    }

    store.set("settings", defaultSettings);
    return defaultSettings;
};

export function setReleaseCategory(targetEnv: Environment | undefined) {
    settingsLogger.info("Updating release category", targetEnv);
    let releaseCategory = RELEASE_CATEGORIES.STABLE;
    switch (targetEnv) {
        case "alpha":
            releaseCategory = RELEASE_CATEGORIES.ALPHA;
            break;
        case "beta":
            releaseCategory = RELEASE_CATEGORIES.EARLY_ACCESS;
            break;
        default:
            releaseCategory = RELEASE_CATEGORIES.STABLE;
    }
    updateSettings({ releaseCategory });
}
