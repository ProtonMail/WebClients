import { CryptoProxy, type PublicKeyReference, type SessionKey } from '@proton/crypto';
import { deriveKey, exportKey, generateKey } from '@proton/crypto/lib/subtle/aesGcm';
import {
    base64StringToUint8Array,
    base64URLStringToUint8Array,
    uint8ArrayToBase64String,
    uint8ArrayToPaddedBase64URLString,
} from '@proton/shared/lib/helpers/encoding';
import type {
    BookingPageCreationPayload,
    BookingPageSlotsPayload,
} from '@proton/shared/lib/interfaces/calendar/Bookings';
import type { DecryptedCalendarKey } from '@proton/shared/lib/interfaces/calendar/CalendarKey';
import type { PrimaryAddressKeyForEncryption, PrimaryAddressKeysForSigning } from '@proton/shared/lib/keys';

import { type BookingFormData, BookingLocation } from '../bookingsProvider/interface';
import { JSONFormatData, JSONFormatTextData, createBookingLink } from './bookingHelpers';

interface EncryptionParams {
    formData: BookingFormData;
    encryptionKey: PrimaryAddressKeyForEncryption;
    signingKeys: PrimaryAddressKeysForSigning;
    calendarKeys: DecryptedCalendarKey[];
}

const encryptBookingData = async (
    formData: BookingFormData,
    bookingKeyPassword: string,
    bookingUid: string,
    signingKeys: PrimaryAddressKeysForSigning
) => {
    const { message: encryptedContent } = await CryptoProxy.encryptMessage({
        textData: JSONFormatData({
            description: formData.description || '',
            location: formData.location || '',
            summary: formData.title,
            withProtonMeetLink: formData.locationType === BookingLocation.MEET,
        }),
        passwords: bookingKeyPassword,
        signingKeys: signingKeys,
        format: 'binary',
        signatureContext: { critical: true, value: `bookings.content.${bookingUid}` },
    });

    return encryptedContent;
};

const encryptBookingSlots = async (
    formData: BookingFormData,
    bookingUid: string,
    bookingKeyPassword: string,
    signingKeys: PrimaryAddressKeysForSigning,
    calendarPublicKeys: PublicKeyReference[]
): Promise<BookingPageSlotsPayload[]> => {
    if (!calendarPublicKeys?.length) {
        throw new Error('Calendar public key is required');
    }

    const Slots: BookingPageSlotsPayload[] = [];
    for (const slot of formData.bookingSlots) {
        const sharedSessionKey = await CryptoProxy.generateSessionKey({ recipientKeys: calendarPublicKeys });
        const bookingKeyPacket = await CryptoProxy.encryptSessionKey({
            ...sharedSessionKey,
            passwords: bookingKeyPassword,
            format: 'binary',
        });

        const sharedKeyPacket = await CryptoProxy.encryptSessionKey({
            ...sharedSessionKey,
            encryptionKeys: calendarPublicKeys,
            format: 'binary',
        });

        const StartTime = Math.floor(slot.start.getTime() / 1000);
        const EndTime = Math.floor(slot.end.getTime() / 1000);
        const Timezone = formData.timezone || 'Europe/Zurich';
        const RRule = null;

        const slotSignature = await CryptoProxy.signMessage({
            textData: JSONFormatTextData({ EndTime, RRule, StartTime, Timezone }),
            signingKeys,
            detached: true,
            format: 'binary',
            signatureContext: { critical: true, value: `bookings.slot.${bookingUid}` },
        });

        Slots.push({
            StartTime,
            EndTime,
            Timezone,
            RRule,
            DetachedSignature: uint8ArrayToBase64String(slotSignature),
            BookingKeyPacket: uint8ArrayToBase64String(bookingKeyPacket),
            SharedKeyPacket: uint8ArrayToBase64String(sharedKeyPacket),
        });
    }

    return Slots;
};

