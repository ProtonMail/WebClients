import Store from "electron-store";
import { getSettings, updateSettings } from "./settingsStore";

const store = new Store();

// Delete URL store to increase security
const deleteURLStore = () => {
    store.delete("appURL");
    store.delete("HardcodedUrls");
};

// Delete old theme settings (Meet uses hard-coded dark theme)
const deleteThemeSettings = () => {
    store.delete("theme");
};

// We want to have app cache enabled by default
const enableAppCache = () => {
    const { appCacheEnabled } = getSettings();

    if (appCacheEnabled === undefined) {
        updateSettings({ appCacheEnabled: true });
    }
};

export const performStoreMigrations = () => {
    deleteURLStore(); // Introduced in v1.0.0
    deleteThemeSettings(); // Meet uses hard-coded dark theme
    enableAppCache(); // Introduced in v1.9.0
};
