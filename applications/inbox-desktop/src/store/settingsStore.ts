import Store from "electron-store";
import { SerializedTheme } from "../utils/themes";
import { settingsLogger } from "../utils/log";
import { RELEASE_CATEGORIES } from "@proton/shared/lib/constants";
import { Environment } from "@proton/shared/lib/interfaces/Environment";

const store = new Store<{ settings: SettingsStore }>({
    configFileMode: 0o600,
});

interface SettingsStore {
    spellChecker: boolean;
    overrideError: boolean;
    defaultMailto: boolean;
    theme?: SerializedTheme;
    releaseCategory?: RELEASE_CATEGORIES;
    rolloutProportion?: number;
}

const defaultSettings = {
    spellChecker: true,
    overrideError: false,
    defaultMailto: false,
    releaseCategory: RELEASE_CATEGORIES.STABLE,
    rolloutProportion: 1 - Math.random(),
} as const satisfies SettingsStore;

export const saveSettings = (settings: SettingsStore) => {
    settingsLogger.info("Settings saved", JSON.stringify(settings));
    store.set("settings", settings);
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
            settingsLogger.info("Some default values were missing, saving settings.");
            saveSettings(settings);
        }

        return settings;
    }

    settingsLogger.info("Settings not found, using default settings");
    return defaultSettings;
};

export function setReleaseCategory(targetEnv: Environment | undefined) {
    settingsLogger.info("Updating release category", targetEnv);
    const settings = getSettings();
    switch (targetEnv) {
        case "alpha":
            settings.releaseCategory = RELEASE_CATEGORIES.ALPHA;
            break;
        case "beta":
            settings.releaseCategory = RELEASE_CATEGORIES.EARLY_ACCESS;
            break;
        default:
            settings.releaseCategory = RELEASE_CATEGORIES.STABLE;
    }
    saveSettings(settings);
}
