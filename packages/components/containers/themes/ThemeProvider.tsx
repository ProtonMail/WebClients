import { ReactNode, createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react';

import { clearBit, hasBit, setBit } from '@proton/shared/lib/helpers/bitset';
import { getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import createListeners from '@proton/shared/lib/helpers/listeners';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import {
    ColorScheme,
    MotionModeSetting,
    PROTON_DEFAULT_THEME,
    PROTON_THEMES_MAP,
    ThemeFeatureSetting,
    ThemeFontFaceSetting,
    ThemeFontFaceSettingMap,
    ThemeFontSizeSetting,
    ThemeFontSizeSettingMap,
    ThemeModeSetting,
    ThemeSetting,
    ThemeTypes,
    getDarkThemes,
    getDefaultThemeSetting,
    getParsedThemeSetting,
    getThemeType,
    serializeThemeSetting,
} from '@proton/shared/lib/themes/themes';
import noop from '@proton/utils/noop';

import { classNames, styles } from './properties';

interface ThemeInformation {
    theme: ThemeTypes;
    dark: boolean;
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

interface ThemeContextInterface {
    setTheme: (theme: ThemeTypes, mode?: ThemeModeSetting) => void;
    setThemeSetting: (theme?: ThemeSetting) => void;
    setAutoTheme: (enabled: boolean) => void;
    setFontSize: (fontSize: ThemeFontSizeSetting) => void;
    setFontFace: (fontFace: ThemeFontFaceSetting) => void;
    setFeature: (featureBit: ThemeFeatureSetting, toggle: boolean) => void;
    settings: ThemeSetting;
    information: ThemeInformation;
    addListener: (cb: (data: ThemeSetting) => void) => () => void;
}

export const ThemeContext = createContext<ThemeContextInterface>({
    setTheme: noop,
    setThemeSetting: noop,
    setAutoTheme: noop,
    setFontSize: noop,
    setFontFace: noop,
    setFeature: noop,
    settings: {
        LightTheme: PROTON_DEFAULT_THEME,
        DarkTheme: PROTON_DEFAULT_THEME,
        Mode: ThemeModeSetting.Light,
        FontSize: ThemeFontSizeSetting.DEFAULT,
        FontFace: ThemeFontFaceSetting.DEFAULT,
        Features: ThemeFeatureSetting.DEFAULT,
    },
    information: {
        theme: PROTON_DEFAULT_THEME,
        dark: false,
        default: false,
        style: '',
        label: '',
        colorScheme: ColorScheme.Light,
        motionMode: MotionModeSetting.No_preference,
        features: {
            scrollbars: false,
            animations: false,
        },
    },
    addListener: () => noop,
});

interface Props {
    children: ReactNode;
    initial?: ThemeTypes;
}

export const useTheme = () => {
    return useContext(ThemeContext);
};

export const getThemeStyle = (themeType: ThemeTypes = PROTON_DEFAULT_THEME) => {
    return PROTON_THEMES_MAP[themeType]?.theme || PROTON_THEMES_MAP[PROTON_DEFAULT_THEME].theme;
};

const THEME_COOKIE_NAME = 'Theme';

const storedTheme = getCookie(THEME_COOKIE_NAME);

export const THEME_ID = 'theme-root';

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
    return matches ? ColorScheme.Dark : ColorScheme.Light;
};

const getMotionMode = (matches: boolean): MotionModeSetting => {
    return matches ? MotionModeSetting.Reduce : MotionModeSetting.No_preference;
};

const listeners = createListeners<[ThemeSetting]>();

const darkThemes = getDarkThemes();

const ThemeProvider = ({ children }: Props) => {
    const [themeSetting, setThemeSettingDefault] = useState(() => {
        return getParsedThemeSetting(storedTheme);
    });
    const setThemeSetting = useCallback((theme: ThemeSetting = getDefaultThemeSetting()) => {
        setThemeSettingDefault((oldTheme: ThemeSetting) => {
            if (isDeepEqual(theme, oldTheme)) {
                return oldTheme;
            }
            return theme;
        });
    }, []);
    const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
        return getColorScheme(matchMediaScheme.matches);
    });
    const [motionMode, setMotionMode] = useState<MotionModeSetting>(() => {
        return getMotionMode(matchMediaMotion.matches);
    });

    useLayoutEffect(() => {
        setColorScheme(getColorScheme(matchMediaScheme.matches));
        const listener = (e: MediaQueryListEvent) => {
            setColorScheme(getColorScheme(e.matches));
        };
        // Safari <14 does not support addEventListener on match media queries
        matchMediaScheme.addEventListener?.('change', listener);
        return () => {
            matchMediaScheme.removeEventListener?.('change', listener);
        };
    }, []);

    useLayoutEffect(() => {
        setMotionMode(getMotionMode(matchMediaMotion.matches));
        const listener = (e: MediaQueryListEvent) => {
            setMotionMode(getMotionMode(e.matches));
        };
        // Safari <14 does not support addEventListener on match media queries
        matchMediaMotion.addEventListener?.('change', listener);
        return () => {
            matchMediaMotion.removeEventListener?.('change', listener);
        };
    }, []);

    const syncThemeSettingValue = (theme: ThemeSetting) => {
        listeners.notify(theme);
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

        if (darkThemes.includes(themeType)) {
            syncThemeSettingValue({ ...themeSetting, Mode: ThemeModeSetting.Dark, DarkTheme: themeType });
        } else {
            syncThemeSettingValue({ ...themeSetting, Mode: ThemeModeSetting.Light, LightTheme: themeType });
        }
    };

    const setAutoTheme = (enabled: boolean) => {
        if (enabled) {
            syncThemeSettingValue({ ...themeSetting, Mode: ThemeModeSetting.Auto });
        } else {
            syncThemeSettingValue({
                ...themeSetting,
                Mode: colorScheme === ColorScheme.Light ? ThemeModeSetting.Light : ThemeModeSetting.Dark,
            });
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

    const theme = getThemeType(themeSetting, colorScheme);

    const style = getThemeStyle(theme);

    const information: ThemeInformation = {
        theme,
        dark: darkThemes.includes(theme),
        default: PROTON_DEFAULT_THEME === theme,
        style,
        label: PROTON_THEMES_MAP[theme]?.label || '',
        colorScheme,
        motionMode,
        features: {
            scrollbars: hasBit(themeSetting.Features, ThemeFeatureSetting.SCROLLBARS_OFF),
            animations: hasBit(themeSetting.Features, ThemeFeatureSetting.ANIMATIONS_OFF),
        },
    };

    useLayoutEffect(() => {
        const htmlEl = document.querySelector('html');

        const defaultValue = ThemeFontSizeSettingMap[ThemeFontSizeSetting.DEFAULT].value;
        const actualValue = ThemeFontSizeSettingMap[themeSetting.FontSize]?.value;

        const value = !actualValue || defaultValue === actualValue ? undefined : `${actualValue}`;

        syncStyleToEl(htmlEl, styles.fontSize, value);
    }, [themeSetting.FontSize]);

    useLayoutEffect(() => {
        const htmlEl = document.querySelector('html');

        const defaultValue = ThemeFontFaceSettingMap[ThemeFontFaceSetting.DEFAULT].value;
        const actualValue = ThemeFontFaceSettingMap[themeSetting.FontFace]?.value;

        const value = !actualValue || defaultValue === actualValue ? undefined : `${actualValue}`;

        syncStyleToEl(htmlEl, styles.fontFamily, value);
    }, [themeSetting.FontFace]);

    useLayoutEffect(() => {
        const htmlEl = document.querySelector('html');

        syncClassNameToEl(htmlEl, classNames.scrollbars, information.features.scrollbars);
        syncClassNameToEl(htmlEl, classNames.animations, information.features.animations);
    }, [information.features.animations, information.features.scrollbars]);

    useEffect(() => {
        const syncToMeta = () => {
            const themeMeta = document.querySelector("meta[name='theme-color']");
            const uiProminentElement = document.querySelector('.ui-prominent');
            const themeColor = uiProminentElement
                ? window.getComputedStyle(uiProminentElement).getPropertyValue('--background-norm').trim()
                : '';

            if (themeMeta && themeColor) {
                themeMeta.setAttribute('content', themeColor);
            }
        };

        syncToMeta();
    }, [theme]);

    useEffect(() => {
        return () => {
            listeners.clear();
        };
    }, []);

    useEffect(() => {
        const syncToCookie = () => {
            const cookieValue = serializeThemeSetting(themeSetting);
            // Note: We might set `undefined` which will clear the cookie
            setCookie({
                cookieName: THEME_COOKIE_NAME,
                cookieValue,
                cookieDomain: getSecondLevelDomain(window.location.hostname),
                path: '/',
                expirationDate: 'max',
            });
        };

        syncToCookie();
    }, [themeSetting]);

    return (
        <ThemeContext.Provider
            value={{
                settings: themeSetting,
                setTheme,
                setThemeSetting,
                setAutoTheme,
                setFontSize,
                setFontFace,
                setFeature,
                information,
                addListener: listeners.subscribe,
            }}
        >
            <style id={THEME_ID}>{style}</style>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;
