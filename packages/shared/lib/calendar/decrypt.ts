import {
    createCleartextMessage,
    decryptMessage,
    decryptSessionKey,
    getMessage,
    getSignature,
    OpenPGPKey,
    SessionKey,
    VERIFICATION_STATUS,
    verifyMessage,
} from 'pmcrypto';

import { base64StringToUint8Array } from '../helpers/encoding';
import { CalendarEventData } from '../interfaces/calendar';
import { SimpleMap } from '../interfaces/utils';
import { CALENDAR_CARD_TYPE, EVENT_VERIFICATION_STATUS } from './constants';

export const getEventVerificationStatus = (status: VERIFICATION_STATUS | undefined, hasPublicKeys: boolean) => {
    if (!hasPublicKeys || status === undefined) {
        return EVENT_VERIFICATION_STATUS.NOT_VERIFIED;
    }
    return status === VERIFICATION_STATUS.SIGNED_AND_VALID
        ? EVENT_VERIFICATION_STATUS.SUCCESSFUL
        : EVENT_VERIFICATION_STATUS.FAILED;
};

/**
 * Given an array with signature verification status values, which correspond to verifying different parts of a component,
 * return an aggregated signature verification status for the component.
 */
export const getAggregatedEventVerificationStatus = (arr: (EVENT_VERIFICATION_STATUS | undefined)[]) => {
    if (!arr.length) {
        return EVENT_VERIFICATION_STATUS.NOT_VERIFIED;
    }
    if (arr.some((verification) => verification === EVENT_VERIFICATION_STATUS.FAILED)) {
        return EVENT_VERIFICATION_STATUS.FAILED;
    }
    if (arr.every((verification) => verification === EVENT_VERIFICATION_STATUS.SUCCESSFUL)) {
        return EVENT_VERIFICATION_STATUS.SUCCESSFUL;
    }
    return EVENT_VERIFICATION_STATUS.NOT_VERIFIED;
};

export const getDecryptedSessionKey = async (data: Uint8Array, privateKeys: OpenPGPKey | OpenPGPKey[]) => {
    return decryptSessionKey({ message: await getMessage(data), privateKeys });
};

export const verifySignedCard = async (
    dataToVerify: string,
    signature: string | null,
    publicKeys: OpenPGPKey | OpenPGPKey[]
) => {
    const verified = signature
        ? (
              await verifyMessage({
                  message: await createCleartextMessage(dataToVerify),
                  publicKeys,
                  signature: await getSignature(signature),
                  detached: true,
              })
          ).verified
        : undefined;
    const hasPublicKeys = Array.isArray(publicKeys) ? !!publicKeys.length : !!publicKeys;
    const verificationStatus = getEventVerificationStatus(verified, hasPublicKeys);

    return { data: dataToVerify, verificationStatus };
};

export const decryptCard = async (
    dataToDecrypt: Uint8Array,
    signature: string | null,
    publicKeys: OpenPGPKey | OpenPGPKey[],
    sessionKey?: SessionKey
) => {
    const { data: decryptedData, verified } = await decryptMessage({
        message: await getMessage(dataToDecrypt),
        publicKeys,
        signature: signature ? await getSignature(signature) : undefined,
        sessionKeys: sessionKey ? [sessionKey] : undefined,
    });
    const hasPublicKeys = Array.isArray(publicKeys) ? !!publicKeys.length : !!publicKeys;
    const verificationStatus = getEventVerificationStatus(verified, hasPublicKeys);

    if (typeof decryptedData !== 'string') {
        throw new Error('Unknown data');
    }

    return { data: decryptedData, verificationStatus };
};

export const decryptAndVerifyCalendarEvent = (
    { Type, Data, Signature, Author }: CalendarEventData,
    publicKeysMap: SimpleMap<OpenPGPKey | OpenPGPKey[]>,
    sessionKey: SessionKey | undefined
): Promise<{ data: string; verificationStatus: EVENT_VERIFICATION_STATUS }> => {
    const publicKeys = publicKeysMap[Author] || [];
    if (Type === CALENDAR_CARD_TYPE.CLEAR_TEXT) {
        return Promise.resolve({ data: Data, verificationStatus: EVENT_VERIFICATION_STATUS.NOT_VERIFIED });
    }
    if (Type === CALENDAR_CARD_TYPE.ENCRYPTED) {
        return decryptCard(base64StringToUint8Array(Data), Signature, [], sessionKey);
    }
    if (Type === CALENDAR_CARD_TYPE.SIGNED) {
        if (!Signature) {
            throw new Error('Signed card is missing signature');
        }
        return verifySignedCard(Data, Signature, publicKeys);
    }
    if (Type === CALENDAR_CARD_TYPE.ENCRYPTED_AND_SIGNED) {
        if (!Signature) {
            throw new Error('Encrypted and signed card is missing signature');
        }
        return decryptCard(base64StringToUint8Array(Data), Signature, publicKeys, sessionKey);
    }
    throw new Error('Unknow event card type');
};
