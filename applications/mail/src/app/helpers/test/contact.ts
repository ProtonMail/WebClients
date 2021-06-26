import { ContactEmail, ContactProperties, Contact } from 'proton-shared/lib/interfaces/contacts';
import { prepareCards } from 'proton-shared/lib/contacts/encrypt';

import { toKeyProperty } from 'proton-shared/lib/contacts/keyProperties';
import { addApiMock } from './api';
import { GeneratedKey } from './crypto';

export interface ContactMock {
    contactID: string;
    email: string;

    mimeType?: string;
    pinKey?: GeneratedKey;
}

export const apiContacts = new Map<string, ContactMock>();

const addApiContactMock = () => {
    addApiMock('contacts/emails', (args) => {
        const email = args.params.Email;
        if (apiContacts.has(email)) {
            const contactMock = apiContacts.get(email) as ContactMock;
            return { ContactEmails: [{ ContactID: contactMock.contactID }] as ContactEmail[] };
        }
        // console.log('api contact email', args, email);
        return {};
    });
};

addApiContactMock();

export const addApiContact = (contact: ContactMock, key: GeneratedKey) => {
    apiContacts.set(contact.email, contact);
    addApiMock(`contacts/${contact.contactID}`, async () => {
        const group = 'group';
        const properties: ContactProperties = [{ field: 'email', value: contact.email, group }];
        if (contact.pinKey) {
            properties.push(toKeyProperty({ publicKey: contact.pinKey.publicKeys[0], group, index: 0 }));
        }
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