export const deriveBookingKeyPassword = async (
    calendarID: string,
    secretBytes: Uint8Array<ArrayBuffer>,
    salt: Uint8Array<ArrayBuffer>
) => {
    const bookingKey = await deriveKey(
        secretBytes,
        salt,
        new TextEncoder().encode(`bookings.booking_key.${calendarID}`),
        {
            extractable: true,
        }
    );

    const bookingKeyBytes = await exportKey(bookingKey);
    return new Uint8Array(bookingKeyBytes);
};

/**
 * Derives the booking UID bytes from the booking secret bytes
 * @param bookingSecretBytes - The raw secret bytes (NOT base64url encoded)
 * @returns Raw booking UID bytes (NOT base64url encoded)
 */
export const deriveBookingUid = async (bookingSecretBytes: Uint8Array<ArrayBuffer>) => {
    const bookingUidKey = await deriveKey(
        bookingSecretBytes,
        new Uint8Array(),
        new TextEncoder().encode('bookings.booking_id'),
        {
            extractable: true,
        }
    );
    const bookingUidBytes = await exportKey(bookingUidKey);
    return new Uint8Array(bookingUidBytes);
};

/**
 * Extracts and derives the booking UID in base64url format from the booking secret
 * @param bookingSecretBase64Url - The booking secret in base64url format (from URL hash)
 * @returns The booking UID in base64url format (for API calls)
 */
export const extractBookingUidFromSecret = async (bookingSecretBase64Url: string): Promise<string> => {
    const bookingSecretBytes = base64URLStringToUint8Array(bookingSecretBase64Url);
    return uint8ArrayToPaddedBase64URLString(await deriveBookingUid(bookingSecretBytes));
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
    const bookingSecretBytes = base64URLStringToUint8Array(bookingSecretBase64Url);
    const saltBytes = base64StringToUint8Array(bookingKeySalt);
    const bookingKeyPassword = uint8ArrayToBase64String(
        await deriveBookingKeyPassword(calendarId, bookingSecretBytes, saltBytes)
    );

    const bookingKeyPacketBytes = base64StringToUint8Array(bookingKeyPacket);

    return CryptoProxy.decryptSessionKey({
        binaryMessage: bookingKeyPacketBytes,
        passwords: [bookingKeyPassword],
    });
};

export const encryptBookingPage = async ({
    calendarKeys,
    formData,
    encryptionKey,
    signingKeys,
    calendarID,
}: EncryptionParams & { calendarID: string }): Promise<
    Omit<BookingPageCreationPayload, 'CalendarID'> & { BookingLink: string }
> => {
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const secretBytes = generateKey();

    const bookingKeyPassword = uint8ArrayToBase64String(await deriveBookingKeyPassword(calendarID, secretBytes, salt));
    const bookingUid = uint8ArrayToBase64String(await deriveBookingUid(secretBytes));

    const calendarPublicKeys = calendarKeys.map(({ publicKey }) => publicKey);
    const Slots: BookingPageSlotsPayload[] = await encryptBookingSlots(
        formData,
        bookingUid,
        bookingKeyPassword,
        signingKeys,
        calendarPublicKeys
    );

    const encryptedContent = await encryptBookingData(formData, bookingKeyPassword, bookingUid, signingKeys);

    const { message: encryptedSecret } = await CryptoProxy.encryptMessage({
        binaryData: secretBytes,
        encryptionKeys: encryptionKey,
        signingKeys: signingKeys,
        format: 'binary',
        signatureContext: {
            value: `bookings.secret.${calendarID}`,
            critical: true,
        },
    });

    return {
        BookingUID: bookingUid,
        BookingLink: createBookingLink(secretBytes),
        BookingKeySalt: uint8ArrayToBase64String(salt),
        EncryptedSecret: uint8ArrayToBase64String(encryptedSecret),
        EncryptedContent: uint8ArrayToBase64String(encryptedContent),
        Slots,
    };
};
