import type { EnpassCategory, EnpassItem } from '@proton/pass/lib/import/providers/enpass.types';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { ItemContent } from '@proton/pass/types';

import type { IdentityDictionary } from './builders.types';

const enpassDictionary: IdentityDictionary = {
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

export const buildEnpassIdentity = (item: EnpassItem<EnpassCategory.IDENTITY>): ItemContent<'identity'> => {
    const emptyIdentity = itemBuilder('identity').data.content;
    return (
        item.fields?.reduce<ItemContent<'identity'>>((acc, { uid, value }) => {
            const field = enpassDictionary[uid];
            return field ? { ...acc, [field]: value ?? '' } : acc;
        }, emptyIdentity) ?? emptyIdentity
    );
};
