import { shouldCheckSignatureVerificationStatus } from '@proton/account/publicKeys/verificationPreferences';
import type { PrivateKeyReference, SessionKey } from '@proton/crypto/lib';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto/lib';
import { SentryCalendarInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import type { VerificationPreferences } from '@proton/shared/lib/interfaces/VerificationPreferences';

import { deriveBookingKeyPassword } from './bookingEncryption';
import { bookingContentSignatureContextValue, bookingSecretSignatureContextValue } from './cryptoHelpers';

export const decryptAndVerifyBookingPageSecret = async ({
    bookingUID,
    encryptedSecret,
    selectedCalendar,
    decryptionKeys,
    verificationPreferences,
}: {
    bookingUID: string;
    encryptedSecret: string;
    selectedCalendar: string;
    decryptionKeys: PrivateKeyReference[];
    verificationPreferences: VerificationPreferences | null;
}): Promise<{ data: Uint8Array<ArrayBuffer>; failedToVerify: boolean }> => {
    const decrypted = await CryptoProxy.decryptMessage({
        binaryMessage: Uint8Array.fromBase64(encryptedSecret),
        decryptionKeys,
        verificationKeys: verificationPreferences?.verifyingKeys,
        signatureContext:
            verificationPreferences && verificationPreferences.verifyingKeys.length > 0
                ? { value: bookingSecretSignatureContextValue(selectedCalendar), required: true }
                : undefined,
        format: 'binary',
    });

    let failedToVerify = false;

    if (
        verificationPreferences &&
        shouldCheckSignatureVerificationStatus(verificationPreferences) &&
        decrypted.verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID
    ) {
        // eslint-disable-next-line no-console
        console.warn({ errors: decrypted.verificationErrors });
        traceInitiativeError(SentryCalendarInitiatives.BOOKINGS, {
            type: 'encryptedSecret',
            verificationErrors: decrypted.verificationErrors,
            bookingUID,
        });

        failedToVerify = true;
    }

    return { data: decrypted.data, failedToVerify };
};

/**
 * Decrypts the booking session key using the booking secret
 * @param bookingSecretBase64Url - The booking secret in base64url format (from URL hash)
 * @param bookingKeySalt - The salt in base64 format (from API)
 * @param calendarId - The calendar ID
 * @param bookingKeyPacket - The encrypted session key packet in base64 format (from API)
 * @returns The decrypted session key
 */
export const decryptBookingSessionKey = async (
    bookingSecretBase64Url: string,
    bookingKeySalt: string,
    calendarId: string,
    bookingKeyPacket: string
): Promise<SessionKey | undefined> => {
    const bookingSecretBytes = Uint8Array.fromBase64(bookingSecretBase64Url, { alphabet: 'base64url' });
    const saltBytes = Uint8Array.fromBase64(bookingKeySalt);
    const bookingKeyPassword = (await deriveBookingKeyPassword(calendarId, bookingSecretBytes, saltBytes)).toBase64();

    const bookingKeyPacketBytes = Uint8Array.fromBase64(bookingKeyPacket);

    return CryptoProxy.decryptSessionKey({
        binaryMessage: bookingKeyPacketBytes,
        passwords: [bookingKeyPassword],
    });
};

export const decryptBookingContent = async ({
    encryptedContent,
    bookingSecretBytes,
    bookingKeySalt,
    calendarId,
    bookingUid,
    verificationPreferences,
}: {
    encryptedContent: string;
    bookingSecretBytes: Uint8Array<ArrayBuffer>;
    bookingKeySalt: string;
    calendarId: string;
    bookingUid: string;
    verificationPreferences: VerificationPreferences | null;
}): Promise<{
    summary: string;
    description: string;
    location: string;
    withProtonMeetLink: boolean;
    failedToVerify: boolean;
}> => {
    const salt = Uint8Array.fromBase64(bookingKeySalt);
    const bookingKeyPassword = (await deriveBookingKeyPassword(calendarId, bookingSecretBytes, salt)).toBase64();

    const {
        data: decryptedContent,
        verificationStatus,
        verificationErrors,
    } = await CryptoProxy.decryptMessage({
        binaryMessage: Uint8Array.fromBase64(encryptedContent),
        passwords: [bookingKeyPassword],
        verificationKeys: verificationPreferences?.verifyingKeys,
        signatureContext:
            verificationPreferences && verificationPreferences.verifyingKeys.length > 0
                ? { required: true, value: bookingContentSignatureContextValue(bookingUid) }
                : undefined,
    });

    let failedToVerify = false;
    if (
        verificationPreferences &&
        shouldCheckSignatureVerificationStatus(verificationPreferences) &&
        verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID
    ) {
        // eslint-disable-next-line no-console
        console.warn({ verificationErrors });
        traceInitiativeError(SentryCalendarInitiatives.BOOKINGS, {
            type: 'encryptedContent',
            verificationErrors,
            bookingUID: bookingUid,
        });

        failedToVerify = true;
    }

    const data = JSON.parse(decryptedContent);

    return { ...data, failedToVerify };
};
