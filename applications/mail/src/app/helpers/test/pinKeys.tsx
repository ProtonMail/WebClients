import { CryptoProxy } from '@proton/crypto';
import { arrayToBinaryString, encodeBase64 } from '@proton/crypto/lib/utils';
import { prepareCardsFromVCard } from '@proton/shared/lib/contacts/encrypt';
import { createContactPropertyUid, fromVCardProperties } from '@proton/shared/lib/contacts/properties';
import { Recipient } from '@proton/shared/lib/interfaces';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { addApiMock } from './api';
import { GeneratedKey, generateKeys } from './crypto';

export const contactID = 'contactID';
export const receiver = {
    Name: 'receiver',
    Address: 'receiver@protonmail.com',
} as Recipient;

export const sender = {
    Name: 'sender',
    Address: 'sender@outside.com',
    ContactID: contactID,
} as Recipient;

export const message = {
    ID: 'messageID',
    Sender: sender,
    ToList: [receiver] as Recipient[],
} as Message;

export const contactEmails = [{ ContactID: contactID, Email: sender.Address } as ContactEmail] as ContactEmail[];

const getProperties = async (senderKeys: GeneratedKey, hasFingerprint = true) => {
    const keyValue = hasFingerprint
        ? `data:application/pgp-keys;base64,${encodeBase64(
              arrayToBinaryString(
                  await CryptoProxy.exportPublicKey({ key: senderKeys.publicKeys[0], format: 'binary' })
              )
          )}`
        : 'data:application/pgp-keys;';

    return [
        { field: 'fn', value: 'Sender', params: { pref: '1' }, uid: createContactPropertyUid() } as VCardProperty,
        {
            field: 'email',
            group: 'item1',
            value: sender.Address,
            params: { pref: '1' },
            uid: createContactPropertyUid(),
        } as VCardProperty,
        {
            field: 'key',
            group: 'item1',
            value: keyValue,
            params: { pref: '1' },
            uid: createContactPropertyUid(),
        } as VCardProperty,
    ] as VCardProperty[];
};

export const setupContactsForPinKeys = async (hasFingerprint = true) => {
    const updateSpy = jest.fn(() => Promise.resolve({}));
    addApiMock(`contacts/v4/contacts/${contactID}`, updateSpy, 'put');

    const receiverKeys = await generateKeys('me', receiver.Address);
    const senderKeys = await generateKeys('sender', sender.Address);

    const properties = await getProperties(senderKeys, hasFingerprint);
    const vCardContact = fromVCardProperties(properties);

    const contactCards = await prepareCardsFromVCard(vCardContact, {
        privateKey: receiverKeys.privateKeys[0],
        publicKey: receiverKeys.publicKeys[0],
    });

    // Add an api mock to use the created contact when the call is done
    addApiMock(
        `contacts/v4/contacts/${contactID}`,
        () => {
            return { Contact: { Cards: contactCards, ContactEmails: contactEmails } };
        },
        'get'
    );

    return { receiverKeys, senderKeys, updateSpy };
};
