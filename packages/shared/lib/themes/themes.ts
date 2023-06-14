import { c } from 'ttag';

// @ts-ignore
import carbonTheme from '@proton/colors/themes/dist/carbon.theme.css';
// @ts-ignore
import classicTheme from '@proton/colors/themes/dist/classic.theme.css';
// @ts-ignore
import contrastDarkTheme from '@proton/colors/themes/dist/contrast-dark.theme.css';
// @ts-ignore
import contrastLightTheme from '@proton/colors/themes/dist/contrast-light.theme.css';
// @ts-ignore
import duotoneTheme from '@proton/colors/themes/dist/duotone.theme.css';
// @ts-ignore
import legacyTheme from '@proton/colors/themes/dist/legacy.theme.css';
// @ts-ignore
import monokaiTheme from '@proton/colors/themes/dist/monokai.theme.css';
// @ts-ignore
import passTheme from '@proton/colors/themes/dist/pass.theme.css';
// @ts-ignore
import snowTheme from '@proton/colors/themes/dist/snow.theme.css';
import { decodeBase64URL, encodeBase64URL } from '@proton/shared/lib/helpers/encoding';

export enum ThemeTypes {
    Duotone = 0,
    Carbon = 1,
    Snow = 2,
    Monokai = 3,
    ContrastLight = 4,
    Legacy = 5,
    Classic = 6,
    ContrastDark = 7,
    Pass = 8,
}

export const PROTON_DEFAULT_THEME = ThemeTypes.Duotone;

export const PROTON_THEMES_MAP = {
    [ThemeTypes.Duotone]: {
        label: 'Proton',
        identifier: ThemeTypes.Duotone,
        thumbColors: {
            prominent: '#4C399D',
            standard: '#ffffff',
            primary: '#936DFF',
            weak: '#9288c2',
        },
        theme: duotoneTheme.toString(),
    },
    [ThemeTypes.Carbon]: {
        label: 'Carbon',
        identifier: ThemeTypes.Carbon,
        thumbColors: {
            prominent: '#16141C',
            standard: '#2A2833',
            primary: '#6D4AFF',
            weak: '#6c6b70',
        },
        theme: carbonTheme.toString(),
    },
    [ThemeTypes.Monokai]: {
        label: 'Monokai',
        identifier: ThemeTypes.Monokai,
        thumbColors: {
            prominent: '#13151A',
            standard: '#262A33',
            primary: '#E64663',
            weak: '#776f7e',
        },
        theme: monokaiTheme.toString(),
    },
    [ThemeTypes.Snow]: {
        label: 'Snow',
        identifier: ThemeTypes.Snow,
        thumbColors: {
            prominent: '#FAF9F7',
            standard: '#ffffff',
            primary: '#6D4AFF',
            weak: '#bebbb8',
        },
        theme: snowTheme.toString(),
    },
    [ThemeTypes.ContrastLight]: {
        label: 'Ivory',
        identifier: ThemeTypes.ContrastLight,
        thumbColors: {
            prominent: '#F5F5F5',
            standard: '#ffffff',
            primary: '#4630A6',
            weak: '#313131',
        },
        theme: contrastLightTheme.toString(),
    },
    [ThemeTypes.ContrastDark]: {
        label: 'Ebony',
        identifier: ThemeTypes.ContrastDark,
        thumbColors: {
            prominent: '#000000',
            standard: '#0e0d12',
            primary: '#0073ff',
            weak: '#555555',
        },
        theme: contrastDarkTheme.toString(),
    },
    [ThemeTypes.Legacy]: {
        label: 'Legacy',
        identifier: ThemeTypes.Legacy,
        thumbColors: {
            prominent: '#606073',
            standard: '#F1F1F1',
            primary: '#9498CB',
            weak: '#8d8d9a',
        },
        theme: legacyTheme.toString(),
    },
    [ThemeTypes.Classic]: {
        label: 'Classic',
        identifier: ThemeTypes.Classic,
        thumbColors: {
            prominent: '#2E396B',
            standard: '#ffffff',
            primary: '#657EE4',
            weak: '#8187a4',
        },
        theme: classicTheme.toString(),
    },
    [ThemeTypes.Pass]: {
        label: 'Pass',
        identifier: ThemeTypes.Pass,
        thumbColors: {
            prominent: '#16141C',
            standard: '#2A2833',
            primary: '#6D4AFF',
            weak: '#6c6b70',
        },
        theme: passTheme.toString(),
    },
} as const;

