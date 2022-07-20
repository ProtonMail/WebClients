import { c } from 'ttag';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';

import { CONTACT_CARD_TYPE } from '../constants';
import { KeysPair } from '../interfaces';
import { Contact, ContactCard } from '../interfaces/contacts';
import { VCardContact } from '../interfaces/contacts/VCard';
import { CRYPTO_PROCESSING_TYPES } from './constants';
import { mergeVCard } from './properties';
import { parseToVCard } from './vcard';

const { SUCCESS, SIGNATURE_NOT_VERIFIED, FAIL_TO_READ, FAIL_TO_DECRYPT } = CRYPTO_PROCESSING_TYPES;

const { CLEAR_TEXT, ENCRYPTED_AND_SIGNED, ENCRYPTED, SIGNED } = CONTACT_CARD_TYPE;

export interface CryptoProcessingError {
    type: Exclude<CRYPTO_PROCESSING_TYPES, CRYPTO_PROCESSING_TYPES.SUCCESS>;
    error: Error;
}

interface ProcessedContactData {
    type: CRYPTO_PROCESSING_TYPES;
    data?: string;
    signatureTimestamp?: Date;
    error?: Error;
}

export const decrypt = async ({ Data }: ContactCard, { privateKeys }: Pick<KeysPair, 'privateKeys'>) => {
    try {
        const { data } = await CryptoProxy.decryptMessage({ armoredMessage: Data, decryptionKeys: privateKeys });

        if (data && typeof data !== 'string') {
            throw new Error('Unknown data');
        }
        return { type: SUCCESS, data };
    } catch (error: any) {
        return { type: FAIL_TO_DECRYPT, error };
    }
};

export const readSigned = async (
    { Data, Signature = '' }: ContactCard,
    { publicKeys }: Pick<KeysPair, 'publicKeys'>
) => {
    try {
        if (!Signature) {
            throw new Error(c('Error').t`Missing signature`);
        }
        const { verified, signatureTimestamp } = await CryptoProxy.verifyMessage({
            textData: Data,
            stripTrailingSpaces: true,
            verificationKeys: publicKeys,
            armoredSignature: Signature,
        });

        if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
            return {
                data: Data,
                type: SIGNATURE_NOT_VERIFIED,
                signatureTimestamp: undefined,
                error: new Error(c('Error').t`Contact signature not verified`),
            };
        }
        return { type: SUCCESS, data: Data, signatureTimestamp: signatureTimestamp! };
    } catch (error: any) {
        return {
            type: SIGNATURE_NOT_VERIFIED,
            data: Data,
            signatureTimestamp: undefined,
            error,
        };
    }
};

export const decryptSigned = async ({ Data, Signature }: ContactCard, { publicKeys, privateKeys }: KeysPair) => {
    try {
        const { data, verified } = await CryptoProxy.decryptMessage({
            armoredMessage: Data,
            decryptionKeys: privateKeys,
            verificationKeys: publicKeys,
            armoredSignature: Signature || undefined,
        });

        if (data && typeof data !== 'string') {
            throw new Error('Unknown data');
        }

        if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
            return { data, type: SIGNATURE_NOT_VERIFIED, error: new Error(c('Error').t`Signature not verified`) };
        }

        return { type: SUCCESS, data };
    } catch (error: any) {
        return { type: FAIL_TO_DECRYPT, error };
    }
};

const clearText = ({ Data }: ContactCard) => Promise.resolve({ type: SUCCESS, data: Data });

const ACTIONS: { [index: number]: (...params: any) => Promise<ProcessedContactData> } = {
    [ENCRYPTED_AND_SIGNED]: decryptSigned,
    [SIGNED]: readSigned,
    [ENCRYPTED]: decrypt,
    [CLEAR_TEXT]: clearText,
};

export const decryptContact = async (
    contact: Contact,
    { publicKeys, privateKeys }: KeysPair
): Promise<{ vcards: string[]; errors: (CryptoProcessingError | Error)[]; isVerified: boolean }> => {
    const { Cards } = contact;
    let isVerified = Cards.some(({ Type }) => [SIGNED, ENCRYPTED_AND_SIGNED].includes(Type));

    const decryptedCards = await Promise.all(
        Cards.map(async (card) => {
            if (!ACTIONS[card.Type]) {
                return { type: FAIL_TO_READ, error: new Error('Unknown card type') };
            }
            return ACTIONS[card.Type](card, { publicKeys, privateKeys });
        })
    );

    // remove UIDs put by mistake in encrypted cards
    const sanitizedCards = decryptedCards.map((card, i) => {
        if (![ENCRYPTED_AND_SIGNED, ENCRYPTED].includes(Cards[i].Type) || !card.data) {
            return card;
        }
        return { ...card, data: card.data.replace(/\nUID:.*\n/i, '\n') };
    });

    const { vcards, errors } = sanitizedCards.reduce<{ vcards: string[]; errors: CryptoProcessingError[] }>(
        (acc, { type, data, error }) => {
            if (data) {
                acc.vcards.push(data);
            }
            if (error) {
                if (type === SUCCESS) {
                    throw new Error('Inconsistency detected during contact card processing');
                }
                if (type === SIGNATURE_NOT_VERIFIED) {
                    isVerified = false;
                }
                acc.errors.push({ type, error });
            }
            return acc;
        },
        { vcards: [], errors: [] }
    );

    return { isVerified, vcards, errors };
};

export const prepareVCardContact = async (
    contact: Contact,
    { publicKeys, privateKeys }: KeysPair
): Promise<{ vCardContact: VCardContact; errors: (CryptoProcessingError | Error)[]; isVerified: boolean }> => {
    const { isVerified, vcards, errors } = await decryptContact(contact, { publicKeys, privateKeys });

    try {
        const vCardContacts = vcards.map((vcard) => parseToVCard(vcard));
        const vCardContact = mergeVCard(vCardContacts);
        return { vCardContact, errors, isVerified };
    } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error('Error in prepare vCard', e);
        const error = e instanceof Error ? e : new Error('Corrupted vcard data');
        return { vCardContact: { fn: [] }, errors: [error], isVerified };
    }
};
