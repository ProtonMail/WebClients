import type { ImportProvider } from '@proton/pass/lib/import/types';
import type { PassPlanResponse } from '@proton/pass/types';


export type TelemetryPlatform = 'browser' | 'any';

export enum TelemetryEventName {
    ItemCreation = 'item.creation',
    ItemUpdate = 'item.update',
    ItemRead = 'item.read',
    ItemDeletion = 'item.deletion',
    AutosuggestAliasCreated = 'autosuggest.alias_created',
    ImportCompletion = 'import.complete',
    AutosaveDone = 'autosave.done',
    AutosaveDisplay = 'autosave.display',
    AutofillDisplay = 'autofill.display',
    AutofillTriggered = 'autofill.triggered',
    SearchTriggered = 'search.triggered',
    SearchClick = 'search.click',
    TwoFAAutofill = '2fa.autofill',
    TwoFADisplay = '2fa.display',
    TwoFACreation = '2fa.creation',
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
        [TelemetryEventName.ItemCreation]: BaseTelemetryEvent<T, {}, { type: TelemetryItemType }>;
        [TelemetryEventName.ItemUpdate]: BaseTelemetryEvent<T, {}, { type: TelemetryItemType }>;
        [TelemetryEventName.ItemRead]: BaseTelemetryEvent<T, {}, { type: TelemetryItemType }>;
        [TelemetryEventName.ItemDeletion]: BaseTelemetryEvent<T, {}, { type: TelemetryItemType }>;
        [TelemetryEventName.AutosuggestAliasCreated]: BaseTelemetryEvent<T>;
        [TelemetryEventName.AutosaveDisplay]: BaseTelemetryEvent<T>;
        [TelemetryEventName.AutosaveDone]: BaseTelemetryEvent<T>;
        [TelemetryEventName.AutofillDisplay]: BaseTelemetryEvent<T, {}, { location: AutofillSource }>;
        [TelemetryEventName.AutofillTriggered]: BaseTelemetryEvent<T, {}, { location: AutofillSource }>;
        [TelemetryEventName.SearchTriggered]: BaseTelemetryEvent<T>;
        [TelemetryEventName.SearchClick]: BaseTelemetryEvent<T>;
        [TelemetryEventName.ImportCompletion]: BaseTelemetryEvent<
            T,
            { item_count: number; vaults: number },
            { source: ImportProvider }
        >;
        [TelemetryEventName.TwoFAAutofill]: BaseTelemetryEvent<T>;
        [TelemetryEventName.TwoFADisplay]: BaseTelemetryEvent<T>;
        [TelemetryEventName.TwoFACreation]: BaseTelemetryEvent<T>;
        [TelemetryEventName.TwoFAUpdate]: BaseTelemetryEvent<T>;
    }[T],
    T
>;
