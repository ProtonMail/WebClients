import type { IdentityFieldName } from '@proton/pass/hooks/identity/useIdentityForm';
import type { OnePassFieldKey } from '@proton/pass/lib/import/providers/1password.1pux.types';

export type IdentityDictionary = { [key: string | number]: IdentityFieldName };
export type IdentityRecord = Partial<Record<IdentityFieldName, string>>;

export type OnePassFieldValue<K extends OnePassFieldKey> = K extends OnePassFieldKey.ADDRESS
    ? IdentityRecord[]
    : string;

export type OnePassFieldValueFactory = {
    [K in OnePassFieldKey]?: (...args: any) => OnePassFieldValue<K>;
};

export type OnePassLegacyFieldValueFactory = {
    [key: string]: (...args: any) => string;
};
