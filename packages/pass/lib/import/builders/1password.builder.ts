import type { IdentityFieldName } from '@proton/pass/hooks/identity/useIdentityForm';
import { type OnePassLegacySection } from '@proton/pass/lib/import/providers/1password.1pif.types';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { ItemContent } from '@proton/pass/types';

const onePasswordDictionary: { [key: string]: IdentityFieldName } = {
    address1: 'streetAddress',
    busphone: 'workPhoneNumber',
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
    website: 'website',
    yahoo: 'yahoo',
    zip: 'zipOrPostalCode',
};

export const build1PassIdentity = (sections?: OnePassLegacySection[]): ItemContent<'identity'> => {
    const emptyIdentity = itemBuilder('identity').data.content;
    if (!sections) return emptyIdentity;

    const fixedSections = ['name', 'address', 'internet'];

    return sections.reduce<ItemContent<'identity'>>((acc, { name, fields }) => {
        // Support extra sections in next version
        if (!fixedSections.includes(name) || !fields) return acc;

        return {
            ...acc,
            ...fields.reduce<Partial<ItemContent<'identity'>>>((partialIdentityItem, { n, v }) => {
                const identityFieldName = onePasswordDictionary[n];
                return identityFieldName ? { ...partialIdentityItem, [identityFieldName]: v } : partialIdentityItem;
            }, {}),
        };
    }, emptyIdentity);
};
