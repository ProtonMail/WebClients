import { nativeTheme } from "electron";
import { getSettings, saveSettings } from "../store/settingsStore";
import {
    ColorScheme,
    DESKTOP_THEME_TYPES,
    electronAppTheme,
    isDesktopThemeType,
    ThemeModeSetting,
    ThemeSetting,
} from "@proton/shared/lib/themes/themes";

export const SERIALIZED_THEME_MODE = {
    [ThemeModeSetting.Auto]: "auto",
    [ThemeModeSetting.Dark]: "dark",
    [ThemeModeSetting.Light]: "light",
} as const satisfies Record<ThemeModeSetting, string>;

let currentColorScheme: ColorScheme;

export function getTheme(): ThemeSetting {
    const settings = getSettings();

    if (!settings.theme) {
        return electronAppTheme;
    }

    const theme = { ...electronAppTheme };

    if (settings.theme.Mode !== undefined) {
        theme.Mode = settings.theme.Mode;
    }

    if (isDesktopThemeType(settings.theme.LightTheme)) {
        theme.LightTheme = settings.theme.LightTheme;
    }

    if (isDesktopThemeType(settings.theme.DarkTheme)) {
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
        const usedTheme = getColorScheme() === ColorScheme.Dark ? theme.DarkTheme : theme.LightTheme;

        if (usedTheme === DESKTOP_THEME_TYPES.Snow) {
            nativeTheme.themeSource = "light";
        } else {
            nativeTheme.themeSource = "dark";
        }
    } else {
        nativeTheme.themeSource = SERIALIZED_THEME_MODE[theme.Mode];
    }
}

export function getColorScheme() {
    const previousThemeSource = nativeTheme.themeSource;
    nativeTheme.themeSource = "system";
    const colorScheme = nativeTheme.shouldUseDarkColors ? ColorScheme.Dark : ColorScheme.Light;
    nativeTheme.themeSource = previousThemeSource;
    return colorScheme;
}

export function observeNativeTheme() {
    const addListener = () => {
        // There's a delay between the themeSource assignment and the triggered 'updated' event.
        // We need to add some delay here before re-adding the theme change listener.
        // This introduces a limitation: if user changes the OS color scheme multiple times
        // in less than a second, the app won't be able to catch that change.
        setTimeout(() => {
            nativeTheme.addListener("updated", onNativeThemeUpdate);
        }, 1000);
    };

    const onNativeThemeUpdate = () => {
        if (nativeTheme.themeSource === "system") {
            return;
        }

        // When cheking the existing color scheme we need to accidentally trigger
        // the 'update' event when assigning 'system' to themeSource.
        nativeTheme.removeListener("updated", onNativeThemeUpdate);

        const colorScheme = getColorScheme();

        if (colorScheme === currentColorScheme) {
            addListener();
            return;
        }

        currentColorScheme = colorScheme;
        updateNativeTheme(getTheme());
        addListener();
    };

    addListener();
}

export function setTheme(theme: ThemeSetting) {
    updateNativeTheme(theme);

    const lightTheme = isDesktopThemeType(theme.LightTheme) ? theme.LightTheme : electronAppTheme.LightTheme;
    const darkTheme = isDesktopThemeType(theme.DarkTheme) ? theme.DarkTheme : electronAppTheme.DarkTheme;

    saveSettings({
        ...getSettings(),
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
