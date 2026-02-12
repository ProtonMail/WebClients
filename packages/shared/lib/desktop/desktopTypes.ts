import { z } from 'zod';

import type { HttpsProtonMeDesktopInboxHeartbeatTotalV1SchemaJson } from '@proton/metrics/types/desktop_inbox_heartbeat_total_v1.schema';
import type { Environment } from '@proton/shared/lib/interfaces';
import type { ColorScheme } from '@proton/shared/lib/themes/constants';

import type { ThemeSetting } from '../themes/themes';
import { type DailyStatsStored, zDailyStatsReport } from './DailyStats';
import { type DefaultProtocol, zDefaultProtocol } from './DefaultProtocol';
import type { AppVersion, DesktopVersion } from './DesktopVersion';

export type CHANGE_VIEW_TARGET = 'mail' | 'calendar' | 'account';
export type ElectronNotification = {
    title: string;
    body: string;
    app: CHANGE_VIEW_TARGET;
    elementID?: string;
    messageID?: string;
    labelID?: string;
};

export type ESUserChoice = boolean | null;

// This type must be updated in the Electron application as well
export type IPCInboxDesktopFeature =
    | 'ThemeSelection'
    | 'InAppPayments'
    | 'EarlyAccess'
    | 'MultiAccount'
    | 'LatestVersionCheck'
    | 'InstallSource'
    | 'MailtoTelemetry'
    | 'MailtoUpdate'
    | 'ESUserChoice'
    | 'FullTheme'
    | 'StoreVersion'
    | 'HeartbeatMetrics'
    | 'StatsTelemetry'
    | 'RestrictedThemeSelection'
    | 'ClearAppModal'
    | 'SnapSupport'
    | 'BugReportLogAttachments'
    | 'PrintDialog'
    | 'UserLogoutV2';
export type IPCInboxGetInfoMessage =
    | { type: 'theme'; result: ThemeSetting }
    | { type: 'latestVersion'; result: DesktopVersion | null }
    | { type: 'isSnap'; result: boolean | null }
    | { type: 'snapRevision'; result: string }
    | { type: 'installSource'; result: string | null }
    | { type: 'defaultMailto'; result: DefaultProtocol }
    | { type: 'defaultMailtoBannerDismissed'; result: boolean }
    | { type: 'colorScheme'; result: ColorScheme }
    | { type: 'getAllAppVersions'; result: string }
    | { type: 'dailyStats'; result: DailyStatsStored };
export type IPCInboxGetUserInfoMessage = { type: 'esUserChoice'; result: ESUserChoice };
export type IPCInboxClientUpdateMessage =
    | { type: 'updateNotification'; payload: number }
    | { type: 'userLogin'; payload?: undefined }
    | { type: 'userLogout'; payload?: undefined } // Deprecated by `userLogoutV2`; older desktop clients still rely on the message.
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
    | { type: 'setDefaultMailto'; payload?: undefined }
    | { type: 'setShouldCheckDefaultMailto'; payload: boolean }
    | { type: 'checkDailyStatsAndSignal'; payload?: undefined }
    | { type: 'setDefaultMailtoBannerDismissed'; payload: boolean }
    | { type: 'defaultMailtoTelemetryReported'; payload: number }
    | { type: 'dailyStatsReported'; payload: number }
    | { type: 'setESUserChoice'; payload: { userID: string; userChoice: boolean } }
    | { type: 'storeAppVersion'; payload: AppVersion }
    | { type: 'triggerCrash'; payload?: undefined }
    | { type: 'reportTestingError'; payload?: undefined }
    | { type: 'metricsListenerChanged'; payload: 'ready' | 'removed' }
    | { type: 'toggleAppCache'; payload: boolean }
    | { type: 'togglePrintDialog'; payload: string }
    | { type: 'userLogoutV2'; payload: string }
    | { type: 'logoutAllUsers'; payload?: undefined };
export type IPCInboxClientGetAsyncDataMessage = {
    type: 'getElectronLogs';
    args: [maxSize?: number];
    result: Uint8Array<ArrayBuffer> | null;
};
export type IPCInboxClientUpdateMessageType = IPCInboxClientUpdateMessage['type'];

export const IPCInboxHostUpdateMessageSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('defaultMailtoChecked'),
        payload: zDefaultProtocol,
    }),
    z.object({
        type: z.literal('dailyStatsChecked'),
        payload: zDailyStatsReport,
    }),
    z.object({
        type: z.literal('sentHeartbeatMetrics'),
        payload: z.custom<HttpsProtonMeDesktopInboxHeartbeatTotalV1SchemaJson>(),
    }),
]);

export type IPCInboxHostUpdateMessage = z.infer<typeof IPCInboxHostUpdateMessageSchema>;
export type IPCInboxHostUpdateMessageType = IPCInboxHostUpdateMessage['type'];
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
    getUserInfo?: <T extends IPCInboxGetUserInfoMessage['type']>(
        type: T,
        userID: string
    ) => Extract<IPCInboxGetUserInfoMessage, { type: T }>['result'];

    getAsyncData?: <T extends IPCInboxClientGetAsyncDataMessage['type']>(
        type: T,
        ...args: Extract<IPCInboxClientGetAsyncDataMessage, { type: T }>['args']
    ) => Promise<Extract<IPCInboxClientGetAsyncDataMessage, { type: T }>['result']>;

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
