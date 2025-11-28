import { shouldCheckSignatureVerificationStatus } from '@proton/account/publicKeys/verificationPreferences';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto/lib';
import type { VerificationPreferences } from '@proton/shared/lib/interfaces/VerificationPreferences';

import type { APISlot } from '../../bookingsTypes';
import { JSONFormatTextData } from './bookingEncryptionHelpers';
import { bookingSlotSignatureContextValue } from './cryptoHelpers';

export const verifyBookingSlots = async ({
    bookingSlots,
    bookingID,
    verificationPreferences,
}: {
    bookingSlots: APISlot[];
    bookingID: string;
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
                        ? { value: bookingSlotSignatureContextValue(bookingID), required: true }
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
        // TODO send data to sentry
        failedToVerify = true;
    }

    return {
        failedToVerify,
    };
};
