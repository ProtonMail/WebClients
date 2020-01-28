import { ContactEmailCache, ContactEmail } from '../models/contact';
import { normalizeEmail } from './addresses';

export const findEmailInCache = (cache: ContactEmailCache, email: string): ContactEmail =>
    [...cache.values()].find(({ Email }) => {
        return email === normalizeEmail(Email);
    }) || {};

export const getContactsOfGroup = (contacts: ContactEmail[] = [], groupID = ''): ContactEmail[] =>
    contacts.filter((contact) => contact.LabelIDs?.includes(groupID));
