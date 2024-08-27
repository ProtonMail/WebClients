import { c } from 'ttag';

import { type ItemBuilder, itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { IdentityFieldName, ItemContent, Maybe, MaybeNull, UnsafeItemExtraField } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { objectKeys } from '@proton/pass/utils/object/generic';
import { epochToDate } from '@proton/pass/utils/time/format';
import lastItem from '@proton/utils/lastItem';

import type { OnePassLegacyItem, OnePassLegacyURL } from './1pif.types';
import { type OnePassLegacySection, type OnePassLegacySectionField, OnePassLegacySectionFieldKey } from './1pif.types';
import type {
    OnePassCategory,
    OnePassCreditCardFieldId,
    OnePassField,
    OnePassFields,
    OnePassItem,
    OnePassItemDetails,
    OnePassLoginDesignation,
    OnePassSection,
} from './1pux.types';
import { OnePassCreditCardFieldIds, OnePassFieldKey, OnePassFieldValueKeys } from './1pux.types';

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

export const is1PasswordNoteField = ({ value }: OnePassField) => 'string' in value || 'url' in value;
export const is1PasswordLegacyNoteField = ({ k: key }: OnePassLegacySectionField) =>
    key === OnePassLegacySectionFieldKey.STRING || key === OnePassLegacySectionFieldKey.URL;

export const is1PasswordSupportedField = ({ value }: OnePassField) =>
    OnePassFieldValueKeys.some((key) => key === Object.keys(value)[0]);

export const is1PasswordCCField = (field: OnePassField): field is OnePassField & { id: OnePassCreditCardFieldId } =>
    OnePassCreditCardFieldIds.some((id) => id === field.id);

export const format1PasswordMonthYear = (monthYear: Maybe<number>): string => {
    const monthYearString = String(monthYear);
    if (!monthYear || monthYearString.length !== 6) return '';
    return `${monthYearString.slice(4, 6)}${monthYearString.slice(0, 4)}`;
};

export const format1PasswordFieldValue = (field: OnePassFields, key: OnePassFieldKey): string => {
    const value = field[key];
    if (!value) return '';

    switch (key) {
        case OnePassFieldKey.DATE:
            return epochToDate(field[key]!);
        case OnePassFieldKey.MONTH_YEAR:
            return format1PasswordMonthYear(field[key]!);
        default:
            return String(value);
    }
};

export const format1PasswordLegacyFieldValue = (field: OnePassLegacySectionField): string => {
    const value = field.v;
    if (!value) return '';

    switch (field.k) {
        case OnePassLegacySectionFieldKey.DATE:
            return epochToDate(field.v!);
        default:
            return String(value);
    }
};

export const extract1PasswordNote = (details: OnePassItemDetails): string => {
    const base = details.notesPlain;

    return (details.sections ?? [])
        .reduce<string>(
            (fullNote, section) => {
                if (!section) return fullNote;

                const hasNoteFields = section.fields.some(is1PasswordNoteField);
                if (!hasNoteFields) return fullNote;

                if (section.title) fullNote += `${section.title}\n`;

                (section.fields ?? []).forEach((field, idx, fields) => {
                    if (!is1PasswordNoteField(field)) return;

                    const subTitle = field.title;
                    const value = field.value.string ?? field.value.url ?? '';
                    if (subTitle) fullNote += `${subTitle}\n`;
                    if (value) fullNote += `${value}\n${idx === fields.length - 1 ? '\n' : ''}`;
                });

                return fullNote;
            },
            base ? `${base}\n\n` : ''
        )
        .trim();
};

export const extract1PasswordLegacyNote = (item: OnePassLegacyItem): string => {
    const base = item.secureContents?.notesPlain;

    return (item.secureContents.sections ?? [])
        .reduce<string>(
            (fullNote, section) => {
                const hasNoteFields = section.fields?.some(is1PasswordLegacyNoteField);
                if (!hasNoteFields) return fullNote;

                if (section.title) fullNote += `${section.title}\n`;

                (section.fields ?? []).forEach((field, idx, fields) => {
                    const { t: subTitle, v: value } = field;
                    if (!is1PasswordLegacyNoteField(field)) return;

                    if (subTitle) fullNote += `${subTitle}\n`;
                    if (value) fullNote += `${value}\n${idx === fields.length - 1 ? '\n' : ''}`;
                });

                return fullNote;
            },
            base ? `${base}\n\n` : ''
        )
        .trim();
};

export const extract1PasswordURLs = ({ overview }: OnePassItem): string[] => [
    overview.url,
    ...(overview.urls ?? []).map(({ url }) => url),
];

export const extract1PasswordLegacyURLs = (item: OnePassLegacyItem): string[] => {
    if (item.secureContents?.URLs === undefined) return [];
    return item.secureContents.URLs.map(({ url }: OnePassLegacyURL) => url);
};

export const extract1PasswordExtraFields = (item: OnePassItem): UnsafeItemExtraField[] => {
    const { sections } = item.details;
    if (!sections) return [];

    return (
        sections
            /* check that field value key is supported and remove any credit card fields */
            .flatMap(({ fields }) =>
                fields.filter((field) => is1PasswordSupportedField(field) && !is1PasswordCCField(field))
            )
            .map<MaybeNull<UnsafeItemExtraField>>(({ title, value }) => {
                const [fieldKey] = objectKeys(value);
                const data = value[fieldKey];
                if (!data) return null;

                switch (fieldKey) {
                    case OnePassFieldKey.STRING:
                    case OnePassFieldKey.DATE:
                    case OnePassFieldKey.MONTH_YEAR:
                    case OnePassFieldKey.URL:
                        return {
                            fieldName: title || c('Label').t`Text`,
                            type: 'text',
                            data: { content: format1PasswordFieldValue(value, fieldKey) },
                        };
                    case OnePassFieldKey.TOTP:
                        return {
                            fieldName: title || c('Label').t`TOTP`,
                            type: 'totp',
                            data: { totpUri: format1PasswordFieldValue(value, fieldKey) },
                        };
                    case OnePassFieldKey.CONCEALED:
                    case OnePassFieldKey.CREDIT_CARD_NUMBER:
                        return {
                            fieldName: title || c('Label').t`Hidden`,
                            type: 'hidden',
                            data: { content: format1PasswordFieldValue(value, fieldKey) },
                        };
                    default:
                        return null;
                }
            })
            .filter(truthy)
    );
};

export const extract1PasswordLegacyExtraFields = (item: OnePassLegacyItem) => {
    return item.secureContents.sections
        ?.filter(({ fields }) => Boolean(fields))
        .flatMap(({ fields }) =>
            (fields as OnePassLegacySectionField[])
                .filter(({ k }) => Object.values(OnePassLegacySectionFieldKey).includes(k))
                .map<MaybeNull<UnsafeItemExtraField>>((field) => {
                    switch (field.k) {
                        case OnePassLegacySectionFieldKey.STRING:
                        case OnePassLegacySectionFieldKey.URL:
                            return {
                                fieldName: field.t || c('Label').t`Text`,
                                type: 'text',
                                data: { content: field.v ?? '' },
                            };
                        case OnePassLegacySectionFieldKey.CONCEALED:
                            if (field.n.startsWith('TOTP')) {
                                return {
                                    fieldName: field.t || c('Label').t`TOTP`,
                                    type: 'totp',
                                    data: { totpUri: field.v ?? '' },
                                };
                            }
                            return {
                                // translator: label for a field that is hidden. Singular only.
                                fieldName: field.t || c('Label').t`Hidden`,
                                type: 'hidden',
                                data: { content: field.v ?? '' },
                            };
                        default:
                            return null;
                    }
                })
                .filter(truthy)
        );
};

export const extract1PasswordLoginField = (
    item: Extract<OnePassItem, { categoryUuid: OnePassCategory.LOGIN }>,
    designation: OnePassLoginDesignation
): string => lastItem(item.details.loginFields.filter((field) => field.designation === designation))?.value ?? '';

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

export const extract1PasswordIdentity = identityBuilderFactory<OnePassField, OnePassSection>((item, { id, value }) => {
    const [fieldKey] = objectKeys<OnePassFieldKey>(value);
    const fieldName = ONE_PASS_IDENTITY_FIELD_MAP[id];

    if (fieldKey === OnePassFieldKey.ADDRESS) {
        return ONE_PASS_ADDRESS_KEYS.forEach((key) => {
            const address = value[fieldKey];
            const field = ONE_PASS_IDENTITY_FIELD_MAP[key];
            if (field) item.set('content', (content) => content.set(field, address?.[key] ?? ''));
        });
    }

    if (fieldName) {
        item.set('content', (content) => content.set(fieldName, format1PasswordFieldValue(value, fieldKey)));
    }
});

export const extract1PasswordLegacyIdentity = identityBuilderFactory<OnePassLegacySectionField, OnePassLegacySection>(
    (item, field) => {
        if (field.k === OnePassLegacySectionFieldKey.ADDRESS && field.v) {
            return Object.entries(field.v).forEach(([key, value]) => {
                const field = ONE_PASS_IDENTITY_FIELD_MAP[key];
                if (field) item.set('content', (content) => content.set(field, value ?? ''));
            });
        }

        const fieldName = ONE_PASS_IDENTITY_FIELD_MAP[field.n];
        if (fieldName) item.set('content', (content) => content.set(fieldName, format1PasswordLegacyFieldValue(field)));
    }
);
