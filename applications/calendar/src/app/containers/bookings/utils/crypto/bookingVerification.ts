import { shouldCheckSignatureVerificationStatus } from '@proton/account/publicKeys/verificationPreferences';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto/lib';
import { SentryCalendarInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import type { VerificationPreferences } from '@proton/shared/lib/interfaces/VerificationPreferences';

import type { APISlot } from '../../bookingsTypes';
import { JSONFormatTextData } from './bookingEncryptionHelpers';
import { bookingSlotSignatureContextValue } from './cryptoHelpers';

export const verifyBookingSlots = async ({
    bookingSlots,
    bookingUID,
    verificationPreferences,
}: {
    bookingSlots: APISlot[];
    bookingUID: string;
    verificationPreferences: VerificationPreferences;
}) => {
    const slotsArray = [];

    for (const slot of bookingSlots) {
        slotsArray.push(
            CryptoProxy.verifyMessage({
                textData: JSONFormatTextData({
                    EndTime: slot.EndTime,
                    RRule: slot.RRule,
                    StartTime: slot.StartTime,
                    Timezone: slot.Timezone,
                }),
                binarySignature: Uint8Array.fromBase64(slot.DetachedSignature),
                verificationKeys: verificationPreferences.verifyingKeys,
                signatureContext:
                    verificationPreferences && verificationPreferences.verifyingKeys.length > 0
                        ? { value: bookingSlotSignatureContextValue(bookingUID), required: true }
                        : undefined,
            })
        );
    }

    const results = await Promise.all(slotsArray);
    let failedToVerify = false;
    if (
        verificationPreferences &&
        shouldCheckSignatureVerificationStatus(verificationPreferences) &&
        results.some((res) => res.verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID)
    ) {
        // eslint-disable-next-line no-console
        console.warn('Error verifying booking slots');
        traceInitiativeError(SentryCalendarInitiatives.BOOKINGS, {
            verificationStatusArray: results.map(({ verificationStatus }) => verificationStatus),
            bookingUID,
        });

        failedToVerify = true;
    }

    return {
        failedToVerify,
    };
};
