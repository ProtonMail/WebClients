import { c } from 'ttag';

import {
    BitwardenCustomFieldType,
    type BitwardenIdentityItem,
} from '@proton/pass/lib/import/providers/bitwarden.types';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { ItemContent, MaybeNull, UnsafeItemExtraField } from '@proton/pass/types';

import type { IdentityDictionary } from './builders.types';

const bitwardenDictionary: IdentityDictionary = {
    firstName: 'firstName',
    middleName: 'middleName',
    lastName: 'lastName',
    address1: 'streetAddress',
    address2: 'floor',
    city: 'city',
    state: 'stateOrProvince',
    postalCode: 'zipOrPostalCode',
    country: 'countryOrRegion',
    company: 'company',
    email: 'email',
    phone: 'phoneNumber',
    ssn: 'socialSecurityNumber',
    username: 'xHandle',
    passportNumber: 'passportNumber',
    licenseNumber: 'licenseNumber',
};

export const extraFieldsFactory: {
    [k in BitwardenCustomFieldType]: (n: MaybeNull<string>, v: MaybeNull<string>) => UnsafeItemExtraField;
} = {
    [BitwardenCustomFieldType.TEXT]: (name, value) => ({
        fieldName: name || c('Label').t`Text`,
        type: 'text',
        data: { content: value ?? '' },
    }),
    [BitwardenCustomFieldType.HIDDEN]: (name, value) => ({
        fieldName: name || c('Label').t`Hidden`,
        type: 'hidden',
        data: { content: value ?? '' },
    }),
};

export const buildBitwardenIdentity = (item: BitwardenIdentityItem): ItemContent<'identity'> => {
    const emptyIdentity = itemBuilder('identity').data.content;
    const extraSectionFields =
        item.fields?.filter((f) => Object.values(BitwardenCustomFieldType).includes(f.type)) ?? [];

    if (extraSectionFields.length > 0) {
        emptyIdentity.extraSections.push({
            sectionName: 'Extra fields',
            sectionFields: extraSectionFields.map(({ name, type, value }) => extraFieldsFactory[type](name, value)),
        });
    }

    return Object.entries(item.identity).reduce((acc, [key, value]) => {
        const field = bitwardenDictionary[key];
        return field ? { ...acc, [field]: value ?? '' } : acc;
    }, emptyIdentity);
};
