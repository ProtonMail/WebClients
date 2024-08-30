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
// @ts-ignore
import storefrontWalletTheme from '@proton/colors/themes/dist/storefront-wallet.theme.css';
// @ts-ignore
import storefrontTheme from '@proton/colors/themes/dist/storefront.theme.css';
// @ts-ignore
import walletLightTheme from '@proton/colors/themes/dist/wallet.theme.css';
import { decodeBase64URL, encodeBase64URL } from '@proton/shared/lib/helpers/encoding';

import { canGetInboxDesktopInfo, getInboxDesktopInfo, hasInboxDesktopFeature } from '../desktop/ipcHelpers';
import { isElectronApp } from '../helpers/desktop';

// Update the allowed values in the settings heartbeat
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
    Storefront = 9,
    WalletLight = 10,
    StorefrontWallet = 11,
}

export const PROTON_DEFAULT_THEME = ThemeTypes.Duotone;

type ThemeDefinition = {
    /**
     * Theme name
     */
    label: string;
    /**
     * Theme identifier
     */
    identifier: ThemeTypes;
    /**
     * Defines the default theme color for the application. This sometimes affects
     * how the OS displays the site
     */
    themeColorMeta: string;
    /**
     * Colour definition for the SVG thumbnail only
     */
    thumbColors: {
        prominent: string;
        standard: string;
        primary: string;
        weak: string;
    };
    /**
     * The theme's stylesheet
     */
    theme: string;
};

export const PROTON_THEMES_MAP: Record<ThemeTypes, ThemeDefinition> = {
    [ThemeTypes.Duotone]: {
        label: 'Proton',
        identifier: ThemeTypes.Duotone,
        themeColorMeta: '#1b1340',
        thumbColors: {
            prominent: '#44348C',
            standard: '#ffffff',
            primary: '#936DFF',
            weak: '#9186BE',
        },
        theme: duotoneTheme.toString(),
    },
    [ThemeTypes.Carbon]: {
        label: 'Carbon',
        identifier: ThemeTypes.Carbon,
        themeColorMeta: '#16141c',
        thumbColors: {
            prominent: '#372E45',
            standard: '#453C56',
            primary: '#936DFF',
            weak: '#7A6E80',
        },
        theme: carbonTheme.toString(),
    },
    [ThemeTypes.Monokai]: {
        label: 'Monokai',
        identifier: ThemeTypes.Monokai,
        themeColorMeta: '#16141c',
        thumbColors: {
            prominent: '#16141C',
            standard: '#2B293D',
            primary: '#D3597B',
            weak: '#706878',
        },
        theme: monokaiTheme.toString(),
    },
    [ThemeTypes.Snow]: {
        label: 'Snow',
        identifier: ThemeTypes.Snow,
        themeColorMeta: 'white',
        thumbColors: {
            prominent: '#FFFFFF',
            standard: '#FAF8F6',
            primary: '#6D4AFF',
            weak: '#C7C4C1',
        },
        theme: snowTheme.toString(),
    },
    [ThemeTypes.ContrastLight]: {
        label: 'Ivory',
        identifier: ThemeTypes.ContrastLight,
        themeColorMeta: 'white',
        thumbColors: {
            prominent: '#FFFFFF',
            standard: '#FAF8F6',
            primary: '#4E33BF',
            weak: '#333333',
        },
        theme: contrastLightTheme.toString(),
    },
    [ThemeTypes.ContrastDark]: {
        label: 'Ebony',
        identifier: ThemeTypes.ContrastDark,
        themeColorMeta: 'black',
        thumbColors: {
            prominent: '#131313',
            standard: '#000000',
            primary: '#8C94FD',
            weak: '#555555',
        },
        theme: contrastDarkTheme.toString(),
    },
    [ThemeTypes.Legacy]: {
        label: 'Legacy',
        identifier: ThemeTypes.Legacy,
        themeColorMeta: '#505061',
        thumbColors: {
            prominent: '#535364',
            standard: '#F5F5F5',
            primary: '#9498CB',
            weak: '#BABAC1',
        },
        theme: legacyTheme.toString(),
    },
    [ThemeTypes.Classic]: {
        label: 'Classic',
        identifier: ThemeTypes.Classic,
        themeColorMeta: '#1c223d',
        thumbColors: {
            prominent: '#282F54',
            standard: '#F5F4F2',
            primary: '#6A7FE0',
            weak: '#585E78',
        },
        theme: classicTheme.toString(),
    },
    [ThemeTypes.Pass]: {
        label: 'Pass',
        identifier: ThemeTypes.Pass,
        themeColorMeta: '#191927',
        thumbColors: {
            prominent: '#16141C',
            standard: '#2A2833',
            primary: '#6D4AFF',
            weak: '#6c6b70',
        },
        theme: passTheme.toString(),
    },
    [ThemeTypes.Storefront]: {
        label: 'Storefront',
        identifier: ThemeTypes.Storefront,
        themeColorMeta: '#1d1738',
        thumbColors: {
            prominent: '#16141C',
            standard: '#2A2833',
            primary: '#6D4AFF',
            weak: '#6c6b70',
        },
        theme: storefrontTheme.toString(),
    },
    [ThemeTypes.WalletLight]: {
        label: 'WalletLight',
        identifier: ThemeTypes.WalletLight,
        themeColorMeta: '#f3f5f6',
        thumbColors: {
            prominent: '#16141C',
            standard: '#2A2833',
            primary: '#6D4AFF',
            weak: '#6c6b70',
        },
        theme: walletLightTheme.toString(),
    },
    [ThemeTypes.StorefrontWallet]: {
        label: 'StorefrontWallet',
        identifier: ThemeTypes.StorefrontWallet,
        themeColorMeta: 'white',
        thumbColors: {
            prominent: '#FFFFFF',
            standard: '#FAF8F6',
            primary: '#767DFF',
            weak: '#F3F5F6',
        },
        theme: storefrontWalletTheme.toString(),
    },
} as const;

