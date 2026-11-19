import { ThemeTypes } from '@proton/shared/lib/themes/constants';

import { getDefaultSettings, getInitialLumoSettings } from './lumoThemeStorage';
import { getLumoThemeFromSettings, getThemeConfig, matchDarkTheme } from './lumoThemeUtils';

const THEME_STYLE_ATTRIBUTE = 'data-lumo-theme-style';

/**
 * The single Lumo theme `<style>`. It lives outside React so it survives tree swaps (Suspense
 * fallback, loader, guest and auth apps), and sits at the end of `<body>`, after `.app-root`, so it
 * wins over the shared `<style id="theme-root">` rendered by `ProtonApp`. Its id stays
 * `lumo-dark-theme` / `lumo-light-theme` for `body:has(#lumo-dark-theme)` rules and DOM checks.
 */
const getThemeStyleElement = (): HTMLStyleElement => {
    const existing = document.querySelector<HTMLStyleElement>(`style[${THEME_STYLE_ATTRIBUTE}]`);
    if (existing) {
        return existing;
    }
    const element = document.createElement('style');
    element.setAttribute(THEME_STYLE_ATTRIBUTE, '');
    document.body.appendChild(element);
    return element;
};

export const applyLumoTheme = (theme: ThemeTypes) => {
    const isDark = theme === ThemeTypes.LumoDark;
    const element = getThemeStyleElement();
    const styles = getThemeConfig(theme).styles;

    element.id = isDark ? 'lumo-dark-theme' : 'lumo-light-theme';
    if (element.textContent !== styles) {
        element.textContent = styles;
    }
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

/**
 * Runs synchronously when the main bundle loads, before React renders any loading indicator. Uses the
 * unencrypted local settings, which exist before the store or any session.
 */
export const applyInitialLumoTheme = () => {
    applyLumoTheme(
        getLumoThemeFromSettings(getInitialLumoSettings() || getDefaultSettings(), matchDarkTheme().matches)
    );
};
