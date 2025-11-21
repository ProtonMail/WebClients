import type { BookingPageEditData } from 'applications/calendar/src/app/store/internalBooking/interface';

import { CryptoProxy, type PublicKeyReference, type SessionKey } from '@proton/crypto';
import { deriveKey, exportKey, generateKey } from '@proton/crypto/lib/subtle/aesGcm';
import type {
    BookingPageCreationPayload,
    BookingPageSlotsPayload,
} from '@proton/shared/lib/interfaces/calendar/Bookings';
import type { DecryptedCalendarKey } from '@proton/shared/lib/interfaces/calendar/CalendarKey';
import type { PrimaryAddressKeyForEncryption, PrimaryAddressKeysForSigning } from '@proton/shared/lib/keys';

import { BookingLocation } from '../../bookingsProvider/interface';
import type { SerializedFormData } from '../../bookingsTypes';
import { JSONFormatData, JSONFormatTextData, createBookingLink } from './bookingEncryptionHelpers';
import {
    bookingContentSignatureContextValue,
    bookingSecretSignatureContextValue,
    bookingSlotSignatureContextValue,
} from './cryptoHelpers';

interface EncryptionParams {
    formData: SerializedFormData;
    encryptionKey: PrimaryAddressKeyForEncryption;
    signingKeys: PrimaryAddressKeysForSigning;
    calendarKeys: DecryptedCalendarKey[];
}

const encryptBookingData = async (
    formData: SerializedFormData,
    bookingKeyPassword: string,
    bookingUid: string,
    signingKeys: PrimaryAddressKeysForSigning
) => {
    const { message: encryptedContent } = await CryptoProxy.encryptMessage({
        textData: JSONFormatData({
            description: formData.description,
            location: formData.location,
            summary: formData.summary,
            withProtonMeetLink: formData.locationType === BookingLocation.MEET,
        }),
        passwords: bookingKeyPassword,
        signingKeys: signingKeys,
        format: 'binary',
        signatureContext: { critical: true, value: bookingContentSignatureContextValue(bookingUid) },
    });

    return encryptedContent;
};

const encryptBookingSlots = async (
    formData: SerializedFormData,
    bookingUid: string,
    bookingKeyPassword: string,
    signingKeys: PrimaryAddressKeysForSigning,
    calendarPublicKeys: PublicKeyReference[]
): Promise<BookingPageSlotsPayload[]> => {
    if (!calendarPublicKeys?.length) {
        throw new Error('Calendar public key is required');
    }

    const slotPromises = formData.bookingSlots.map(async (slot) => {
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

        const slotSignature = await CryptoProxy.signMessage({
            textData: JSONFormatTextData({
                EndTime: slot.end,
                RRule: formData.recurring ? 'FREQ=WEEKLY' : null,
                StartTime: slot.start,
                Timezone: formData.timezone,
            }),
            signingKeys,
            detached: true,
            format: 'binary',
            signatureContext: { critical: true, value: bookingSlotSignatureContextValue(bookingUid) },
        });

        return {
            StartTime: slot.start,
            EndTime: slot.end,
            Timezone: formData.timezone,
            RRule: formData.recurring ? 'FREQ=WEEKLY' : null,
            DetachedSignature: slotSignature.toBase64(),
            BookingKeyPacket: bookingKeyPacket.toBase64(),
            SharedKeyPacket: sharedKeyPacket.toBase64(),
        };
    });

    const Slots = await Promise.all(slotPromises);

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
    const bookingSecretBytes = Uint8Array.fromBase64(bookingSecretBase64Url, { alphabet: 'base64url' });
    return (await deriveBookingUid(bookingSecretBytes)).toBase64({ alphabet: 'base64url' });
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

    const bookingKeyPassword = (await deriveBookingKeyPassword(calendarID, secretBytes, salt)).toBase64();
    const bookingUid = (await deriveBookingUid(secretBytes)).toBase64();

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
            value: bookingSecretSignatureContextValue(calendarID),
            critical: true,
        },
    });

    return {
        BookingUID: bookingUid,
        BookingLink: createBookingLink(secretBytes),
        BookingKeySalt: salt.toBase64(),
        EncryptedSecret: encryptedSecret.toBase64(),
        EncryptedContent: encryptedContent.toBase64(),
        Slots,
    };
};

export const encryptBookingPageEdition = async ({
    editData,
    calendarID,
    updateData,
    signingKeys,
    decryptedSecret,
    calendarKeys,
}: {
    editData: BookingPageEditData;
    calendarID: string;
    updateData: SerializedFormData;
    signingKeys: PrimaryAddressKeysForSigning;
    decryptedSecret: Uint8Array<ArrayBuffer>;
    calendarKeys: DecryptedCalendarKey[];
}) => {
    const saltBytes = Uint8Array.fromBase64(editData.bookingKeySalt);
    const bookingKeyPassword = (await deriveBookingKeyPassword(calendarID, decryptedSecret, saltBytes)).toBase64();
    const bookingID = (await deriveBookingUid(decryptedSecret)).toBase64();

    const encryptedContent = await CryptoProxy.encryptMessage({
        textData: JSONFormatData({
            description: updateData.description,
            location: updateData.location,
            summary: updateData.summary,
            withProtonMeetLink: updateData.locationType === BookingLocation.MEET,
        }),
        passwords: bookingKeyPassword,
        signingKeys: signingKeys,
        format: 'binary',
        signatureContext: {
            critical: true,
            value: bookingContentSignatureContextValue(bookingID),
        },
    });

    const calendarPublicKeys = calendarKeys.map(({ publicKey }) => publicKey);
    const Slots = await encryptBookingSlots(updateData, bookingID, bookingKeyPassword, signingKeys, calendarPublicKeys);

    return {
        EncryptedContent: encryptedContent.message.toBase64(),
        Slots,
    };
};
