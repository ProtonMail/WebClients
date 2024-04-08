import { nativeTheme } from "electron";
import { getSettings, saveSettings } from "../store/settingsStore";

export enum ThemeTypes {
    Carbon = 1,
    Snow = 2,
}
export enum ThemeModeSetting {
    Auto,
    Dark,
    Light,
}
export type ThemeSetting = {
    Mode: ThemeModeSetting;
    LightTheme: ThemeTypes;
    DarkTheme: ThemeTypes;
};

const SERIALIZED_THEME_MODE = {
    [ThemeModeSetting.Auto]: "auto",
    [ThemeModeSetting.Dark]: "dark",
    [ThemeModeSetting.Light]: "light",
} as const satisfies Record<ThemeModeSetting, string>;

export type SerializedTheme = {
    mode?: (typeof SERIALIZED_THEME_MODE)[ThemeModeSetting];
};

const DEFAULT_THEME: ThemeSetting = {
    Mode: ThemeModeSetting.Auto,
    LightTheme: ThemeTypes.Snow,
    DarkTheme: ThemeTypes.Carbon,
};

export function getTheme() {
    const settings = getSettings();

    if (!settings.theme?.mode) {
        return DEFAULT_THEME;
    }

    switch (settings.theme.mode) {
        case "auto":
            return DEFAULT_THEME;
        case "dark":
            return { ...DEFAULT_THEME, Mode: ThemeModeSetting.Dark };
        case "light":
            return { ...DEFAULT_THEME, Mode: ThemeModeSetting.Light };
    }
}

export function setTheme(theme: ThemeSetting) {
    if (theme.Mode === ThemeModeSetting.Auto) {
        nativeTheme.themeSource = "system";
    } else {
        nativeTheme.themeSource = SERIALIZED_THEME_MODE[theme.Mode];
    }

    saveSettings({
        ...getSettings(),
        theme: { mode: SERIALIZED_THEME_MODE[theme.Mode] },
    });
}
