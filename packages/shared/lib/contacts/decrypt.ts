import {
    createCleartextMessage,
    decryptMessage,
    getMessage,
    getSignature,
    VERIFICATION_STATUS,
    verifyMessage,
} from 'pmcrypto';
import { c } from 'ttag';

import { CONTACT_CARD_TYPE } from '../constants';
import { KeysPair } from '../interfaces';
import { Contact, ContactCard, ContactProperties } from '../interfaces/contacts';
import { CRYPTO_PROCESSING_TYPES } from './constants';
import { sanitizeProperties } from './properties';
import { merge, parse } from './vcard';

const { SUCCESS, SIGNATURE_NOT_VERIFIED, FAIL_TO_READ, FAIL_TO_LOAD, FAIL_TO_DECRYPT } = CRYPTO_PROCESSING_TYPES;

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
    let message;
    try {
        message = await getMessage(Data);
    } catch (error: any) {
        return { type: FAIL_TO_READ, error };
    }

    try {
        const { data } = await decryptMessage({ message, privateKeys });

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
        const signature = await getSignature(Signature);
        const { verified, signatureTimestamp } = await verifyMessage({
            message: createCleartextMessage(Data),
            publicKeys,
            signature,
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
    let message;
    let signature;

    try {
        if (!Signature) {
            return { type: FAIL_TO_LOAD, error: new Error(c('Error').t`Missing signature`) };
        }
        [message, signature] = await Promise.all([getMessage(Data), getSignature(Signature)]);
    } catch (error: any) {
        return { type: FAIL_TO_READ, error };
    }

    try {
        const { data, verified } = await decryptMessage({
            message,
            privateKeys,
            publicKeys,
            signature,
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

export const prepareContact = async (
    contact: Contact,
    { publicKeys, privateKeys }: KeysPair
): Promise<{ properties: ContactProperties; errors: (CryptoProcessingError | Error)[]; isVerified: boolean }> => {
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

    try {
        const properties = sanitizeProperties(merge(vcards.map(parse)));
        return { properties, errors, isVerified };
    } catch (e: any) {
        const error = e instanceof Error ? e : new Error('Corrupted vcard data');
        return { properties: [], errors: [error], isVerified };
    }
};
