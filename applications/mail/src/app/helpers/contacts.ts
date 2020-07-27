import { ContactEmailCache, ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { normalizeEmail } from './addresses';

export const findEmailInCache = (cache: ContactEmailCache, email: string): Partial<ContactEmail> =>
    [...cache.values()].find(({ Email }) => {
        return email === normalizeEmail(Email);
    }) || {};

export const getContactOfRecipient = (contacts: ContactEmail[] = [], address = '') =>
    (contacts || []).find(({ Email }) => normalizeEmail(Email) === normalizeEmail(address));

export const getContactsOfGroup = (contacts: ContactEmail[] = [], groupID = ''): ContactEmail[] =>
    contacts.filter((contact) => contact.LabelIDs?.includes(groupID));
