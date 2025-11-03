import { c } from 'ttag';

import { CryptoProxy, type PublicKeyReference, VERIFICATION_STATUS } from '@proton/crypto';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { deriveBookingKeyPassword } from '../../containers/bookings/bookingCryptoUtils';

/**
 * Parameters required to decrypt booking content
 */
interface DecryptBookingContentParams {
    /**
     * Base64-encoded encrypted booking content
     */
    encryptedContent: string;
    /**
     * Secret bytes used for key derivation
     */
    bookingSecretBytes: Uint8Array<ArrayBuffer>;
    /**
     * Base64-encoded salt for key derivation
     */
    bookingKeySalt: string;
    /**
     * Calendar ID associated with the booking
     */
    calendarId: string;
    /**
     * Booking Uid associated with the booking
     */
    bookingUid: string;
    /**
     * PublicKeys to verifiy the signature
     */
    verificationKeys?: PublicKeyReference[];
}

/**
 * Decrypted booking content data
 */
interface BookingContentData {
    /**
     * Event summary/title
     */
    summary: string;
    /**
     * Event description
     */
    description: string;
    /**
     * Event location
     */
    location: string;
}

/**
 * Decrypts encrypted booking content using derived keys and returns the booking data.
 * Uses PBKDF2 key derivation with the provided salt and secret, then decrypts
 * the content using the Proton crypto proxy.
 *
 * @param params - Decryption parameters including encrypted content and key material
 * @returns Promise resolving to decrypted booking content data
 * @throws Error if decryption fails or JSON parsing fails
 *
 * @example
 * const bookingData = await decryptBookingContent({
 *   encryptedContent: 'base64...',
 *   bookingSecretBytes: secretArray,
 *   bookingKeySalt: 'base64...',
 *   calendarId: 'cal_123',
 *   bookingUid: 'dsa312de'
 * });
 */
export const decryptBookingContent = async ({
    encryptedContent,
    bookingSecretBytes,
    bookingKeySalt,
    calendarId,
    bookingUid,
    verificationKeys,
}: DecryptBookingContentParams): Promise<BookingContentData> => {
    const salt = base64StringToUint8Array(bookingKeySalt);
    const bookingKeyPassword = uint8ArrayToBase64String(
        await deriveBookingKeyPassword(calendarId, bookingSecretBytes, salt)
    );

    const {
        data: decryptedContent,
        verificationStatus,
        verificationErrors,
    } = await CryptoProxy.decryptMessage({
        binaryMessage: base64StringToUint8Array(encryptedContent),
        passwords: [bookingKeyPassword],
        verificationKeys,
        signatureContext: verificationKeys ? { required: true, value: `bookings.content.${bookingUid}` } : undefined,
    });

    if (verificationKeys && verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        //TODO: Improve verification error handling
        // eslint-disable-next-line no-console
        console.warn({ verificationErrors });
        throw new Error(c('Error').t`Content verification failed`);
    }

    return JSON.parse(decryptedContent);
};
