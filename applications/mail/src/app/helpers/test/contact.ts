import { prepareCardsFromVCard } from '@proton/shared/lib/contacts/encrypt';
import { toKeyProperty } from '@proton/shared/lib/contacts/keyProperties';
import { createContactPropertyUid, fromVCardProperties } from '@proton/shared/lib/contacts/properties';
import { Contact, ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

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
    addApiMock('contacts/v4/contacts/emails', (args) => {
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
    addApiMock(`contacts/v4/contacts/${contact.contactID}`, async () => {
        const group = 'group';
        const properties: VCardProperty<string>[] = [
            { field: 'email', value: contact.email, group, uid: createContactPropertyUid() },
        ];
        if (contact.pinKey) {
            properties.push(await toKeyProperty({ publicKey: contact.pinKey.publicKeys[0], group, index: 0 }));
        }
        if (contact.mimeType) {
            properties.push({
                field: 'x-pm-mimetype',
                value: contact.mimeType,
                group: 'group',
                uid: createContactPropertyUid(),
            });
        }
        const vCardContact = fromVCardProperties(properties);
        const Cards = await prepareCardsFromVCard(vCardContact, {
            privateKey: key.privateKeys[0],
            publicKey: key.publicKeys[0],
        });
        return { Contact: { ContactID: contact.contactID, Cards } as Partial<Contact> };
    });
};

export const clearApiContacts = () => {
    apiContacts.clear();
    addApiContactMock();
};
