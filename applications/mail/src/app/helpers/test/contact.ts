import { ContactEmail, ContactProperties, Contact } from 'proton-shared/lib/interfaces/contacts';
import { prepareCards } from 'proton-shared/lib/contacts/encrypt';

import { addApiMock } from './api';
import { GeneratedKey } from './crypto';

export interface ContactMock {
    contactID: string;
    email: string;
    mimeType: string;
}

export const apiContacts = new Map<string, ContactMock>();

const addApiContactMock = () => {
    addApiMock('contacts/emails', (args) => {
        const email = args.params.Email;
        if (apiContacts.has(email)) {
            const contactMock = apiContacts.get(email) as ContactMock;
            return { ContactEmails: [{ ContactID: contactMock.contactID }] as ContactEmail[] };
        }
        return {};
    });
};

addApiContactMock();

export const addApiContact = (contact: ContactMock, key: GeneratedKey) => {
    apiContacts.set(contact.email, contact);
    addApiMock(`contacts/${contact.contactID}`, async () => {
        const properties: ContactProperties = [{ field: 'email', value: contact.email, group: 'group' }];
        if (contact.mimeType) {
            properties.push({ field: 'x-pm-mimetype', value: contact.mimeType, group: 'group' });
        }
        const Cards = await prepareCards(properties, key.privateKeys, key.publicKeys);
        return { Contact: { ContactID: contact.contactID, Cards } as Partial<Contact> };
    });
};

export const clearApiContacts = () => {
    apiContacts.clear();
    addApiContactMock();
};
