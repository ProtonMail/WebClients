import { OpenPGPKey, encryptMessage, signMessage } from 'pmcrypto';
import { c } from 'ttag';

import { generateProtonWebUID } from '../helpers/uid';
import { toICAL } from './vcard';
import { hasCategories, sanitizeProperties, addPref, addGroup } from './properties';
import { KeyPair, DecryptedKey } from '../interfaces';
import { Contact, ContactCard, ContactProperties } from '../interfaces/contacts/Contact';
import { CONTACT_CARD_TYPE } from '../constants';
import { CLEAR_FIELDS, SIGNED_FIELDS } from './constants';

const { CLEAR_TEXT, ENCRYPTED_AND_SIGNED, SIGNED } = CONTACT_CARD_TYPE;

interface SplitProperties {
    toEncryptAndSign: ContactProperties;
    toSign: ContactProperties;
    toClearText: ContactProperties;
}

/**
 * Split properties for contact cards
 */
const splitProperties = (properties: ContactProperties): SplitProperties => {
    // we should only create a clear text part if categories are present
    const splitClearText = hasCategories(properties);

    return properties.reduce<SplitProperties>(
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

/**
 * Prepare contact cards
 */
export const prepareCards = (
    properties: ContactProperties = [],
    privateKeys: OpenPGPKey[],
    publicKeys: OpenPGPKey[]
): Promise<ContactCard[]> => {
    const promises = [];
    const { toEncryptAndSign = [], toSign = [], toClearText = [] } = splitProperties(properties);

    if (toEncryptAndSign.length > 0) {
        const data = toICAL(toEncryptAndSign).toString();

        promises.push(
            encryptMessage({ data, publicKeys, privateKeys, armor: true, detached: true }).then(
                ({ data: Data, signature: Signature }) => {
                    const card: ContactCard = {
                        Type: ENCRYPTED_AND_SIGNED,
                        Data,
                        Signature,
                    };
                    return card;
                }
            )
        );
    }

    if (toSign.length > 0) {
        const hasUID = toSign.some((property) => property.field === 'uid');
        const hasFN = toSign.some((property) => property.field === 'fn');

        if (!hasUID) {
            const defaultUID = generateProtonWebUID();
            toSign.push({ field: 'uid', value: defaultUID });
        }

        if (!hasFN) {
            const defaultFN = c('Default display name vcard').t`Unknown`;
            toSign.push({ field: 'fn', value: defaultFN });
        }

        const data = toICAL(toSign).toString();

        promises.push(
            signMessage({ data, privateKeys, armor: true, detached: true }).then(({ signature: Signature }) => {
                const card: ContactCard = {
                    Type: SIGNED,
                    Data: data,
                    Signature,
                };
                return card;
            })
        );
    }

    if (toClearText.length > 0) {
        const Data = toICAL(toClearText).toString();

        promises.push({
            Type: CLEAR_TEXT,
            Data,
            Signature: null,
        });
    }

    return Promise.all(promises);
};

/**
 * Clean properties
 * Parse properties to build vCards
 *
 * @dev  For encryption, only the primary key is needed
 */
export const prepareContact = async (
    properties: ContactProperties,
    { privateKey, publicKey }: KeyPair
): Promise<Pick<Contact, 'Cards'>> => {
    const sanitized = sanitizeProperties(properties);
    const withPref = addPref(sanitized);
    const withGroup = addGroup(withPref);
    const Cards = await prepareCards(withGroup, [privateKey], [publicKey]);
    return { Cards };
};

/**
 * Prepare contacts data to be saved with the API
 * @param {Array} contacts
 * @param {Object} primaryKey
 * @returns {Promise} data
 */
export const prepareContacts = async (
    contacts: ContactProperties[] = [],
    { privateKey, publicKey }: DecryptedKey
): Promise<Pick<Contact, 'Cards'>[]> => {
    const promises = contacts.reduce<Promise<Pick<Contact, 'Cards'>>[]>((acc, properties) => {
        if (privateKey && publicKey) {
            acc.push(prepareContact(properties, { privateKey, publicKey }));
        }
        return acc;
    }, []);

    return Promise.all(promises);
};
