import type { TOTP } from 'otpauth';
import { URI } from 'otpauth';

import type { MaybeNull, OtpCode } from '@proton/pass/types';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';

export const generateTOTPCode = (totpUri?: string): MaybeNull<OtpCode> => {
    try {
        if (!totpUri) return null;
        const otp = URI.parse(totpUri) as TOTP;
        const token = otp.generate();
        const timestamp = getEpoch();
        const expiry = timestamp + otp.period - (timestamp % otp.period);

        return { token, period: otp.period, expiry };
    } catch {
        return null;
    }
};
