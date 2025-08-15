import type { PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import { isElectronMail } from '../../helpers/desktop';
import { base64StringToUint8Array } from '../../helpers/encoding';
import type { CalendarEventData } from '../../interfaces/calendar';
import type { SimpleMap } from '../../interfaces/utils';
import { CALENDAR_CARD_TYPE, EVENT_VERIFICATION_STATUS } from '../constants';

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

export const getDecryptedSessionKey = async (
    data: Uint8Array<ArrayBuffer>,
    privateKeys: PrivateKeyReference | PrivateKeyReference[]
) => {
    return CryptoProxy.decryptSessionKey({ binaryMessage: data, decryptionKeys: privateKeys });
};

export const getNeedsLegacyVerification = (verifiedBinary: VERIFICATION_STATUS, textData: string) => {
    if (verifiedBinary !== VERIFICATION_STATUS.SIGNED_AND_INVALID) {
        return false;
    }
    if (/ \r\n/.test(textData)) {
        // if there are trailing spaces using the RFC-compliant line separator, those got stripped by clients signing
        // as-text with the stripTrailingSpaces option enabled. We need legacy verification.
        return true;
    }
    const textDataWithoutCRLF = textData.replaceAll(`\r\n`, '');

    // if there are "\n" end-of-lines we need legacy verification as those got normalized by clients signing as-text
    return /\n/.test(textDataWithoutCRLF);
};

const getVerifiedLegacy = async ({
    textData,
    signature,
    publicKeys,
}: {
    textData: string;
    signature: string;
    publicKeys: PublicKeyReference | PublicKeyReference[];
}) => {
    /**
     * Verification of an ical card may have failed because the signature is a legacy one,
     * done as text and therefore using OpenPGP normalization (\n -> \r\n) + stripping trailing spaces.
     *
     * We try to verify the signature in the legacy way and log the fact in Sentry
     */
    if (!isElectronMail) {
        captureMessage('Fallback to legacy signature verification of calendar event', { level: 'info' });
    }
    const { verificationStatus: verificationStatusLegacy } = await CryptoProxy.verifyMessage({
        textData,
        stripTrailingSpaces: true,
        verificationKeys: publicKeys,
        armoredSignature: signature,
    });

    return verificationStatusLegacy;
};

export const verifySignedCard = async (
    dataToVerify: string,
    signature: string,
    publicKeys: PublicKeyReference | PublicKeyReference[]
) => {
    const { verificationStatus: verifiedBinary } = await CryptoProxy.verifyMessage({
        binaryData: stringToUtf8Array(dataToVerify), // not 'utf8' to avoid issues with trailing spaces and automatic normalisation of EOLs to \n
        verificationKeys: publicKeys,
        armoredSignature: signature,
    });
    const maybeLegacyVerificationStatus = getNeedsLegacyVerification(verifiedBinary, dataToVerify)
        ? await getVerifiedLegacy({ textData: dataToVerify, signature, publicKeys })
        : verifiedBinary;
    const hasPublicKeys = Array.isArray(publicKeys) ? !!publicKeys.length : !!publicKeys;
    const verificationStatus = getEventVerificationStatus(maybeLegacyVerificationStatus, hasPublicKeys);

    return { data: dataToVerify, verificationStatus };
};

export const decryptCard = async (
    dataToDecrypt: Uint8Array<ArrayBuffer>,
    signature: string | null,
    publicKeys: PublicKeyReference | PublicKeyReference[],
    sessionKey: SessionKey
) => {
    const { data: decryptedData, verificationStatus: verifiedBinary } = await CryptoProxy.decryptMessage({
        binaryMessage: dataToDecrypt,
        format: 'binary', // even though we convert to utf8 later, we can't use 'utf8' here as that would entail automatic normalisation of EOLs to \n
        verificationKeys: publicKeys,
        armoredSignature: signature || undefined,
        sessionKeys: [sessionKey],
    });
    const decryptedText = utf8ArrayToString(decryptedData);
    const maybeLegacyVerificationStatus =
        signature && getNeedsLegacyVerification(verifiedBinary, decryptedText)
            ? await getVerifiedLegacy({ textData: decryptedText, signature, publicKeys })
            : verifiedBinary;
    const hasPublicKeys = Array.isArray(publicKeys) ? !!publicKeys.length : !!publicKeys;
    const verificationStatus = getEventVerificationStatus(maybeLegacyVerificationStatus, hasPublicKeys);

    return { data: utf8ArrayToString(decryptedData), verificationStatus };
};

export const decryptAndVerifyCalendarEvent = (
    { Type, Data, Signature, Author }: CalendarEventData,
    publicKeysMap: SimpleMap<PublicKeyReference | PublicKeyReference[]>,
    sessionKey: SessionKey | undefined
): Promise<{ data: string; verificationStatus: EVENT_VERIFICATION_STATUS }> => {
    const publicKeys = publicKeysMap[Author] || [];
    if (Type === CALENDAR_CARD_TYPE.CLEAR_TEXT) {
        return Promise.resolve({ data: Data, verificationStatus: EVENT_VERIFICATION_STATUS.NOT_VERIFIED });
    }
    if (Type === CALENDAR_CARD_TYPE.ENCRYPTED) {
        if (!sessionKey) {
            throw new Error('Cannot decrypt without session key');
        }
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
        if (!sessionKey) {
            throw new Error('Cannot decrypt without session key');
        }

        return decryptCard(base64StringToUint8Array(Data), Signature, publicKeys, sessionKey);
    }
    throw new Error('Unknow event card type');
};
