import { telemetry } from '@proton/shared/lib/telemetry';
import type { ThemeModeSetting } from '@proton/shared/lib/themes/constants';

/**
 * Tracks when a user opens the theme toggle dropdown
 */
export const sendThemeToggleDropdownOpen = () => {
    telemetry.sendCustomEvent(
        /**
         * Event type version should be updated when the data structure changes
         */
        'public_theme_toggle_dropdown_open_v1',
        {}
    );
};

/**
 * Tracks when a user selects a theme from the dropdown
 */
export const sendThemeToggleThemeSelect = ({ themeMode }: { themeMode: ThemeModeSetting }) => {
    telemetry.sendCustomEvent(
        /**
         * Event type version should be updated when the data structure changes
         */
        'public_theme_toggle_theme_select_v1',
        {
            themeMode,
        }
    );
};
