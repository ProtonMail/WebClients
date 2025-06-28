import type { ImportProvider } from '@proton/pass/lib/import/types';
import type { InAppNotification, PassPlanResponse } from '@proton/pass/types';
import type { TelemetryInAppNotificationStatus } from '@proton/pass/types/data/notification';

export type TelemetryPlatform = 'browser' | 'any';

export enum TelemetryEventName {
    AutofillDisplay = 'autofill.display',
    AutofillTriggered = 'autofill.triggered',
    AutosaveDismissed = 'autosave.dismissed',
    AutosaveDisplay = 'autosave.display',
    AutosaveDone = 'autosave.done',
    AutosuggestAliasCreated = 'autosuggest.alias_created',
    ErrorResumingSession = 'error.resuming_session',
    ExtensionCopiedFromLogin = 'extension.copied_from_login',
    ExtensionUsed = 'extension.used',
    ImportCompletion = 'import.complete',
    ItemCreation = 'item.creation',
    ItemDeletion = 'item.deletion',
    ItemRead = 'item.read',
    ItemUpdate = 'item.update',
    PasskeyAuthSuccess = 'passkey.auth_done',
    PasskeyCreated = 'passkey.create_done',
    PasskeyCreateDisplay = 'passkey.create_prompt_display',
    PasskeysSuggestionsDisplay = 'passkey.display_suggestions',
    PassFileUploaded = 'pass_file_attachment.file_uploaded',
    PassMonitorAddCustomEmailFromSuggestion = 'pass_monitor.add_custom_email_from_suggestion',
    PassMonitorDisplayDarkWebMonitoring = 'pass_monitor.display_dark_web_monitoring',
    PassMonitorDisplayExcludedItems = 'pass_monitor.display_excluded_items',
    PassMonitorDisplayHome = 'pass_monitor.display_home',
    PassMonitorDisplayMissing2FA = 'pass_monitor.display_missing_2fa',
    PassMonitorDisplayMonitoringEmailAliases = 'pass_monitor.display_monitoring_email_aliases',
    PassMonitorDisplayMonitoringProtonAddresses = 'pass_monitor.display_monitoring_proton_addresses',
    PassMonitorDisplayReusedPasswords = 'pass_monitor.display_reused_passwords',
    PassMonitorDisplayWeakPasswords = 'pass_monitor.display_weak_passwords',
    PassMonitorItemDetailFromMissing2FA = 'pass_monitor.item_detail_from_missing_2fa',
    PassMonitorItemDetailFromReusedPassword = 'pass_monitor.item_detail_from_reused_password',
    PassMonitorItemDetailFromWeakPassword = 'pass_monitor.item_detail_from_weak_password',
    PassNotificationChangeStatus = 'pass_notifications.change_notification_status',
    PassNotificationCTAClick = 'pass_notifications.notification_cta_click',
    PassNotificationDisplay = 'pass_notifications.display_notification',
    SearchClick = 'search.click',
    SearchTriggered = 'search.triggered',
    TwoFAAutofill = '2fa.autofill',
    TwoFACreation = '2fa.creation',
    TwoFADisplay = '2fa.display',
    TwoFAUpdate = '2fa.update',
}

export enum TelemetryItemType {
    note = 'note',
    login = 'login',
    alias = 'alias',
    creditCard = 'credit_card',
    identity = 'identity',
    sshKey = 'ssh_key',
    wifi = 'wifi',
    custom = 'custom',
}

export enum TelemetryFieldType {
    email = 'email',
    username = 'username',
    password = 'password',
    totp = 'totp',
    note = 'note',
    customField = 'custom_field',
}

/** Telemetry payloads support only ints and strings */
type TelemetryDimensions = Record<string, string>;
type TelemetryValues = Record<string, number>;

export type BaseTelemetryEvent<
    T extends TelemetryEventName,
    V extends TelemetryValues = {},
    D extends TelemetryDimensions = {},
> = {
    MeasurementGroup: `pass.${TelemetryPlatform}.user_actions`;
    Event: T;
    Values: V;
    Dimensions: { user_tier?: PassPlanResponse['InternalName'] } & D;
};

export type ExtensionCopiedFromLoginDimensions = {
    extensionField: TelemetryFieldType;
    hasLoginItemForCurrentWebsite: string;
    extensionCopiedFromCurrentPage: string;
    autofillLoginFormDetected: string;
    loginAutofillEnabled: string;
    uniqueMatch: string;
    autofillPaused: string;
    modelVersion: string;
};

type ImportValues = { item_count: number; vaults: number };

type ImportDimensions = { source: ImportProvider };
type ItemDimensions = { type: TelemetryItemType };
type ExtensionUsedDimensions = { modelVersion: string };
type FileDimensions = { mimeType: string };
type NotificationDimensions = { notificationKey: InAppNotification['NotificationKey'] };
type NotificationChangeDimensions = NotificationDimensions & { notificationStatus: TelemetryInAppNotificationStatus };
type AutofillDimensions = { location: 'source' | 'app' };
type AutosaveDismissedDimensions = { dismissReason: 'not_now' | 'close' | 'disable'; modelVersion: string };
type ErrorResumingSessionDimensions = { extensionBrowser: string; extensionReloadRequired: string };

