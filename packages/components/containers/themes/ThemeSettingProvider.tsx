import { ReactNode, createContext, useContext, useLayoutEffect, useState } from 'react';

import useInstance from '@proton/hooks/useInstance';
import { updateTheme } from '@proton/shared/lib/api/settings';
import { postMessageToIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_APPS, DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { clearBit, hasBit, setBit } from '@proton/shared/lib/helpers/bitset';
import {
    DARK_THEMES,
    MotionModeSetting,
    PROTON_DEFAULT_THEME,
    ThemeFeatureSetting,
    ThemeFontFaceSetting,
    ThemeFontFaceSettingMap,
    ThemeFontSizeSetting,
    ThemeFontSizeSettingMap,
    ThemeModeSetting,
    ThemeSetting,
    ThemeTypes,
    getDefaultThemeSetting,
    getThemeType,
} from '@proton/shared/lib/themes/themes';
import debounce from '@proton/utils/debounce';
import noop from '@proton/utils/noop';

import { useApi, useDrawer, useUserSettings } from '../../hooks';
import { useTheme } from './ThemeProvider';
import { classNames, styles } from './properties';

type ColorScheme = Exclude<ThemeModeSetting, ThemeModeSetting.Auto>;
export const ThemeSettingContext = createContext<{
    setTheme: (theme: ThemeTypes, mode?: ThemeModeSetting) => void;
    setAutoTheme: (enabled: boolean) => void;
    setFontSize: (fontSize: ThemeFontSizeSetting) => void;
    setFontFace: (fontFace: ThemeFontFaceSetting) => void;
    setFeature: (featureBit: ThemeFeatureSetting, toggle: boolean) => void;
    settings: {
        lightTheme: ThemeTypes;
        darkTheme: ThemeTypes;
        mode: ThemeModeSetting;
        currentTheme: ThemeTypes;
        colorScheme: ColorScheme;
        motionMode: MotionModeSetting;
        fontSize: ThemeFontSizeSetting;
        fontFace: ThemeFontFaceSetting;
        features: {
            scrollbars: boolean;
            animations: boolean;
        };
    };
}>({
    setTheme: noop,
    setAutoTheme: noop,
    setFontSize: noop,
    setFontFace: noop,
    setFeature: noop,
    settings: {
        lightTheme: PROTON_DEFAULT_THEME,
        darkTheme: PROTON_DEFAULT_THEME,
        mode: ThemeModeSetting.Light,
        currentTheme: PROTON_DEFAULT_THEME,
        colorScheme: ThemeModeSetting.Light,
        motionMode: MotionModeSetting.No_preference,
        fontSize: ThemeFontSizeSetting.DEFAULT,
        fontFace: ThemeFontFaceSetting.DEFAULT,
        features: {
            scrollbars: true,
            animations: true,
        },
    },
});

interface Props {
    children: ReactNode;
    initial?: ThemeTypes;
}

export const useThemeSetting = () => {
    return useContext(ThemeSettingContext);
};

const matchMediaScheme = window.matchMedia('(prefers-color-scheme: dark)');
const matchMediaMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const syncClassNameToEl = (el: HTMLElement | null, name: string, toggle: boolean) => {
    if (!el) {
        return;
    }
    if (toggle) {
        el.classList.add(name);
    } else {
        el.classList.remove(name);
    }
};

const syncStyleToEl = (el: HTMLElement | null, property: string, value: string | undefined) => {
    if (!el) {
        return;
    }
    el.style.removeProperty(property);
    if (value === undefined) {
        return;
    }
    el.style.setProperty(property, value);
};

const getColorScheme = (matches: boolean): ColorScheme => {
    return matches ? ThemeModeSetting.Dark : ThemeModeSetting.Light;
};

const getMotionMode = (matches: boolean): MotionModeSetting => {
    return matches ? MotionModeSetting.Reduce : MotionModeSetting.No_preference;
};

const ThemeSettingProvider = ({ children }: Props) => {
    const api = useApi();
    const [userSettings] = useUserSettings();
    const [, setActiveTheme] = useTheme();
    const [themeSetting, setThemeSetting] = useState(() => {
        return userSettings.Theme && 'Mode' in userSettings.Theme
            ? userSettings.Theme
            : getDefaultThemeSetting(userSettings.ThemeType);
    });
    const { iframeSrcMap } = useDrawer();

    const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
        return getColorScheme(matchMediaScheme.matches);
    });
    const [motionMode, setMotionMode] = useState<MotionModeSetting>(() => {
        return getMotionMode(matchMediaMotion.matches);
    });
    const legacyTheme = userSettings.ThemeType;

    useLayoutEffect(() => {
        setColorScheme(getColorScheme(matchMediaScheme.matches));
        const listener = (e: MediaQueryListEvent) => {
            setColorScheme(getColorScheme(e.matches));
        };
        matchMediaScheme.addEventListener('change', listener);
        return () => {
            matchMediaScheme.removeEventListener('change', listener);
        };
    }, []);

    useLayoutEffect(() => {
        setMotionMode(getMotionMode(matchMediaMotion.matches));
        const listener = (e: MediaQueryListEvent) => {
            setMotionMode(getMotionMode(e.matches));
        };
        matchMediaMotion.addEventListener('change', listener);
        return () => {
            matchMediaMotion.removeEventListener('change', listener);
        };
    }, []);

    const syncTheme = useInstance(() => {
        return debounce((settings: ThemeSetting) => {
            void api(updateTheme(settings));
        }, 500);
    });

    const syncThemeSettingValue = (theme: ThemeSetting) => {
        syncTheme(theme);
        setThemeSetting(theme);
    };

    const setTheme = (themeType: ThemeTypes, mode?: ThemeModeSetting) => {
        if (mode) {
            syncThemeSettingValue({
                ...themeSetting,
                Mode: ThemeModeSetting.Auto,
                [mode === ThemeModeSetting.Dark ? 'DarkTheme' : 'LightTheme']: themeType,
            });
            return;
        }

        if (DARK_THEMES.includes(themeType)) {
            syncThemeSettingValue({ ...themeSetting, Mode: ThemeModeSetting.Dark, DarkTheme: themeType });
        } else {
            syncThemeSettingValue({ ...themeSetting, Mode: ThemeModeSetting.Light, LightTheme: themeType });
        }
    };

    const setAutoTheme = (enabled: boolean) => {
        if (enabled) {
            syncThemeSettingValue({ ...themeSetting, Mode: ThemeModeSetting.Auto });
        } else {
            syncThemeSettingValue({ ...themeSetting, Mode: colorScheme });
        }
    };

    const setFontSize = (fontSize: ThemeFontSizeSetting) => {
        syncThemeSettingValue({ ...themeSetting, FontSize: fontSize });
    };

    const setFontFace = (fontFace: ThemeFontFaceSetting) => {
        syncThemeSettingValue({ ...themeSetting, FontFace: fontFace });
    };

    const setFeature = (featureBit: ThemeFeatureSetting, toggle: boolean) => {
        syncThemeSettingValue({
            ...themeSetting,
            Features: toggle ? setBit(themeSetting.Features, featureBit) : clearBit(themeSetting.Features, featureBit),
        });
    };

    const settings = {
        darkTheme: themeSetting.DarkTheme,
        lightTheme: themeSetting.LightTheme,
        mode: themeSetting.Mode,
        currentTheme: getThemeType(themeSetting, colorScheme, legacyTheme),
        colorScheme,
        motionMode,
        fontSize: themeSetting.FontSize,
        fontFace: themeSetting.FontFace,
        features: {
            scrollbars: hasBit(themeSetting.Features, ThemeFeatureSetting.SCROLLBARS_OFF),
            animations: hasBit(themeSetting.Features, ThemeFeatureSetting.ANIMATIONS_OFF),
        },
    };

    useLayoutEffect(() => {
        setActiveTheme(settings.currentTheme);

        // If apps are opened in drawer, update their theme too
        if (iframeSrcMap) {
            Object.keys(iframeSrcMap).map((app) => {
                postMessageToIframe(
                    { type: DRAWER_EVENTS.UPDATE_THEME, payload: { theme: settings.currentTheme } },
                    app as DRAWER_APPS
                );
            });
        }
    }, [settings.currentTheme]);

    useLayoutEffect(() => {
        const htmlEl = document.querySelector('html');

        const value =
            settings.fontSize === ThemeFontSizeSetting.DEFAULT
                ? undefined
                : `${ThemeFontSizeSettingMap[settings.fontSize].value}`;
        syncStyleToEl(htmlEl, styles.fontSize, value);
    }, [settings.fontSize]);

    useLayoutEffect(() => {
        const htmlEl = document.querySelector('html');

        const value =
            settings.fontFace === ThemeFontFaceSetting.DEFAULT
                ? undefined
                : ThemeFontFaceSettingMap[settings.fontFace].value;

        syncStyleToEl(htmlEl, styles.fontFamily, value);
    }, [settings.fontFace]);

    useLayoutEffect(() => {
        const htmlEl = document.querySelector('html');

        syncClassNameToEl(htmlEl, classNames.scrollbars, settings.features.scrollbars);
        syncClassNameToEl(htmlEl, classNames.animations, settings.features.animations);
    }, [settings.features.animations, settings.features.scrollbars]);

    return (
        <ThemeSettingContext.Provider
            value={{ settings, setTheme, setAutoTheme, setFontSize, setFontFace, setFeature }}
        >
            {children}
        </ThemeSettingContext.Provider>
    );
};

export default ThemeSettingProvider;
