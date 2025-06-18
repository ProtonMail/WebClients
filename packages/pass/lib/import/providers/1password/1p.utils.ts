import { c } from 'ttag';

import { type ItemBuilder, itemBuilder } from '@proton/pass/lib/items/item.builder';
import type {
    DeobfuscatedItemExtraField,
    IdentityFieldName,
    ItemContent,
    ItemImportIntent,
    Maybe,
    MaybeNull,
} from '@proton/pass/types';
import { WifiSecurity } from '@proton/pass/types/protobuf/item-v1';
import { prop } from '@proton/pass/utils/fp/lens';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { objectKeys } from '@proton/pass/utils/object/generic';
import { isObject } from '@proton/pass/utils/object/is-object';
import { epochToDate } from '@proton/pass/utils/time/format';
import lastItem from '@proton/utils/lastItem';

import type { OnePassLegacyItem, OnePassLegacyURL } from './1pif.types';
import { type OnePassLegacySection, type OnePassLegacySectionField, OnePassLegacySectionFieldKey } from './1pif.types';
import type {
    OnePassCategory,
    OnePassCreditCardFieldId,
    OnePassField,
    OnePassFieldValue,
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

/** 1P field values can be nested objects of type :
 * `{ value: { [string | menu | concealed]: string } }` */
const sanitize1PasswordFieldValue = (data: unknown): string => {
    if (isObject(data)) {
        const value = Object.values(data)?.[0];
        if (typeof value === 'string') return value;
        else return '';
    }

    return String(data);
};

const sanitize1PasswordLegacyFieldValue = (data: unknown): string => {
    if (isObject(data)) return '';
    return String(data);
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
            return sanitize1PasswordFieldValue(value);
    }
};

