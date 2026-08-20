import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';

export const buildContactEmail = (value?: Partial<ContactEmail>): ContactEmail => {
    return {
        ID: 'contact-email-id',
        Email: 'contact@example.com',
        Name: 'Contact',
        Type: [],
        Defaults: 1,
        Order: 1,
        ContactID: 'contact-id',
        LabelIDs: [],
        LastUsedTime: 0,
        ...value,
    };
};
