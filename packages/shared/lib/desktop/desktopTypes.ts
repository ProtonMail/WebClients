import type { Environment } from '@proton/shared/lib/interfaces';

import type { ThemeSetting } from '../themes/themes';
import type { DesktopVersion } from './DesktopVersion';

export type CHANGE_VIEW_TARGET = 'mail' | 'calendar' | 'account';
export type ElectronNotification = {
    title: string;
    body: string;
    app: CHANGE_VIEW_TARGET;
    elementID?: string;
    labelID?: string;
};

// This type must be updated in the Electron application as well
export type IPCInboxDesktopFeature =
    | 'ThemeSelection'
    | 'InAppPayments'
    | 'EarlyAccess'
    | 'MultiAccount'
    | 'LatestVersionCheck';
export type IPCInboxGetInfoMessage =
    | { type: 'theme'; result: ThemeSetting }
    | { type: 'latestVersion'; result: DesktopVersion | null };
export type IPCInboxClientUpdateMessage =
    | { type: 'updateNotification'; payload: number }
    | { type: 'userLogin'; payload?: undefined }
    | { type: 'userLogout'; payload?: undefined }
    | { type: 'clearAppData'; payload?: undefined }
    | { type: 'oauthPopupOpened'; payload: 'oauthPopupStarted' | 'oauthPopupFinished' }
    | { type: 'subscriptionModalOpened'; payload: 'subscriptionModalStarted' | 'subscriptionModalFinished' }
    | { type: 'openExternal'; payload: string }
    | { type: 'changeView'; payload: CHANGE_VIEW_TARGET }
    | { type: 'trialEnd'; payload?: 'trialEnded' | 'resetTrialEnded' | undefined }
    | { type: 'showNotification'; payload: ElectronNotification }
    | { type: 'updateLocale'; payload: string }
    | { type: 'setTheme'; payload: ThemeSetting }
    | { type: 'earlyAccess'; payload: Environment | undefined };
export type IPCInboxClientUpdateMessageType = IPCInboxClientUpdateMessage['type'];
export type IPCInboxHostUpdateMessage = {
    type: 'captureMessage';
    payload: {
        message: string;
        level: 'error' | 'warning';
        tags: Record<string, string | number>;
        extra: Record<string, string | number>;
    };
};
export type IPCInboxHostUpdateMessageType = IPCInboxHostUpdateMessage['type'];

/**
 * Electron injects an object in the window object
 * This object can then be used to communicate from the web app to the desktop app
 * This type can be used in any file that needs to communicate with the desktop app.
 *
 * The object can be injected when used in specific clients to avoid adding it globally
 */
export type IPCInboxMessageBroker = {
    hasFeature?: (feature: IPCInboxDesktopFeature) => boolean;
    getInfo?: <T extends IPCInboxGetInfoMessage['type']>(
        type: T
    ) => Extract<IPCInboxGetInfoMessage, { type: T }>['result'];
    on?: <T extends IPCInboxHostUpdateMessageType>(
        type: T,
        callback: (payload: Extract<IPCInboxHostUpdateMessage, { type: T }>['payload']) => void
    ) => { removeListener: () => void };
    send?: <T extends IPCInboxClientUpdateMessageType>(
        type: T,
        payload: Extract<IPCInboxClientUpdateMessage, { type: T }>['payload']
    ) => void;
};

export const END_OF_TRIAL_KEY = 'endOfTrial';

export interface InboxDesktopFreeTrialDates {
    trialStartDate?: Date;
    trialEndDate?: Date;
}

export interface InboxDesktopFreeTrialReminders {
    first: boolean;
    second: boolean;
    third: boolean;
}
