import { canonicalizeEmail } from '../helpers/email';
import type { ContactEmail } from '../interfaces/contacts/Contact';
import type { SimpleMap } from '../interfaces/utils';

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
