import { nativeTheme } from "electron";
import { getSettings, saveSettings } from "../store/settingsStore";
import {
    ColorScheme,
    electronAppTheme,
    ThemeFeatureSetting,
    ThemeFontFaceSetting,
    ThemeFontSizeSetting,
    ThemeModeSetting,
    ThemeSetting,
} from "@proton/shared/lib/themes/themes";
import {
    DESKTOP_THEME_TYPES,
    DesktopThemeSetting,
    DesktopThemeType,
    isDesktopThemeType,
} from "@proton/shared/lib/desktop/desktopTypes";
import { clearBit, hasBit, setBit } from "@proton/shared/lib/helpers/bitset";

const SERIALIZED_THEME_MODE = {
    [ThemeModeSetting.Auto]: "auto",
    [ThemeModeSetting.Dark]: "dark",
    [ThemeModeSetting.Light]: "light",
} as const satisfies Record<ThemeModeSetting, string>;

const SERIALIZED_THEME_FONT_FACE = {
    [ThemeFontFaceSetting.ARIAL]: "arial",
    [ThemeFontFaceSetting.DEFAULT]: "default",
    [ThemeFontFaceSetting.DYSLEXIC]: "dyslexic",
    [ThemeFontFaceSetting.SYSTEM]: "system",
    [ThemeFontFaceSetting.TIMES]: "times",
} as const satisfies Record<ThemeFontFaceSetting, string>;

const SERIALIZED_THEME_FONT_SIZE = {
    [ThemeFontSizeSetting.DEFAULT]: "default",
    [ThemeFontSizeSetting.LARGE]: "large",
    [ThemeFontSizeSetting.SMALL]: "small",
    [ThemeFontSizeSetting.X_LARGE]: "x-large",
    [ThemeFontSizeSetting.X_SMALL]: "x-small",
} as const satisfies Record<ThemeFontSizeSetting, string>;

const SERIALIZED_THEME_FEATURES = [
    {
        enumIndex: ThemeFeatureSetting.ANIMATIONS_OFF,
        key: "animations-off",
    },
    {
        enumIndex: ThemeFeatureSetting.SCROLLBARS_OFF,
        key: "scrollbars-off",
    },
] as const satisfies Array<{ enumIndex: ThemeFeatureSetting; key: string }>;

type SerializedThemeFeature = (typeof SERIALIZED_THEME_FEATURES)[number];

let currentColorScheme: ColorScheme;

export type SerializedTheme = {
    LightTheme?: DesktopThemeType;
    DarkTheme?: DesktopThemeType;
    mode?: (typeof SERIALIZED_THEME_MODE)[ThemeModeSetting];
    FontFace?: (typeof SERIALIZED_THEME_FONT_FACE)[ThemeFontFaceSetting];
    FontSize?: (typeof SERIALIZED_THEME_FONT_SIZE)[ThemeFontSizeSetting];
    Features?: Partial<Record<SerializedThemeFeature["key"], boolean>>;
};

export function getTheme(): ThemeSetting {
    const settings = getSettings();

    if (!settings.theme) {
        return electronAppTheme;
    }

    const theme = { ...electronAppTheme };

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

    if (isDesktopThemeType(settings.theme.LightTheme)) {
        theme.LightTheme = settings.theme.LightTheme;
    }

    if (isDesktopThemeType(settings.theme.DarkTheme)) {
        theme.DarkTheme = settings.theme.DarkTheme;
    }

    switch (settings.theme.FontFace) {
        case "arial":
            theme.FontFace = ThemeFontFaceSetting.ARIAL;
            break;
        case "default":
            theme.FontFace = ThemeFontFaceSetting.DEFAULT;
            break;
        case "dyslexic":
            theme.FontFace = ThemeFontFaceSetting.DYSLEXIC;
            break;
        case "system":
            theme.FontFace = ThemeFontFaceSetting.SYSTEM;
            break;
        case "times":
            theme.FontFace = ThemeFontFaceSetting.TIMES;
            break;
        default:
            break;
    }

    switch (settings.theme.FontSize) {
        case "large":
            theme.FontSize = ThemeFontSizeSetting.LARGE;
            break;
        case "default":
            theme.FontSize = ThemeFontSizeSetting.DEFAULT;
            break;
        case "small":
            theme.FontSize = ThemeFontSizeSetting.SMALL;
            break;
        case "x-large":
            theme.FontSize = ThemeFontSizeSetting.X_LARGE;
            break;
        case "x-small":
            theme.FontSize = ThemeFontSizeSetting.X_SMALL;
            break;
        default:
            break;
    }

    if (settings.theme.Features) {
        for (const { key, enumIndex } of SERIALIZED_THEME_FEATURES) {
            if (key in settings.theme.Features) {
                if (settings.theme.Features[key]) {
                    theme.Features = setBit(theme.Features, enumIndex);
                } else {
                    theme.Features = clearBit(theme.Features, enumIndex);
                }
            }
        }
    }

    return theme;
}

export function updateNativeTheme(theme: ThemeSetting | DesktopThemeSetting) {
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

    const serializedFeatures: SerializedTheme["Features"] = {};

    for (const { key, enumIndex } of SERIALIZED_THEME_FEATURES) {
        if (hasBit(theme.Features, enumIndex)) {
            serializedFeatures[key] = true;
        } else {
            serializedFeatures[key] = false;
        }
    }

    saveSettings({
        ...getSettings(),
        theme: {
            LightTheme: lightTheme,
            DarkTheme: darkTheme,
            mode: SERIALIZED_THEME_MODE[theme.Mode],
            FontFace: SERIALIZED_THEME_FONT_FACE[theme.FontFace],
            FontSize: SERIALIZED_THEME_FONT_SIZE[theme.FontSize],
            Features: serializedFeatures,
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