export const getDarkThemes = () => [ThemeTypes.Carbon, ThemeTypes.Monokai, ThemeTypes.ContrastDark, ThemeTypes.Pass];

export const getProminentHeaderThemes = () => [ThemeTypes.Classic, ThemeTypes.Legacy];

export const getThemes = () => {
    // Currently we only support Snow and Carbon themes on the desktop app.
    if (isElectronApp) {
        return [ThemeTypes.Snow, ThemeTypes.Carbon].map((id) => PROTON_THEMES_MAP[id]);
    }

    return [
        ThemeTypes.Duotone,
        ThemeTypes.Classic,
        ThemeTypes.Snow,
        ThemeTypes.Legacy,
        ThemeTypes.Carbon,
        ThemeTypes.Monokai,
        ThemeTypes.ContrastDark,
        ThemeTypes.ContrastLight,
    ].map((id) => PROTON_THEMES_MAP[id]);
};

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
export const getThemeFontSizeEntries = () => {
    return Object.entries(ThemeFontSizeSettingMap)
        .map(([key, value]): [ThemeFontSizeSetting, ThemeFontSizeSettingValue] => {
            const themeFontSizeSettingKey: ThemeFontSizeSetting = Number(key);
            return [themeFontSizeSettingKey, value];
        })
        .sort((a, b) => a[1].value - b[1].value);
};

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

