import { CryptoProxy } from '@proton/crypto';

import { CONTACT_CARD_TYPE } from '../constants';
import { generateProtonWebUID } from '../helpers/uid';
import { KeyPair } from '../interfaces';
import { Contact, ContactCard } from '../interfaces/contacts/Contact';
import { VCardContact, VCardProperty } from '../interfaces/contacts/VCard';
import { CLEAR_FIELDS, SIGNED_FIELDS } from './constants';
import { createContactPropertyUid, getVCardProperties, hasCategories } from './properties';
import { getFallbackFNValue, prepareForSaving } from './surgery';
import { vCardPropertiesToICAL } from './vcard';

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

    // The FN field could be empty on contact creation, this is intentional but we need to compute it from first and last name field if that's the case
    if (!vCardContact.fn) {
        const givenName = vCardContact?.n?.value?.givenNames?.[0].trim() ?? '';
        const familyName = vCardContact?.n?.value?.familyNames?.[0].trim() ?? '';
        const computedFirstAndLastName = `${givenName} ${familyName}` || ''; // Fallback that should never happen since we should always have a first and last name
        const fallbackEmail = vCardContact.email?.[0]?.value; // Fallback that should never happen since we should always have a first and last name

        const computedFullName: VCardProperty = {
            field: 'fn',
            value: computedFirstAndLastName || fallbackEmail || '',
            uid: createContactPropertyUid(),
        };
        toSign.push(computedFullName);
    }

    if (toSign.length > 0) {
        const hasUID = toSign.some((property) => property.field === 'uid');
        const hasFN = toSign.some((property) => property.field === 'fn');

        if (!hasUID) {
            const defaultUID = generateProtonWebUID();
            toSign.push({ field: 'uid', value: defaultUID, uid: createContactPropertyUid() });
        }

        if (!hasFN) {
            const fallbackFN = getFallbackFNValue();
            toSign.push({ field: 'fn', value: fallbackFN, uid: createContactPropertyUid() });
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
