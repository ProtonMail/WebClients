import Store from "electron-store";
import { getSettings, updateSettings } from "./settingsStore";
import { SERIALIZED_THEME_MODE } from "../utils/themes";
import {
    electronAppTheme,
    getDarkThemes,
    ThemeModeSetting,
    ThemeSetting,
    ThemeTypes,
} from "@proton/shared/lib/themes/themes";
import { setShouldCheckDefaultMailtoApp } from "../utils/protocol/default";
import { loadDefaultProtocol } from "../utils/protocol/store";
import { mainLogger } from "../utils/log";
import { DESKTOP_FEATURES } from "../ipc/ipcConstants";

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

// Force using a light theme for day and dark theme for night
const forceLightAndDarkThemes = () => {
    let { theme } = getSettings();

    if (!theme) {
        return;
    }

    const updateTheme = (updatedTheme: Partial<ThemeSetting>) => {
        updateSettings({ theme: { ...theme, ...updatedTheme } });
        theme = getSettings().theme;
    };

    const darkThemes = getDarkThemes();
    const isAutoTheme = theme.Mode === undefined || theme.Mode === ThemeModeSetting.Auto;

    if (isAutoTheme && theme.LightTheme && theme.DarkTheme && theme.LightTheme === theme.DarkTheme) {
        if (darkThemes.includes(theme.LightTheme)) {
            updateTheme({ Mode: ThemeModeSetting.Dark, LightTheme: ThemeTypes.Snow, DarkTheme: ThemeTypes.Carbon });
        } else {
            updateTheme({ Mode: ThemeModeSetting.Light, LightTheme: ThemeTypes.Snow, DarkTheme: ThemeTypes.Carbon });
        }
    }

    if (theme.LightTheme && darkThemes.includes(theme.LightTheme)) {
        updateTheme({ LightTheme: ThemeTypes.Snow });
    }

    if (theme.DarkTheme && !darkThemes.includes(theme.DarkTheme)) {
        updateTheme({ DarkTheme: ThemeTypes.Carbon });
    }
};

// We start asking to set app as default mail client from this point
const checkDefaultMailClient = () => {
    if (!DESKTOP_FEATURES.MailtoUpdate) {
        return;
    }

    const defaultMailto = loadDefaultProtocol("mailto");

    if (!defaultMailto.canUpdateDefault) {
        mainLogger.info("Enable check default mail to app");
        setShouldCheckDefaultMailtoApp(true);
    }
};

export const performStoreMigrations = () => {
    deleteWindowStore(); // Introduced in v0.9.4
    deleteURLStore(); // Introduced in v1.0.0
    deleteTrialEndStore(); // Introduced in v1.0.0
    deleteSerializedThemeMode(); // Introduced in v1.2.4
    forceLightAndDarkThemes(); // Introduced in v1.6.0
    checkDefaultMailClient(); // Introduced in v1.6.2
};
