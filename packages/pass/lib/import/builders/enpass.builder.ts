import type { EnpassCategory, EnpassItem } from '@proton/pass/lib/import/providers/enpass.types';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { IdentityFieldName, ItemContent } from '@proton/pass/types';

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

export const buildEnpassIdentity = (importItem: EnpassItem<EnpassCategory.IDENTITY>): ItemContent<'identity'> => {
    const item = itemBuilder('identity');

    importItem.fields?.forEach(({ uid, value }) => {
        const field = ENPASS_IDENTITY_FIELD_MAP[uid];
        if (field) item.set('content', (content) => content.set(field, value ?? ''));
    });

    return item.data.content;
};
