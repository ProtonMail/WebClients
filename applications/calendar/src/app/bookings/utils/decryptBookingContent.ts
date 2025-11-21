import { CryptoProxy, type PublicKeyReference, VERIFICATION_STATUS } from '@proton/crypto';

import { deriveBookingKeyPassword } from '../../containers/bookings/utils/crypto/bookingEncryption';
import { bookingContentSignatureContextValue } from '../../containers/bookings/utils/crypto/cryptoHelpers';

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
    /**
     * Whether or not the location is a proton meet link
     */
    withProtonMeetLink: boolean;
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
    const salt = Uint8Array.fromBase64(bookingKeySalt);
    const bookingKeyPassword = (await deriveBookingKeyPassword(calendarId, bookingSecretBytes, salt)).toBase64();

    const {
        data: decryptedContent,
        verificationStatus,
        verificationErrors,
    } = await CryptoProxy.decryptMessage({
        binaryMessage: Uint8Array.fromBase64(encryptedContent),
        passwords: [bookingKeyPassword],
        verificationKeys,
        signatureContext:
            verificationKeys && verificationKeys?.length > 0
                ? { required: true, value: bookingContentSignatureContextValue(bookingUid) }
                : undefined,
    });

    if (
        verificationKeys &&
        verificationKeys.length > 0 &&
        verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID
    ) {
        // eslint-disable-next-line no-console
        console.warn({ verificationErrors });
    }

    return JSON.parse(decryptedContent);
};
