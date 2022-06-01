import { arrayToBinaryString, encodeBase64 } from 'pmcrypto';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { Recipient } from '@proton/shared/lib/interfaces';
import { ContactEmail, ContactProperties, ContactProperty } from '@proton/shared/lib/interfaces/contacts';
import { prepareCards } from '@proton/shared/lib/contacts/encrypt';
import { GeneratedKey, generateKeys } from './crypto';
import { addApiMock } from './api';

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

const getProperties = (senderKeys: GeneratedKey, hasFingerprint = true) => {
    const keyValue = hasFingerprint
        ? `data:application/pgp-keys;base64,${encodeBase64(
              arrayToBinaryString(senderKeys.publicKeys[0].toPacketlist().write() as Uint8Array)
          )}`
        : 'data:application/pgp-keys;';

    return [
        { field: 'fn', pref: 1, value: 'Sender' } as ContactProperty,
        { field: 'email', group: 'item1', pref: 1, value: sender.Address } as ContactProperty,
        { field: 'key', group: 'item1', pref: 1, value: keyValue } as ContactProperty,
    ] as ContactProperties;
};

export const setupContactsForPinKeys = async (hasFingerprint = true) => {
    const updateSpy = jest.fn(() => Promise.resolve({}));
    addApiMock(`contacts/v4/contacts/${contactID}`, updateSpy, 'put');

    const receiverKeys = await generateKeys('me', receiver.Address);
    const senderKeys = await generateKeys('sender', sender.Address);

    const properties = getProperties(senderKeys, hasFingerprint);

    const contactCards = await prepareCards(properties, receiverKeys.privateKeys, receiverKeys.publicKeys);

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
