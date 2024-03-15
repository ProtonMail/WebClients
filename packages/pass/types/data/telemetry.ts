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
        [TelemetryEventName.SearchClick]: BaseTelemetryEvent<T>;
        [TelemetryEventName.SearchTriggered]: BaseTelemetryEvent<T>;
        [TelemetryEventName.TwoFAAutofill]: BaseTelemetryEvent<T>;
        [TelemetryEventName.TwoFACreation]: BaseTelemetryEvent<T>;
        [TelemetryEventName.TwoFADisplay]: BaseTelemetryEvent<T>;
        [TelemetryEventName.TwoFAUpdate]: BaseTelemetryEvent<T>;
    }[T],
    T
>;
