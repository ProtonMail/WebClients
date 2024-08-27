import type { EnpassCategory, EnpassItem } from '@proton/pass/lib/import/providers/enpass/enpass.types';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { IdentityFieldName, ItemContent, UnsafeItemExtraField } from '@proton/pass/types';

import type { EnpassField } from './enpass.types';

const ENPASS_IDENTITY_FIELD_MAP: Record<string, IdentityFieldName> = {
    130: 'firstName',
    131: 'middleName',
    132: 'lastName',
    133: 'gender',
    134: 'birthdate',
    212: 'socialSecurityNumber',
    143: 'streetAddress',
    144: 'city',
    145: 'stateOrProvince',
    146: 'countryOrRegion',
    147: 'zipOrPostalCode',
    149: 'phoneNumber',
    151: 'secondPhoneNumber',
    140: 'workPhoneNumber',
    137: 'company',
    139: 'jobTitle',
    213: 'organization',
    153: 'xHandle',
    154: 'facebook',
    155: 'linkedin',
    157: 'instagram',
    158: 'yahoo',
    163: 'website',
    165: 'email',
};

export const ENPASS_FIELD_TYPES = {
    login: ['username', 'email', 'totp', 'password', 'url'],
    creditCard: ['ccName', 'ccType', 'ccNumber', 'ccCvc', 'ccPin', 'ccExpiry'],
    ignored: ['section'],
} as const;

export const isTrashedEnpassItem = (item: EnpassItem<any>) => item.archived !== 0 || item.trashed !== 0;

export const extractEnpassFactory = <K extends string>(keys: readonly K[]) => {
    const isSupportedKey = (type: any): type is K => keys.includes(type);

    return (fields: EnpassField[]) =>
        fields.reduce(
            (acc: { extracted: { [key in K]?: string }; remaining: EnpassField[] }, field) => {
                if (!field.value) return acc;

                if (isSupportedKey(field.type) && !acc.extracted[field.type]) {
                    acc.extracted[field.type] = field.value;
                    return acc;
                }

                if (!(<readonly string[]>ENPASS_FIELD_TYPES.ignored).includes(field.type)) {
                    acc.remaining.push(field);
                    return acc;
                }

                return acc;
            },
            { extracted: {}, remaining: [] }
        );
};

export const extractEnpassLogin = extractEnpassFactory(ENPASS_FIELD_TYPES.login);
export const extractEnpassCC = extractEnpassFactory(ENPASS_FIELD_TYPES.creditCard);

export const extractEnpassExtraFields = (fields: EnpassField[]): UnsafeItemExtraField[] =>
    fields.map(({ value, label, sensitive }) => ({
        data: { content: value },
        fieldName: label,
        type: sensitive ? 'hidden' : 'text',
    }));

export const extractEnpassIdentity = (importItem: EnpassItem<EnpassCategory.IDENTITY>): ItemContent<'identity'> => {
    const item = itemBuilder('identity');

    importItem.fields?.forEach(({ uid, value }) => {
        const field = ENPASS_IDENTITY_FIELD_MAP[uid];
        if (field) item.set('content', (content) => content.set(field, value ?? ''));
    });

    return item.data.content;
};
