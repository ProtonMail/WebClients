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

import type { OnePassLegacyItem, OnePassLegacyURL, OnePasswordWifiFields } from './1pif.types';
import { type OnePassLegacySection, type OnePassLegacySectionField, OnePassLegacySectionFieldKey } from './1pif.types';
import type {
    OnePassCategory,
    OnePassCreditCardFieldId,
    OnePassField,
    OnePassFieldValue,
    OnePassFields,
    OnePassItem,
    OnePassLoginDesignation,
    OnePassSection,
} from './1pux.types';
import { OnePassCreditCardFieldIds, OnePassFieldKey } from './1pux.types';

const ONE_PASS_FIXED_SECTIONS = ['name', 'address', 'internet'];
const ONE_PASS_ADDRESS_KEYS = ['street', 'city', 'country', 'zip', 'state'];
const ONE_PASS_WIFI_KEYS = ['network_name', 'wireless_password', 'wireless_security'];
const ONE_PASS_SSH_KEYS = ['sshKey-privateKey', 'sshKey-publicKey'];
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

export const is1PasswordCCField = (field: OnePassField): field is OnePassField & { id: OnePassCreditCardFieldId } =>
    OnePassCreditCardFieldIds.some((id) => id === field.id);

export const format1PasswordMonthYear = (monthYear: Maybe<number>): string => {
    const monthYearString = String(monthYear);
    if (!monthYear || monthYearString.length !== 6) return '';
    return `${monthYearString.slice(4, 6)}${monthYearString.slice(0, 4)}`;
};

/** 1P field values can be nested objects of type :
 * `{ value: { [string | menu | concealed]: string } }`*/
const sanitizeFieldValue = (data: unknown): string => {
    if (isObject(data)) {
        if (Array.isArray(data)) return '';
        const value = Object.values(data)?.[0];
        if (typeof value === 'string') return value;
        else return '';
    }

    return String(data);
};

const into1PasswordExtraField = (
    value: unknown,
    fieldName: MaybeNull<string> = null
): MaybeNull<DeobfuscatedItemExtraField | DeobfuscatedItemExtraField[]> => {
    try {
        if (!value || Array.isArray(value)) return null;

        if (isObject(value)) {
            return Object.entries(value)
                .filter(([, val]) => truthy(val) && !isObject(val))
                .map(([key, val]) => ({
                    fieldName: key,
                    type: 'text',
                    data: { content: String(val) },
                }));
        }

        return {
            fieldName: fieldName || c('Label').t`Text`,
            type: 'text',
            data: { content: String(value) },
        };
    } catch {
        return null;
    }
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
            return sanitizeFieldValue(value);
    }
};

export const format1PasswordLegacyFieldValue = (field: OnePassLegacySectionField): string => {
    const value = field.v;
    if (!value) return '';

    switch (field.k) {
        case OnePassLegacySectionFieldKey.DATE:
            return epochToDate(field.v!);
        default:
            return sanitizeFieldValue(value);
    }
};

const extractURLsFromItem = <T>(options: {
    item: T;
    getPrimaryUrl: (item: T) => Maybe<string>;
    getSecondaryUrls: (item: T) => string[];
}): string[] => {
    const primary = options.getPrimaryUrl(options.item);
    const secondary = options.getSecondaryUrls(options.item);
    return [primary, ...secondary].filter(truthy);
};

export const extract1PasswordURLs = (item: OnePassItem): string[] =>
    extractURLsFromItem({
        item,
        getPrimaryUrl: (item) => item.overview.url,
        getSecondaryUrls: (item) => (item.overview.urls ?? []).map(({ url }) => url),
    });

export const extract1PasswordLegacyURLs = (item: OnePassLegacyItem): string[] =>
    extractURLsFromItem({
        item,
        getPrimaryUrl: () => undefined,
        getSecondaryUrls: (item) => item.secureContents?.URLs?.map(({ url }: OnePassLegacyURL) => url) ?? [],
    });

const createTextExtraField = (title: Maybe<string>, content: string): DeobfuscatedItemExtraField => ({
    fieldName: title || c('Label').t`Text`,
    type: 'text',
    data: { content },
});

const createHiddenExtraField = (title: Maybe<string>, content: string): DeobfuscatedItemExtraField => ({
    fieldName: title || c('Label').t`Hidden`,
    type: 'hidden',
    data: { content },
});

const createTotpExtraField = (title: Maybe<string>, content: string): DeobfuscatedItemExtraField => ({
    fieldName: title || c('Label').t`TOTP`,
    type: 'totp',
    data: { totpUri: content },
});

