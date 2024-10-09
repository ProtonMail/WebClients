import { ThemeTypes } from '../themes/themes';

export const DESKTOP_THEME_TYPES = {
    Carbon: ThemeTypes.Carbon,
    Snow: ThemeTypes.Snow,
} as const;

export const isDesktopThemeType = (value: unknown): value is ThemeTypes => {
    return Object.values(DESKTOP_THEME_TYPES).includes(value as any);
};
