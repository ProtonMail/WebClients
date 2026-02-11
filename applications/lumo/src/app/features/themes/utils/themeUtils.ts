import { isAfter, isBefore } from 'date-fns';

import type { LumoThemeConfig } from '../config/lumoThemeConfig';
import { LUMO_SPECIAL_THEMES } from '../config/lumoThemeConfig';

/**
 * Finds the currently active special theme based on the current date
 * If multiple themes are active, returns the one with highest priority
 * @returns Active theme config or null if no theme is active
 */
export const getActiveSpecialTheme = (): LumoThemeConfig | null => {
    const now = new Date();

    const activeThemes = LUMO_SPECIAL_THEMES.filter(
        (theme) => isAfter(now, theme.startDate) && isBefore(now, theme.endDate)
    );

    if (activeThemes.length === 0) {
        return null;
    }

    // If multiple themes are active, return the one with highest priority
    if (activeThemes.length > 1) {
        return activeThemes.reduce((highest, current) =>
            (current.priority ?? 0) > (highest.priority ?? 0) ? current : highest
        );
    }

    return activeThemes[0];
};