export const extract1PasswordExtraFields = (section: OnePassSection): DeobfuscatedItemExtraField[] => {
    return section.fields
        .flatMap<MaybeNull<DeobfuscatedItemExtraField>>(({ title, value, id }) => {
            const [fieldKey] = objectKeys(value);
            const data = value[fieldKey];

            if (!data || ONE_PASS_WIFI_KEYS.includes(id)) return null;

            switch (fieldKey) {
                case OnePassFieldKey.STRING:
                case OnePassFieldKey.DATE:
                case OnePassFieldKey.MONTH_YEAR:
                case OnePassFieldKey.URL:
                    return createTextExtraField(title, format1PasswordFieldValue(value, fieldKey));
                case OnePassFieldKey.TOTP:
                    return createTotpExtraField(title, format1PasswordFieldValue(value, fieldKey));
                case OnePassFieldKey.CONCEALED:
                case OnePassFieldKey.CREDIT_CARD_NUMBER:
                    return createHiddenExtraField(title, format1PasswordFieldValue(value, fieldKey));
                case OnePassFieldKey.SSH_KEY:
                case OnePassFieldKey.FILE:
                    return null;
                default:
                    return into1PasswordExtraField(data, title);
            }
        })
        .filter(truthy);
};

const mapLegacyFieldIntoExtraField = (
    field: OnePassLegacySectionField
): MaybeNull<DeobfuscatedItemExtraField | DeobfuscatedItemExtraField[]> => {
    if (ONE_PASS_WIFI_KEYS.includes(field.n)) return null;

    switch (field.k) {
        case OnePassLegacySectionFieldKey.STRING:
        case OnePassLegacySectionFieldKey.URL:
            return createTextExtraField(field.t, field.v ?? '');
        case OnePassLegacySectionFieldKey.CONCEALED:
            if (field.n.startsWith('TOTP')) return createTotpExtraField(field.t, field.v ?? '');
            return createHiddenExtraField(field.t, field.v ?? '');
        default:
            return into1PasswordExtraField(field.v, field.t);
    }
};

export const extract1PasswordLegacyExtraFields = (item: OnePassLegacyItem): DeobfuscatedItemExtraField[] =>
    item.secureContents.sections?.flatMap(
        ({ fields }) => fields?.flatMap(mapLegacyFieldIntoExtraField).filter(truthy) ?? []
    ) ?? [];

export const extract1PasswordLegacyUnknownExtraFields = (item: OnePassLegacyItem): DeobfuscatedItemExtraField[] =>
    item.secureContents.unknown_details?.sections?.flatMap(
        ({ fields }) =>
            fields
                ?.filter(({ n }) => !ONE_PASS_SSH_KEYS.includes(n))
                .flatMap(mapLegacyFieldIntoExtraField)
                .filter(truthy) ?? []
    ) ?? [];

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

const processAddressField = (item: ItemBuilder<'identity'>, addressData: Record<string, any>): void => {
    ONE_PASS_ADDRESS_KEYS.forEach((key) => {
        const field = ONE_PASS_IDENTITY_FIELD_MAP[key];
        if (field) item.set('content', (content) => content.set(field, addressData[key] ?? ''));
    });
};

export const extract1PasswordIdentity = identityBuilderFactory<OnePassField, OnePassSection>((item, { id, value }) => {
    const [fieldKey] = objectKeys<OnePassFieldKey>(value);
    const fieldName = ONE_PASS_IDENTITY_FIELD_MAP[id];
    if (fieldKey === OnePassFieldKey.ADDRESS && value[fieldKey]) return processAddressField(item, value[fieldKey]);
    if (fieldName) item.set('content', (content) => content.set(fieldName, format1PasswordFieldValue(value, fieldKey)));
});

export const extract1PasswordLegacyIdentity = identityBuilderFactory<OnePassLegacySectionField, OnePassLegacySection>(
    (item, field) => {
        const { k, v, n } = field;
        const fieldName = ONE_PASS_IDENTITY_FIELD_MAP[n];
        if (k === OnePassLegacySectionFieldKey.ADDRESS && v) return processAddressField(item, v);
        if (fieldName) item.set('content', (content) => content.set(fieldName, format1PasswordLegacyFieldValue(field)));
    }
);

export const into1PasswordItemFiles = (sections: Maybe<OnePassSection[]>): string[] => {
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

export const extract1PasswordSSHSections = (
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

    return sectionFields.length ? [{ sectionName: 'OpenSSH', sectionFields }] : [];
};

const extractBaseWifiFields = <T extends { fields?: any[] }>(
    sections: Maybe<T[]> = [],
    findFieldValue: (field: NonNullable<T['fields']>[number], key: string) => any
): OnePasswordWifiFields => {
    const fields = sections.flatMap(prop('fields'));
    const [ssid, password, wirelessSecurity] = ONE_PASS_WIFI_KEYS.map((key) => {
        const match = fields.find((field) => findFieldValue(field, key));
        if (match) return sanitizeFieldValue(findFieldValue(match, key));
    });

    return {
        ssid,
        password,
        security: (() => {
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
        })(),
    };
};

export const extract1PasswordWifiFields = (sections: Maybe<OnePassSection[]> = []): OnePasswordWifiFields =>
    extractBaseWifiFields(sections, (field, key) => (field.id === key ? field.value : undefined));

export const extractLegacy1PasswordWifiFields = (sections: Maybe<OnePassLegacySection[]> = []): OnePasswordWifiFields =>
    extractBaseWifiFields(sections, (field, key) => (field?.n === key ? field.v : undefined));