export const DARK_THEMES = [ThemeTypes.Carbon, ThemeTypes.Monokai, ThemeTypes.ContrastDark, ThemeTypes.Pass];

export const PROTON_THEMES = [
    ThemeTypes.Duotone,
    ThemeTypes.Classic,
    ThemeTypes.Snow,
    ThemeTypes.Legacy,
    ThemeTypes.Carbon,
    ThemeTypes.Monokai,
    ThemeTypes.ContrastLight,
    ThemeTypes.ContrastDark,
].map((id) => PROTON_THEMES_MAP[id]);

export enum ThemeModeSetting {
    Auto,
    Dark,
    Light,
}

export enum ColorScheme {
    Dark,
    Light,
}

export enum MotionModeSetting {
    No_preference,
    Reduce,
}

export enum ThemeFontSizeSetting {
    DEFAULT = 0,
    X_SMALL,
    SMALL,
    LARGE,
    X_LARGE,
}

interface ThemeFontSizeSettingValue {
    label: () => string;
    value: number;
}

export const ThemeFontSizeSettingMap: { [key in ThemeFontSizeSetting]: ThemeFontSizeSettingValue } = {
    [ThemeFontSizeSetting.X_SMALL]: {
        label: () => c('Font size option').t`Very small`,
        value: 10,
    },
    [ThemeFontSizeSetting.SMALL]: {
        label: () => c('Font size option').t`Small`,
        value: 12,
    },
    [ThemeFontSizeSetting.DEFAULT]: {
        label: () => c('Font size option').t`Medium (recommended)`,
        value: 14,
    },
    [ThemeFontSizeSetting.LARGE]: {
        label: () => c('Font size option').t`Large`,
        value: 16,
    },
    [ThemeFontSizeSetting.X_LARGE]: {
        label: () => c('Font size option').t`Very large`,
        value: 18,
    },
};
export const themeFontSizeEntries = (
    Object.entries(ThemeFontSizeSettingMap) as unknown as [ThemeFontSizeSetting, ThemeFontSizeSettingValue][]
).sort((a, b) => a[1].value - b[1].value);

export enum ThemeFontFaceSetting {
    DEFAULT,
    SYSTEM,
    ARIAL,
    TIMES,
    DYSLEXIC,
}

interface ThemeFontFaceSettingValue {
    label: () => string;
    value: string | null;
}

export const ThemeFontFaceSettingMap = {
    [ThemeFontFaceSetting.DEFAULT]: {
        label: () => c('Font face option').t`Theme default`,
        value: null,
    },
    [ThemeFontFaceSetting.SYSTEM]: {
        label: () => c('Font face option').t`System default`,
        value: 'system-ui, sans-serif',
    },
    [ThemeFontFaceSetting.ARIAL]: {
        label: () => 'Arial',
        value: 'Arial, Helvetica, sans-serif',
    },
    [ThemeFontFaceSetting.TIMES]: {
        label: () => 'Times New Roman',
        value: "'Times New Roman', Times, serif",
    },
    [ThemeFontFaceSetting.DYSLEXIC]: {
        label: () => 'OpenDyslexic',
        value: 'OpenDyslexic, cursive',
    },
};
export const themeFontFaceEntries = Object.entries(ThemeFontFaceSettingMap) as unknown as [
    ThemeFontFaceSetting,
    ThemeFontFaceSettingValue
][];

export enum ThemeFeatureSetting {
    DEFAULT,
    SCROLLBARS_OFF,
    ANIMATIONS_OFF,
}

export interface ThemeSetting {
    Mode: ThemeModeSetting;
    LightTheme: ThemeTypes;
    DarkTheme: ThemeTypes;
    FontSize: ThemeFontSizeSetting;
    FontFace: ThemeFontFaceSetting;
    Features: ThemeFeatureSetting;
}

