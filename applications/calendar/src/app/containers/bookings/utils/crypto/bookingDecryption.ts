import { shouldCheckSignatureVerificationStatus } from '@proton/account/publicKeys/verificationPreferences';
import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
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
        traceInitiativeError(SentryCalendarInitiatives.BOOKINGS, {
            type: 'encryptedSecret',
            verificationErrors: decrypted.verificationErrors,
            bookingUID,
        });

        failedToVerify = true;
    }

    return { data: decrypted.data, failedToVerify };
};

export const decryptBookingContent = async ({
    encryptedContent,
    bookingSecretBytes,
    bookingKeySalt,
    calendarId,
    bookingUID,
    verificationPreferences,
}: {
    encryptedContent: string;
    bookingSecretBytes: Uint8Array<ArrayBuffer>;
    bookingKeySalt: string;
    calendarId: string;
    bookingUID: string;
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
                ? { required: true, value: bookingContentSignatureContextValue(bookingUID) }
                : undefined,
    });

    let failedToVerify = false;
    if (
        verificationPreferences &&
        shouldCheckSignatureVerificationStatus(verificationPreferences) &&
        verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID
    ) {
        traceInitiativeError(SentryCalendarInitiatives.BOOKINGS, {
            type: 'encryptedContent',
            verificationErrors,
            bookingUID,
        });

        failedToVerify = true;
    }

    const data = JSON.parse(decryptedContent);

    return { ...data, failedToVerify };
};
