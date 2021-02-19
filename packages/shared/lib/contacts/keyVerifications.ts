import { getKeys, getMessage } from 'pmcrypto';
import { CONTACT_CARD_TYPE } from '../constants';
import { Key } from '../interfaces';
import { Contact } from '../interfaces/contacts';

export interface KeyId {
    equals(keyid: KeyId): boolean;
}

export interface KeyWithIds {
    key: Key;
    ids: KeyId[];
}

/**
 * Get all the key ids of each user keys
 */
export const getUserKeyIds = async (userKeys: Key[]) => {
    return Promise.all(
        userKeys.map(async (userKey) => {
            const keys = await getKeys(userKey.PrivateKey);
            return { key: userKey, ids: keys[0].getKeyIds() as KeyId[] } as KeyWithIds;
        })
    );
};

/**
 * Get all key ids of the encryption keys of the cards of a contact
 * Technically each cards could be encrypted with different keys but it should never happen
 * So we simplify by returning a flatten array of keys
 */
export const getContactKeyIds = async (contact: Contact, fromEncryption: boolean) => {
    const selectedCards =
        contact?.Cards.filter((card) =>
            fromEncryption
                ? card.Type === CONTACT_CARD_TYPE.ENCRYPTED_AND_SIGNED || card.Type === CONTACT_CARD_TYPE.ENCRYPTED
                : card.Type === CONTACT_CARD_TYPE.ENCRYPTED_AND_SIGNED || card.Type === CONTACT_CARD_TYPE.SIGNED
        ) || [];

    return (
        await Promise.all(
            selectedCards.map(async (card) => {
                const data = fromEncryption ? card.Data : (card.Signature as string);
                const message = await getMessage(data);
                return (fromEncryption ? message.getEncryptionKeyIds() : message.getSigningKeyIds()) as KeyId[];
            })
        )
    ).flat();
};

/**
 * Return first match of the keyWithIds in the keyIds list
 */
export const matchKeys = (keysWithIds: KeyWithIds[], keyIdsToFind: KeyId[]) => {
    const result = keysWithIds.find(({ ids }) =>
        ids.some((idFromKey) => keyIdsToFind.some((keyIdToFind) => idFromKey.equals(keyIdToFind)))
    );

    return result?.key;
};

/**
 * Get user key used to encrypt this contact considering there is only one
 */
export const getKeyUsedForContact = async (contact: Contact, userKeys: Key[], fromEncryption: boolean) => {
    const userKeysIds = await getUserKeyIds(userKeys);
    const contactKeyIds = await getContactKeyIds(contact, fromEncryption);
    return matchKeys(userKeysIds, contactKeyIds);
};
