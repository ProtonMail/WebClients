import type { NordPassExtraField, NordPassItem } from '@proton/pass/lib/import/providers/nordpass/nordpass.types';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { obfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';
import type { DeobfuscatedItemExtraField, IdentityFieldName, ItemContent, ItemExtraField } from '@proton/pass/types';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { formatISODate } from '@proton/pass/utils/time/format';

export const NORDPASS_EXPECTED_HEADERS: (keyof NordPassItem)[] = [
    'name',
    'url',
    'username',
    'password',
    'note',
    'cardholdername',
    'cardnumber',
    'cvc',
    'expirydate',
    'zipcode',
    'folder',
    'full_name',
    'phone_number',
    'email', // not used for "Login" items, maybe for "Personal Info" items instead
    'address1',
    'address2',
    'city',
    'country',
    'state',
    'type',
];

const NORDPASS_IDENTITY_FIELD_MAP: Record<string, IdentityFieldName> = {
    url: 'website',
    zipcode: 'zipOrPostalCode',
    full_name: 'fullName',
    phone_number: 'phoneNumber',
    email: 'email',
    address1: 'streetAddress',
    city: 'city',
    country: 'countryOrRegion',
    state: 'stateOrProvince',
};

export const extractNordPassIdentity = (importItem: NordPassItem): ItemContent<'identity'> => {
    const item = itemBuilder('identity');

    Object.entries(importItem).forEach(([key, value]) => {
        const field = NORDPASS_IDENTITY_FIELD_MAP[key];
        if (field) item.set('content', (content) => content.set(field, value ?? ''));
    });

    return item.data.content;
};

export const extractNordPassExtraFields = (item: NordPassItem): ItemExtraField[] => {
    if (!item.custom_fields) return [];

    const fields = safeCall((): NordPassExtraField[] => JSON.parse(item.custom_fields!))() ?? [];

    return obfuscateExtraFields(
        fields.map<DeobfuscatedItemExtraField>(({ type, value: content, label: fieldName }) => {
            switch (type) {
                case 'text':
                    return { type: 'text', data: { content }, fieldName };
                case 'hidden':
                    return { type: 'hidden', data: { content }, fieldName };
                case 'date':
                    const date = new Date(content);
                    if (isNaN(+date)) return { type: 'text', data: { content }, fieldName };
                    const timestamp = formatISODate(date);
                    return { type: 'timestamp', data: { timestamp }, fieldName };
            }
        })
    );
};
