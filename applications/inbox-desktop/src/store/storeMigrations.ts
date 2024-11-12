import Store from "electron-store";
import { getSettings, updateSettings } from "./settingsStore";
import { SERIALIZED_THEME_MODE } from "../utils/themes";
import { electronAppTheme, ThemeModeSetting } from "@proton/shared/lib/themes/themes";

const store = new Store();

// Delete the old window store for a fresh start
const deleteWindowStore = () => {
    store.delete(`WindowsStore-MAIL`);
    store.delete(`WindowsStore-CALENDAR`);
};

// Delete URL store to increase security
const deleteURLStore = () => {
    store.delete("appURL");
    store.delete("HardcodedUrls");
};

// Delete the trialEnd store as it is not needed anymore
const deleteTrialEndStore = () => {
    store.delete("trialEnd");
};

// Delete settings.theme.mode as we are now saving the full theme
const deleteSerializedThemeMode = () => {
    const settings = getSettings();

    if (settings && settings.theme && "mode" in settings.theme) {
        let Mode = electronAppTheme.Mode;

        if (settings.theme.mode === SERIALIZED_THEME_MODE[ThemeModeSetting.Auto]) {
            Mode = ThemeModeSetting.Auto;
        } else if (settings.theme.mode === SERIALIZED_THEME_MODE[ThemeModeSetting.Light]) {
            Mode = ThemeModeSetting.Light;
        } else if (settings.theme.mode === SERIALIZED_THEME_MODE[ThemeModeSetting.Dark]) {
            Mode = ThemeModeSetting.Dark;
        }

        updateSettings({
            theme: {
                DarkTheme: settings.theme.DarkTheme,
                LightTheme: settings.theme.LightTheme,
                Mode,
                FontFace: settings.theme.FontFace,
                FontSize: settings.theme.FontSize,
                Features: settings.theme.Features,
            },
        });
    }
};

export const performStoreMigrations = () => {
    deleteWindowStore(); // Introduced in v0.9.4
    deleteURLStore(); // Introduced in v1.0.0
    deleteTrialEndStore(); // Introduced in v1.0.0
    deleteSerializedThemeMode(); // Introduced in v.1.2.4
};
