import type {
    OnePassLegacySection,
    OnePassLegacySectionField,
} from '@proton/pass/lib/import/providers/1password.1pif.types';
import {
    type ItemSection,
    type OnePassField,
    OnePassFieldKey,
    type OnePassFields,
} from '@proton/pass/lib/import/providers/1password.1pux.types';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { ItemContent, Maybe, MaybeNull } from '@proton/pass/types';
import { objectKeys } from '@proton/pass/utils/object/generic';
import { epochToDate } from '@proton/pass/utils/time/format';

import type { IdentityDictionary, IdentityRecord, OnePassFieldValue, OnePassFieldValueFactory } from './builders.types';

const fixedSections = ['name', 'address', 'internet'];
const addressKeys = ['street', 'city', 'country', 'zip', 'state'];

const onePasswordDictionary: IdentityDictionary = {
    address1: 'streetAddress',
    busphone: 'workPhoneNumber',
    birthdate: 'birthdate',
    cellphone: 'secondPhoneNumber',
    city: 'city',
    company: 'organization',
    country: 'countryOrRegion',
    defphone: 'phoneNumber',
    email: 'email',
    firstname: 'firstName',
    gender: 'gender',
    jobtitle: 'jobTitle',
    lastname: 'lastName',
    state: 'stateOrProvince',
    street: 'streetAddress',
    website: 'website',
    yahoo: 'yahoo',
    zip: 'zipOrPostalCode',
};

export const formatCCExpirationDate = (monthYear: Maybe<number>): string => {
    const monthYearString = String(monthYear);
    if (!monthYear || monthYearString.length !== 6) return '';
    return `${monthYearString.slice(4, 6)}${monthYearString.slice(0, 4)}`;
};

const onePassValueFactory: OnePassFieldValueFactory = {
    [OnePassFieldKey.ADDRESS]: (address: MaybeNull<Record<string, string>>) =>
        addressKeys.reduce<IdentityRecord[]>((acc, key) => {
            const field = onePasswordDictionary[key];
            return field ? [...acc, { [field]: address?.[key] ?? '' }] : acc;
        }, []),
    [OnePassFieldKey.DATE]: epochToDate,
    [OnePassFieldKey.MONTH_YEAR]: (value: number) => formatCCExpirationDate(value),
};

export const getValue = <K extends OnePassFieldKey>(fields: OnePassFields, key: K): OnePassFieldValue<K> => {
    const factory = onePassValueFactory[key];
    const value = fields[key];
    return (factory?.(value) ?? String(value)) as OnePassFieldValue<K>;
};

const build1PassBaseIdentity =
    <T, S extends OnePassLegacySection | ItemSection>(
        reducer: (acc: Partial<ItemContent<'identity'>>, field: T) => Partial<ItemContent<'identity'>>
    ) =>
    (sections?: S[]): ItemContent<'identity'> => {
        const emptyIdentity = itemBuilder('identity').data.content;
        if (!sections) return emptyIdentity;

        return sections.reduce<ItemContent<'identity'>>((acc, { name, fields }) => {
            // Support extra sections in next version
            if (!fixedSections.includes(name) || !fields) return acc;
            return { ...acc, ...fields.reduce(reducer as any, {}) };
        }, emptyIdentity);
    };

export const build1PassLegacyIdentity = build1PassBaseIdentity<OnePassLegacySectionField, OnePassLegacySection>(
    (acc: Partial<ItemContent<'identity'>>, { n, v }) => {
        const identityFieldName = onePasswordDictionary[n];
        return identityFieldName ? { ...acc, [identityFieldName]: v ?? '' } : acc;
    }
);

export const build1PassIdentity = build1PassBaseIdentity<OnePassField, ItemSection>(
    (acc: Partial<ItemContent<'identity'>>, { id, value }) => {
        const [valueKey] = objectKeys<OnePassFieldKey>(value);

        if (valueKey === OnePassFieldKey.ADDRESS) {
            return getValue(value, valueKey).reduce((fields, field) => ({ ...fields, ...field }), acc);
        }

        const identityFieldName = onePasswordDictionary[id];
        return identityFieldName ? { ...acc, [identityFieldName]: getValue(value, valueKey) } : acc;
    }
);
