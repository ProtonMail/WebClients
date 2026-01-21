import type { APP_NAMES } from '@proton/shared/lib/constants';
import { telemetry } from '@proton/shared/lib/telemetry';

/**
 * Tracks how long a user spent on the Explore Apps List page (in seconds)
 * This event is sent when the user clicks an app or uses context menu actions
 */
export const sendExploreAppsListTimeSpent = ({ timeSpentSec }: { timeSpentSec: number }) => {
    telemetry.sendCustomEvent(
        /**
         * Event type version should be updated when the data structure changes
         * Note: timeSpentSec is in seconds (rounded)
         */
        'explore_apps_list_time_spent_v1',
        {
            timeSpentSec,
        }
    );
};

/**
 * Tracks when a user clicks on an app to open it
 */
export const sendExploreAppsListAppClick = ({ appName }: { appName: APP_NAMES }) => {
    telemetry.sendCustomEvent(
        /**
         * Event type version should be updated when the data structure changes
         */
        'explore_apps_list_app_click_v1',
        {
            appName,
        }
    );
};

/**
 * Tracks when a user clicks "Open in new tab" from the context menu
 */
export const sendExploreAppsListContextMenuOpenNewTab = ({ appName }: { appName: APP_NAMES }) => {
    telemetry.sendCustomEvent(
        /**
         * Event type version should be updated when the data structure changes
         */
        'explore_apps_list_context_menu_open_new_tab_v1',
        {
            appName,
        }
    );
};

/**
 * Tracks when a user clicks "Open settings" from the context menu
 */
export const sendExploreAppsListContextMenuOpenSettings = ({ appName }: { appName: APP_NAMES }) => {
    telemetry.sendCustomEvent(
        /**
         * Event type version should be updated when the data structure changes
         */
        'explore_apps_list_context_menu_open_settings_v1',
        {
            appName,
        }
    );
};
