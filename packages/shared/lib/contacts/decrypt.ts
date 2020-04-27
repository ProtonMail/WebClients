import {
    getMessage,
    decryptMessage,
    getSignature,
    verifyMessage,
    createCleartextMessage,
    VERIFICATION_STATUS
} from 'pmcrypto';
import { c } from 'ttag';
import { KeyPairs } from '../interfaces';
import { Contact, ContactCard, ContactProperties } from '../interfaces/contacts';
import { merge, parse } from './vcard';
import { sanitizeProperties } from './properties';

import { CONTACT_CARD_TYPE } from '../constants';
import { CRYPTO_PROCESSING_TYPES } from './constants';

const { SUCCESS, SIGNATURE_NOT_VERIFIED, FAIL_TO_READ, FAIL_TO_LOAD, FAIL_TO_DECRYPT } = CRYPTO_PROCESSING_TYPES;

const { CLEAR_TEXT, ENCRYPTED_AND_SIGNED, ENCRYPTED, SIGNED } = CONTACT_CARD_TYPE;

export interface CryptoProcessingError {
    type: Exclude<CRYPTO_PROCESSING_TYPES, CRYPTO_PROCESSING_TYPES.SUCCESS>;
    error: Error;
}

interface ContactClearTextData {
    type: CRYPTO_PROCESSING_TYPES;
    data?: string;
    error?: Error;
}

interface ContactSignedData {
    type: CRYPTO_PROCESSING_TYPES.SUCCESS | CRYPTO_PROCESSING_TYPES.SIGNATURE_NOT_VERIFIED;
    data: string;
    error?: Error;
}

export const decrypt = async (
    { Data }: ContactCard,
    { privateKeys }: Pick<KeyPairs, 'privateKeys'>
): Promise<ContactClearTextData> => {
    let message;
    try {
        message = await getMessage(Data);
    } catch (error) {
        return { type: FAIL_TO_READ, error };
    }

    try {
        const { data }: { data: string } = await decryptMessage({ message, privateKeys });
        return { type: SUCCESS, data };
    } catch (error) {
        return { type: FAIL_TO_DECRYPT, error };
    }
};

export const readSigned = async (
    { Data, Signature = '' }: ContactCard,
    { publicKeys }: Pick<KeyPairs, 'publicKeys'>
): Promise<ContactSignedData> => {
    try {
        if (!Signature) {
            throw new Error(c('Error').t`Missing signature`);
        }
        const signature = await getSignature(Signature);
        const { verified } = await verifyMessage({
            message: createCleartextMessage(Data),
            publicKeys,
            signature
        });

        if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
            return {
                data: Data,
                type: SIGNATURE_NOT_VERIFIED,
                error: new Error(c('Error').t`Contact signature not verified`)
            };
        }
        return { type: SUCCESS, data: Data };
    } catch (error) {
        return { type: SIGNATURE_NOT_VERIFIED, data: Data, error };
    }
};

export const decryptSigned = async (
    { Data, Signature }: ContactCard,
    { publicKeys, privateKeys }: KeyPairs
): Promise<ContactClearTextData> => {
    try {
        if (!Signature) {
            return { type: FAIL_TO_LOAD, error: new Error(c('Error').t`Missing signature`) };
        }
        const [message, signature] = await Promise.all([getMessage(Data), getSignature(Signature)]);
        const { data, verified } = await decryptMessage({
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            message,
            privateKeys,
            publicKeys,
            signature
        });

        if (verified !== 1) {
            return { data, type: SIGNATURE_NOT_VERIFIED, error: new Error(c('Error').t`Signature not verified`) };
        }

        return { type: SUCCESS, data };
    } catch (error) {
        return { type: FAIL_TO_READ, error };
    }
};

const clearText = ({ Data }: ContactCard): ContactClearTextData => ({ type: SUCCESS, data: Data });

const ACTIONS: { [index: number]: any } = {
    [ENCRYPTED_AND_SIGNED]: decryptSigned,
    [SIGNED]: readSigned,
    [ENCRYPTED]: decrypt,
    [CLEAR_TEXT]: clearText
};

export const prepareContact = async (
    contact: Contact,
    { publicKeys, privateKeys }: KeyPairs
): Promise<{ properties: ContactProperties; errors: CryptoProcessingError[] }> => {
    const { Cards } = contact;

    const decryptedCards = await Promise.all(
        Cards.map(async (card) => {
            if (!ACTIONS[card.Type]) {
                return { error: FAIL_TO_READ };
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

    const { vcards, errors } = sanitizedCards.reduce(
        (acc, { type, data, error }) => {
            if (type === SUCCESS) {
                acc.vcards.push(data);
            } else {
                acc.errors.push({ type, error });
            }
            return acc;
        },
        { vcards: [], errors: [] }
    );

    return { properties: sanitizeProperties(merge(vcards.map(parse))), errors };
};
