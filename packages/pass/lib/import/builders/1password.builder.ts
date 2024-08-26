import {
    type OnePassLegacySection,
    type OnePassLegacySectionField,
    OnePassLegacySectionFieldKey,
} from '@proton/pass/lib/import/providers/1password.1pif.types';
import type {
    OnePassField,
    OnePassFields,
    OnePassSection,
} from '@proton/pass/lib/import/providers/1password.1pux.types';
import { OnePassFieldKey } from '@proton/pass/lib/import/providers/1password.1pux.types';
import { type ItemBuilder, itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { IdentityFieldName, ItemContent, Maybe } from '@proton/pass/types';
import { objectKeys } from '@proton/pass/utils/object/generic';
import { epochToDate } from '@proton/pass/utils/time/format';

const ONE_PASS_FIXED_SECTIONS = ['name', 'address', 'internet'];
const ONE_PASS_ADDRESS_KEYS = ['street', 'city', 'country', 'zip', 'state'];

const ONE_PASS_IDENTITY_FIELD_MAP: Record<string, IdentityFieldName> = {
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

export const formatMonthYearDate = (monthYear: Maybe<number>): string => {
    const monthYearString = String(monthYear);
    if (!monthYear || monthYearString.length !== 6) return '';
    return `${monthYearString.slice(4, 6)}${monthYearString.slice(0, 4)}`;
};

export const formatFieldValue = (field: OnePassFields, key: OnePassFieldKey): string => {
    const value = field[key];
    if (!value) return '';

    switch (key) {
        case OnePassFieldKey.DATE:
            return epochToDate(field[key]!);
        case OnePassFieldKey.MONTH_YEAR:
            return formatMonthYearDate(field[key]!);
        default:
            return String(value);
    }
};

export const formatLegacySectionFieldValue = (field: OnePassLegacySectionField): string => {
    const value = field.v;
    if (!value) return '';

    switch (field.k) {
        case OnePassLegacySectionFieldKey.DATE:
            return epochToDate(field.v!);
        default:
            return String(value);
    }
};

const identityBuilderFactory =
    <Field, Section extends { name: string; fields?: Field[] }>(
        buildField: (item: ItemBuilder<'identity'>, field: Field) => void
    ) =>
    (sections?: Section[]): ItemContent<'identity'> => {
        const item = itemBuilder('identity');

        sections?.forEach(({ name, fields }) => {
            /* FIXME: Support extra sections in next version */
            if (!ONE_PASS_FIXED_SECTIONS.includes(name) || !fields) return item;
            fields.forEach((field) => buildField(item, field));
        });

        return item.data.content;
    };

export const build1PassIdentity = identityBuilderFactory<OnePassField, OnePassSection>((item, { id, value }) => {
    const [fieldKey] = objectKeys<OnePassFieldKey>(value);
    const fieldName = ONE_PASS_IDENTITY_FIELD_MAP[id];

    if (fieldKey === OnePassFieldKey.ADDRESS) {
        return ONE_PASS_ADDRESS_KEYS.forEach((key) => {
            const address = value[fieldKey];
            const field = ONE_PASS_IDENTITY_FIELD_MAP[key];
            if (field) item.set('content', (content) => content.set(field, address?.[key] ?? ''));
        });
    }

    if (fieldName) item.set('content', (content) => content.set(fieldName, formatFieldValue(value, fieldKey)));
});

export const build1PassLegacyIdentity = identityBuilderFactory<OnePassLegacySectionField, OnePassLegacySection>(
    (item, field) => {
        if (field.k === OnePassLegacySectionFieldKey.ADDRESS && field.v) {
            return Object.entries(field.v).forEach(([key, value]) => {
                const field = ONE_PASS_IDENTITY_FIELD_MAP[key];
                if (field) item.set('content', (content) => content.set(field, value ?? ''));
            });
        }

        const fieldName = ONE_PASS_IDENTITY_FIELD_MAP[field.n];
        if (fieldName) item.set('content', (content) => content.set(fieldName, formatLegacySectionFieldValue(field)));
    }
);
