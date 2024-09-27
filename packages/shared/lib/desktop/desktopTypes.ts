import type { Environment } from '@proton/shared/lib/interfaces';

import type { ThemeModeSetting, ThemeSetting, ThemeTypes } from '../themes/themes';
import type { DefaultProtocol } from './DefaultProtocol';
import type { DesktopVersion } from './DesktopVersion';

export interface DesktopThemeSetting {
    Mode: ThemeModeSetting;
    LightTheme: ThemeTypes;
    DarkTheme: ThemeTypes;
}

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
    | 'LatestVersionCheck'
    | 'InstallSource'
    | 'MailtoTelemetry';
export type IPCInboxGetInfoMessage =
    | { type: 'theme'; result: ThemeSetting }
    | { type: 'latestVersion'; result: DesktopVersion | null }
    | { type: 'installSource'; result: string | null }
    | { type: 'defaultMailto'; result: DefaultProtocol };
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
    | { type: 'earlyAccess'; payload: Environment | undefined }
    | { type: 'checkDefaultMailtoAndSignal'; payload?: undefined }
    | { type: 'defaultMailtoTelemetryReported'; payload: number };
export type IPCInboxClientUpdateMessageType = IPCInboxClientUpdateMessage['type'];

// WARNING: DO NOT EXTEND THIS WITH OTHER UNION. IT IS NOT EASY AND EVENTS WON'T BE TYPESAFE
// label: inda-refactor-001
export type IPCInboxHostUpdateMessage =
    | {
          type: 'captureMessage';
          payload: {
              message: string;
              level: 'error' | 'warning';
              tags: Record<string, string | number>;
              extra: Record<string, string | number>;
          };
      }
    | { type: 'defaultMailtoChecked'; payload: DefaultProtocol };
export type IPCInboxHostUpdateMessageType = string & IPCInboxHostUpdateMessage['type'];
export type IPCInboxHostUpdateMessagePayload = IPCInboxHostUpdateMessage['payload'];
export type IPCInboxHostUpdateListener = (payload: IPCInboxHostUpdateMessagePayload) => void;
export type IPCInboxHostUpdateListenerRemover = { removeListener: () => void };

// THIS NEEDS REFACTOR: inda-refactor-001
// The orininal idea for `on` function was that this type will be defined by
// generic T extends IPCInboxHostUpdateMessageType, but it makes it messy
// because generic doesn't pick one value but also union of all possible types
// and therefore payload and callback need to accpet all.
export type IPCInboxHostUpdateListenerAdder = (
    eventType: IPCInboxHostUpdateMessageType,
    callback: IPCInboxHostUpdateListener
) => IPCInboxHostUpdateListenerRemover;

// THIS NEEDS REFACTOR: inda-refactor-001
// Either avoid this function completelly or at least implemet it in zod.
export function isValidHostUpdateMessage(
    data: unknown
): { success: false; error: string } | { success: true; data: IPCInboxHostUpdateMessage } {
    if (!data) {
        return { success: false, error: 'is null' };
    }
    if (typeof data !== 'object') {
        return { success: false, error: 'not an object' };
    }

    if (!('type' in data)) {
        return { success: false, error: 'not have type' };
    }

    if (typeof data.type !== 'string') {
        return { success: false, error: 'have non-string type' };
    }

    if (!('payload' in data)) {
        return { success: false, error: 'not have payload' };
    }

    const allowedTypes = ['captureMessage', 'defaultMailtoChecked'];
    if (allowedTypes.indexOf(data.type) > -1) {
        return { success: true, data: data as IPCInboxHostUpdateMessage };
    }

    return { success: false, error: `unknown type ${data.type}` };
}

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
    on?: IPCInboxHostUpdateListenerAdder;
    send?: <T extends IPCInboxClientUpdateMessageType>(
        type: T,
        payload: Extract<IPCInboxClientUpdateMessage, { type: T }>['payload']
    ) => void;
};

export type PayloadOfHostUpdateType<T extends IPCInboxHostUpdateMessageType> = Extract<
    IPCInboxHostUpdateMessage,
    { type: T }
>['payload'];

// Assuming that broker was added as window object.
export function addIPCHostUpdateListener<T extends IPCInboxHostUpdateMessageType>(
    eventType: T,
    callback: (payload: PayloadOfHostUpdateType<T>) => void
): IPCInboxHostUpdateListenerRemover {
    // THIS NEEDS REFACTOR inda-refactor-001
    // This shouldn't be needed, better to avoid it with custom type-safe event emmiter
    //
    // With generic T we make sure first correct callback type is added to
    // correct event type. But the `on` function must accept union of callbacks.
    const unsafeCallback = callback as IPCInboxHostUpdateListener;
    return window.ipcInboxMessageBroker!.on!(eventType, unsafeCallback);
}

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
