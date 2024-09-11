import { nativeTheme } from "electron";
import { getSettings, saveSettings } from "../store/settingsStore";
import { ThemeModeSetting, ThemeTypes } from "@proton/shared/lib/themes/themes";
import { DesktopThemeSetting } from "@proton/shared/lib/desktop/desktopTypes";

const SERIALIZED_THEME_MODE = {
    [ThemeModeSetting.Auto]: "auto",
    [ThemeModeSetting.Dark]: "dark",
    [ThemeModeSetting.Light]: "light",
} as const satisfies Record<ThemeModeSetting, string>;

export type SerializedTheme = {
    LightTheme?: ThemeTypes;
    DarkTheme?: ThemeTypes;
    mode?: (typeof SERIALIZED_THEME_MODE)[ThemeModeSetting];
};

const DEFAULT_THEME: DesktopThemeSetting = {
    Mode: ThemeModeSetting.Auto,
    LightTheme: ThemeTypes.Snow,
    DarkTheme: ThemeTypes.Carbon,
};

export function getTheme() {
    const settings = getSettings();

    if (!settings.theme) {
        return DEFAULT_THEME;
    }

    const theme = { ...DEFAULT_THEME };

    switch (settings.theme.mode) {
        case "dark":
            theme.Mode = ThemeModeSetting.Dark;
            break;
        case "light":
            theme.Mode = ThemeModeSetting.Light;
            break;
        default:
            break;
    }

    if (settings.theme.LightTheme && settings.theme.LightTheme in ThemeTypes) {
        theme.LightTheme = settings.theme.LightTheme;
    }

    if (settings.theme.DarkTheme && settings.theme.DarkTheme in ThemeTypes) {
        theme.DarkTheme = settings.theme.DarkTheme;
    }

    return theme;
}

export function updateNativeTheme(theme: DesktopThemeSetting) {
    if (theme.Mode === ThemeModeSetting.Auto) {
        nativeTheme.themeSource = "system";
        const usedTheme = nativeTheme.shouldUseDarkColors ? theme.DarkTheme : theme.LightTheme;

        if (usedTheme === ThemeTypes.Snow) {
            nativeTheme.themeSource = "light";
        } else {
            nativeTheme.themeSource = "dark";
        }
    } else {
        nativeTheme.themeSource = SERIALIZED_THEME_MODE[theme.Mode];
    }
}

export function setTheme(theme: DesktopThemeSetting) {
    updateNativeTheme(theme);

    const lightTheme = theme.LightTheme in ThemeTypes ? theme.LightTheme : DEFAULT_THEME.LightTheme;
    const darkTheme = theme.DarkTheme in ThemeTypes ? theme.DarkTheme : DEFAULT_THEME.DarkTheme;

    saveSettings({
        ...getSettings(),
        theme: {
            LightTheme: lightTheme,
            DarkTheme: darkTheme,
            mode: SERIALIZED_THEME_MODE[theme.Mode],
        },
    });
}

export function isEqualTheme(themeA: DesktopThemeSetting, themeB: DesktopThemeSetting) {
    return (
        themeA.Mode === themeB.Mode && themeA.LightTheme === themeB.LightTheme && themeA.DarkTheme === themeB.DarkTheme
    );
}