type TelemetryEvents =
    | BaseTelemetryEvent<TelemetryEventName.AutofillDisplay, {}, AutofillDimensions>
    | BaseTelemetryEvent<TelemetryEventName.AutofillTriggered, {}, AutofillDimensions>
    | BaseTelemetryEvent<TelemetryEventName.AutosaveDismissed, {}, AutosaveDismissedDimensions>
    | BaseTelemetryEvent<TelemetryEventName.AutosaveDisplay>
    | BaseTelemetryEvent<TelemetryEventName.AutosaveDone>
    | BaseTelemetryEvent<TelemetryEventName.AutosuggestAliasCreated>
    | BaseTelemetryEvent<TelemetryEventName.ErrorResumingSession, {}, ErrorResumingSessionDimensions>
    | BaseTelemetryEvent<TelemetryEventName.ExtensionCopiedFromLogin, {}, ExtensionCopiedFromLoginDimensions>
    | BaseTelemetryEvent<TelemetryEventName.ExtensionUsed, {}, ExtensionUsedDimensions>
    | BaseTelemetryEvent<TelemetryEventName.ImportCompletion, ImportValues, ImportDimensions>
    | BaseTelemetryEvent<TelemetryEventName.ItemCreation, {}, ItemDimensions>
    | BaseTelemetryEvent<TelemetryEventName.ItemDeletion, {}, ItemDimensions>
    | BaseTelemetryEvent<TelemetryEventName.ItemRead, {}, ItemDimensions>
    | BaseTelemetryEvent<TelemetryEventName.ItemUpdate, {}, ItemDimensions>
    | BaseTelemetryEvent<TelemetryEventName.PasskeyAuthSuccess>
    | BaseTelemetryEvent<TelemetryEventName.PasskeyCreated>
    | BaseTelemetryEvent<TelemetryEventName.PasskeyCreateDisplay>
    | BaseTelemetryEvent<TelemetryEventName.PasskeysSuggestionsDisplay>
    | BaseTelemetryEvent<TelemetryEventName.PassFileUploaded, {}, FileDimensions>
    | BaseTelemetryEvent<TelemetryEventName.PassMonitorAddCustomEmailFromSuggestion>
    | BaseTelemetryEvent<TelemetryEventName.PassMonitorDisplayDarkWebMonitoring>
    | BaseTelemetryEvent<TelemetryEventName.PassMonitorDisplayExcludedItems>
    | BaseTelemetryEvent<TelemetryEventName.PassMonitorDisplayHome>
    | BaseTelemetryEvent<TelemetryEventName.PassMonitorDisplayMissing2FA>
    | BaseTelemetryEvent<TelemetryEventName.PassMonitorDisplayMonitoringEmailAliases>
    | BaseTelemetryEvent<TelemetryEventName.PassMonitorDisplayMonitoringProtonAddresses>
    | BaseTelemetryEvent<TelemetryEventName.PassMonitorDisplayReusedPasswords>
    | BaseTelemetryEvent<TelemetryEventName.PassMonitorDisplayWeakPasswords>
    | BaseTelemetryEvent<TelemetryEventName.PassMonitorItemDetailFromMissing2FA>
    | BaseTelemetryEvent<TelemetryEventName.PassMonitorItemDetailFromReusedPassword>
    | BaseTelemetryEvent<TelemetryEventName.PassMonitorItemDetailFromWeakPassword>
    | BaseTelemetryEvent<TelemetryEventName.PassNotificationChangeStatus, {}, NotificationChangeDimensions>
    | BaseTelemetryEvent<TelemetryEventName.PassNotificationCTAClick, {}, NotificationDimensions>
    | BaseTelemetryEvent<TelemetryEventName.PassNotificationDisplay, {}, NotificationDimensions>
    | BaseTelemetryEvent<TelemetryEventName.SearchClick>
    | BaseTelemetryEvent<TelemetryEventName.SearchTriggered>
    | BaseTelemetryEvent<TelemetryEventName.TwoFAAutofill>
    | BaseTelemetryEvent<TelemetryEventName.TwoFACreation>
    | BaseTelemetryEvent<TelemetryEventName.TwoFADisplay>
    | BaseTelemetryEvent<TelemetryEventName.TwoFAUpdate>;

export type TelemetryEvent<T extends TelemetryEventName = TelemetryEventName> = Extract<TelemetryEvents, { Event: T }>;

type TelemetryEventExtra = {
    [TelemetryEventName.ExtensionCopiedFromLogin]: {
        extensionField: TelemetryFieldType;
        itemUrls: string[];
    };
};

export type TelemetryEventDTO<T extends TelemetryEventName = TelemetryEventName> = {
    event: TelemetryEvent<T>;
    extra?: T extends keyof TelemetryEventExtra ? TelemetryEventExtra[T] : never;
};

export type OnTelemetryEvent = <T extends TelemetryEventName = TelemetryEventName>(
    Event: T,
    Values: TelemetryEvent<T>['Values'],
    Dimensions: TelemetryEvent<T>['Dimensions'],
    platform?: TelemetryPlatform,
    extra?: TelemetryEventDTO<T>['extra']
) => void;
