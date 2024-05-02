import type { ImportProvider } from '@proton/pass/lib/import/types';
import type { PassPlanResponse } from '@proton/pass/types';

export type TelemetryPlatform = 'browser' | 'any';

export enum TelemetryEventName {
    AutofillDisplay = 'autofill.display',
    AutofillTriggered = 'autofill.triggered',
    AutosaveDisplay = 'autosave.display',
    AutosaveDone = 'autosave.done',
    AutosuggestAliasCreated = 'autosuggest.alias_created',
    ImportCompletion = 'import.complete',
    ItemCreation = 'item.creation',
    ItemDeletion = 'item.deletion',
    ItemRead = 'item.read',
    ItemUpdate = 'item.update',
    PasskeyAuthSuccess = 'passkey.auth_done',
    PasskeyCreated = 'passkey.create_done',
    PasskeyCreateDisplay = 'passkey.create_prompt_display',
    PasskeysSuggestionsDisplay = 'passkey.display_suggestions',
    PassMonitorDisplayHome = 'pass_monitor.display_home',
    PassMonitorDisplayWeakPasswords = 'pass_monitor.display_weak_passwords',
    PassMonitorDisplayReusedPasswords = 'pass_monitor.display_reused_passwords',
    PassMonitorDisplayMissing2FA = 'pass_monitor.display_missing_2fa',
    PassMonitorDisplayExcludedItems = 'pass_monitor.display_excluded_items',
    PassMonitorDisplayDarkWebMonitoring = 'pass_monitor.display_dark_web_monitoring',
    PassMonitorDisplayMonitoringProtonAddresses = 'pass_monitor.display_monitoring_proton_addresses',
    PassMonitorDisplayMonitoringEmailAliases = 'pass_monitor.display_monitoring_email_aliases',
    PassMonitorAddCustomEmailFromSuggestion = 'pass_monitor.add_custom_email_from_suggestion',
    PassMonitorItemDetailFromWeakPassword = 'pass_monitor.item_detail_from_weak_password',
    PassMonitorItemDetailFromMissing2FA = 'pass_monitor.item_detail_from_missing_2fa',
    PassMonitorItemDetailFromReusedPassword = 'pass_monitor.item_detail_from_reused_password',
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
}

type BaseTelemetryEvent<T extends TelemetryEventName, V = {}, D = {}> = {
    MeasurementGroup: `pass.${TelemetryPlatform}.user_actions`;
    Event: T;
    Values: V;
    Dimensions: { user_tier?: PassPlanResponse['InternalName'] } & D;
} & T;

type AutofillSource = 'source' | 'app';

export type TelemetryEvent<T extends TelemetryEventName = TelemetryEventName> = Extract<
    {
        [TelemetryEventName.AutofillDisplay]: BaseTelemetryEvent<T, {}, { location: AutofillSource }>;
        [TelemetryEventName.AutofillTriggered]: BaseTelemetryEvent<T, {}, { location: AutofillSource }>;
        [TelemetryEventName.AutosaveDisplay]: BaseTelemetryEvent<T>;
        [TelemetryEventName.AutosaveDone]: BaseTelemetryEvent<T>;
        [TelemetryEventName.AutosuggestAliasCreated]: BaseTelemetryEvent<T>;
        [TelemetryEventName.ImportCompletion]: BaseTelemetryEvent<
            T,
            { item_count: number; vaults: number },
            { source: ImportProvider }
        >;
        [TelemetryEventName.ItemCreation]: BaseTelemetryEvent<T, {}, { type: TelemetryItemType }>;
        [TelemetryEventName.ItemDeletion]: BaseTelemetryEvent<T, {}, { type: TelemetryItemType }>;
        [TelemetryEventName.ItemRead]: BaseTelemetryEvent<T, {}, { type: TelemetryItemType }>;
        [TelemetryEventName.ItemUpdate]: BaseTelemetryEvent<T, {}, { type: TelemetryItemType }>;
        [TelemetryEventName.PasskeyAuthSuccess]: BaseTelemetryEvent<T>;
        [TelemetryEventName.PasskeyCreated]: BaseTelemetryEvent<T>;
        [TelemetryEventName.PasskeyCreateDisplay]: BaseTelemetryEvent<T>;
        [TelemetryEventName.PasskeysSuggestionsDisplay]: BaseTelemetryEvent<T>;
        [TelemetryEventName.PassMonitorDisplayHome]: BaseTelemetryEvent<T>;
        [TelemetryEventName.PassMonitorDisplayWeakPasswords]: BaseTelemetryEvent<T>;
        [TelemetryEventName.PassMonitorDisplayReusedPasswords]: BaseTelemetryEvent<T>;
        [TelemetryEventName.PassMonitorDisplayMissing2FA]: BaseTelemetryEvent<T>;
        [TelemetryEventName.PassMonitorDisplayExcludedItems]: BaseTelemetryEvent<T>;
        [TelemetryEventName.PassMonitorDisplayDarkWebMonitoring]: BaseTelemetryEvent<T>;
        [TelemetryEventName.PassMonitorDisplayMonitoringProtonAddresses]: BaseTelemetryEvent<T>;
        [TelemetryEventName.PassMonitorDisplayMonitoringEmailAliases]: BaseTelemetryEvent<T>;
        [TelemetryEventName.PassMonitorAddCustomEmailFromSuggestion]: BaseTelemetryEvent<T>;
        [TelemetryEventName.PassMonitorItemDetailFromWeakPassword]: BaseTelemetryEvent<T>;
        [TelemetryEventName.PassMonitorItemDetailFromMissing2FA]: BaseTelemetryEvent<T>;
        [TelemetryEventName.PassMonitorItemDetailFromReusedPassword]: BaseTelemetryEvent<T>;
        [TelemetryEventName.SearchClick]: BaseTelemetryEvent<T>;
        [TelemetryEventName.SearchTriggered]: BaseTelemetryEvent<T>;
        [TelemetryEventName.TwoFAAutofill]: BaseTelemetryEvent<T>;
        [TelemetryEventName.TwoFACreation]: BaseTelemetryEvent<T>;
        [TelemetryEventName.TwoFADisplay]: BaseTelemetryEvent<T>;
        [TelemetryEventName.TwoFAUpdate]: BaseTelemetryEvent<T>;
    }[T],
    T
>;
