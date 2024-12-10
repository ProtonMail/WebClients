import { nativeTheme } from "electron";
import { getSettings, updateSettings } from "../store/settingsStore";
import {
    ColorScheme,
    electronAppTheme,
    getDarkThemes,
    isDesktopThemeType,
    PROTON_THEMES_MAP,
    ThemeModeSetting,
    ThemeSetting,
    ThemeTypes,
} from "@proton/shared/lib/themes/themes";
import { getMainWindow } from "./view/viewManagement";

export const SERIALIZED_THEME_MODE = {
    [ThemeModeSetting.Auto]: "auto",
    [ThemeModeSetting.Dark]: "dark",
    [ThemeModeSetting.Light]: "light",
} as const satisfies Record<ThemeModeSetting, string>;

export function getTheme(): ThemeSetting {
    const settings = getSettings();

    if (!settings.theme) {
        return electronAppTheme;
    }

    const theme = { ...electronAppTheme };

    if (settings.theme.Mode !== undefined) {
        theme.Mode = settings.theme.Mode;
    }

    const darkThemes = getDarkThemes();

    if (isDesktopThemeType(settings.theme.LightTheme) && !darkThemes.includes(settings.theme.LightTheme)) {
        theme.LightTheme = settings.theme.LightTheme;
    }

    if (isDesktopThemeType(settings.theme.DarkTheme) && darkThemes.includes(settings.theme.DarkTheme)) {
        theme.DarkTheme = settings.theme.DarkTheme;
    }

    if (settings.theme.FontFace !== undefined) {
        theme.FontFace = settings.theme.FontFace;
    }

    if (settings.theme.FontSize !== undefined) {
        theme.FontSize = settings.theme.FontSize;
    }

    if (settings.theme.Features !== undefined) {
        theme.Features = settings.theme.Features;
    }

    return theme;
}

export function updateNativeTheme(theme: ThemeSetting) {
    if (theme.Mode === ThemeModeSetting.Auto) {
        nativeTheme.themeSource = "system";
    } else if (theme.Mode === ThemeModeSetting.Light) {
        nativeTheme.themeSource = "light";
    } else if (theme.Mode === ThemeModeSetting.Dark) {
        nativeTheme.themeSource = "dark";
    }

    const mainWindow = getMainWindow();
    if (!mainWindow.isDestroyed()) {
        const themeColors = nativeTheme.shouldUseDarkColors
            ? PROTON_THEMES_MAP[ThemeTypes.Carbon]
            : PROTON_THEMES_MAP[ThemeTypes.Snow];
        mainWindow.setBackgroundColor(themeColors.themeColorMeta);
    }
}

export function getColorScheme() {
    return nativeTheme.shouldUseDarkColors ? ColorScheme.Dark : ColorScheme.Light;
}

export function setTheme(theme: ThemeSetting) {
    updateNativeTheme(theme);

    const darkThemes = getDarkThemes();

    const lightTheme =
        isDesktopThemeType(theme.LightTheme) && !darkThemes.includes(theme.LightTheme)
            ? theme.LightTheme
            : electronAppTheme.LightTheme;

    const darkTheme =
        isDesktopThemeType(theme.DarkTheme) && darkThemes.includes(theme.DarkTheme)
            ? theme.DarkTheme
            : electronAppTheme.DarkTheme;

    updateSettings({
        theme: {
            LightTheme: lightTheme,
            DarkTheme: darkTheme,
            Mode: theme.Mode,
            FontFace: theme.FontFace,
            FontSize: theme.FontSize,
            Features: theme.Features,
        },
    });
}

export function isEqualTheme(themeA: ThemeSetting, themeB: ThemeSetting) {
    return (
        themeA.Mode === themeB.Mode &&
        themeA.LightTheme === themeB.LightTheme &&
        themeA.DarkTheme === themeB.DarkTheme &&
        themeA.FontFace === themeB.FontFace &&
        themeA.FontSize === themeB.FontSize &&
        themeA.Features === themeB.Features
    );
}
