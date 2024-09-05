import type { ImportProvider } from '@proton/pass/lib/import/types';
import type { PassPlanResponse } from '@proton/pass/types';

export type TelemetryPlatform = 'browser' | 'any';

export enum TelemetryEventName {
    AutofillDisplay = 'autofill.display',
    AutofillTriggered = 'autofill.triggered',
    AutosaveDisplay = 'autosave.display',
    AutosaveDone = 'autosave.done',
    AutosuggestAliasCreated = 'autosuggest.alias_created',
    ErrorResumingSession = 'error.resuming_session',
    ImportCompletion = 'import.complete',
    ItemCreation = 'item.creation',
    ItemDeletion = 'item.deletion',
    ItemRead = 'item.read',
    ItemUpdate = 'item.update',
    PasskeyAuthSuccess = 'passkey.auth_done',
    PasskeyCreated = 'passkey.create_done',
    PasskeyCreateDisplay = 'passkey.create_prompt_display',
    PasskeysSuggestionsDisplay = 'passkey.display_suggestions',
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
    PassSettingsDisplayUsername = 'pass_settings.display_username',
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
}

export type BaseTelemetryEvent<T extends TelemetryEventName, V = {}, D = {}> = {
    MeasurementGroup: `pass.${TelemetryPlatform}.user_actions`;
    Event: T;
    Values: V;
    Dimensions: { user_tier?: PassPlanResponse['InternalName'] } & D;
};

type ImportValues = { item_count: number; vaults: number };
type ImportDimensions = { source: ImportProvider };
type ItemDimensions = { type: TelemetryItemType };
type AutofillDimensions = { location: 'source' | 'app' };
type SettingValues = { checked: boolean };
type ErrorResumingSessionDimensions = { extensionBrowser: string; extensionReloadRequired: boolean };

type TelemetryEvents =
    | BaseTelemetryEvent<TelemetryEventName.AutofillDisplay, {}, AutofillDimensions>
    | BaseTelemetryEvent<TelemetryEventName.AutofillTriggered, {}, AutofillDimensions>
    | BaseTelemetryEvent<TelemetryEventName.AutosaveDisplay>
    | BaseTelemetryEvent<TelemetryEventName.AutosaveDone>
    | BaseTelemetryEvent<TelemetryEventName.AutosuggestAliasCreated>
    | BaseTelemetryEvent<TelemetryEventName.ErrorResumingSession, {}, ErrorResumingSessionDimensions>
    | BaseTelemetryEvent<TelemetryEventName.ImportCompletion, ImportValues, ImportDimensions>
    | BaseTelemetryEvent<TelemetryEventName.ItemCreation, {}, ItemDimensions>
    | BaseTelemetryEvent<TelemetryEventName.ItemDeletion, {}, ItemDimensions>
    | BaseTelemetryEvent<TelemetryEventName.ItemRead, {}, ItemDimensions>
    | BaseTelemetryEvent<TelemetryEventName.ItemUpdate, {}, ItemDimensions>
    | BaseTelemetryEvent<TelemetryEventName.PasskeyAuthSuccess>
    | BaseTelemetryEvent<TelemetryEventName.PasskeyCreated>
    | BaseTelemetryEvent<TelemetryEventName.PasskeyCreateDisplay>
    | BaseTelemetryEvent<TelemetryEventName.PasskeysSuggestionsDisplay>
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
    | BaseTelemetryEvent<TelemetryEventName.PassSettingsDisplayUsername, SettingValues>
    | BaseTelemetryEvent<TelemetryEventName.SearchClick>
    | BaseTelemetryEvent<TelemetryEventName.SearchTriggered>
    | BaseTelemetryEvent<TelemetryEventName.TwoFAAutofill>
    | BaseTelemetryEvent<TelemetryEventName.TwoFACreation>
    | BaseTelemetryEvent<TelemetryEventName.TwoFADisplay>
    | BaseTelemetryEvent<TelemetryEventName.TwoFAUpdate>;

export type TelemetryEvent<T extends TelemetryEventName = TelemetryEventName> = Extract<TelemetryEvents, { Event: T }>;
