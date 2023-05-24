import type { TOTP } from 'otpauth';
import { URI } from 'otpauth';

import { selectCanGenerateTOTP, selectItemByShareIdAndId } from '@proton/pass/store';
import type { OtpRequest } from '@proton/pass/types';
import { type OtpCode, WorkerMessageType } from '@proton/pass/types';
import { withPayload } from '@proton/pass/utils/fp';
import { logId, logger } from '@proton/pass/utils/logger';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { getEpoch } from '@proton/pass/utils/time';

import WorkerMessageBroker from '../channel';
import store from '../store';

export const createOTPService = () => {
    /* Although clients should store a complete OTP URI in the `totpUri` field.
     * We take this with a grain of salt to account from possible faulty imports.
     * And treat the `totpUri` field value as if it was user input, either:
     * - a valid OTP URI
     * - a valid secret from which we can create a valid TOTP URI with our defaults
     * - an invalid string
     * Each of the following OTP-related operations may throw. */
    const generateTOTPCode = (totpUri: string): OtpCode => {
        const otp = URI.parse(totpUri) as TOTP;
        const token = otp.generate();
        const timestamp = getEpoch();
        const expiry = timestamp + otp.period - (timestamp % otp.period);

        return { token, period: otp.period, expiry };
    };

    const handleTOTPRequest = ({ shareId, itemId, ...request }: OtpRequest) => {
        try {
            const canGenerateTOTP = selectCanGenerateTOTP(shareId, itemId);
            if (!canGenerateTOTP) throw new Error('User plan does not allow generating this OTP code');

            const item = selectItemByShareIdAndId(shareId, itemId)(store.getState());

            if (item?.data.type === 'login') {
                const totpUri =
                    request.type === 'item'
                        ? item?.data.content.totpUri
                        : item?.data.extraFields?.[request.index].value;

                if (totpUri) return generateTOTPCode(parseOTPValue(totpUri));
            }

            throw new Error('Cannot generate an OTP code from such item');
        } catch (err) {
            logger.error(
                `[Worker::OTP] Unable to generate OTP code for item ${logId(itemId)} on share ${logId(shareId)}`,
                err
            );

            throw err;
        }
    };

    WorkerMessageBroker.registerMessage(WorkerMessageType.OTP_CODE_GENERATE, withPayload(handleTOTPRequest));

    return {};
};

export type OTPService = ReturnType<typeof createOTPService>;
