import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import type { SimpleMap } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

export const getContactEmailKey = (value: string) => {
    return canonicalizeEmail(value);
};

export const getContactEmailsMapWithDuplicates = (contactEmails: ContactEmail[]) =>
    contactEmails.reduce<SimpleMap<ContactEmail[]>>((acc, contact) => {
        const email = getContactEmailKey(contact.Email);
        const contacts = acc[email];
        if (!contacts) {
            acc[email] = [contact];
        } else {
            contacts.push(contact);
            contacts.sort((a, b) => a.Order - b.Order);
        }
        return acc;
    }, {});
