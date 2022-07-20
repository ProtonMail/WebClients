import { c } from 'ttag';
import { CryptoProxy } from '@proton/crypto';

import { generateProtonWebUID } from '../helpers/uid';
import { vCardPropertiesToICAL } from './vcard';
import { hasCategories, getVCardProperties, createContactPropertyUid } from './properties';
import { KeyPair } from '../interfaces';
import { Contact, ContactCard } from '../interfaces/contacts/Contact';
import { CONTACT_CARD_TYPE } from '../constants';
import { CLEAR_FIELDS, SIGNED_FIELDS } from './constants';
import { VCardContact, VCardProperty } from '../interfaces/contacts/VCard';
import { prepareForSaving } from './surgery';

const { CLEAR_TEXT, ENCRYPTED_AND_SIGNED, SIGNED } = CONTACT_CARD_TYPE;

interface SplitVCardProperties {
    toEncryptAndSign: VCardProperty[];
    toSign: VCardProperty[];
    toClearText: VCardProperty[];
}

/**
 * Split properties for contact cards
 */
const splitVCardProperties = (properties: VCardProperty[]): SplitVCardProperties => {
    // we should only create a clear text part if categories are present
    const splitClearText = hasCategories(properties);

    return properties.reduce<SplitVCardProperties>(
        (acc, property) => {
            const { field } = property;

            if (splitClearText && CLEAR_FIELDS.includes(field)) {
                acc.toClearText.push(property);
                // Notice CLEAR_FIELDS and SIGNED_FIELDS have some overlap.
                // The repeated fields need to be in the clear-text and signed parts
                if (SIGNED_FIELDS.includes(field)) {
                    acc.toSign.push(property);
                }
                return acc;
            }

            if (SIGNED_FIELDS.includes(field)) {
                acc.toSign.push(property);
                return acc;
            }

            acc.toEncryptAndSign.push(property);
            return acc;
        },
        {
            toEncryptAndSign: [],
            toSign: [],
            toClearText: [],
        }
    );
};

export const prepareCardsFromVCard = (
    vCardContact: VCardContact,
    { privateKey, publicKey }: KeyPair
): Promise<ContactCard[]> => {
    const promises = [];
    const publicKeys = [publicKey];
    const privateKeys = [privateKey];
    const properties = getVCardProperties(vCardContact);
    const { toEncryptAndSign = [], toSign = [], toClearText = [] } = splitVCardProperties(properties);

    if (toEncryptAndSign.length > 0) {
        const textData: string = vCardPropertiesToICAL(toEncryptAndSign).toString();

        promises.push(
            CryptoProxy.encryptMessage({
                textData,
                stripTrailingSpaces: true,
                encryptionKeys: publicKeys,
                signingKeys: privateKeys,
                detached: true,
            }).then(({ message: Data, signature: Signature }) => {
                const card: ContactCard = {
                    Type: ENCRYPTED_AND_SIGNED,
                    Data,
                    Signature,
                };
                return card;
            })
        );
    }

    if (toSign.length > 0) {
        const hasUID = toSign.some((property) => property.field === 'uid');
        const hasFN = toSign.some((property) => property.field === 'fn');

        if (!hasUID) {
            const defaultUID = generateProtonWebUID();
            toSign.push({ field: 'uid', value: defaultUID, uid: createContactPropertyUid() });
        }

        if (!hasFN) {
            const defaultFN = c('Default display name vcard').t`Unknown`;
            toSign.push({ field: 'fn', value: defaultFN, uid: createContactPropertyUid() });
        }

        const textData: string = vCardPropertiesToICAL(toSign).toString();

        promises.push(
            CryptoProxy.signMessage({
                textData,
                stripTrailingSpaces: true,
                signingKeys: privateKeys,
                detached: true,
            }).then((Signature) => {
                const card: ContactCard = {
                    Type: SIGNED,
                    Data: textData,
                    Signature,
                };
                return card;
            })
        );
    }

    if (toClearText.length > 0) {
        const Data = vCardPropertiesToICAL(toClearText).toString();

        promises.push({
            Type: CLEAR_TEXT,
            Data,
            Signature: null,
        });
    }

    return Promise.all(promises);
};

export const prepareVCardContact = async (
    vCardContact: VCardContact,
    { privateKey, publicKey }: KeyPair
): Promise<Pick<Contact, 'Cards'>> => {
    const prepared = prepareForSaving(vCardContact);
    const Cards = await prepareCardsFromVCard(prepared, { privateKey, publicKey });
    return { Cards };
};

export const prepareVCardContacts = async (
    vCardContacts: VCardContact[],
    { privateKey, publicKey }: KeyPair
): Promise<Pick<Contact, 'Cards'>[]> => {
    if (!privateKey || !publicKey) {
        return Promise.resolve([]);
    }

    return Promise.all(vCardContacts.map((contact) => prepareVCardContact(contact, { privateKey, publicKey })));
};
