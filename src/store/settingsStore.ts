import Logger from "electron-log";
import Store from "electron-store";
import { SerializedTheme } from "../utils/themes";
import { RELEASE_CATEGORIES, Environment } from "../constants";

const store = new Store<{ settings: SettingsStore }>({
    configFileMode: 0o600,
});

interface SettingsStore {
    spellChecker: boolean;
    overrideError: boolean;
    theme?: SerializedTheme;
    releaseCategory?: RELEASE_CATEGORIES;
    rolloutProportion?: number;
}

const defaultSettings = {
    spellChecker: true,
    overrideError: false,
    releaseCategory: RELEASE_CATEGORIES.STABLE,
    rolloutProportion: 1-Math.random(),
} as const satisfies SettingsStore;

export const saveSettings = (settings: SettingsStore) => {
    Logger.info("Settings saved", settings)
    store.set("settings", settings);
};

export const getSettings = (): SettingsStore => {
    const settings = store.get("settings");
    if (settings) {
        let saveDefaults = false

        if (!settings.releaseCategory) {
            settings.releaseCategory = defaultSettings.releaseCategory
            saveDefaults = true
        }

        if (!settings.rolloutProportion) {
            settings.rolloutProportion = defaultSettings.rolloutProportion
            saveDefaults = true
        }

        if (saveDefaults) {
            Logger.info("Some default values were missing, saving settings.")
            saveSettings(settings)
        }

        return settings;
    }

    Logger.info("Settings not found, using default settings");
    return defaultSettings;
};


export function setReleaseCategory(targetEnv: Environment | undefined) {
    Logger.info("Updating release cathegory", targetEnv);
    const settings = getSettings();
    settings.releaseCategory = targetEnv ? RELEASE_CATEGORIES.EARLY_ACCESS : RELEASE_CATEGORIES.STABLE
    saveSettings(settings)
}