export const getDefaultThemeSetting = (themeType?: ThemeTypes): ThemeSetting => {
    return {
        Mode: ThemeModeSetting.Light,
        LightTheme: themeType || PROTON_DEFAULT_THEME,
        DarkTheme: ThemeTypes.Carbon,
        FontSize: ThemeFontSizeSetting.DEFAULT,
        FontFace: ThemeFontFaceSetting.DEFAULT,
        Features: ThemeFeatureSetting.DEFAULT,
    };
};

const getValidatedThemeType = (themeType: number): ThemeTypes | undefined => {
    if (themeType >= ThemeTypes.Duotone && themeType <= ThemeTypes.ContrastDark) {
        return themeType;
    }
};

const getParsedThemeType = (maybeThemeType: any): ThemeTypes | undefined => {
    return getValidatedThemeType(Number(maybeThemeType));
};

const getValidatedThemeMode = (maybeThemeMode: number): ThemeModeSetting | undefined => {
    if (maybeThemeMode >= ThemeModeSetting.Auto && maybeThemeMode <= ThemeModeSetting.Light) {
        return maybeThemeMode;
    }
};

const getValidatedFontSize = (maybeFontSize: number) => {
    if (maybeFontSize >= ThemeFontSizeSetting.DEFAULT && maybeFontSize <= ThemeFontSizeSetting.X_LARGE) {
        return maybeFontSize;
    }
};

const getValidatedFontFace = (maybeFontFace: number) => {
    if (maybeFontFace >= ThemeFontFaceSetting.DEFAULT && maybeFontFace <= ThemeFontFaceSetting.DYSLEXIC) {
        return maybeFontFace;
    }
};

const getValidatedFeatures = (maybeFeatures: number) => {
    if (maybeFeatures >= 0 && maybeFeatures <= 32) {
        return maybeFeatures;
    }
};

export const getParsedThemeSetting = (storedThemeSetting: string | undefined): ThemeSetting => {
    // The theme cookie used to contain just the theme number type.
    if (storedThemeSetting && storedThemeSetting?.length === 1) {
        const maybeParsedThemeType = getParsedThemeType(storedThemeSetting);
        if (maybeParsedThemeType !== undefined) {
            return getDefaultThemeSetting(maybeParsedThemeType);
        }
    }
    const defaultThemeSetting = getDefaultThemeSetting(PROTON_DEFAULT_THEME);
    // Now it contains JSON
    if (storedThemeSetting && storedThemeSetting?.length >= 10) {
        try {
            const parsedTheme: any = JSON.parse(decodeBase64URL(storedThemeSetting));
            return {
                Mode: getValidatedThemeMode(parsedTheme.Mode) ?? defaultThemeSetting.Mode,
                LightTheme: getValidatedThemeType(parsedTheme.LightTheme) ?? defaultThemeSetting.LightTheme,
                DarkTheme: getValidatedThemeType(parsedTheme.DarkTheme) ?? defaultThemeSetting.DarkTheme,
                FontFace: getValidatedFontSize(parsedTheme.FontFace) ?? defaultThemeSetting.FontFace,
                FontSize: getValidatedFontFace(parsedTheme.FontSize) ?? defaultThemeSetting.FontSize,
                Features: getValidatedFeatures(parsedTheme.Features) ?? defaultThemeSetting.Features,
            };
        } catch (e: any) {}
    }
    return defaultThemeSetting;
};

export const serializeThemeSetting = (themeSetting: ThemeSetting) => {
    return encodeBase64URL(JSON.stringify(themeSetting));
};

export const getThemeType = (theme: ThemeSetting, colorScheme: ColorScheme): ThemeTypes => {
    let value: ThemeTypes;

    switch (theme.Mode) {
        case ThemeModeSetting.Auto:
            value = colorScheme === ColorScheme.Dark ? theme.DarkTheme : theme.LightTheme;
            break;
        case ThemeModeSetting.Dark:
            value = theme.DarkTheme;
            break;
        default:
        case ThemeModeSetting.Light:
            value = theme.LightTheme;
            break;
    }

    return getValidatedThemeType(value) ?? PROTON_DEFAULT_THEME;
};
