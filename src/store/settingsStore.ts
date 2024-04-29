import Logger from "electron-log";
import Store from "electron-store";
import { SerializedTheme } from "../utils/themes";

const store = new Store<{ settings: SettingsStore }>({
    configFileMode: 0o600,
});

interface SettingsStore {
    spellChecker: boolean;
    overrideError: boolean;
    theme?: SerializedTheme;
}

const defaultSettings = {
    spellChecker: true,
    overrideError: false,
} as const satisfies SettingsStore;

export const saveSettings = (settings: SettingsStore) => {
    store.set("settings", settings);
};

export const getSettings = (): SettingsStore => {
    const settings = store.get("settings");
    if (settings) {
        return settings;
    }

    Logger.info("Settings not found, using default settings");
    return defaultSettings;
};
