import type { TOTP } from 'otpauth';
import { URI } from 'otpauth';

import { selectAutofillCandidates, selectItemByShareIdAndId } from '@proton/pass/store';
import type { OtpRequest, WorkerMessageResponse } from '@proton/pass/types';
import { type OtpCode, WorkerMessageType } from '@proton/pass/types';
import { withPayload } from '@proton/pass/utils/fp';
import { logId, logger } from '@proton/pass/utils/logger';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { getEpoch } from '@proton/pass/utils/time';
import type { ParsedSender } from '@proton/pass/utils/url';
import { parseSender } from '@proton/pass/utils/url';

import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
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

    const handleTOTPRequest = (otpRequest: OtpRequest) => {
        const { shareId, itemId, ...request } = otpRequest;

        try {
            const item = selectItemByShareIdAndId(shareId, itemId)(store.getState());

            if (item?.data.type === 'login') {
                const extraField = request.type === 'extraField' ? item?.data.extraFields?.[request.index] : undefined;

                const totpUri =
                    request.type === 'item'
                        ? item?.data.content.totpUri
                        : extraField?.type === 'totp' && extraField.data.totpUri;

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

    const handleOTPCheck = withContext<
        (sender: ParsedSender) => WorkerMessageResponse<WorkerMessageType.AUTOFILL_OTP_CHECK>
    >(({ service: { formTracker } }, { tabId, url }) => {
        const submission = formTracker.get(tabId, url.domain ?? '');
        const candidates = selectAutofillCandidates(url)(store.getState());
        const otpItems = candidates.filter((item) => Boolean(item.data.content.totpUri));

        const match = submission
            ? otpItems.find((item) => item.data.content.username === submission.data.username)
            : otpItems[0];

        if (match) {
            return {
                shouldPrompt: true,
                shareId: match.shareId,
                itemId: match.itemId,
            };
        }

        return { shouldPrompt: false };
    });

    WorkerMessageBroker.registerMessage(WorkerMessageType.OTP_CODE_GENERATE, withPayload(handleTOTPRequest));
    WorkerMessageBroker.registerMessage(WorkerMessageType.AUTOFILL_OTP_CHECK, (_, sender) =>
        handleOTPCheck(parseSender(sender))
    );
    return {};
};

export type OTPService = ReturnType<typeof createOTPService>;