export const format1PasswordLegacyFieldValue = (field: OnePassLegacySectionField): string => {
    const value = field.v;
    if (!value) return '';

    switch (field.k) {
        case OnePassLegacySectionFieldKey.DATE:
            return epochToDate(field.v!);
        default:
            return sanitize1PasswordLegacyFieldValue(value);
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

// Field's ids to filter out and build the Wi-Fi item
const baseWifiFields = ['network_name', 'wireless_password', 'wireless_security'];

export const extract1PasswordExtraFields = (section: OnePassSection): DeobfuscatedItemExtraField[] => {
    return section.fields
        .flatMap<MaybeNull<DeobfuscatedItemExtraField>>(({ title, value, id }) => {
            const [fieldKey] = objectKeys(value);
            const data = value[fieldKey];

            // Prevent importing duplicated fields
            if (!data || baseWifiFields.includes(id)) return null;

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

                // Return null since we have another mechanism to import files and SSH Keys
                case OnePassFieldKey.SSH_KEY:
                case OnePassFieldKey.FILE:
                    return null;

                default:
                    try {
                        let newValue = data;
                        if (!newValue || Array.isArray(newValue)) return null;

                        // The pattern for 1P objects, is always the same.
                        // The "value" property contains an object with 2 keys:
                        // - One key contains the actual data
                        // - The other key contains null/undefined values
                        if (isObject(newValue)) {
                            return Object.entries(newValue)
                                .filter(([, val]) => truthy(val) && !isObject(val))
                                .map(([key, value]) => ({
                                    fieldName: key,
                                    type: 'text',
                                    data: { content: String(value) },
                                }));
                        }

                        // Always treat as "text" since hidden values were already handled
                        return {
                            fieldName: title || c('Label').t`Text`,
                            type: 'text',
                            data: { content: String(newValue) },
                        };
                    } catch {
                        return null;
                    }
            }
        })
        .filter(truthy);
};

const mapLegacyFieldIntoExtraField = (field: OnePassLegacySectionField): MaybeNull<DeobfuscatedItemExtraField> => {
    if (baseWifiFields.includes(field.n)) return null;

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
};

export const extract1PasswordLegacyExtraFields = (item: OnePassLegacyItem): DeobfuscatedItemExtraField[] => {
    const fieldKeys = Object.values(OnePassLegacySectionFieldKey);

    return (
        item.secureContents.sections?.flatMap(
            ({ fields }) =>
                fields
                    ?.filter(({ k }) => fieldKeys.includes(k))
                    .map(mapLegacyFieldIntoExtraField)
                    .filter(truthy) ?? []
        ) ?? []
    );
};

export const extract1PasswordLegacyUnknownExtraFields = (item: OnePassLegacyItem): DeobfuscatedItemExtraField[] => {
    const excludedFields = ['sshKey-privateKey', 'sshKey-publicKey'];
    const fieldKeys = Object.values(OnePassLegacySectionFieldKey);

    return (
        item.secureContents.unknown_details?.sections?.flatMap(
            ({ fields }) =>
                fields
                    ?.filter(({ k, n }) => fieldKeys.includes(k) && !excludedFields.includes(n))
                    .map(mapLegacyFieldIntoExtraField)
                    .filter(truthy) ?? []
        ) ?? []
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

export const intoFilesFrom1PasswordItem = (sections: Maybe<OnePassSection[]>): string[] => {
    if (!sections) return [];

    return sections.reduce<string[]>((acc, section) => {
        section.fields.forEach((field) => {
            const file = field.value?.file;

            if (file?.documentId) {
                /** File attachments are stored in `files/{documentId}__{filename}` */
                const filename = `files/${file.documentId}__${file.fileName}`;
                acc.push(filename);
            }
        });

        return acc;
    }, []);
};

export const extractSSHSections = (
    sshKey: OnePassFieldValue<OnePassFieldKey.SSH_KEY>
): ItemImportIntent<'sshKey'>['content']['sections'] => {
    const sectionFields: DeobfuscatedItemExtraField[] = [];

    if (sshKey?.privateKey) {
        sectionFields.push({
            fieldName: c('Label').t`Private Key`,
            type: 'hidden',
            data: { content: sshKey.privateKey },
        });
    }

    if (sshKey?.metadata?.fingerprint) {
        sectionFields.push({
            fieldName: c('Label').t`Key fingerprint`,
            type: 'hidden',
            data: { content: sshKey.metadata.fingerprint },
        });
    }

    if (sshKey?.metadata?.keyType) {
        sectionFields.push({
            fieldName: c('Label').t`Key type`,
            type: 'text',
            data: { content: sshKey.metadata.keyType },
        });
    }

    if (!sectionFields.length) return [];

    return [{ sectionName: 'OpenSSH', sectionFields }];
};

const getWifiSecurity = (wirelessSecurity: string): WifiSecurity => {
    switch (wirelessSecurity) {
        case 'wpa3p':
        case 'wpa3e':
            return WifiSecurity.WPA3;
        case 'wpa2p':
        case 'wpa2e':
            return WifiSecurity.WPA2;
        case 'wpa':
            return WifiSecurity.WPA;
        case 'wep':
            return WifiSecurity.WEP;
        default:
            return WifiSecurity.UnspecifiedWifiSecurity;
    }
};

type OnePasswordWifiFields = {
    ssid?: string;
    password?: string;
    security: WifiSecurity;
};

export const extractBaseWifi = (sections: Maybe<OnePassSection[]> = []): OnePasswordWifiFields => {
    const fields = sections.flatMap(prop('fields'));

    const [ssid, password, wirelessSecurity] = baseWifiFields.map((key) => {
        const match = fields.find(({ id }) => id === key)?.value;
        if (match) return sanitize1PasswordFieldValue(match);
    });

    return { ssid, password, security: getWifiSecurity(wirelessSecurity ?? '') };
};

export const extractLegacyBaseWifi = (sections: Maybe<OnePassLegacySection[]> = []): OnePasswordWifiFields => {
    const fields = sections.flatMap(prop('fields'));

    const [ssid, password, wirelessSecurity] = baseWifiFields.map((key) => {
        const value = fields.find((f) => f?.n === key)?.v;
        if (value) return sanitize1PasswordLegacyFieldValue(value);
    });

    return { ssid, password, security: getWifiSecurity(wirelessSecurity ?? '') };
};