export const ThemeFontFaceSettingMap: { [key in ThemeFontFaceSetting]: ThemeFontFaceSettingValue } = {
    [ThemeFontFaceSetting.DEFAULT]: {
        label: () => {
            /* translator:
                This is the text proposed in a dropdown menu in the Accessibility settings.
                Here the user can choose the "Font family", and this string proposes the choice of
                "Theme font", the font of the chosen theme.
            */
            return c('Font face option').t`Theme font`;
        },
        value: null,
    },
    [ThemeFontFaceSetting.SYSTEM]: {
        label: () => {
            /* translator:
                This is the text proposed in a dropdown menu in the Accessibility settings.
                Here the user can choose the "Font family", and this string proposes the choice of
                "System default", the default font of the user's operating system.
            */
            return c('Font face option').t`System default`;
        },
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
export const getThemeFontFaceEntries = () => {
    return Object.entries(ThemeFontFaceSettingMap).map(
        ([key, value]): [ThemeFontFaceSetting, ThemeFontFaceSettingValue] => {
            const themeFontFaceSettingKey: ThemeFontFaceSetting = Number(key);
            return [themeFontFaceSettingKey, value];
        }
    );
};

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

export interface ThemeInformation {
    theme: ThemeTypes;
    dark: boolean;
    prominentHeader: boolean;
    default: boolean;
    style: string;
    label: string;
    colorScheme: ColorScheme;
    motionMode: MotionModeSetting;
    features: {
        scrollbars: boolean;
        animations: boolean;
    };
}

export const electronAppTheme = {
    Mode: ThemeModeSetting.Auto,
    LightTheme: ThemeTypes.Snow,
    DarkTheme: ThemeTypes.Carbon,
    FontSize: ThemeFontSizeSetting.DEFAULT,
    FontFace: ThemeFontFaceSetting.DEFAULT,
    Features: ThemeFeatureSetting.DEFAULT,
};

export const getDefaultThemeSetting = (themeType?: ThemeTypes): ThemeSetting => {
    const theme = {
        Mode: ThemeModeSetting.Light,
        LightTheme: themeType || PROTON_DEFAULT_THEME,
        DarkTheme: ThemeTypes.Carbon,
        FontSize: ThemeFontSizeSetting.DEFAULT,
        FontFace: ThemeFontFaceSetting.DEFAULT,
        Features: ThemeFeatureSetting.DEFAULT,
    };

    // Electron follow system settings and only Snow and Carbon theme
    if (isElectronApp) {
        if (hasInboxDesktopFeature('ThemeSelection') && canGetInboxDesktopInfo) {
            return getInboxDesktopInfo('theme');
        } else {
            return electronAppTheme;
        }
    }

    return theme;
};

const getValidatedThemeType = (themeType: number): ThemeTypes | undefined => {
    if (themeType >= ThemeTypes.Duotone && themeType <= ThemeTypes.StorefrontWallet) {
        return themeType;
    }
};

const getParsedThemeType = (maybeThemeType: any): ThemeTypes | undefined => {
    return getValidatedThemeType(Number(maybeThemeType));
};

const getValidatedThemeMode = (maybeThemeMode: number | undefined): ThemeModeSetting | undefined => {
    if (
        maybeThemeMode !== undefined &&
        maybeThemeMode >= ThemeModeSetting.Auto &&
        maybeThemeMode <= ThemeModeSetting.Light
    ) {
        return maybeThemeMode;
    }
};

const getValidatedFontSize = (maybeFontSize: number | undefined) => {
    if (
        maybeFontSize !== undefined &&
        maybeFontSize >= ThemeFontSizeSetting.DEFAULT &&
        maybeFontSize <= ThemeFontSizeSetting.X_LARGE
    ) {
        return maybeFontSize;
    }
};

const getValidatedFontFace = (maybeFontFace: number | undefined) => {
    if (
        maybeFontFace !== undefined &&
        maybeFontFace >= ThemeFontFaceSetting.DEFAULT &&
        maybeFontFace <= ThemeFontFaceSetting.DYSLEXIC
    ) {
        return maybeFontFace;
    }
};

const getValidatedFeatures = (maybeFeatures: number | undefined) => {
    if (maybeFeatures !== undefined && maybeFeatures >= 0 && maybeFeatures <= 32) {
        return maybeFeatures;
    }
};

export const getParsedThemeSetting = (storedThemeSetting: string | undefined): ThemeSetting => {
    // Electron follow system settings and only Snow and Carbon theme
    if (isElectronApp) {
        return getDefaultThemeSetting();
    }

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

const getDiff = (a: ThemeSetting, b: ThemeSetting): Partial<ThemeSetting> => {
    return Object.entries(a).reduce<Partial<ThemeSetting>>((acc, [_key, value]) => {
        const key = _key as keyof ThemeSetting;
        const otherValue = b[key] as any;
        if (value !== otherValue) {
            acc[key] = otherValue;
        }
        return acc;
    }, {});
};

export const serializeThemeSetting = (themeSetting: ThemeSetting) => {
    const diff = getDiff(getDefaultThemeSetting(), themeSetting);
    const keys = Object.keys(diff) as (keyof ThemeSetting)[];
    if (!keys.length) {
        return;
    }
    if (keys.length === 1 && keys[0] === 'LightTheme') {
        return `${diff.LightTheme}`;
    }
    return encodeBase64URL(JSON.stringify(diff));
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

export const PROTON_DEFAULT_THEME_SETTINGS: ThemeSetting = {
    LightTheme: PROTON_DEFAULT_THEME,
    DarkTheme: PROTON_DEFAULT_THEME,
    Mode: ThemeModeSetting.Light,
    FontSize: ThemeFontSizeSetting.DEFAULT,
    FontFace: ThemeFontFaceSetting.DEFAULT,
    Features: ThemeFeatureSetting.DEFAULT,
};

export const PROTON_DEFAULT_THEME_INFORMATION: ThemeInformation = {
    theme: PROTON_DEFAULT_THEME,
    dark: false,
    prominentHeader: false,
    default: false,
    style: '',
    label: '',
    colorScheme: ColorScheme.Light,
    motionMode: MotionModeSetting.No_preference,
    features: {
        scrollbars: false,
        animations: false,
    },
};
