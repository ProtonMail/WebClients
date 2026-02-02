import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';

import isDeepEqual from 'lodash/isEqual';

import { getStoredThemeString, setStoredThemeString } from '@proton/components/containers/themes/themeCookieStorage';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import {
    canGetInboxDesktopInfo,
    getInboxDesktopInfo,
    hasInboxDesktopFeature,
    invokeInboxDesktopIPC,
} from '@proton/shared/lib/desktop/ipcHelpers';
import { clearBit, hasBit, setBit } from '@proton/shared/lib/helpers/bitset';
import { isElectronMail, isElectronOnSupportedApps } from '@proton/shared/lib/helpers/desktop';
import { updateElectronThemeModeClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import createListeners from '@proton/shared/lib/helpers/listeners';
import {
    ColorScheme,
    MotionModeSetting,
    ThemeFeatureSetting,
    ThemeFontFaceSetting,
    ThemeFontSizeSetting,
    ThemeModeSetting,
    ThemeTypes,
} from '@proton/shared/lib/themes/constants';
import type { ThemeInformation, ThemeSetting } from '@proton/shared/lib/themes/themes';
import {
    PROTON_DEFAULT_THEME,
    PROTON_DEFAULT_THEME_INFORMATION,
    PROTON_DEFAULT_THEME_SETTINGS,
    PROTON_THEMES_MAP,
    ThemeFontFaceSettingMap,
    ThemeFontSizeSettingMap,
    getDarkThemes,
    getDefaultThemeSetting,
    getParsedThemeSetting,
    getProminentHeaderThemes,
    getThemeType,
    serializeThemeSetting,
} from '@proton/shared/lib/themes/themes';
import noop from '@proton/utils/noop';

import { classNames, styles } from './properties';

export interface ThemeContextInterface {
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
    settings: PROTON_DEFAULT_THEME_SETTINGS,
    information: PROTON_DEFAULT_THEME_INFORMATION,
    addListener: () => noop,
});

interface Props {
    appName: APP_NAMES;
    children: ReactNode;
    persist?: boolean;
    initialThemeSetting?: ThemeSetting | (() => ThemeSetting);
}

export const useTheme = () => {
    return useContext(ThemeContext);
};

export const getThemeStyle = (themeType: ThemeTypes = PROTON_DEFAULT_THEME) => {
    return PROTON_THEMES_MAP[themeType]?.theme || PROTON_THEMES_MAP[PROTON_DEFAULT_THEME].theme;
};

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
    if (canGetInboxDesktopInfo && hasInboxDesktopFeature('FullTheme')) {
        return getInboxDesktopInfo('colorScheme');
    }

    return matches ? ColorScheme.Dark : ColorScheme.Light;
};

const getMotionMode = (matches: boolean): MotionModeSetting => {
    return matches ? MotionModeSetting.Reduce : MotionModeSetting.No_preference;
};

const listeners = createListeners<[ThemeSetting]>();

const darkThemes = getDarkThemes();

const prominentHeaderThemes = getProminentHeaderThemes();

const syncToCookie = (themeSetting: ThemeSetting) => {
    setStoredThemeString(serializeThemeSetting(themeSetting));
};

const defaultInitialThemeSetting = () => {
    return getParsedThemeSetting(getStoredThemeString());
};

const ThemeProvider = ({
    children,
    appName,
    persist = true,
    initialThemeSetting = defaultInitialThemeSetting,
}: Props) => {
    const [themeSetting, setThemeSettingDefault] = useState(initialThemeSetting);

    const constrainedThemeSettings: ThemeSetting = useMemo(() => {
        // We want to Proton Wallet to inherit from all theme settings except styles
        if (appName === APPS.PROTONWALLET) {
            return {
                ...themeSetting,
                LightTheme: ThemeTypes.WalletLight,
                DarkTheme: ThemeTypes.WalletDark,
            };
        }

        if (appName === APPS.PROTONLUMO) {
            return {
                ...themeSetting,
                LightTheme: ThemeTypes.LumoLight,
                DarkTheme: ThemeTypes.LumoDark,
            };
        }

        return themeSetting;
    }, [themeSetting]);

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

    const theme = getThemeType(constrainedThemeSettings, colorScheme);

    const style = getThemeStyle(theme);

    const information: ThemeInformation = {
        theme,
        dark: darkThemes.includes(theme),
        prominentHeader: prominentHeaderThemes.includes(theme),
        default: PROTON_DEFAULT_THEME === theme,
        style,
        label: PROTON_THEMES_MAP[theme]?.label || '',
        colorScheme,
        motionMode,
        features: {
            scrollbars: hasBit(constrainedThemeSettings.Features, ThemeFeatureSetting.SCROLLBARS_OFF),
            animations: hasBit(constrainedThemeSettings.Features, ThemeFeatureSetting.ANIMATIONS_OFF),
        },
    };

    useLayoutEffect(() => {
        const htmlEl = document.querySelector('html');

        const defaultValue = ThemeFontSizeSettingMap[ThemeFontSizeSetting.DEFAULT].value;
        const actualValue = ThemeFontSizeSettingMap[constrainedThemeSettings.FontSize]?.value;

        const value = !actualValue || defaultValue === actualValue ? undefined : `${actualValue}`;

        syncStyleToEl(htmlEl, styles.fontSize, value);
    }, [constrainedThemeSettings.FontSize]);

    useLayoutEffect(() => {
        const htmlEl = document.querySelector('html');

        const defaultValue = ThemeFontFaceSettingMap[ThemeFontFaceSetting.DEFAULT].value;
        const actualValue = ThemeFontFaceSettingMap[constrainedThemeSettings.FontFace]?.value;

        const value = !actualValue || defaultValue === actualValue ? undefined : `${actualValue}`;

        syncStyleToEl(htmlEl, styles.fontFamily, value);
    }, [constrainedThemeSettings.FontFace]);

    useLayoutEffect(() => {
        const htmlEl = document.querySelector('html');

        syncClassNameToEl(htmlEl, classNames.scrollbars, information.features.scrollbars);
        syncClassNameToEl(htmlEl, classNames.animations, information.features.animations);
    }, [information.features.animations, information.features.scrollbars]);

    useLayoutEffect(() => {
        const htmlElement = document.querySelector('html');
        if (htmlElement) {
            htmlElement.setAttribute('data-theme-mode', information.dark ? 'dark' : 'light');
            htmlElement.setAttribute('data-theme-name', information.label);
        }
    }, [information.dark, information.label]);

    useEffect(() => {
        const syncToMeta = () => {
            const themeMeta = document.querySelector("meta[name='theme-color']");
            const themeColor = PROTON_THEMES_MAP[theme].themeColorMeta;

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
        if (persist) {
            syncToCookie(themeSetting);
        }
    }, [themeSetting]);

    useEffect(() => {
        if (appName && isElectronOnSupportedApps(appName) && hasInboxDesktopFeature('ThemeSelection')) {
            void invokeInboxDesktopIPC({ type: 'setTheme', payload: themeSetting });
        }
    }, [themeSetting]);

    useEffect(() => {
        if (isElectronMail) {
            updateElectronThemeModeClassnames(themeSetting);
        }
    }, [colorScheme, themeSetting]);

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
