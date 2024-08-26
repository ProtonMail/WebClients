import { c } from 'ttag';

import {
    BitwardenCustomFieldType,
    type BitwardenIdentityItem,
} from '@proton/pass/lib/import/providers/bitwarden.types';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { IdentityFieldName, ItemContent, MaybeNull, UnsafeItemExtraField } from '@proton/pass/types';

const BITWARDEN_IDENTITY_FIELD_MAP: Record<string, IdentityFieldName> = {
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

export const buildBitwardenIdentity = ({ fields, identity }: BitwardenIdentityItem): ItemContent<'identity'> => {
    const item = itemBuilder('identity');
    const extraSectionFields = fields?.filter((f) => Object.values(BitwardenCustomFieldType).includes(f.type)) ?? [];

    item.set('content', (content) => {
        if (extraSectionFields.length > 0) {
            content.set('extraSections', (sections) => {
                sections.push({
                    sectionName: 'Extra fields',
                    sectionFields: extraSectionFields.map(({ name, type, value }) =>
                        extraFieldsFactory[type](name, value)
                    ),
                });
                return sections;
            });
        }

        Object.entries(identity).forEach(([key, value]) => {
            const field = BITWARDEN_IDENTITY_FIELD_MAP[key];
            if (field) content.set(field, value ?? '');
        });

        return content;
    });

    return item.data.content;
};
