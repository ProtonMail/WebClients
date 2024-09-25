// import { z } from 'zod';
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

/*
const zCaptureMessage = z.object({
    type: z.literal('captureMessage'),
    payload: z.object({
        messages: z.string(),
        level: z.literal('error').or(z.literal('warning')),
        tags: z.record(z.string(), z.string().or(z.number())),
        extra: z.record(z.string(), z.string().or(z.number())),
    }),
});
const zDefaultMailtoChecked = z.object({
    type: z.literal('defaultMailtoChecked'),
    payload: zDefaultProtocol,
});
const zIPCInboxHostUpdateMessage = z.union([zCaptureMessage, zDefaultMailtoChecked]);

export const isValidHostUpdateMessage = zIPCInboxHostUpdateMessage.safeParse;
export type IPCInboxHostUpdateMessage = z.infer<typeof zIPCInboxHostUpdateMessage>;
*/

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
    | {
          type: 'defaultMailtoChecked';
          payload: DefaultProtocol;
      };

export type IPCInboxHostUpdateMessageType = string & IPCInboxHostUpdateMessage['type'];
export type PayloadOfIPCInboxHostUpdateType<T extends IPCInboxHostUpdateMessageType> = Extract<
    IPCInboxHostUpdateMessage,
    { type: T }
>['payload'];
export type IPCInboxHostUpdateListener<T extends IPCInboxHostUpdateMessageType> = (
    data: PayloadOfIPCInboxHostUpdateType<T>
) => void;

export type IPCInboxHostUpdateListenerAdder<T extends IPCInboxHostUpdateMessageType> = (
    type: T,
    callback: IPCInboxHostUpdateListener<T>
) => IPCInboxHostUpdateListenerRemover;
export type IPCInboxHostUpdateListenerRemover = { removeListener: () => void };

export function isValidHostUpdateMessage(
    data: unknown
): { success: false; error: string } | { success: true; data: IPCInboxHostUpdateMessage } {
    // FIXME(jcuth): implement at least some level of checks
    if (!data) {
        return { success: false, error: 'is null' };
    }
    if (typeof data !== 'object') {
        return { success: false, error: 'not an object' };
    }

    if (!('type' in data)) {
        return { success: false, error: 'not have type' };
    }

    if (!('payload' in data)) {
        return { success: false, error: 'not have payload' };
    }

    switch (data.type) {
        case 'captureMessage':
            return { success: true, data: data as IPCInboxHostUpdateMessage };
        case 'defaultMailtoChecked':
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
    // THIS DOESN'T WORK: on?: IPCInboxHostUpdateListenerAdder<IPCInboxHostUpdateMessageType>;
    // THIS DOESN'T WORK: on?: IPCInboxHostUpdateListenerAdder<'captureMessage'> | IPCInboxHostUpdateListenerAdder<'defaultMailtoChecked'>;
    on?: IPCInboxHostUpdateListenerAdder<IPCInboxHostUpdateMessageType>;
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
