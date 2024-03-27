import Logger from "electron-log";
import Store from "electron-store";
import { SerializedTheme } from "../utils/themes";

const store = new Store();

interface SettingsStore {
    spellChecker: boolean;
    overrideError: boolean;
    theme?: SerializedTheme;
}

const defaultSettings: SettingsStore = {
    spellChecker: true,
    overrideError: false,
};

export const saveSettings = (settings: SettingsStore) => {
    store.set("settings", settings);
};

export const getSettings = (): SettingsStore => {
    const settings = store.get("settings");
    if (settings) {
        return settings as SettingsStore;
    }

    Logger.info("Settings not found, using default settings");
    return defaultSettings;
};
